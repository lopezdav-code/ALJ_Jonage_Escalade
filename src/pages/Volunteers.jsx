import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import MemberImage from '@/components/MemberImage';
import VolunteerQuiz from '@/components/VolunteerQuiz';
import CompetitionTabs from '@/components/CompetitionTabs';
import LeisureChildrenTabs from '@/components/LeisureChildrenTabs';
import { Button } from '@/components/ui/button';
import { Info, Loader2, Pencil, Shield, Star, Mail, Phone, Award, Gavel, Scale, Flag, Check, ChevronsUpDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Placeholder for brevetColors - adapt if needed
const brevetColors = {
  'Initiateur SAE': 'bg-blue-500',
  'Animateur SAE': 'bg-green-500',
  'Moniteur Escalade': 'bg-red-500',
};

const VolunteerRow = React.memo(({ member, onEdit, isEmergencyContact, showSubGroup, showCategory, canEdit }) => {
    const hasEmergencyContact = !!(member.emergency_contact_1_id || member.emergency_contact_2_id);
    return (
      <tr className="border-b">
        <td className="p-2">
          <MemberImage member={member} />
        </td>
        <td className="p-2">{member.first_name}</td>
        <td className="p-2">{member.last_name}</td>
        {showSubGroup && <td className="p-2">{member.sub_group}</td>}
        {showCategory && <td className="p-2">{member.category || ''}</td>}
        <td className="p-2">
          <div className="flex items-center gap-2">
            {hasEmergencyContact && <Shield className="h-5 w-5 text-blue-500" title="A un contact d'urgence" />}
            {isEmergencyContact && <Star className="h-5 w-5 text-yellow-500" title="Est un contact d'urgence" />}
            {member.sexe === 'H' && <span className="font-bold text-blue-600" title="Homme">♂</span>}
            {member.sexe === 'F' && <span className="font-bold text-pink-600" title="Femme">♀</span>}
            {!!member.email && <Mail className="h-4 w-4 text-slate-500" title="Email renseigné" />}
            {!!member.phone && <Phone className="h-4 w-4 text-slate-500" title="Téléphone renseigné" />}
            {member.brevet_federaux && member.brevet_federaux.length > 0 && <Award className="h-4 w-4 text-green-500" title="A des brevets fédéraux" />}
          </div>
        </td>
        <td className="p-2">
          {canEdit && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(member)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </td>
      </tr>
    );
}, (prevProps, nextProps) => {
    return prevProps.member.id === nextProps.member.id;
});
VolunteerRow.displayName = 'VolunteerRow';

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
  const [showNoEmailFilter, setShowNoEmailFilter] = useState(false); // New state for the filter
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, isBureau } = useAuth();
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
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('secure_members')
        .select('*');

      if (error) {
        // Erreur lors du chargement des membres
      } else {
        setMembers(data || []);
      }
      setLoading(false);
    };

    fetchMembers();
  }, []);

  const membersForDisplay = useMemo(() => {
    if (showNoEmailFilter) {
      return members.filter(member => !member.email || member.email.trim() === '');
    }
    return members;
  }, [members, showNoEmailFilter]);

  const membersByTitle = useMemo(() => {
    return membersForDisplay.reduce((acc, member) => {
      const title = member.title || 'Sans Titre';
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
      "Adhérent",
      "Compétition U11-U15",
      "Compétition U15-U19",
      "Loisir enfants",
      "Loisir collège",
      "Loisir lycée",
      "Adultes débutans",
      "Adultes autonomes",
      "emergency_contact"
    ];
    
    return Object.keys(membersByTitle).sort((a, b) => {
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

  // Get active tab from URL or default to first title
  const activeTab = searchParams.get('tab') || (titles.length > 0 ? titles[0] : '');

  // Handle tab change and update URL
  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
  };

  // Check if category column should be shown for each tab
  const shouldShowCategoryColumn = (title) => {
    return membersByTitle[title]?.some(m => m.category && m.category.trim() !== '') || false;
  };
  
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return membersForDisplay; // Use membersForDisplay here
    const lowerCaseQuery = searchQuery.toLowerCase();
    return membersForDisplay.filter(member => // Use membersForDisplay here
      member.first_name.toLowerCase().includes(lowerCaseQuery) ||
      member.last_name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [membersForDisplay, searchQuery]);

  const handleMemberSelect = (memberId) => {
    const member = members.find(m => m.id === memberId);
    setSelectedMember(member);
    setOpenMemberSearch(false);
    setSearchQuery(''); // Clear search query after selection
    // Optionally, navigate to member's page or filter the view
    if (member) {
      navigate(`/member-edit/${member.id}`);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  if (isQuizVisible) {
    const quizVolunteers = members.filter(m => m.title === 'Bureau' || m.title === 'Adhérent');
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
        <Popover open={openMemberSearch} onOpenChange={setOpenMemberSearch}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openMemberSearch}
              className="w-[300px] justify-between"
            >
              <span className={cn(!selectedMember && "text-muted-foreground")}>
                {selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : "Rechercher un membre..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandEmpty>
                {loading ? "Chargement..." : "Aucun membre trouvé."}
              </CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {filteredMembers.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={`${member.first_name} ${member.last_name}`}
                      onSelect={() => {
                        handleMemberSelect(member.id);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedMember?.id === member.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{member.first_name} {member.last_name}</span>
                        {member.title && (
                          <span className="text-xs text-muted-foreground">
                            {member.title}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedMember && (
          <Button variant="ghost" onClick={() => setSelectedMember(null)}>
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
        <TabsList>
          {titles.map((title) => (
            <TabsTrigger key={title} value={title}>{getTabTitle(title)}</TabsTrigger>
          ))}
        </TabsList>
        {titles.map((title) => {
          // Custom rendering for competition tabs
          if (title.includes('Compétition')) {
            const currentTabMembers = membersForDisplay.filter(m => m.title === title); // Use membersForDisplay
            
            const membersByCategory = currentTabMembers.reduce((acc, member) => {
              const category = member.category || 'Sans catégorie'; // Default category if missing
              if (!acc[category]) {
                acc[category] = [];
              }
              acc[category].push(member);
              return acc;
            }, {});
            const categories = Object.keys(membersByCategory).sort();

            const showCategoryColumn = currentTabMembers.some(m => m.category && m.category.trim() !== '');
            const showSubGroupColumn = currentTabMembers.some(m => m.sub_group && m.sub_group.trim() !== ''); // Check if subgroup is relevant

            return (
              <TabsContent key={title} value={title}>
                <Tabs defaultValue={categories[0]} className="w-full"> {/* Nested Tabs for Categories */}
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    {categories.map((category) => (
                      <TabsTrigger key={category} value={category}>
                        {category} ({membersByCategory[category].length})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {categories.map((category) => (
                    <TabsContent key={category} value={category}>
                      <div className="overflow-x-auto mt-4"> {/* Added margin-top */}
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Photo</th>
                              <th className="text-left p-2">Prénom</th>
                              <th className="text-left p-2">Nom</th>
                              {showSubGroupColumn && <th className="text-left p-2">Sous-groupe</th>}
                              {showCategoryColumn && <th className="text-left p-2">Catégorie</th>}
                              <th className="text-left p-2">Info</th>
                              {canEdit && <th className="text-left p-2">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {membersByCategory[category].map((member) => (
                              <VolunteerRow
                                key={member.id}
                                member={member}
                                onEdit={(member) => {
                                  navigate(`/member-edit/${member.id}`, { state: { fromTab: activeTab } });
                                }}
                                isEmergencyContact={emergencyContactIds.has(member.id)}
                                showSubGroup={showSubGroupColumn}
                                showCategory={showCategoryColumn}
                                canEdit={canEdit}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>
            );
          }

          // Special handling for leisure children - group by sub-group
          if (title.includes('Loisir')) {
            const currentTabMembers = membersForDisplay.filter(m => m.title === title); // Use membersForDisplay
            
            const membersBySubGroup = currentTabMembers.reduce((acc, member) => {
              const subGroup = member.sub_group || 'Sans sous-groupe'; // Default sub-group if missing
              if (!acc[subGroup]) {
                acc[subGroup] = [];
              }
              acc[subGroup].push(member);
              return acc;
            }, {});
            const subGroups = Object.keys(membersBySubGroup).sort();

            const showCategoryColumn = currentTabMembers.some(m => m.category && m.category.trim() !== '');
            const showSubGroupColumn = currentTabMembers.some(m => m.sub_group && m.sub_group.trim() !== '');

            return (
              <TabsContent key={title} value={title}>
                <Tabs defaultValue={subGroups[0]} className="w-full"> {/* Nested Tabs for Sub-Groups */}
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3"> {/* Adjusted grid columns */}
                    {subGroups.map((subGroup) => (
                      <TabsTrigger key={subGroup} value={subGroup}>
                        {subGroup} ({membersBySubGroup[subGroup].length})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {subGroups.map((subGroup) => (
                    <TabsContent key={subGroup} value={subGroup}>
                      <div className="overflow-x-auto mt-4"> {/* Added margin-top */}
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Photo</th>
                              <th className="text-left p-2">Prénom</th>
                              <th className="text-left p-2">Nom</th>
                              {showSubGroupColumn && <th className="text-left p-2">Sous-groupe</th>}
                              {showCategoryColumn && <th className="text-left p-2">Catégorie</th>}
                              <th className="text-left p-2">Info</th>
                              {canEdit && <th className="text-left p-2">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {membersBySubGroup[subGroup].map((member) => (
                              <VolunteerRow
                                key={member.id}
                                member={member}
                                onEdit={(member) => {
                                  navigate(`/member-edit/${member.id}`, { state: { fromTab: activeTab } });
                                }}
                                isEmergencyContact={emergencyContactIds.has(member.id)}
                                showSubGroup={showSubGroupColumn}
                                showCategory={showCategoryColumn}
                                canEdit={canEdit}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>
            );
          }

          // Default rendering for other tabs
          const tabMembers = membersByTitle[title] || [];
          const showCategoryColumn = tabMembers.some(m => m.category && m.category.trim() !== '');
          const showSubGroupColumn = tabMembers.some(m => m.sub_group && m.sub_group.trim() !== '');

          return (
            <TabsContent key={title} value={title}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Photo</th>
                      <th className="text-left p-2">Prénom</th>
                      <th className="text-left p-2">Nom</th>
                      {showSubGroupColumn && <th className="text-left p-2">Sous-groupe</th>}
                      {showCategoryColumn && <th className="text-left p-2">Catégorie</th>}
                      <th className="text-left p-2">Info</th>
                      {canEdit && <th className="text-left p-2">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tabMembers.map((member) => (
                      <VolunteerRow
                        key={member.id}
                        member={member}
                        onEdit={(member) => {
                          navigate(`/member-edit/${member.id}`, { state: { fromTab: activeTab } });
                        }}
                        isEmergencyContact={emergencyContactIds.has(member.id)}
                        showSubGroup={showSubGroupColumn}
                        showCategory={showCategoryColumn}
                        canEdit={canEdit}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
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
    </div>
    </ProtectedRoute>
  );
};

export default Volunteers;
