import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import VolunteerQuiz from '@/components/VolunteerQuiz';
import { Button } from '@/components/ui/button';
import { Info, Loader2, Shield, Star, Mail, Phone, Award, Gavel, Scale, Flag, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMemberViewPermissions } from '@/hooks/useMemberViewPermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import VolunteerRow from '@/components/volunteers/VolunteerRow';
import GroupedVolunteersView from '@/components/volunteers/GroupedVolunteersView';
import RoleFilteredVolunteersView from '@/components/volunteers/RoleFilteredVolunteersView';

// Placeholder for brevetColors - adapt if needed
const brevetColors = {
  'Initiateur SAE': 'bg-blue-500',
  'Animateur SAE': 'bg-green-500',
  'Moniteur Escalade': 'bg-red-500',
};

const BrevetDefinitionDialog = ({ brevetName, definition }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" className="flex items-center gap-2 justify-start p-0 h-auto font-normal text-left">
        <div className={`w-4 h-4 rounded-full flex-shrink-0 ${brevetColors[brevetName]}`}></div>
        <span className="flex-1">{brevetName}</span>
        <Info className="h-4 w-4 text-muted-foreground ml-auto" />
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{definition.title}</DialogTitle>
        <DialogDescription>{definition.description}</DialogDescription>
      </DialogHeader>
      <div className="overflow-y-auto pr-4 space-y-4">
        {definition.articles.map((article, index) => (
          <div key={index}>
            <h4 className="font-semibold">{article.title}</h4>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{article.content}</p>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);
BrevetDefinitionDialog.displayName = 'BrevetDefinitionDialog';

const Volunteers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const [openMemberSearch, setOpenMemberSearch] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoEmailFilter, setShowNoEmailFilter] = useState(false);
  // showAllInGroup removed as it is now handled by GroupedVolunteersView
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, isBureau, loading: authLoading } = useAuth();
  const { canViewDetail } = useMemberViewPermissions();
  const canEdit = useMemo(() => isAdmin || isBureau, [isAdmin, isBureau]);

  const emergencyContactIds = useMemo(() => {
    const ids = new Set();
    members.forEach(m => {
      if (m.emergency_contact_1_id) ids.add(m.emergency_contact_1_id);
      if (m.emergency_contact_2_id) ids.add(m.emergency_contact_2_id);
    });
    return ids;
  }, [members]);

  useEffect(() => {
    if (authLoading) return;

    const fetchMembers = async () => {
      setLoading(true);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('secure_members')
        .select('*');

      if (membersError) {
        console.error("Error fetching members", membersError);
      }

      // Fetch groups
      const { data: groupsData } = await supabase.from('groupe').select('*');
      const groupsMap = (groupsData || []).reduce((acc, g) => ({ ...acc, [g.id]: g }), {});

      // Fetch bureau
      const { data: bureauData } = await supabase.from('bureau').select('*');
      const bureauMap = (bureauData || []).reduce((acc, b) => ({ ...acc, [b.members_id]: b }), {});

      // Fetch volunteer roles from view
      const { data: volunteerRolesData } = await supabase.from('volunteer_roles_view').select('*');
      const volunteerRolesMap = (volunteerRolesData || []).reduce((acc, r) => ({ ...acc, [r.member_id]: r }), {});

      // Merge
      const mergedMembers = (membersData || []).map(m => ({
        ...m,
        groupInfo: m.groupe_id ? groupsMap[m.groupe_id] : null,
        bureauInfo: bureauMap[m.id] || null,
        volunteerRoles: volunteerRolesMap[m.id] || { is_ouvreur: false, is_encadrant: false }
      }));

      setMembers(mergedMembers || []);
      setLoading(false);
    };

    fetchMembers();
  }, [authLoading]);

  const membersForDisplay = useMemo(() => {
    if (showNoEmailFilter) {
      return members.filter(member => !member.email || member.email.trim() === '');
    }
    return members;
  }, [members, showNoEmailFilter]);

  const membersByTitle = useMemo(() => {
    return membersForDisplay.reduce((acc, member) => {
      let title = 'Sans Groupe';

      if (member.bureauInfo) {
        if (member.bureauInfo.role !== 'Bénévole') {
          title = 'Bureau';
        } else {
          title = 'Bénévole';
        }
      } else if (member.groupInfo) {
        title = member.groupInfo.category;
      }

      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(member);
      return acc;
    }, {});
  }, [membersForDisplay]);

  const titles = useMemo(() => {
    const customOrder = [
      "Bureau",
      "Bénévole",
      "Adhérent",
      "Compétition U11-U15",
      "Compétition U15-U19",
      "Loisir enfants",
      "Loisir collège",
      "Loisir lycée",
      "Adultes débutans",
      "Adultes autonomes"
    ];

    return Object.keys(membersByTitle)
      .filter(title => title !== "emergency_contact" && title !== "Sans Groupe")
      .sort((a, b) => {
        const indexA = customOrder.indexOf(a);
        const indexB = customOrder.indexOf(b);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });
  }, [membersByTitle]);

  const activeTab = searchParams.get('tab') || (titles.length > 0 ? titles[0] : '');

  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return membersForDisplay;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return membersForDisplay.filter(member =>
      member.first_name.toLowerCase().includes(lowerCaseQuery) ||
      member.last_name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [membersForDisplay, searchQuery]);

  const handleMemberSelect = (memberId) => {
    const member = members.find(m => m.id === memberId);
    setSelectedMember(member);
    setOpenMemberSearch(false);
    setSearchQuery('');
    if (member) {
      navigate(`/member-view/${member.id}`);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  if (isQuizVisible) {
    const quizVolunteers = members.filter(m => m.bureauInfo || (m.groupInfo && m.groupInfo.category === 'Adhérent')); // Approximation
    return <VolunteerQuiz volunteers={quizVolunteers} onQuizEnd={() => setIsQuizVisible(false)} />;
  }

  const getTabTitle = (title) => {
    if (title === 'Bureau') return 'Le Bureau';
    if (title === 'Adhérent') return 'Les Encadrants Adhérents';
    return title;
  };

  return (
    <ProtectedRoute pageTitle="Gestion des membres">
      <div className="p-8">
        <Helmet><title>Membres - Club d'Escalade</title></Helmet>

        <h1 className="text-2xl font-bold mb-6">Gestion des Membres</h1>

        <div className="mb-6 flex items-center space-x-4">
          <div className="relative w-[300px]">
            <Input
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setOpenMemberSearch(true)}
              className="w-full"
            />
            {openMemberSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {loading ? "Chargement..." : "Aucun membre trouvé."}
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onMouseDown={() => {
                        handleMemberSelect(member.id);
                        setOpenMemberSearch(false);
                      }}
                      className={cn(
                        "px-4 py-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0",
                        selectedMember?.id === member.id && "bg-blue-50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4 mt-1 flex-shrink-0",
                            selectedMember?.id === member.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{member.first_name} {member.last_name}</div>
                          {member.groupInfo && (
                            <div className="text-xs text-gray-500">
                              {member.groupInfo.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {selectedMember && (
            <Button variant="ghost" onClick={() => { setSelectedMember(null); setSearchQuery(''); }}>
              Effacer la sélection
            </Button>
          )}
          <Button
            variant={showNoEmailFilter ? "default" : "outline"}
            onClick={() => setShowNoEmailFilter(!showNoEmailFilter)}
          >
            {showNoEmailFilter ? "Afficher tout" : "Sans email"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-auto flex-wrap">
            {titles.map((title) => (
              <TabsTrigger key={title} value={title}>{getTabTitle(title)}</TabsTrigger>
            ))}
          </TabsList>
          {titles.map((title) => {
            const currentTabMembers = membersByTitle[title] || [];

            // Determine if we should group by sub_category
            // For Competition and Leisure, we usually want to group by sub-category
            const shouldGroup = (title.includes('Compétition') || title.includes('Loisir')) &&
              currentTabMembers.some(m => m.groupInfo && m.groupInfo.sous_category);

            return (
              <TabsContent key={title} value={title} className="mt-6">
                {title === 'Bénévole' ? (
                  <RoleFilteredVolunteersView
                    members={currentTabMembers}
                    canEdit={canEdit}
                    canViewDetail={canViewDetail}
                    emergencyContactIds={emergencyContactIds}
                    navigate={navigate}
                    activeTab={activeTab}
                  />
                ) : shouldGroup ? (
                  <GroupedVolunteersView
                    members={currentTabMembers}
                    canEdit={canEdit}
                    canViewDetail={canViewDetail}
                    emergencyContactIds={emergencyContactIds}
                    navigate={navigate}
                    activeTab={activeTab}
                  />
                ) : (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-medium">Photo</th>
                          <th className="text-left p-2 font-medium">Prénom</th>
                          <th className="text-left p-2 font-medium">Nom</th>
                          <th className="text-left p-2 font-medium">Groupe</th>
                          <th className="text-left p-2 font-medium">Info</th>
                          {(canEdit || canViewDetail) && <th className="text-left p-2 font-medium">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {currentTabMembers.map((member) => (
                          <VolunteerRow
                            key={member.id}
                            member={member}
                            onEdit={(member) => navigate(`/member-edit/${member.id}`, { state: { fromTab: activeTab } })}
                            onView={(member) => navigate(`/member-view/${member.id}`, { state: { fromTab: activeTab } })}
                            isEmergencyContact={emergencyContactIds.has(member.id)}
                            showGroupDetails={true}
                            canEdit={canEdit}
                            canView={canViewDetail}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Légende des icônes */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Légende des icônes :</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>A un contact d'urgence</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Est un contact d'urgence</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-blue-600">♂</span>
              <span>Homme</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-pink-600">♀</span>
              <span>Femme</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4 text-slate-500" />
              <span>Email renseigné</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4 text-slate-500" />
              <span>Téléphone renseigné</span>
            </div>
          </div>
          <h3 className="text-sm font-semibold mb-2 mt-4">Brevets Fédéraux :</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Flag className="h-4 w-4" />
              <span>Initiateur SAE</span>
            </div>
            <div className="flex items-center gap-1">
              <Gavel className="h-4 w-4" />
              <span>Juge Bloc</span>
            </div>
            <div className="flex items-center gap-1">
              <Scale className="h-4 w-4" />
              <span>Juge de difficulté</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>Gestionnaire EPI</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Entraîneur d'escalade</span>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <h3 className="text-sm font-semibold text-blue-800">Note pour les administrateurs et le bureau :</h3>
            <p className="text-sm text-blue-700 mt-1">
              Vous disposez des droits étendus sur cette page. Le nom de famille complet des membres est affiché et le bouton d'édition (crayon) est visible. Les autres utilisateurs ne voient que l'initiale du nom de famille et n'ont pas accès à l'édition.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Volunteers;

