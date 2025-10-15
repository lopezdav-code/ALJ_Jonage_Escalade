import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Search, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import SessionList from '@/components/session-log/SessionList';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SessionLog = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const { toast } = useToast();
  const { user, isAdmin, isAdherent, loading: authLoading } = useAuth();

  const canViewPage = !authLoading && (isAdmin || isAdherent);
  const canEditContent = !authLoading && isAdmin;

  // Charger les créneaux du planning
  useEffect(() => {
    const fetchSchedules = async () => {
      const { data, error } = await supabase
        .from('schedule')
        .select('id, type, age_category, day, start_time')
        .order('day')
        .order('start_time');

      if (!error) {
        setSchedules(data || []);
      }
    };

    if (canViewPage) {
      fetchSchedules();
    }
  }, [canViewPage]);

  const fetchSessions = useCallback(async () => {
    if (!canViewPage) {
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
      .order('date', { ascending: false, nullsFirst: true }) // Include null dates first
      .order('start_time', { ascending: false, nullsFirst: true })
      .order('order', { foreignTable: 'exercises', ascending: true });

    console.log('Données récupérées pour les séances :', data); // Log the fetched data

    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les séances.", variant: "destructive" });
    } else {
      // Récupérer tous les IDs de membres uniques
      const allMemberIds = new Set();
      data.forEach(session => {
        (session.instructors || []).forEach(id => allMemberIds.add(id));
        (session.students || []).forEach(id => allMemberIds.add(id));
      });

      // Récupérer les informations des membres
      let membersMap = {};
      if (allMemberIds.size > 0) {
        const { data: members } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .in('id', Array.from(allMemberIds));

        membersMap = (members || []).reduce((acc, member) => {
          acc[member.id] = `${member.first_name} ${member.last_name}`;
          return acc;
        }, {});
      }

      // Enrichir les sessions avec les noms des membres
      const enrichedSessions = data.map(s => ({
        ...s,
        start_time: s.start_time ? s.start_time.substring(0, 5) : '18:30',
        instructorNames: (s.instructors || []).map(id => membersMap[id] || `ID: ${id}`),
        studentNames: (s.students || []).map(id => membersMap[id] || `ID: ${id}`)
      }));

      setSessions(enrichedSessions);
    }
    setLoading(false);
  }, [toast, canViewPage]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleEdit = (session) => {
    if (!canEditContent) return;
    navigate(`/session-log/edit/${session.id}`);
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
    const result = sessions
      .filter(session => {
        // Filtrer les séances sans date
        if (!session.date) return false;

        // Filtrage par créneau du planning
        if (scheduleFilter && session.schedule_id !== scheduleFilter) return false;

        // Filtrage par terme de recherche
        if (!searchTerm) return true;
        const lowerSearchTerm = searchTerm.toLowerCase();
        const searchIn = [
          session.cycles?.name || '',
          session.cycles?.short_description || '',
          session.session_objective,
          session.comment,
          ...(session.instructorNames || []),
          ...(session.studentNames || []),
          ...session.exercises.map(ex => Object.values(ex).join(' '))
        ].join(' ').toLowerCase();
        return searchIn.includes(lowerSearchTerm);
      });

    console.log('Séances après filtrage :', result); // Log filtered sessions
    return result;
  }, [sessions, searchTerm, scheduleFilter]);

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
          {canEditContent && (
            <Button onClick={() => navigate('/session-log/new')}>
              <PlusCircle className="w-4 h-4 mr-2" /> Créer une séance
            </Button>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Historique des séances</CardTitle>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par objectif, encadrant, élève..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par créneau du planning" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les créneaux</SelectItem>
                  {schedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      {schedule.day} - {schedule.start_time.substring(0, 5)} - {schedule.age_category} ({schedule.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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