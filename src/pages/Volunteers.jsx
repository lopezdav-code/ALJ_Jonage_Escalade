import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Building, FolderHeart as HandHeart, Crown, User, FileText, Wallet, Loader2, Edit, Eye, Award, Info, BrainCircuit, Shield, Siren as Whistle, Wrench, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { scheduleData } from '@/data/schedule';
import { formatName, ProfileIndicator } from '@/lib/utils.jsx';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import VolunteerQuiz from '@/components/VolunteerQuiz';
import { useMemberDetail } from '@/contexts/MemberDetailContext';
import SafeMemberAvatar from '@/components/SafeMemberAvatar';

const brevetColors = {
  'Initiateur SAE': 'bg-blue-500',
  'Juge Bloc 1': 'bg-yellow-500',
  'Juge Bloc 2': 'bg-orange-500',
  'Juge Bloc 3': 'bg-red-500',
  'Juge de difficulté 1': 'bg-green-500',
  'Juge de difficulté 2': 'bg-teal-500',
  'Juge de difficulté 3': 'bg-indigo-500',
  'Gestionanaire EPI': 'bg-gray-500',
  'Entraineur d\'escalade 1': 'bg-purple-500',
  'Entraineur d\'escalade 2': 'bg-pink-500',
};

const brevetDefinitions = {
  'Initiateur SAE': {
    title: 'Initiateur SAE (Structure Artificielle d\'escalade)',
    description: `La Fédération Française de la Montagne et de l'Escalade délivre le brevet d'initiateur SAE.`,
    articles: [
      {
        title: 'Art 2 : Compétences',
        content: `L'attribution du brevet mentionné à l’article précédent reconnaît à son titulaire les compétences pour encadrer en escalade sur SAE de type bloc et sur SAE avec points d'assurage, c’est à dire :\n• surveiller la gestion de la sécurité de plusieurs cordées lors d’un créneau d'accès libre,\n• animer un groupe d’au moins 6 personnes,\n• développer les compétences des pratiquants jusqu'au niveau du passeport orange en appliquant les situations d'une progression type, dans une optique d'accession à l'autonomie.\nLe référentiel de compétences est précisé en annexe.`
      },
      {
        title: 'Art 3 : Conditions d’obtention du brevet',
        content: `Pour obtenir ce brevet, le candidat doit avoir :\n• suivi la formation initiateur SAE,\n• satisfait aux évaluations de la formation initiateur SAE,\n• réalisé un stage pratique de 35 h.`
      },
      {
        title: 'Art 4 : Evaluation',
        content: `L’évaluation de la formation d'initiateur SAE est organisée par l’équipe pédagogique. Elle vise à s'assurer que le stagiaire possède les compétences pour :\n• conduire une démarche d'initiation en SAE,\n• encadrer en sécurité,\n• intégrer son action dans le cadre fédéral.\nElle repose sur 3 types d'épreuves :\n• l'encadrement d'une séance pédagogique,\n• la sécurisation d'un atelier,\n• et des écrits complémentaires.\nL’évaluation du stage pratique est un contrôle continu portant sur la capacité du candidat à encadrer un groupe sur SAE.\nLa validation du stage pratique est faite par le Président du club d’accueil.`
      },
      {
        title: 'Art 5 : Exigences préalables à l’entrée en formation',
        content: `Les exigences préalables suivantes sont requises pour accéder à la formation :\n• âge : 16 ans,\n• niveau de pratique personnel : 5c en voie et 4c en bloc,\n• maîtrise des techniques de sécurité individuelles telles s'équiper, s'encorder, assurer un partenaire en moulinette et en tête, respecter les obligations de sécurité, parer, contrôler...,\n• attitude respectueuse des partenaires, du milieu et du cadre,\n• licence FFME en cours de validité.\nCes exigences préalables sont vérifiées au moyen de la présentation du passeport escalade orange ou supérieur, pour le niveau de pratique personnel et la maîtrise des techniques de sécurité.`
      },
      {
        title: 'Art 6 : Exigences préalables au stage pratique',
        content: `Pour accéder au stage pratique d’initiateur SAE, le candidat doit être titulaire de :\n• secourisme : titulaire d'une attestation du 1er niveau de secourisme,\n• licence FFME en cours de validité,\n• attestation de réussite obtenue à l'issue de la formation initiateur SAE.`
      },
      {
        title: 'Art 7 : Formation continue',
        content: `Des sessions de formation continue sont accessibles aux initiateurs SAE dans l'objectif de maintenir ou approfondir leur compétences.`
      },
      {
        title: 'Art 8 : VAE fédérale',
        content: `Le brevet`
      }
    ]
  }
};

