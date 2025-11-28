import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatName } from '@/lib/utils';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Helper function to compare climbing grades
const compareGrades = (grade1, grade2) => {
  if (!grade1) return -1;
  if (!grade2) return 1;

  const grades = ['4a', '4a+', '4b', '4b+', '4c', '4c+', '5a', '5a+', '5b', '5b+', '5c', '5c+',
    '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+',
    '8a', '8a+', '8b', '8b+', '8c', '8c+'];

  const index1 = grades.indexOf(grade1);
  const index2 = grades.indexOf(grade2);

  if (index1 === -1) return -1;
  if (index2 === -1) return 1;

  return index1 - index2;
};

// Get the maximum grade from an array of grades
const getMaxGrade = (grades) => {
  if (!grades || grades.length === 0) return null;
  return grades.reduce((max, current) => {
    return compareGrades(current, max) > 0 ? current : max;
  }, grades[0]);
};

const CommentsSummary = () => {
  const { loading: authLoading } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [onlyShowWithComments, setOnlyShowWithComments] = useState(true); // Activé par défaut
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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

      // Si aucun schedule sélectionné, sélectionner "Lycéens - Mardi 18:30:00" par défaut
      if (data && data.length > 0 && !selectedScheduleId) {
        // Chercher le planning "Lycéens - Mardi 18:30:00"
        const defaultSchedule = data.find(
          s => s.age_category === 'Lycéens' && s.day === 'Mardi' && s.start_time === '18:30:00'
        );
        // Si trouvé, le sélectionner, sinon prendre le premier
        setSelectedScheduleId(defaultSchedule ? defaultSchedule.id : data[0].id);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les plannings.',
        variant: 'destructive'
      });
    }
  }, [toast, selectedScheduleId]);

  // Charger les données de commentaires pour un schedule donné
  const fetchCommentsData = useCallback(async () => {
    if (!selectedScheduleId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Récupérer les sessions du schedule (3 derniers mois, max 50)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, date, start_time')
        .eq('schedule_id', selectedScheduleId)
        .not('date', 'is', null)
        .gte('date', threeMonthsAgoStr)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;

      const sessionsArray = sessionsData || [];
      setSessions(sessionsArray);

      // 2. Récupérer les membres inscrits à ce schedule
      const { data: memberScheduleData, error: memberScheduleError } = await supabase
        .from('member_schedule')
        .select(`
          member_id,
          members:member_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('schedule_id', selectedScheduleId);

      if (memberScheduleError) throw memberScheduleError;

      // Extraire les membres
      const members = (memberScheduleData || [])
        .map(ms => ms.members)
        .filter(Boolean);

      // 3. Récupérer les commentaires pour ces sessions et membres
      const sessionIds = sessionsArray.map(s => s.id);
      const memberIds = members.map(m => m.id);

      let commentsData = [];
      if (sessionIds.length > 0 && memberIds.length > 0) {
        const { data: comments, error: commentsError } = await supabase
          .from('student_session_comments')
          .select('session_id, member_id, comment, max_moulinette, max_tete')
          .in('session_id', sessionIds)
          .in('member_id', memberIds);

        if (commentsError) throw commentsError;
        commentsData = comments || [];
      }

      // 4. Agréger les données par élève
      const summary = members.map(member => {
        const memberComments = commentsData
          .filter(c => c.member_id === member.id && c.comment && c.comment.trim())
          .map(c => {
            const session = sessionsArray.find(s => s.id === c.session_id);
            return {
              comment: c.comment,
              max_moulinette: c.max_moulinette,
              max_tete: c.max_tete,
              date: session?.date,
              sessionId: c.session_id
            };
          })
          .filter(c => c.date) // Ne garder que les commentaires avec date valide
          .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordre chronologique

        // Calculate max grades across all sessions for this member
        const allMemberData = commentsData.filter(c => c.member_id === member.id);
        const moulinetteGrades = allMemberData.map(c => c.max_moulinette).filter(Boolean);
        const teteGrades = allMemberData.map(c => c.max_tete).filter(Boolean);

        const maxMoulinette = getMaxGrade(moulinetteGrades);
        const maxTete = getMaxGrade(teteGrades);

        return {
          member,
          comments: memberComments,
          totalComments: memberComments.length,
          maxMoulinette,
          maxTete
        };
      });

      setSummaryData(summary);
    } catch (error) {
      console.error('Error fetching comments data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données des commentaires.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedScheduleId, toast]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (selectedScheduleId && schedules.length > 0) {
      fetchCommentsData();
    }
  }, [selectedScheduleId, schedules.length, fetchCommentsData]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

  // Appliquer les filtres
  const displayedData = summaryData
    .filter(({ comments }) => {
      // Filtre : afficher seulement les élèves avec commentaires
      if (onlyShowWithComments && comments.length === 0) return false;
      return true;
    })
    .filter(({ member }) => {
      // Filtre : recherche par prénom/nom
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase();
      const firstMatch = member.first_name?.toLowerCase().includes(searchLower);
      const lastMatch = member.last_name?.toLowerCase().includes(searchLower);
      return firstMatch || lastMatch;
    });

  return (
    <ProtectedRoute
      pageTitle="Récapitulatif Commentaires"
      message="Cette page est réservée aux administrateurs, membres du bureau et encadrants."
    >
      <Helmet>
        <title>Récapitulatif Commentaires - ALJ Jonage Escalade</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">Récapitulatif des Commentaires</h1>
          <p className="text-muted-foreground mt-2">
            Consultez les commentaires par élève et par planning
          </p>
        </motion.div>

        {/* Carte de filtres */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dropdown créneau */}
            <div>
              <Label htmlFor="schedule-select">Planning</Label>
              <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                <SelectTrigger id="schedule-select" className="w-full mt-1">
                  <SelectValue placeholder="Sélectionner un planning" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map(schedule => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {schedule.type}
                        </Badge>
                        <span>
                          {schedule.age_category} - {schedule.day} {schedule.start_time}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtres additionnels */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="only-with-comments"
                  checked={onlyShowWithComments}
                  onCheckedChange={setOnlyShowWithComments}
                />
                <Label htmlFor="only-with-comments" className="cursor-pointer">
                  Afficher seulement les élèves avec commentaires
                </Label>
              </div>

              <Input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tableau des commentaires */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedSchedule && (
                <>
                  Commentaires - {selectedSchedule.type} {selectedSchedule.age_category}
                </>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {displayedData.length} élève(s)
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Élève</TableHead>
                  <TableHead className="w-[120px] text-center">Max Moulinette</TableHead>
                  <TableHead className="w-[120px] text-center">Max en Tête</TableHead>
                  <TableHead>Commentaires</TableHead>
                  <TableHead className="w-[100px] text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {searchTerm.trim() ? (
                        <>Aucun élève trouvé pour "{searchTerm}"</>
                      ) : onlyShowWithComments ? (
                        <>Aucun élève avec commentaires pour ce planning</>
                      ) : (
                        <>Aucun élève inscrit à ce planning</>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedData.map(({ member, comments, totalComments, maxMoulinette, maxTete }) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`/member-view/${member.id}`)}
                          className="font-medium hover:underline"
                        >
                          {formatName(member.first_name, member.last_name, true)}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {maxMoulinette ? (
                          <Badge variant="secondary">{maxMoulinette}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {maxTete ? (
                          <Badge variant="secondary">{maxTete}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {comments.length === 0 ? (
                          <span className="text-muted-foreground italic">
                            Aucun commentaire
                          </span>
                        ) : (
                          <ul className="space-y-2">
                            {comments.map((c, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1">
                                  <Button
                                    variant="link"
                                    className="h-auto p-0 text-left justify-start whitespace-normal hover:underline"
                                    onClick={() => navigate(`/session-log/${c.sessionId}`)}
                                  >
                                    <span className="text-foreground">"{c.comment}"</span>
                                    <span className="text-muted-foreground ml-2">
                                      ({new Date(c.date).toLocaleDateString('fr-FR')})
                                    </span>
                                    {(c.max_moulinette || c.max_tete) && (
                                      <span className="ml-2 flex gap-2">
                                        {c.max_moulinette && <Badge variant="outline" className="text-xs">Moulinette: {c.max_moulinette}</Badge>}
                                        {c.max_tete && <Badge variant="outline" className="text-xs">Tête: {c.max_tete}</Badge>}
                                      </span>
                                    )}
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={totalComments > 0 ? "default" : "outline"}>
                          {totalComments}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default CommentsSummary;
