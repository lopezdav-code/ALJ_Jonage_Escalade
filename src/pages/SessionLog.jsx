import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, PlusCircle, Search, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import SessionForm from '@/components/session-log/SessionForm';
import SessionList from '@/components/session-log/SessionList';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const BUCKET_NAME = 'exercise_images';

const SessionLog = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin, isAdherent, loading: authLoading } = useAuth();

  const canViewPage = !authLoading && (isAdmin || isAdherent);
  const canEditContent = !authLoading && isAdmin;

  const fetchSessions = useCallback(async () => {
    if (!canViewPage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*, exercises (*)')
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .order('order', { foreignTable: 'exercises', ascending: true });

    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les séances.", variant: "destructive" });
    } else {
      setSessions(data.map(s => ({...s, start_time: s.start_time ? s.start_time.substring(0, 5) : '18:30'})));
    }
    setLoading(false);
  }, [toast, canViewPage]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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
      const { id, exercises, ...sessionInfo } = sessionData;

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

      if (editingSession) {
        const { data: updatedSession, error: sessionError } = await supabase
          .from('sessions')
          .update(sessionInfo)
          .eq('id', editingSession.id)
          .select()
          .single();

        if (sessionError) throw sessionError;

        await supabase.from('exercises').delete().eq('session_id', updatedSession.id);
        
        const exercisesToInsert = processedExercises.map((ex, index) => {
          const { id: exId, ...rest } = ex;
          return { ...rest, session_id: updatedSession.id, order: index };
        });
        if (exercisesToInsert.length > 0) {
          const { error: exercisesError } = await supabase.from('exercises').insert(exercisesToInsert);
          if (exercisesError) throw exercisesError;
        }
      } else {
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert(sessionInfo)
          .select()
          .single();

        if (sessionError) throw sessionError;

        const exercisesToInsert = processedExercises.map((ex, index) => {
          const { id: exId, ...rest } = ex;
          return { ...rest, session_id: newSession.id, order: index };
        });
        if (exercisesToInsert.length > 0) {
          const { error: exercisesError } = await supabase.from('exercises').insert(exercisesToInsert);
          if (exercisesError) throw exercisesError;
        }
      }

      toast({ title: "Séance sauvegardée !", description: "La séance a été enregistrée avec succès." });
      setIsFormVisible(false);
      setEditingSession(null);
      fetchSessions();
    } catch (error) {
      toast({ title: "Erreur de sauvegarde", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (session) => {
    if (!canEditContent) return;
    setEditingSession(session);
    setIsFormVisible(true);
  };

  const handleDelete = async (sessionId) => {
    if (!canEditContent) return;
    try {
      await supabase.from('exercises').delete().eq('session_id', sessionId);
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) throw error;
      toast({ title: "Séance supprimée", description: "La séance a été supprimée avec succès.", variant: "destructive" });
      fetchSessions();
    } catch (error) {
      toast({ title: "Erreur de suppression", description: error.message, variant: "destructive" });
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions
      .filter(session => {
        if (!searchTerm) return true;
        const lowerSearchTerm = searchTerm.toLowerCase();
        const searchIn = [
          session.cycle_objective,
          session.session_objective,
          session.comment,
          ...(session.instructors || []),
          ...(session.students || []),
          ...session.exercises.map(ex => Object.values(ex).join(' '))
        ].join(' ').toLowerCase();
        return searchIn.includes(lowerSearchTerm);
      })
  }, [sessions, searchTerm]);

  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (!canViewPage) {
    return (
      <div className="text-center py-16">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold mt-4">Accès restreint</h1>
        <p className="text-muted-foreground">Vous devez être un adhérent ou un administrateur pour voir cette page.</p>
        {!user && <p className="mt-4">Veuillez vous connecter.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Séances d'entraînement - ALJ Escalade Jonage</title>
        <meta name="description" content="Consultez et gérez les séances d'escalade du club." />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-primary" />
            Séances d'entraînement
          </h1>
          {canEditContent && !isFormVisible && (
            <Button onClick={() => { setIsFormVisible(true); setEditingSession(null); }}>
              <PlusCircle className="w-4 h-4 mr-2" /> Créer une séance
            </Button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isFormVisible && canEditContent && (
          <SessionForm
            key={editingSession ? editingSession.id : 'new'}
            session={editingSession}
            onSave={handleSave}
            onCancel={() => { setIsFormVisible(false); setEditingSession(null); }}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Historique des séances</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par objectif, encadrant, élève..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <SessionList sessions={filteredSessions} onEdit={handleEdit} onDelete={handleDelete} isAdmin={canEditContent} />
            )}
            {!loading && filteredSessions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucune séance trouvée. Cliquez sur "Créer une séance" pour commencer !</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SessionLog;