const Volunteers = () => {
  const { isAdmin } = useAuth();
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const { showMemberDetails, openEditFormForMember } = useMemberDetail();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('members').select('*, profiles(role)');
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les membres.", variant: "destructive" });
    } else {
      const formattedMembers = data.map(m => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      }));
      setAllMembers(formattedMembers);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const membersWithDynamicRoles = useMemo(() => {
    if (!allMembers.length) return [];
    
    const memberRoles = new Map();

    scheduleData.forEach(session => {
      session.instructors.forEach(instructorName => {
        const normalizedInstructorName = instructorName.toLowerCase().trim();
        const member = allMembers.find(m => 
          `${m.first_name} ${m.last_name}`.toLowerCase().trim() === normalizedInstructorName
        );

        if (member) {
          if (!memberRoles.has(member.id)) {
            memberRoles.set(member.id, new Set());
          }
          const roles = memberRoles.get(member.id);
          if (session.group === 'Compétition') roles.add('Coach');
          if (session.group === 'Loisir' || session.group === 'Perf') roles.add('Encadrant');
          if (session.group === 'Autonomes') roles.add('Ouvreur');
        }
      });
    });

    return allMembers.map(member => ({
      ...member,
      dynamic_roles: memberRoles.has(member.id) ? Array.from(memberRoles.get(member.id)) : [],
    }));
  }, [allMembers]);

  const { bureauPrincipaux, bureauAdjoints } = useMemo(() => {
    const bureau = membersWithDynamicRoles.filter(m => m.title === 'Bureau');
    const roleOrder = ['Présidente', 'Trésorier', 'Secrétaire'];
    
    const principaux = roleOrder.map(role => bureau.find(m => m.sub_group === role)).filter(Boolean);
    const adjoints = bureau.filter(m => m.sub_group && m.sub_group.includes('Adjoint'));
    
    return { bureauPrincipaux: principaux, bureauAdjoints: adjoints };
  }, [membersWithDynamicRoles]);
  
  const findMemberSessions = (member) => {
    const memberFullName = `${member.first_name} ${member.last_name}`.toLowerCase().replace(/é/g, 'e');
    const memberFirstName = member.first_name.toLowerCase().replace(/é/g, 'e');
    const memberLastNameInitial = `${member.last_name.charAt(0)}.`.toLowerCase();

    return scheduleData.filter(session => 
      session.instructors.some(instructor => {
        const instructorLower = instructor.toLowerCase().replace(/é/g, 'e');
        return instructorLower.includes(memberFullName) || 
               (member.last_name.length > 1 && instructorLower.includes(`${memberFirstName} ${memberLastNameInitial}`));
      })
    );
  };

  const allCourses = useMemo(() => {
    const courses = new Set();
    scheduleData.forEach(session => courses.add(session.title));
    return ['all', ...Array.from(courses).sort()];
  }, []);

  const volunteersData = useMemo(() => {
    let volunteers = membersWithDynamicRoles.filter(m => m.title === 'Bénévole');
    if (selectedCourse === 'all') {
      return volunteers;
    }
    return volunteers.filter(member => {
      const sessions = findMemberSessions(member);
      return sessions.some(session => session.title === selectedCourse);
    });
  }, [membersWithDynamicRoles, selectedCourse]);

  const getRoleIcon = (role) => ({
    'Présidente': Crown, 'Présidente Adjointe': Crown,
    'Secrétaire': FileText, 'Secrétaire Adjoint': FileText, 'Secrétaire Adjointe': FileText,
    'Trésorier': Wallet, 'Trésorier Adjoint': Wallet, 'Trésorière Adjointe': Wallet,
  }[role] || User);

  const getBadgeVariant = (group) => ({ 'Compétition': 'competition', 'Perf': 'perf', 'Autonomes': 'autonomes', 'Loisir': 'loisir' }[group] || 'secondary');

  const dynamicRoleInfo = {
    'Coach': { icon: Whistle, color: 'bg-red-500 text-white', title: 'Coach (Compétition)' },
    'Encadrant': { icon: Shield, color: 'bg-blue-500 text-white', title: 'Encadrant (Loisir/Perf)' },
    'Ouvreur': { icon: Wrench, color: 'bg-yellow-500 text-black', title: 'Ouvreur (Autonomes)' },
  };

  const VolunteerCard = ({ member }) => {
    const { showMemberDetails, openEditFormForMember } = useMemberDetail();
    const fullName = formatName(member.first_name, member.last_name, isAdmin);
    const sessions = findMemberSessions(member);
    const Icon = member.title === 'Bureau' ? getRoleIcon(member.sub_group) : null;

    const handleViewDetails = (e) => {
      console.log('🔍 handleViewDetails clicked', member.id);
      e.preventDefault();
      e.stopPropagation();
      console.log('🔍 Calling showMemberDetails', typeof showMemberDetails);
      showMemberDetails(member.id);
    };

    const handleEdit = (e) => {
      console.log('✏️ handleEdit clicked', member.id);
      e.preventDefault();
      e.stopPropagation();
      console.log('✏️ Calling openEditFormForMember', typeof openEditFormForMember);
      openEditFormForMember(member);
    };

    return (
      <div>
        <Card 
          className="border-green-200 shadow-md hover:shadow-lg transition-shadow relative h-full"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-3">
              <SafeMemberAvatar 
                member={member} 
                size="default"
                className="w-16 h-16"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-lg">{fullName}</p>
                  {Icon && <Icon className="w-5 h-5 text-primary" title={member.sub_group} />}
                  <ProfileIndicator profile={member.profiles} />
                </div>
                {member.title === 'Bureau' && member.sub_group && <Badge variant="outline" className="mt-1">{member.sub_group}</Badge>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {member.dynamic_roles?.map(role => {
                    const info = dynamicRoleInfo[role];
                    const RoleIcon = info?.icon || User;
                    return (
                      <Badge key={role} className={`${info?.color || 'bg-gray-500'} flex items-center gap-1`} title={info?.title}>
                        <RoleIcon className="h-3 w-3" />
                        {role}
                      </Badge>
                    );
                  })}
                </div>
                {sessions.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{sessions.map(s => <Badge key={s.id} variant={getBadgeVariant(s.group)}>{s.title}</Badge>)}</div>}
                {member.brevet_federaux?.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{member.brevet_federaux.map(b => <div key={b} className={`w-4 h-4 rounded-full ${brevetColors[b] || 'bg-gray-400'}`} title={b}></div>)}</div>}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onMouseDown={handleViewDetails}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir le détail
              </Button>
              {isAdmin && (
                <Button 
                  variant="default" 
                  size="sm"
                  onMouseDown={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
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

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  if (isQuizVisible) {
    const quizVolunteers = membersWithDynamicRoles.filter(m => m.title === 'Bureau' || m.title === 'Bénévole');
    return <VolunteerQuiz volunteers={quizVolunteers} onQuizEnd={() => setIsQuizVisible(false)} />;
  }

  return (
    <div className="space-y-12">
      <Helmet><title>Bénévoles - Club d'Escalade</title><meta name="description" content="Découvrez les membres du bureau et les bénévoles qui font vivre le club d'escalade" /></Helmet>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold headline">Nos Bénévoles</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Découvrez les personnes dévouées qui font vivre notre club au quotidien.</p>
        <Button size="lg" onClick={() => setIsQuizVisible(true)}>
          <BrainCircuit className="mr-2 h-5 w-5" />
          Lancer le Quiz "Qui est-ce ?"
        </Button>
      </div>
      <section className="space-y-6">
        <h2 className="text-3xl font-bold headline flex items-center gap-3"><Building className="w-8 h-8 text-primary" />Le Bureau</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {bureauPrincipaux.map((m) => <VolunteerCard key={m.id} member={m} />)}
          </div>
          <div className="space-y-6">
            {bureauAdjoints.map((m) => <VolunteerCard key={m.id} member={m} />)}
          </div>
        </div>
      </section>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold headline flex items-center gap-3"><HandHeart className="w-8 h-8 text-primary" />Les Encadrants Bénévoles</h2>
          <p className="text-muted-foreground mt-2">Nos incroyables bénévoles qui rendent tout cela possible.</p>
        </div>
        <div className="max-w-sm"><Select value={selectedCourse} onValueChange={setSelectedCourse}><SelectTrigger><SelectValue placeholder="Filtrer par cours..." /></SelectTrigger><SelectContent>{allCourses.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Tous les cours' : c}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">{volunteersData.map((m) => <VolunteerCard key={m.id} member={m} />)}</div>
      </section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info className="w-5 h-5" /> Légende</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Rôles & Statuts</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-500" /><span>Admin</span></div>
              <div className="flex items-center gap-2"><User className="h-5 w-5 text-blue-500" /><span>Adhérent</span></div>
              {Object.entries(dynamicRoleInfo).map(([role, { icon: Icon, color, title }]) => (
                <div key={role} className="flex items-center gap-2">
                  <div className={`p-1 rounded-full ${color}`}><Icon className="h-3 w-3" /></div>
                  <span>{title}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Brevets Fédéraux</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              {Object.keys(brevetColors).map((brevet) => {
                const definition = brevetDefinitions[brevet];
                return (
                  <div key={brevet}>
                    {definition ? (
                      <BrevetDefinitionDialog brevetName={brevet} definition={definition} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${brevetColors[brevet]}`}></div>
                        <span>{brevet}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Volunteers;