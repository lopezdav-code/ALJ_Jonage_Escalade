import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, User, Mail, Phone, Award, Shield, FileText, Calendar, Users, Eye, Trophy, Medal, MapPin, Euro, Pencil, GraduationCap, Clock, MessageSquare, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMemberViewPermissions } from '@/hooks/useMemberViewPermissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberPhotoUrl } from '@/lib/memberStorageUtils';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value}</p>
      </div>
    </div>
  );
};

const MemberView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin, isBureau, loading: authLoading } = useAuth();
  const { canViewDetail, loading: permissionsLoading } = useMemberViewPermissions();
  const canEdit = isAdmin || isBureau;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState({ contact1: null, contact2: null });
  const [isEmergencyContactFor, setIsEmergencyContactFor] = useState([]);
  const [competitionResults, setCompetitionResults] = useState([]);
  const [competitionInscriptions, setCompetitionInscriptions] = useState([]);
  const [teachingSchedule, setTeachingSchedule] = useState([]);
  const [memberSchedules, setMemberSchedules] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionHistoryLoading, setSessionHistoryLoading] = useState(false);
  const [sessionHistoryLoaded, setSessionHistoryLoaded] = useState(false);

  // Get the tab to return to from navigation state
  const fromTab = location.state?.fromTab;

  const navigateToVolunteers = () => {
    const url = fromTab ? `/volunteers?tab=${encodeURIComponent(fromTab)}` : '/volunteers';
    navigate(url);
  };

  // Function to fetch session history when accordion is opened
  const fetchSessionHistory = async () => {
    if (sessionHistoryLoaded || sessionHistoryLoading || !id) return;

    setSessionHistoryLoading(true);
    try {
      // Fetch session history (sessions the member attended)
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          date,
          start_time,
          session_objective,
          equipment,
          comment,
          instructors,
          cycles (id, name),
          schedules (id, type, age_category, day, start_time)
        `)
        .contains('students', [id])
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

      if (sessions && sessions.length > 0) {
        // Fetch member's specific comments for these sessions
        const sessionIds = sessions.map(s => s.id);
        const { data: comments } = await supabase
          .from('student_session_comments')
          .select('session_id, comment')
          .eq('member_id', id)
          .in('session_id', sessionIds);

        // Fetch instructor details
        const allInstructorIds = [...new Set(sessions.flatMap(s => s.instructors || []))];
        const { data: instructors } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .in('id', allInstructorIds);

        // Merge data
        const sessionsWithDetails = sessions.map(session => ({
          ...session,
          memberComment: comments?.find(c => c.session_id === session.id)?.comment || null,
          instructorsList: (session.instructors || [])
            .map(instId => instructors?.find(i => i.id === instId))
            .filter(Boolean)
        }));

        setSessionHistory(sessionsWithDetails);
      }
      setSessionHistoryLoaded(true);
    } catch (error) {
      console.error('Erreur chargement historique séances:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des séances",
        variant: "destructive",
      });
    } finally {
      setSessionHistoryLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when permissions are loaded
    if (authLoading || permissionsLoading) return;

    // Check permission
    if (!canViewDetail) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas la permission de consulter les détails des membres.",
        variant: "destructive",
      });
      navigateToVolunteers();
      return;
    }

    const fetchMember = async () => {
      setLoading(true);

      // Reset all states when loading a new member to avoid showing cached data
      setMember(null);
      setPhotoUrl(null);
      setEmergencyContacts({ contact1: null, contact2: null });
      setIsEmergencyContactFor([]);
      setCompetitionResults([]);
      setCompetitionInscriptions([]);
      setTeachingSchedule([]);
      setMemberSchedules([]);
      setSessionHistory([]);
      setSessionHistoryLoading(false);
      setSessionHistoryLoaded(false);

      try {
        // Fetch member data
        const { data, error } = await supabase
          .from('secure_members')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erreur chargement membre:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les informations du membre",
            variant: "destructive",
          });
          navigateToVolunteers();
          return;
        }

        setMember(data);

        // Fetch emergency contacts if they exist
        if (data.emergency_contact_1_id || data.emergency_contact_2_id) {
          const contactIds = [data.emergency_contact_1_id, data.emergency_contact_2_id].filter(Boolean);
          const { data: contacts } = await supabase
            .from('secure_members')
            .select('id, first_name, last_name, phone, email')
            .in('id', contactIds);

          if (contacts) {
            const contact1 = contacts.find(c => c.id === data.emergency_contact_1_id);
            const contact2 = contacts.find(c => c.id === data.emergency_contact_2_id);
            setEmergencyContacts({ contact1, contact2 });
          }
        }

        // Fetch members for whom this person is an emergency contact
        const { data: contactFor } = await supabase
          .from('secure_members')
          .select('id, first_name, last_name')
          .or(`emergency_contact_1_id.eq.${id},emergency_contact_2_id.eq.${id}`);

        if (contactFor) {
          setIsEmergencyContactFor(contactFor);
        }

        // Get photo URL if exists
        if (data.photo_url) {
          const url = await getMemberPhotoUrl(data.photo_url);
          setPhotoUrl(url);
        }

        // Fetch competition participations
        const { data: participations } = await supabase
          .from('competition_participants')
          .select(`
            id,
            role,
            ranking,
            nb_competitor,
            competitions (
              id,
              name,
              short_title,
              start_date,
              location,
              prix,
              disciplines,
              nature,
              niveau
            )
          `)
          .eq('member_id', id)
          .order('start_date', { foreignTable: 'competitions', ascending: false });

        if (participations) {
          // Separate results (with ranking) from simple inscriptions
          const results = participations.filter(p => p.role === 'Competiteur' && p.ranking);
          const inscriptions = participations.filter(p => p.role === 'Competiteur');

          setCompetitionResults(results);
          setCompetitionInscriptions(inscriptions);
        }

        // Fetch teaching schedule (courses where member is instructor)
        const { data: schedules } = await supabase
          .from('schedules')
          .select(`
            *,
            groupe:Groupe(id, category, sous_category, Groupe_schedule)
          `)
          .or(`instructor_1_id.eq.${id},instructor_2_id.eq.${id},instructor_3_id.eq.${id},instructor_4_id.eq.${id}`)
          .order('day')
          .order('start_time');

        if (schedules && schedules.length > 0) {
          // Fetch students for each schedule
          const scheduleIds = schedules.map(s => s.id);
          const { data: memberSchedules } = await supabase
            .from('member_schedule')
            .select(`
              id,
              schedule_id,
              member:members(id, first_name, last_name)
            `)
            .in('schedule_id', scheduleIds);

          // Group students by schedule_id
          const studentsBySchedule = (memberSchedules || []).reduce((acc, ms) => {
            if (!acc[ms.schedule_id]) {
              acc[ms.schedule_id] = [];
            }
            if (ms.member) {
              acc[ms.schedule_id].push(ms.member);
            }
            return acc;
          }, {});

          // Add students to each schedule
          const schedulesWithStudents = schedules.map(schedule => ({
            ...schedule,
            students: studentsBySchedule[schedule.id] || []
          }));

          setTeachingSchedule(schedulesWithStudents);
        }

        // Fetch member's own schedules (courses they attend as a student)
        const { data: memberScheduleData } = await supabase
          .from('member_schedule')
          .select(`
            id,
            schedule:schedules(
              *,
              groupe:Groupe(id, category, sous_category, Groupe_schedule),
              instructor_1:instructor_1_id(id, first_name, last_name),
              instructor_2:instructor_2_id(id, first_name, last_name),
              instructor_3:instructor_3_id(id, first_name, last_name),
              instructor_4:instructor_4_id(id, first_name, last_name)
            )
          `)
          .eq('member_id', id);

        if (memberScheduleData) {
          // Filter out null schedules and add instructors array
          const schedulesWithInstructors = memberScheduleData
            .filter(ms => ms.schedule)
            .map(ms => ({
              ...ms.schedule,
              instructors: [
                ms.schedule.instructor_1,
                ms.schedule.instructor_2,
                ms.schedule.instructor_3,
                ms.schedule.instructor_4
              ].filter(Boolean)
            }))
            .sort((a, b) => {
              // Sort by day then by start_time
              const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
              const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
              if (dayDiff !== 0) return dayDiff;
              return a.start_time.localeCompare(b.start_time);
            });

          setMemberSchedules(schedulesWithInstructors);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des données",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMember();
    }
  }, [id, canViewDetail, authLoading, permissionsLoading]);

  if (loading || authLoading || permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center p-8">
        <p className="text-lg text-muted-foreground mb-4">Membre non trouvé</p>
        <BackButton onClick={() => navigateToVolunteers()}>
          Retour aux adhérents
        </BackButton>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Helmet>
        <title>{member.first_name} {member.last_name} - Club d'Escalade</title>
      </Helmet>

      <div className="mb-6 flex items-center justify-between gap-4">
        <BackButton onClick={() => navigateToVolunteers()}>
          Retour aux adhérents
        </BackButton>
        {canEdit && (
          <Button
            onClick={() => navigate(`/member-edit/${id}`, { state: { fromTab } })}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
        )}
      </div>

      {/* Header with photo and name */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={photoUrl} alt={`${member.first_name} ${member.last_name}`} />
              <AvatarFallback>
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl mb-2">
                {member.first_name} {member.last_name}
              </CardTitle>
              {member.title && (
                <Badge variant="secondary" className="text-base">
                  {member.title}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={User} label="Sexe" value={member.sexe === 'H' ? 'Homme' : member.sexe === 'F' ? 'Femme' : null} />
            <InfoRow icon={Users} label="Catégorie" value={member.category} />
            <InfoRow icon={Users} label="Sous-groupe" value={member.sub_group} />
            <InfoRow icon={FileText} label="Licence" value={member.licence} />
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Mail} label="Email" value={member.email} />
            <InfoRow icon={Phone} label="Téléphone" value={member.phone} />
          </CardContent>
        </Card>

        {/* Escalade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Escalade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Award} label="Passeport" value={member.passeport} />
            {member.brevet_federaux && member.brevet_federaux.length > 0 && (
              <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Brevets fédéraux</p>
                <div className="flex flex-wrap gap-2">
                  {member.brevet_federaux.map((brevet, index) => (
                    <Badge key={index} variant="outline">
                      {brevet}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency contacts */}
        {(emergencyContacts.contact1 || emergencyContacts.contact2) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Contacts d'urgence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {emergencyContacts.contact1 && (
                <div className="pb-3 border-b last:border-b-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Contact 1</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/member-view/${emergencyContacts.contact1.id}`, { state: { fromTab } })}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Voir la fiche
                    </Button>
                  </div>
                  <p className="text-base font-semibold mb-1">{emergencyContacts.contact1.first_name} {emergencyContacts.contact1.last_name}</p>
                  <div className="space-y-1">
                    {emergencyContacts.contact1.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{emergencyContacts.contact1.phone}</span>
                      </div>
                    )}
                    {emergencyContacts.contact1.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{emergencyContacts.contact1.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {emergencyContacts.contact2 && (
                <div className="pb-3 border-b last:border-b-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Contact 2</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/member-view/${emergencyContacts.contact2.id}`, { state: { fromTab } })}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Voir la fiche
                    </Button>
                  </div>
                  <p className="text-base font-semibold mb-1">{emergencyContacts.contact2.first_name} {emergencyContacts.contact2.last_name}</p>
                  <div className="space-y-1">
                    {emergencyContacts.contact2.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{emergencyContacts.contact2.phone}</span>
                      </div>
                    )}
                    {emergencyContacts.contact2.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{emergencyContacts.contact2.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Is emergency contact for */}
        {isEmergencyContactFor.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Contact d'urgence pour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {isEmergencyContactFor.map((person) => (
                  <Button
                    key={person.id}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/member-view/${person.id}`, { state: { fromTab } })}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-3 h-3" />
                    {person.first_name} {person.last_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member's Schedules - Courses they attend */}
        {memberSchedules.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Mes séances ({memberSchedules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {memberSchedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="default" className="font-medium">
                          {schedule.day}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {schedule.type && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Type:</span>
                            <Badge variant="secondary" className="text-xs">{schedule.type}</Badge>
                          </div>
                        )}

                        {schedule.age_category && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Catégorie d'âge:</span>
                            <span className="text-sm">{schedule.age_category}</span>
                          </div>
                        )}

                        {schedule.groupe && (
                          <div className="mt-2 p-2 bg-muted/30 rounded">
                            <p className="text-sm font-medium mb-1">Groupe:</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {schedule.groupe.category && (
                                <Badge variant="outline">{schedule.groupe.category}</Badge>
                              )}
                              {schedule.groupe.sous_category && (
                                <Badge variant="outline">{schedule.groupe.sous_category}</Badge>
                              )}
                              {schedule.groupe.Groupe_schedule && (
                                <span className="text-muted-foreground">{schedule.groupe.Groupe_schedule}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {schedule.instructors && schedule.instructors.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                Encadrants ({schedule.instructors.length})
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {schedule.instructors.map((instructor) => (
                                <Button
                                  key={instructor.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/member-view/${instructor.id}`, { state: { fromTab } })}
                                  className="h-7 text-xs bg-white dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  {instructor.first_name} {instructor.last_name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Palmares - Competition Results */}
        {competitionResults.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Palmarès
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competitionResults.map((result) => (
                  <div key={result.id} className="flex items-start justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Medal className={`w-4 h-4 ${result.ranking === 1 ? 'text-yellow-500' : result.ranking === 2 ? 'text-gray-400' : result.ranking === 3 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                        <span className="font-semibold text-lg">
                          {result.ranking}{result.ranking === 1 ? 'er' : 'e'}
                          {result.nb_competitor && <span className="text-sm text-muted-foreground ml-1">/ {result.nb_competitor}</span>}
                        </span>
                      </div>
                      <p className="font-medium">{result.competitions.name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        {result.competitions.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(result.competitions.start_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                        {result.competitions.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{result.competitions.location}</span>
                          </div>
                        )}
                        {result.competitions.disciplines && result.competitions.disciplines.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Discipline:</span>
                            <span>{result.competitions.disciplines.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      {(result.competitions.nature || result.competitions.niveau) && (
                        <div className="flex gap-2 mt-2">
                          {result.competitions.nature && (
                            <Badge variant="secondary" className="text-xs">
                              {result.competitions.nature}
                            </Badge>
                          )}
                          {result.competitions.niveau && (
                            <Badge variant="outline" className="text-xs">
                              {result.competitions.niveau}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/competitions/detail/${result.competitions.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competition Inscriptions */}
        {competitionInscriptions.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Inscriptions aux compétitions ({competitionInscriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {competitionInscriptions.map((inscription) => (
                  <div key={inscription.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{inscription.competitions.short_title || inscription.competitions.name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        {inscription.competitions.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(inscription.competitions.start_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                        {inscription.competitions.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{inscription.competitions.location}</span>
                          </div>
                        )}
                        {inscription.competitions.prix !== null && inscription.competitions.prix !== undefined && (
                          <div className="flex items-center gap-1 font-medium">
                            <Euro className="w-3 h-3" />
                            <span>{inscription.competitions.prix} €</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/competitions/detail/${inscription.competitions.id}`)}
                      className="shrink-0"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Détails
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teaching Schedule - Courses where member is instructor */}
        {teachingSchedule.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Cours encadrés ({teachingSchedule.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teachingSchedule.map((schedule) => (
                  <div key={schedule.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="default" className="font-medium">
                          {schedule.day}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {schedule.type && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Type:</span>
                            <Badge variant="secondary" className="text-xs">{schedule.type}</Badge>
                          </div>
                        )}

                        {schedule.age_category && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Catégorie d'âge:</span>
                            <span className="text-sm">{schedule.age_category}</span>
                          </div>
                        )}

                        {schedule.groupe && (
                          <div className="mt-2 p-2 bg-muted/30 rounded">
                            <p className="text-sm font-medium mb-1">Groupe:</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {schedule.groupe.category && (
                                <Badge variant="outline">{schedule.groupe.category}</Badge>
                              )}
                              {schedule.groupe.sous_category && (
                                <Badge variant="outline">{schedule.groupe.sous_category}</Badge>
                              )}
                              {schedule.groupe.Groupe_schedule && (
                                <span className="text-muted-foreground">{schedule.groupe.Groupe_schedule}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {schedule.students && schedule.students.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Élèves ({schedule.students.length})
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {schedule.students.map((student) => (
                                <Button
                                  key={student.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/member-view/${student.id}`, { state: { fromTab } })}
                                  className="h-7 text-xs bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  {student.first_name} {student.last_name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session History - Accordion */}
        <Card className="md:col-span-2">
          <Accordion type="single" collapsible onValueChange={(value) => {
            if (value === 'session-history') {
              fetchSessionHistory();
            }
          }}>
            <AccordionItem value="session-history" className="border-none">
              <AccordionTrigger className="px-6 hover:no-underline">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Historique des séances {sessionHistory.length > 0 && `(${sessionHistory.length})`}
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                {sessionHistoryLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : sessionHistory.length > 0 ? (
                  <div className="space-y-4">
                    {sessionHistory.map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    {/* Session header with date and time */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-semibold">
                          {new Date(session.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {session.start_time && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{session.start_time.substring(0, 5)}</span>
                        </div>
                      )}
                    </div>

                    {/* Cycle and Schedule info */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {session.cycles && (
                        <Badge variant="default">
                          {session.cycles.name}
                        </Badge>
                      )}
                      {session.schedules && (
                        <>
                          {session.schedules.type && (
                            <Badge variant="secondary">{session.schedules.type}</Badge>
                          )}
                          {session.schedules.age_category && (
                            <Badge variant="outline">{session.schedules.age_category}</Badge>
                          )}
                        </>
                      )}
                    </div>

                    {/* Session objective */}
                    {session.session_objective && (
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Objectif de la séance
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                              {session.session_objective}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Equipment */}
                    {session.equipment && (
                      <div className="mb-3 text-sm">
                        <span className="font-medium text-muted-foreground">Matériel : </span>
                        <span>{session.equipment}</span>
                      </div>
                    )}

                    {/* General session comment */}
                    {session.comment && (
                      <div className="mb-3 p-3 bg-muted/50 rounded">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Commentaire général
                            </p>
                            <p className="text-sm whitespace-pre-wrap">
                              {session.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Member-specific instructor comment */}
                    {session.memberComment && (
                      <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                              Commentaire de l'encadrant pour vous
                            </p>
                            <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                              {session.memberComment}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Instructors */}
                    {session.instructorsList && session.instructorsList.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 flex-wrap">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Encadrants :</span>
                          <div className="flex flex-wrap gap-2">
                            {session.instructorsList.map((instructor) => (
                              <Button
                                key={instructor.id}
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/member-view/${instructor.id}`, { state: { fromTab } })}
                                className="h-7 text-xs px-2"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                {instructor.first_name} {instructor.last_name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Aucune séance enregistrée
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  );
};

export default MemberView;
