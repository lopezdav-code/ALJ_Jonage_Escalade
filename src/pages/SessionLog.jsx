import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Search, Loader2, Lock, CalendarCheck } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InstructorAutocomplete from '@/components/schedule/InstructorAutocomplete';
import { useToast } from '@/components/ui/use-toast';
import SessionList from '@/components/session-log/SessionList';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SessionLog = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [cyclesOptions, setCyclesOptions] = useState([]);
  const [schedulesOptions, setSchedulesOptions] = useState([]);
  const [membersOptions, setMembersOptions] = useState([]);

  const [filterCycleId, setFilterCycleId] = useState('');
  const [filterScheduleId, setFilterScheduleId] = useState('');
  const [filterInstructorId, setFilterInstructorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      setSessions(data.map(s => ({...s, start_time: s.start_time ? s.start_time.substring(0, 5) : '18:30'})));
    }
    setLoading(false);
  }, [toast, canViewPage]);

  // Fetch filter options (cycles, schedules, members)
  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data: cyclesData } = await supabase.from('cycles').select('id, name').order('name');
      setCyclesOptions(cyclesData || []);

      const { data: schedulesData } = await supabase.from('schedules').select('id, type, age_category, day, start_time').order('day, start_time');
      setSchedulesOptions(schedulesData || []);

  const { data: membersData } = await supabase.from('secure_members').select('id, first_name, last_name').order('last_name, first_name');
  setMembersOptions(membersData || []);
    } catch (err) {
      console.error('Erreur lors du chargement des options de filtre:', err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchFilterOptions();
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
    const lowerSearchTerm = searchTerm.toLowerCase();

    const result = sessions.filter(session => {
      // Filtrer les séances sans date
      if (!session.date) return false;

      // Filtrage par terme de recherche
      if (searchTerm) {
        const searchIn = [
          session.cycles?.name || '',
          session.cycles?.short_description || '',
          session.session_objective || '',
          session.comment || '',
          ...(session.instructors || []).map(String),
          ...(session.students || []).map(String),
          ...session.exercises.map(ex => Object.values(ex).join(' '))
        ].join(' ').toLowerCase();
        if (!searchIn.includes(lowerSearchTerm)) return false;
      }

      // Filtrage par cycle
      if (filterCycleId) {
        if (!session.cycles || String(session.cycles.id) !== String(filterCycleId)) return false;
      }

      // Filtrage par schedule (use schedule_id field)
      if (filterScheduleId) {
        if (!session.schedule_id || String(session.schedule_id) !== String(filterScheduleId)) return false;
      }

      // Filtrage par encadrant (match by instructorNames or by instructor id)
      if (filterInstructorId) {
        const memberId = filterInstructorId;
        const member = membersOptions.find(m => String(m.id) === String(memberId));
        const memberName = member ? `${member.first_name} ${member.last_name}` : null;

        const hasId = session.instructors && session.instructors.some(id => String(id) === String(memberId));
        const hasName = memberName && session.instructorNames && session.instructorNames.includes(memberName);

        if (!hasId && !hasName) return false;
      }

      return true;
    });

    console.log('Séances après filtrage :', result);
    return result;
  }, [sessions, searchTerm, filterCycleId, filterScheduleId, filterInstructorId, membersOptions]);

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
          <div className="flex gap-2">
            {canEditContent && (
              <Button variant="outline" onClick={() => navigate('/attendance-recap')}>
                <CalendarCheck className="w-4 h-4 mr-2" /> Récapitulatif de Présence
              </Button>
            )}
            {canEditContent && (
              <Button onClick={() => navigate('/session-log/new')}>
                <PlusCircle className="w-4 h-4 mr-2" /> Créer une séance
              </Button>
            )}
          </div>
        </div>
      </motion.div>

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
            {/* Filter card */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="filterCycle">Filtrer par cycle</Label>
                <Select value={filterCycleId} onValueChange={(v) => setFilterCycleId(v)}>
                  <SelectTrigger id="filterCycle">
                    <SelectValue placeholder="Tous les cycles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les cycles</SelectItem>
                    {cyclesOptions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filterSchedule">Filtrer par emploi du temps</Label>
                <Select value={filterScheduleId} onValueChange={(v) => setFilterScheduleId(v)}>
                  <SelectTrigger id="filterSchedule">
                    <SelectValue placeholder="Tous les emplois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les emplois</SelectItem>
                    {schedulesOptions.map(s => (
                      <SelectItem key={s.id} value={s.id}>{`${s.type} / ${s.age_category} / ${s.day} ${s.start_time}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <InstructorAutocomplete
                  value={filterInstructorId}
                  onChange={(id) => setFilterInstructorId(id)}
                  members={membersOptions}
                  label="Filtrer par encadrant"
                />
              </div>
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