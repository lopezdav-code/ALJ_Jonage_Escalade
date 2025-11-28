import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Pencil, Trophy, Calendar, MessageSquare, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMemberViewPermissions } from '@/hooks/useMemberViewPermissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberPhotoUrl } from '@/lib/memberStorageUtils';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sub-components
import MemberGeneralInfo from '@/components/members/MemberGeneralInfo';
import MemberSessions from '@/components/members/MemberSessions';
import MemberAwards from '@/components/members/MemberAwards';
import MemberCompetitions from '@/components/members/MemberCompetitions';
import MemberComments from '@/components/members/MemberComments';

const MemberView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Counts for tabs
  const [counts, setCounts] = useState({
    sessions: 0,
    awards: 0,
    competitions: 0,
    comments: 0
  });

  // Get the tab to return to from navigation state
  const fromTab = location.state?.fromTab;

  // Active tab management
  const activeTab = searchParams.get('tab') || 'general';

  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
  };

  const navigateToVolunteers = () => {
    const url = fromTab ? `/volunteers?tab=${encodeURIComponent(fromTab)}` : '/volunteers';
    navigate(url);
  };

  // Function to fetch session history when needed
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
      setCounts({ sessions: 0, awards: 0, competitions: 0, comments: 0 });

      try {
        // Fetch member data with pre-joined emergency contacts and competitions using optimized view
        const { data, error } = await supabase
          .from('member_summary')
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

        // Fetch counts from the new view
        // We use a separate try/catch because this view might not exist yet if migration wasn't run
        try {
          const { data: countsData, error: countsError } = await supabase
            .from('member_details_counts')
            .select('*')
            .eq('member_id', id)
            .single();

          if (!countsError && countsData) {
            setCounts({
              sessions: countsData.session_count || 0,
              awards: countsData.award_count || 0,
              competitions: countsData.competition_count || 0,
              comments: countsData.comment_count || 0
            });
          } else {
            // Fallback if view query fails or returns no data (shouldn't happen if view exists)
            console.warn("Could not fetch counts from view, falling back to manual calculation or 0");
          }
        } catch (e) {
          console.warn("Error fetching counts (view might be missing):", e);
        }

        // Fetch group info if groupe_id exists
        let groupInfo = null;
        if (data.groupe_id) {
          const { data: g } = await supabase.from('groupe').select('*').eq('id', data.groupe_id).single();
          groupInfo = g;
        }

        // Fetch bureau info
        const { data: bureauData } = await supabase.from('bureau').select('*').eq('members_id', id).maybeSingle();

        // Fetch volunteer roles
        const { data: volunteerRoles } = await supabase
          .from('volunteer_roles_view')
          .select('*')
          .eq('member_id', id)
          .maybeSingle();

        setMember({ ...data, groupInfo, bureauData, volunteerRoles });

        // Emergency contacts are now pre-joined in the view as JSON fields
        const contact1 = data.emergency_contact_1 || null;
        const contact2 = data.emergency_contact_2 || null;
        setEmergencyContacts({ contact1, contact2 });

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

        // Competitions are now pre-joined in the view as JSON array
        // Transform the flat structure from the view to match the expected nested structure
        const competitions = (data.competitions || []).map(c => ({
          id: c.participation_id,
          role: c.role,
          ranking: c.ranking,
          nb_competitor: c.nb_competitor,
          competitions: {
            id: c.competition_id,
            name: c.competition_name,
            short_title: c.short_title,
            start_date: c.start_date,
            location: c.location,
            prix: c.prix,
            disciplines: c.disciplines,
            nature: c.nature,
            niveau: c.niveau
          }
        }));

        if (competitions.length > 0) {
          // Separate results (with ranking) from simple inscriptions
          const results = competitions.filter(c => c.role === 'Competiteur' && c.ranking);
          const inscriptions = competitions.filter(c => c.role === 'Competiteur');

          setCompetitionResults(results);
          setCompetitionInscriptions(inscriptions);

          // If view fetch failed, we can update some counts here based on loaded data
          // But for sessions and comments we don't load them initially, so we rely on the view or 0
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

  // Load session history when tab is activated
  useEffect(() => {
    if (activeTab === 'sessions' && !sessionHistoryLoaded) {
      fetchSessionHistory();
    }
  }, [activeTab, sessionHistoryLoaded]);

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
              <div className="flex flex-wrap gap-2">
                {member.bureauData ? (
                  <Badge variant="secondary" className="text-base">
                    {member.bureauData.role} {member.bureauData.sub_role || ''}
                  </Badge>
                ) : member.groupInfo ? (
                  <Badge variant="secondary" className="text-base">
                    {member.groupInfo.category}
                  </Badge>
                ) : null}
                {member.volunteerRoles && member.volunteerRoles.is_ouvreur && (
                  <Badge className="text-base bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">
                    Ouvreur
                  </Badge>
                )}
                {member.volunteerRoles && member.volunteerRoles.is_encadrant && (
                  <Badge className="text-base bg-orange-100 text-orange-800 hover:bg-orange-200 border-none">
                    Encadrant
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="general" className="py-2">
            <User className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Infos</span>
          </TabsTrigger>

          {(counts.sessions > 0 || memberSchedules.length > 0 || teachingSchedule.length > 0) && (
            <TabsTrigger value="sessions" className="py-2">
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Séances {counts.sessions > 0 ? `(${counts.sessions})` : ''}</span>
            </TabsTrigger>
          )}

          {counts.awards > 0 && (
            <TabsTrigger value="awards" className="py-2">
              <Trophy className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Palmarès ({counts.awards})</span>
            </TabsTrigger>
          )}

          {counts.competitions > 0 && (
            <TabsTrigger value="competitions" className="py-2">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Inscriptions ({counts.competitions})</span>
            </TabsTrigger>
          )}

          {counts.comments > 0 && (
            <TabsTrigger value="comments" className="py-2">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Commentaires ({counts.comments})</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general">
          <MemberGeneralInfo
            member={member}
            emergencyContacts={emergencyContacts}
            isEmergencyContactFor={isEmergencyContactFor}
            fromTab={fromTab}
          />
        </TabsContent>

        <TabsContent value="sessions">
          <MemberSessions
            memberSchedules={memberSchedules}
            teachingSchedule={teachingSchedule}
            sessionHistory={sessionHistory}
            sessionHistoryLoading={sessionHistoryLoading}
            fetchSessionHistory={fetchSessionHistory}
            fromTab={fromTab}
          />
        </TabsContent>

        <TabsContent value="awards">
          <MemberAwards competitionResults={competitionResults} />
        </TabsContent>

        <TabsContent value="competitions">
          <MemberCompetitions competitionInscriptions={competitionInscriptions} />
        </TabsContent>

        <TabsContent value="comments">
          <MemberComments memberId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemberView;
