import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CalendarCheck, CheckCircle2, X, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatName } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const AttendanceRecap = () => {
  const { isAdmin, isEncadrant, loading: authLoading } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [onlyShowAbsent, setOnlyShowAbsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirection si pas admin ou encadrant
  useEffect(() => {
    if (!authLoading && !isAdmin && !isEncadrant) {
      navigate('/schedule');
      return;
    }
  }, [isAdmin, isEncadrant, authLoading, navigate]);

  // Charger tous les schedules
  const fetchSchedules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, type, age_category, day, start_time, end_time')
        .order('day')
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);

      // Sélectionner le premier schedule par défaut
      if (data && data.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les plannings.',
        variant: 'destructive'
      });
    }
  }, [selectedScheduleId, toast]);

  // Fonction pour trouver le title correspondant à un schedule
  const findMatchingTitle = (scheduleType, scheduleAgeCategory, availableTitles) => {
    // Essayer plusieurs formats possibles
    const searchTerms = [
      `${scheduleType} ${scheduleAgeCategory}`,
      `${scheduleAgeCategory} ${scheduleType}`,
      scheduleAgeCategory,
      scheduleType
    ].map(term => term.toLowerCase().trim());

    console.log('Termes de recherche:', searchTerms);

    // Chercher une correspondance exacte ou partielle
    for (const title of availableTitles) {
      const titleLower = title.toLowerCase();
      for (const term of searchTerms) {
        if (titleLower === term || titleLower.includes(term) || term.includes(titleLower)) {
          console.log(`Match trouvé: "${title}" correspond à "${term}"`);
          return title;
        }
      }
    }

    return null;
  };

  // Charger les données de présence pour un schedule donné
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedScheduleId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Récupérer le schedule sélectionné d'abord
      const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

      if (!selectedSchedule) {
        setAttendanceData([]);
        setLoading(false);
        return;
      }

      console.log('Schedule sélectionné:', selectedSchedule);

      // 1. Récupérer toutes les sessions (même sans schedule_id)
      // On va les filtrer ensuite en fonction du jour et de l'heure du schedule
      const { data: allSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, date, start_time, students, schedule_id')
        .not('date', 'is', null)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (sessionsError) throw sessionsError;

      console.log('Toutes les sessions récupérées:', allSessions);

      // Filtrer les sessions qui correspondent au schedule
      // Soit par schedule_id direct, soit par correspondance de jour/heure
      const sessionsData = allSessions.filter(session => {
        // Si la session a un schedule_id qui correspond, on la garde
        if (session.schedule_id === selectedScheduleId) {
          return true;
        }

        // Sinon, on vérifie si le jour de la semaine et l'heure correspondent
        if (session.date && session.start_time) {
          const sessionDate = new Date(session.date);
          const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
          const sessionDay = daysOfWeek[sessionDate.getDay()];
          const sessionTime = session.start_time.substring(0, 5); // Format HH:MM

          return sessionDay === selectedSchedule.day &&
                 sessionTime === selectedSchedule.start_time.substring(0, 5);
        }

        return false;
      });

      console.log('Sessions filtrées pour le schedule:', sessionsData);
      setSessions(sessionsData || []);

      // 2. Récupérer tous les membres du schedule sélectionné

      // Récupérer tous les titles disponibles
      const { data: allMembersWithTitle } = await supabase
        .from('secure_members')
        .select('id, first_name, last_name, title')
        .not('title', 'is', null);

      const availableTitles = [...new Set(allMembersWithTitle?.map(m => m.title) || [])];
      console.log('Titles disponibles:', availableTitles);

      // Trouver le title correspondant au schedule
      const matchingTitle = findMatchingTitle(
        selectedSchedule.type,
        selectedSchedule.age_category,
        availableTitles
      );

      console.log('Title correspondant trouvé:', matchingTitle);

      let membersData = [];
      if (matchingTitle) {
        membersData = allMembersWithTitle.filter(m => m.title === matchingTitle);
      }

      console.log('Membres trouvés:', membersData);

      // 3. Construire le tableau de présence
      const attendance = (membersData || []).map(member => {
        const memberAttendance = {
          member,
          sessions: {}
        };

        // Pour chaque session, vérifier si l'élève était présent
        (sessionsData || []).forEach(session => {
          const isPresent = session.students && session.students.includes(member.id);
          memberAttendance.sessions[session.id] = isPresent;
        });

        return memberAttendance;
      });

      console.log('Données de présence construites:', attendance);
      setAttendanceData(attendance);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de présence.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedScheduleId, schedules, toast]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (selectedScheduleId && schedules.length > 0) {
      fetchAttendanceData();
    }
  }, [selectedScheduleId, schedules.length, fetchAttendanceData]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isEncadrant) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Accès non autorisé</h1>
        <p className="text-muted-foreground">
          Cette page est réservée aux administrateurs et encadrants.
        </p>
      </div>
    );
  }

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

  // Appliquer le filtre si demandé : ne garder que les élèves absents au moins une fois
  const displayedAttendance = onlyShowAbsent
    ? attendanceData.filter(({ sessions: memberSessions }) => {
        // Si aucune séance, on ne considère pas comme absent
        const values = Object.values(memberSessions || {});
        if (values.length === 0) return false;
        // Retourne true si au moins une séance est faussey (absent ou non marqué)
        return !values.every(Boolean);
      })
    : attendanceData;

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Récapitulatif de Présence - ALJ Escalade Jonage</title>
        <meta
          name="description"
          content="Récapitulatif des présences des élèves aux séances d'entraînement."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <CalendarCheck className="w-10 h-10 text-primary" />
            Récapitulatif de Présence
          </h1>
          <p className="text-muted-foreground mt-2">
            Consultez les présences des élèves par planning
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Sélectionner un Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisissez un planning..." />
              </SelectTrigger>
              <SelectContent>
                {schedules.map(schedule => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{schedule.type}</Badge>
                      <span>{schedule.age_category}</span>
                      <span className="text-muted-foreground">
                        - {schedule.day} {schedule.start_time}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="only-absent"
                  checked={onlyShowAbsent}
                  onCheckedChange={(val) => setOnlyShowAbsent(Boolean(val))}
                />
                <Label htmlFor="only-absent" className="text-sm">Afficher seulement les absents</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {selectedSchedule && sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Présences - {selectedSchedule.type} {selectedSchedule.age_category}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {attendanceData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">
                        Élève
                      </TableHead>
                      {sessions.map(session => (
                        <TableHead key={session.id} className="text-center min-w-[120px]">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">
                              {new Date(session.date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground font-normal">
                              {session.start_time}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold sticky right-0 bg-background z-10 min-w-[100px]">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map(({ member, sessions: memberSessions }) => {
                      const totalPresent = Object.values(memberSessions).filter(Boolean).length;

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium sticky left-0 bg-background z-10">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <span>
                                {formatName(member.first_name, member.last_name, true)}
                              </span>
                            </div>
                          </TableCell>
                          {sessions.map(session => (
                            <TableCell key={session.id} className="text-center">
                              {memberSessions[session.id] ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-bold sticky right-0 bg-background z-10 text-primary">
                            {totalPresent} / {sessions.length}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucun élève trouvé pour ce planning.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {selectedSchedule && sessions.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="py-12">
              <p className="text-muted-foreground text-center">
                Aucune séance enregistrée pour ce planning.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!selectedSchedule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="py-12">
              <p className="text-muted-foreground text-center">
                Veuillez sélectionner un planning pour afficher les présences.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AttendanceRecap;
