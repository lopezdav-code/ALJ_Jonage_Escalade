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
        exercises (*),
        cycles (
          id,
          name,
          short_description
        )
      `)
      .eq('id', id)
      .order('order', { foreignTable: 'exercises', ascending: true })
      .single();

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la séance.",
        variant: "destructive"
      });
      navigate('/session-log');
    } else {
      setSession({
        ...data,
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
      const { id: sessionId, exercises, ...sessionInfo } = sessionData;

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
      const { cycles, ...rawSessionInfo } = sessionInfo;
      const filteredSessionInfo = Object.entries(rawSessionInfo).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value;
        return acc;
      }, {});

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
