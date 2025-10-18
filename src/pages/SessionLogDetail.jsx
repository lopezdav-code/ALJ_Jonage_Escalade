import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Helmet } from '../components/ui/helmet';
import { ExternalLink, FileText, Calendar, Clock, Users, Target, Package, MessageSquare, ArrowLeft } from 'lucide-react';

const SessionLogDetail = () => {
  const { id } = useParams(); // Correctly extract 'id' from URL parameters
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionDetail = async () => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            *,
            cycles (
              name,
              short_description
            ),
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
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

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
            }
          } catch (err) {
            // Erreur lors de la récupération du schedule
          }
        }

        // Récupérer les informations des membres
        const allMemberIds = [
          ...(data.instructors || []),
          ...(data.students || []),
          ...(data.absent_students || [])
        ];

        let membersMap = {};
        if (allMemberIds.length > 0) {
          const { data: members, error: membersError } = await supabase
            .from('secure_members')
            .select('id, first_name, last_name')
            .in('id', allMemberIds);

          if (membersError) {
            throw membersError;
          }

          membersMap = (members || []).reduce((acc, member) => {
            acc[member.id] = {
              id: member.id,
              fullName: `${member.first_name} ${member.last_name}`,
              firstName: member.first_name,
              lastName: member.last_name
            };
            return acc;
          }, {});
        }

        // Récupérer les commentaires par élève pour cette session
        let studentCommentsMap = {};
        if (data.students && data.students.length > 0) {
          const { data: comments, error: commentsError } = await supabase
            .from('student_session_comments')
            .select('member_id, comment')
            .eq('session_id', id) // Use 'id' here
            .in('member_id', data.students);

          if (commentsError) {
            throw commentsError;
          }

          studentCommentsMap = (comments || []).reduce((acc, comment) => {
            acc[comment.member_id] = comment.comment;
            return acc;
          }, {});
        }

        // Récupérer les infos des fiches pédagogiques
        const pedagogySheetIds = (data.exercises || [])
          .map(ex => ex.pedagogy_sheet_id)
          .filter(Boolean);

        let pedagogySheetsMap = {};
        if (pedagogySheetIds.length > 0) {
          const { data: sheets, error: sheetsError } = await supabase
            .from('pedagogy_sheets')
            .select('id, title, sheet_type')
            .in('id', pedagogySheetIds);

          if (sheetsError) {
            throw sheetsError;
          }

          pedagogySheetsMap = (sheets || []).reduce((acc, sheet) => {
            acc[sheet.id] = sheet;
            return acc;
          }, {});
        }

        // Récupérer tous les membres 'Loisir lycée' depuis la table `members`
        let lyceeMembers = [];
        try {
          const { data: lyceeData, error: lyceeError } = await supabase
            .from('members')
            .select('id, first_name, last_name')
            .eq('title', 'Loisir lycée')
            .order('last_name')
            .order('first_name');

          if (lyceeError) {
            // Ne pas bloquer la page si l'appel échoue, on logge seulement
            console.warn('Erreur en récupérant les membres lycéens:', lyceeError);
          } else {
            lyceeMembers = lyceeData || [];
          }
        } catch (err) {
          console.warn('Exception en récupérant les membres lycéens:', err);
        }

        const lyceeMap = (lyceeMembers || []).reduce((acc, member) => {
          acc[member.id] = {
            id: member.id,
            fullName: `${member.first_name} ${member.last_name}`,
            firstName: member.first_name,
            lastName: member.last_name
          };
          return acc;
        }, {});

        // Enrichir la session avec les noms des membres et commentaires
        const enrichedSession = {
          ...data,
          schedule: scheduleData,
          instructorNames: (data.instructors || []).map(memberId => membersMap[memberId]?.fullName || `ID: ${memberId}`),
          studentNames: (data.students || []).map(memberId => membersMap[memberId]?.fullName || `ID: ${memberId}`),
          studentsData: (data.students || []).map(memberId => ({
            ...(membersMap[memberId] || { id: memberId, fullName: `ID: ${memberId}`, firstName: '', lastName: '' }),
            comment: studentCommentsMap[memberId] || ''
          })),
          // Absent students derived from table `members` (Loisir lycée) minus les présents
          absentNames: (() => {
            const presentIds = new Set(data.students || []);
            return (lyceeMembers || [])
              .filter(m => !presentIds.has(m.id))
              .map(m => `${m.first_name} ${m.last_name}`);
          })(),
          absentData: (() => {
            const presentIds = new Set(data.students || []);
            return (lyceeMembers || [])
              .filter(m => !presentIds.has(m.id))
              .map(m => ({ id: m.id, fullName: `${m.first_name} ${m.last_name}`, firstName: m.first_name, lastName: m.last_name }));
          })(),
          exercises: (data.exercises || []).map(ex => ({
            ...ex,
            pedagogy_sheet: ex.pedagogy_sheet_id ? pedagogySheetsMap[ex.pedagogy_sheet_id] : null
          }))
        };
        setSession(enrichedSession);
      } catch (err) {
        console.error('General error in fetchSessionDetail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) { // Use 'id' here
      fetchSessionDetail();
    } else {
      setError('Session ID is missing.');
      setLoading(false);
    }
  }, [id]); // Depend on 'id' here

  if (loading) {
    return <div className="container mx-auto p-4">Chargement des détails de la séance...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Erreur: {error}</div>;
  }

  if (!session) {
    return <div className="container mx-auto p-4">Séance non trouvée.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Helmet title={`Détail de la séance - ${session.date ? new Date(session.date).toLocaleDateString() : 'Sans date'}`} />

      {/* En-tête avec boutons retour et modifier */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/session-log')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">Détail de la séance</h1>
        </div>
        <Button onClick={() => navigate(`/session-log/edit/${id}`)}> {/* Use 'id' here */}
          Modifier la séance
        </Button>
      </div>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date et heure */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {session.date ? new Date(session.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Non spécifiée'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Heure de début</p>
                <p className="font-medium">{session.start_time || 'Non spécifiée'}</p>
              </div>
            </div>
          </div>

          {/* Cycle */}
          {session.cycles && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Cycle: {session.cycles.name}
              </p>
              {session.cycles.short_description && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {session.cycles.short_description}
                </p>
              )}
            </div>
          )}

          {/* Emploi du temps */}
          {session.schedule && (
            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="font-semibold text-purple-900 dark:text-purple-100">
                Emploi du temps: {session.schedule.type} - {session.schedule.age_category}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                {session.schedule.day} de {session.schedule.start_time} à {session.schedule.end_time}
              </p>
            </div>
          )}

          {/* Objectif de séance */}
          {session.session_objective && (
            <div className="border-l-4 border-primary pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <p className="font-semibold">Objectif de séance</p>
              </div>
              <p className="text-muted-foreground">{session.session_objective}</p>
            </div>
          )}

          {/* Matériel */}
          {session.equipment && (
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-orange-500" />
                <p className="font-semibold">Matériel</p>
              </div>
              <p className="text-muted-foreground">{session.equipment}</p>
            </div>
          )}

          {/* Commentaire */}
          {session.comment && (
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <p className="font-semibold">Commentaire</p>
              </div>
              <p className="text-muted-foreground">{session.comment}</p>
            </div>
          )}

          {/* Encadrants */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <p className="font-semibold">Encadrants ({session.instructorNames?.length || 0})</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.instructorNames?.map((name, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Élèves présents avec commentaires */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <p className="font-semibold">Élèves présents ({session.studentsData?.length || 0})</p>
            </div>
            {session.studentsData && session.studentsData.length > 0 ? (
              <div className="space-y-3">
                {/* Élèves sans commentaire - Format compact */}
                {session.studentsData.filter(s => !s.comment).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {session.studentsData
                      .filter(student => !student.comment)
                      .map((student, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-sm py-1.5 px-3 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100"
                        >
                          {student.fullName}
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Élèves avec commentaire - Format détaillé */}
                {session.studentsData
                  .filter(student => student.comment)
                  .map((student, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className="text-sm py-1 px-3 bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100 whitespace-nowrap"
                        >
                          {student.fullName}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground italic">
                            "{student.comment}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun élève enregistré</p>
            )}
          </div>

          {/* Élèves absents */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <p className="font-semibold">Élèves absents ({session.absentData?.length || 0})</p>
            </div>
            {session.absentData && session.absentData.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {session.absentData.map((student, index) => (
                  <Badge key={index} variant="outline" className="text-sm py-1.5 px-3 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100">
                    {student.fullName}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun élève absent enregistré</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercices */}
      <Card>
        <CardHeader>
          <CardTitle>Déroulé de la séance ({session.exercises?.length || 0} exercices)</CardTitle>
        </CardHeader>
        <CardContent>
          {session.exercises && session.exercises.length > 0 ? (
            <div className="space-y-6">
              {session.exercises.map((exercise, index) => (
                <div key={exercise.id} className="border rounded-lg p-4 space-y-3">
                  {/* En-tête de l'exercice */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                        <h3 className="text-lg font-semibold">{exercise.operational_objective || 'Sans titre'}</h3>
                      </div>
                      {exercise.pedagogy_sheet && (
                        <div className="flex items-center gap-2 mt-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <button
                            onClick={() => navigate(`/pedagogy-sheets/${exercise.pedagogy_sheet_id}`)}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Fiche pédagogique: {exercise.pedagogy_sheet.title}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {exercise.time && (
                      <Badge variant="secondary" className="whitespace-nowrap">
                        <Clock className="w-3 h-3 mr-1" />
                        {exercise.time}
                      </Badge>
                    )}
                  </div>

                  {/* Image de l'exercice */}
                  {exercise.image_url && (
                    <div className="my-3">
                      <img
                        src={exercise.image_url}
                        alt={exercise.operational_objective || 'Image exercice'}
                        className="max-w-full h-auto rounded-lg border shadow-sm max-h-96 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Détails de l'exercice */}
                  <div className="grid gap-3 text-sm">
                    {exercise.situation && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Situation</p>
                        <p className="text-foreground">{exercise.situation}</p>
                      </div>
                    )}
                    {exercise.organisation && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Organisation</p>
                        <p className="text-foreground">{exercise.organisation}</p>
                      </div>
                    )}
                    {exercise.consigne && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Consigne</p>
                        <p className="text-foreground">{exercise.consigne}</p>
                      </div>
                    )}
                    {exercise.success_criteria && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Critères de réussite</p>
                        <p className="text-foreground">{exercise.success_criteria}</p>
                      </div>
                    )}
                    {exercise.regulation && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Régulation</p>
                        <p className="text-foreground">{exercise.regulation}</p>
                      </div>
                    )}
                    {exercise.support_link && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Lien de support</p>
                        <a
                          href={exercise.support_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {exercise.support_link}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucun exercice enregistré pour cette séance.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionLogDetail;
