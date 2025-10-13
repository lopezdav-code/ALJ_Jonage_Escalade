import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import MemberImage from '@/components/MemberImage';
import VolunteerQuiz from '@/components/VolunteerQuiz';
import { Button } from '@/components/ui/button';
import { Info, Loader2, Pencil, Shield, Star, Mail, Phone, Award, Gavel, Scale, Flag } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Placeholder for brevetColors - adapt if needed
const brevetColors = {
  'Initiateur SAE': 'bg-blue-500',
  'Animateur SAE': 'bg-green-500',
  'Moniteur Escalade': 'bg-red-500',
};

const VolunteerRow = React.memo(({ member, onEdit, isEmergencyContact, showSubGroup, showCategory }) => {
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
          <Button variant="ghost" size="icon" onClick={() => onEdit(member)}>
            <Pencil className="h-4 w-4" />
          </Button>
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
        .from('members')
        .select('*');

      if (error) {
        console.error('Erreur chargement membres:', error);
      } else {
        setMembers(data || []);
      }
      setLoading(false);
    };

    fetchMembers();
  }, []);

  const membersByTitle = useMemo(() => {
    return members.reduce((acc, member) => {
      const title = member.title || 'Sans Titre';
      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(member);
      return acc;
    }, {});
  }, [members]);

  const titles = useMemo(() => {
    const customOrder = [
      "Bureau",
      "Bénévole",
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
  
  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  if (isQuizVisible) {
    const quizVolunteers = members.filter(m => m.title === 'Bureau' || m.title === 'Bénévole');
    return <VolunteerQuiz volunteers={quizVolunteers} onQuizEnd={() => setIsQuizVisible(false)} />;
  }

  const getTabTitle = (title) => {
    if (title === 'Bureau') return 'Le Bureau';
    if (title === 'Bénévole') return 'Les Encadrants Bénévoles';
    return title;
  };

  return (
    <div className="p-8">
      <Helmet><title>Membres - Club d'Escalade</title></Helmet>

      <h1 className="text-2xl font-bold mb-6">Gestion des Membres</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {titles.map((title) => (
            <TabsTrigger key={title} value={title}>{getTabTitle(title)}</TabsTrigger>
          ))}
        </TabsList>
        {titles.map((title) => {
          const showSubGroupColumn = membersByTitle[title].some(m => m.sub_group);
          const showCategoryColumn = shouldShowCategoryColumn(title);
          return (
            <TabsContent key={title} value={title}>
              <table className="w-full border-collapse mt-4">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Photo</th>
                    <th className="p-2 text-left">Prénom</th>
                    <th className="p-2 text-left">Nom</th>
                    {showSubGroupColumn && <th className="p-2 text-left">Sous-groupe</th>}
                    {showCategoryColumn && <th className="p-2 text-left">Catégorie</th>}
                    <th className="p-2 text-left">Statut</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {membersByTitle[title].map((member) => (
                    <VolunteerRow 
                      key={member.id} 
                      member={member} 
                      onEdit={() => navigate(`/member-edit/${member.id}`, { state: { fromTab: activeTab } })}
                      isEmergencyContact={emergencyContactIds.has(member.id)}
                      showSubGroup={showSubGroupColumn}
                      showCategory={showCategoryColumn}
                    />
                  ))}
                </tbody>
              </table>
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
  );
};

export default Volunteers;
