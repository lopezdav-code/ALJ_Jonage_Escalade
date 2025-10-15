import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import SessionForm from '@/components/session-log/SessionForm';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const BUCKET_NAME = 'exercise_images';

const SessionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const canEditContent = !authLoading && isAdmin;

  const fetchSession = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        exercises (
          id,
          operational_objective,
          situation,
          organisation,
          consigne,
          time,
          success_criteria,
          regulation,
          support_link,
          image_url,
          pedagogy_sheet_id,
          order
        ),
        cycles (
          id,
          name,
          short_description
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la séance.",
        variant: "destructive"
      });
      navigate('/session-log');
    } else {
      // Récupérer les informations de l'emploi du temps si schedule_id existe
      let scheduleData = null;
      if (data.schedule_id) {
        try {
          const { data: schedule, error: scheduleError } = await supabase
            .from('schedules')
            .select('id, type, age_category, day, start_time, end_time')
            .eq('id', data.schedule_id)
            .single();

          if (!scheduleError && schedule) {
            scheduleData = schedule;
          } else if (scheduleError) {
            console.warn('Schedule not found for id:', data.schedule_id, scheduleError);
          }
        } catch (err) {
          console.warn('Error fetching schedule:', err);
        }
      }

      setSession({
        ...data,
        schedule: scheduleData,
        start_time: data.start_time ? data.start_time.substring(0, 5) : '18:30'
      });
    }
    setLoading(false);
  }, [id, toast, navigate]);

  useEffect(() => {
    if (canEditContent) {
      fetchSession();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [fetchSession, canEditContent, authLoading]);

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    let { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async (sessionData) => {
    if (!canEditContent) return;
    setIsSaving(true);
    try {
      const { id: sessionId, exercises, studentComments, ...sessionInfo } = sessionData;

      const processedExercises = await Promise.all(
        exercises.map(async (ex) => {
          let imageUrl = ex.image_url;
          if (ex.newImageFile) {
            imageUrl = await uploadImage(ex.newImageFile);
          }
          const { newImageFile, ...rest } = ex;
          return { ...rest, image_url: imageUrl };
        })
      );

      // Nettoyer les données : convertir les chaînes vides en null
      // Exclure les champs calculés (instructorNames, studentNames, studentComments, schedule, cycles) qui ne doivent pas être sauvegardés
      const { cycles, schedule, instructorNames, studentNames, ...rawSessionInfo } = sessionInfo;
      const filteredSessionInfo = Object.entries(rawSessionInfo).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value;
        return acc;
      }, {});

      let finalSessionId = id;

      if (id) {
        // Mode édition
        const { data: updatedSession, error: sessionError } = await supabase
          .from('sessions')
          .update(filteredSessionInfo)
          .eq('id', id)
          .select()
          .single();

        if (sessionError) {
          console.error('Supabase Update Error:', sessionError);
          throw sessionError;
        }

        await supabase.from('exercises').delete().eq('session_id', updatedSession.id);

        const exercisesToInsert = processedExercises.map((ex, index) => {
          const { id: exId, ...rest } = ex;
          return { ...rest, session_id: updatedSession.id, order: index };
        });
        if (exercisesToInsert.length > 0) {
          const { error: exercisesError } = await supabase.from('exercises').insert(exercisesToInsert);
          if (exercisesError) {
            console.error('Supabase Insert Error:', exercisesError);
            throw exercisesError;
          }
        }

        finalSessionId = updatedSession.id;
      } else {
        // Mode création
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert(filteredSessionInfo)
          .select()
          .single();

        if (sessionError) {
          console.error('Supabase Insert Error:', sessionError);
          throw sessionError;
        }

        const exercisesToInsert = processedExercises.map((ex, index) => {
          const { id: exId, ...rest } = ex;
          return { ...rest, session_id: newSession.id, order: index };
        });
        if (exercisesToInsert.length > 0) {
          const { error: exercisesError } = await supabase.from('exercises').insert(exercisesToInsert);
          if (exercisesError) {
            console.error('Supabase Insert Error:', exercisesError);
            throw exercisesError;
          }
        }

        finalSessionId = newSession.id;
      }

      // Sauvegarder les commentaires des élèves
      if (studentComments && Object.keys(studentComments).length > 0) {
        // Supprimer les anciens commentaires pour cette session
        await supabase
          .from('student_session_comments')
          .delete()
          .eq('session_id', finalSessionId);

        // Insérer les nouveaux commentaires (uniquement ceux qui ne sont pas vides)
        const commentsToInsert = Object.entries(studentComments)
          .filter(([_, comment]) => comment && comment.trim() !== '')
          .map(([memberId, comment]) => ({
            session_id: finalSessionId,
            member_id: memberId,
            comment: comment.trim()
          }));

        if (commentsToInsert.length > 0) {
          const { error: commentsError } = await supabase
            .from('student_session_comments')
            .insert(commentsToInsert);

          if (commentsError) {
            console.error('Supabase Comments Insert Error:', commentsError);
            // Ne pas lever d'erreur, juste log
            console.warn('Les commentaires n\'ont pas pu être sauvegardés');
          }
        }
      }

      toast({
        title: "Séance sauvegardée !",
        description: "La séance a été enregistrée avec succès."
      });

      // Retour intelligent : retour vers le cycle ou vers la liste des sessions
      const from = searchParams.get('from');
      const cycleId = searchParams.get('cycleId');
      if (from === 'cycle' && cycleId) {
        navigate(`/cycles/${cycleId}`);
      } else {
        navigate('/session-log');
      }
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Retour intelligent : retour vers le cycle ou vers la liste des sessions
    const from = searchParams.get('from');
    const cycleId = searchParams.get('cycleId');
    if (from === 'cycle' && cycleId) {
      navigate(`/cycles/${cycleId}`);
    } else {
      navigate('/session-log');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!canEditContent) {
    return (
      <div className="text-center py-16">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold mt-4">Accès restreint</h1>
        <p className="text-muted-foreground">Vous devez être un administrateur pour modifier les séances.</p>
        {!user && <p className="mt-4">Veuillez vous connecter.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Helmet>
        <title>{id ? 'Modifier la séance' : 'Nouvelle séance'} - ALJ Escalade Jonage</title>
        <meta name="description" content="Édition d'une séance d'escalade du club." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold headline flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-primary" />
          {id ? 'Modifier la séance' : 'Nouvelle séance'}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SessionForm
          session={session}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      </motion.div>
    </div>
  );
};

export default SessionEdit;
