import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ListChecks, ArrowLeft, CheckCircle2, Euro, Shield, User, Medal, Calendar, Filter, Users, Printer, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CompetitionGroupedTable from '@/components/CompetitionGroupedTable';

const DISCIPLINE_COLORS = {
  'Bloc': 'bloc',
  'Difficulté': 'difficulte',
  'Vitesse': 'vitesse'
};

const ParticipationSummaryTable = ({ title, competitors, competitions, dateDebut, dateFin, showOnlyWithParticipation }) => {
  // Filtrer les compétitions par plage de dates
  const filteredCompetitions = competitions.filter(comp => {
    const compDate = new Date(comp.start_date);

    if (dateDebut && new Date(dateDebut) > compDate) return false;
    if (dateFin && new Date(dateFin) < compDate) return false;

    return true;
  });

  // Filtrer les compétiteurs
  const filteredCompetitors = competitors.filter(({ participations }) => {
    if (!showOnlyWithParticipation) return true;

    // Vérifier si le compétiteur a au moins une participation dans les compétitions filtrées
    return filteredCompetitions.some(comp => participations[comp.id]);
  });

  if (filteredCompetitions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {filteredCompetitors.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">Compétiteur</TableHead>
                {filteredCompetitions.map(comp => (
                  <TableHead key={comp.id} className="text-center min-w-[150px]">
                    <div className="flex flex-col items-center">
                      <span>{comp.short_title || comp.name}</span>
                      <div className="text-xs text-muted-foreground font-normal">
                        {new Date(comp.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {comp.disciplines.map(d => <Badge key={d} variant={DISCIPLINE_COLORS[d] || 'default'}>{d.slice(0,4)}</Badge>)}
                        {comp.nature && <Badge variant="outline">{comp.nature}</Badge>}
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompetitors.map(({ member, participations }) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2">
                      <User className={`w-4 h-4 ${member.sexe === 'H' ? 'text-blue-600' : 'text-pink-600'}`} />
                      <span className={member.sexe === 'H' ? 'text-blue-600' : 'text-pink-600'}>
                        {formatName(member.first_name, member.last_name, true)}
                      </span>
                      {member.category && (
                        <span className="text-muted-foreground text-sm">({member.category})</span>
                      )}
                    </div>
                  </TableCell>
                  {filteredCompetitions.map(comp => (
                    <TableCell key={comp.id} className="text-center">
                      {participations[comp.id] ? (
                        participations[comp.id].ranking ? (
                          <div className="flex items-center justify-center gap-1 font-bold text-primary">
                            <Medal className="w-4 h-4" />
                            {participations[comp.id].ranking}
                          </div>
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        )
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">Aucun compétiteur dans ce groupe.</p>
        )}
      </CardContent>
    </Card>
  );
};

const FinancialSummaryTable = ({ title, competitors, competitions }) => {
  if (competitions.length === 0 || competitors.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">Compétiteur</TableHead>
              {competitions.map(comp => (
                <TableHead key={comp.id} className="text-center min-w-[150px]">
                    <div className="flex flex-col items-center">
                      <span>{comp.short_title || comp.name}</span>
                      <div className="text-xs text-muted-foreground font-normal">
                        {new Date(comp.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {comp.disciplines.map(d => <Badge key={d} variant={DISCIPLINE_COLORS[d] || 'default'}>{d.slice(0,4)}</Badge>)}
                        {comp.nature && <Badge variant="outline">{comp.nature}</Badge>}
                      </div>
                    </div>
                  </TableHead>
                ))}
              <TableHead className="text-right font-bold sticky right-0 bg-background z-10 min-w-[100px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map(({ member, participations }) => {
              let total = 0;
              competitions.forEach(comp => {
                if (participations[comp.id] && comp.prix > 0) {
                  total += comp.prix;
                }
              });

              if (total === 0) return null;

              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2">
                      <User className={`w-4 h-4 ${member.sexe === 'H' ? 'text-blue-600' : 'text-pink-600'}`} />
                      <span className={member.sexe === 'H' ? 'text-blue-600' : 'text-pink-600'}>
                        {formatName(member.first_name, member.last_name, true)}
                      </span>
                      {member.category && (
                        <span className="text-muted-foreground text-sm">({member.category})</span>
                      )}
                    </div>
                  </TableCell>
                  {competitions.map(comp => (
                    <TableCell key={comp.id} className="text-center">
                      {participations[comp.id] && comp.prix > 0
                        ? comp.prix.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                        : ''}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold sticky right-0 bg-background z-10 text-primary">
                    {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const VolunteerSection = ({ coaches, referees, competitions }) => {
  const { toast } = useToast();
  const contentRef = useRef(null);

  const handleCopyAsImage = async () => {
    try {
      if (!contentRef.current) return;

      // Cloner l'élément et agrandir les icônes pour la capture
      const clone = contentRef.current.cloneNode(true);

      // Agrandir toutes les icônes SVG dans le clone pour une meilleure capture
      const svgs = clone.querySelectorAll('svg');
      svgs.forEach(svg => {
        const currentWidth = svg.getAttribute('width') || svg.style.width || '';
        const currentHeight = svg.getAttribute('height') || svg.style.height || '';

        // Augmenter la taille des petites icônes
        if (currentWidth.includes('3') || currentHeight.includes('3') || currentWidth.includes('4') || currentHeight.includes('4')) {
          svg.setAttribute('width', '24');
          svg.setAttribute('height', '24');
          svg.style.width = '24px';
          svg.style.height = '24px';
        }
      });

      // Ajouter le clone au DOM temporairement
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      // Attendre que les icônes agrandies soient rendues
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 200);
        });
      });

      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 1.5,
        allowTaint: true,
        useCORS: true,
        logging: false,
        removeModal: true,
      });

      // Nettoyer le clone
      document.body.removeChild(tempContainer);

      canvas.toBlob(async (blob) => {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          toast({
            title: 'Succès',
            description: 'Tableaux copiés dans le presse-papier',
          });
        } catch (err) {
          toast({
            title: 'Erreur',
            description: 'Impossible de copier dans le presse-papier',
            variant: 'destructive',
          });
        }
      });
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de capturer les tableaux',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Boutons d'action */}
      <div className="flex justify-end gap-2 no-print">
        <Button onClick={handleCopyAsImage} variant="outline" size="sm" className="gap-2">
          <Copy className="w-4 h-4" />
          Copier l'image
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimer
        </Button>
      </div>

      {/* Contenu à capturer */}
      <div ref={contentRef} className="space-y-4">
        <VolunteerSummaryTable title="Coachs" volunteers={coaches} competitions={competitions} icon={User} />
        <VolunteerSummaryTable title="Arbitres" volunteers={referees} competitions={competitions} icon={Shield} />
      </div>
    </div>
  );
};

const VolunteerSummaryTable = ({ title, volunteers, competitions, icon: Icon }) => {
  if (competitions.length === 0 || volunteers.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="h-auto py-2 px-2">Bénévole</TableHead>
                {competitions.map(comp => (
                  <TableHead key={comp.id} className="text-center h-auto py-2 px-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs leading-tight">{comp.short_title || comp.name}</span>
                      <div className="text-xs text-muted-foreground font-normal leading-tight">
                        {new Date(comp.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-right font-bold h-auto py-2 px-1">T</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volunteers.map(({ member, participations }) => {
                const total = Object.keys(participations).length;
                if (total === 0) return null;

                return (
                  <TableRow key={member.id} className="h-auto">
                    <TableCell className="font-medium py-1 px-2 text-xs">{formatName(member.first_name, member.last_name, true)}</TableCell>
                    {competitions.map(comp => (
                      <TableCell key={comp.id} className="text-center py-1 px-1">
                        {participations[comp.id] && <CheckCircle2 className="w-3 h-3 text-green-500 mx-auto" />}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-bold text-primary py-1 px-1 text-xs">
                      {total}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const AnnualSummary = () => {
  const [summaryData, setSummaryData] = useState({ u11_u15: [], u15_u19: [] });
  const [allCompetitors, setAllCompetitors] = useState([]);
  const [volunteerData, setVolunteerData] = useState({ coaches: [], referees: [] });
  const [competitions, setCompetitions] = useState({ u11_u15: [], u15_u19: [], all: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('participation');

  // Filtres pour l'onglet participation
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showOnlyWithParticipation, setShowOnlyWithParticipation] = useState(false);
  const [viewMode, setViewMode] = useState('by-group'); // 'by-group' ou 'by-competition'

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: participations, error } = await supabase
        .from('competition_participants')
        .select(`
          role,
          member_id,
          competition_id,
          ranking,
          members ( id, first_name, last_name, title, category, sexe ),
          competitions ( id, name, short_title, start_date, disciplines, nature, prix )
        `);

      if (error) throw error;

      const allCompetitions = participations
        .map(p => p.competitions)
        .filter((v, i, a) => v && a.findIndex(t => t.id === v.id) === i)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

      const processGroup = (groupTitle) => {
        const groupMembers = {};
        const groupComps = {};

        participations
          .filter(p => p.role === 'Competiteur' && p.members?.title === groupTitle)
          .forEach(p => {
            if (!p.members || !p.competitions) return;
            const memberId = p.members.id;
            const compId = p.competitions.id;

            if (!groupMembers[memberId]) {
              groupMembers[memberId] = { member: p.members, participations: {} };
            }
            groupMembers[memberId].participations[compId] = { ranking: p.ranking };

            if (!groupComps[compId]) {
              groupComps[compId] = p.competitions;
            }
          });
        
        const sortedMembers = Object.values(groupMembers).sort((a, b) => {
          // Sort by category
          const categoryA = a.member.category || '';
          const categoryB = b.member.category || '';
          if (categoryA < categoryB) return -1;
          if (categoryA > categoryB) return 1;

          // Then by sex
          const sexA = a.member.sexe || '';
          const sexB = b.member.sexe || '';
          if (sexA < sexB) return -1;
          if (sexA > sexB) return 1;

          // Then by first name
          return a.member.first_name.localeCompare(b.member.first_name);
        });
        const sortedComps = Object.values(groupComps).sort((a,b) => new Date(a.start_date) - new Date(b.start_date));

        return { members: sortedMembers, competitions: sortedComps };
      };

      const processVolunteers = (role) => {
        const volunteerMembers = {};
        participations
          .filter(p => p.role === role)
          .forEach(p => {
            if (!p.members || !p.competitions) return;
            const memberId = p.members.id;
            const compId = p.competitions.id;

            if (!volunteerMembers[memberId]) {
              volunteerMembers[memberId] = { member: p.members, participations: {} };
            }
            volunteerMembers[memberId].participations[compId] = true;
          });
        return Object.values(volunteerMembers).sort((a,b) => a.member.first_name.localeCompare(b.member.first_name));
      };

      const u11_u15_data = processGroup('Compétition U11-U15');
      const u15_u19_data = processGroup('Compétition U15-U19');

      // Garder une trace des IDs de compétiteurs déjà traités
      const processedMemberIds = new Set();
      u11_u15_data.members.forEach(m => processedMemberIds.add(m.member.id));
      u15_u19_data.members.forEach(m => processedMemberIds.add(m.member.id));

      // Traiter tous les autres compétiteurs (autre titre ou sans titre)
      const otherCompetitors = {};
      participations
        .filter(p => p.role === 'Competiteur' && !processedMemberIds.has(p.members?.id))
        .forEach(p => {
          if (!p.members || !p.competitions) return;
          const memberId = p.members.id;
          const compId = p.competitions.id;

          if (!otherCompetitors[memberId]) {
            otherCompetitors[memberId] = { member: p.members, participations: {} };
          }
          otherCompetitors[memberId].participations[compId] = { ranking: p.ranking };
        });
      const otherMembers = Object.values(otherCompetitors).sort((a, b) => {
        return a.member.first_name.localeCompare(b.member.first_name);
      });

      // Combiner tous les compétiteurs pour la vue par compétition
      const combinedCompetitors = [...u11_u15_data.members, ...u15_u19_data.members, ...otherMembers];

      setSummaryData({ u11_u15: u11_u15_data.members, u15_u19: u15_u19_data.members });
      setAllCompetitors(combinedCompetitors);
      setCompetitions({
        u11_u15: u11_u15_data.competitions,
        u15_u19: u15_u19_data.competitions,
        all: allCompetitions
      });
      setVolunteerData({
        coaches: processVolunteers('Coach'),
        referees: processVolunteers('Arbitre'),
      });

    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger les données du récapitulatif.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <ProtectedRoute
      requireAdherent={true}
      pageTitle="Récapitulatif annuel"
      message="Le récapitulatif annuel est réservé aux adhérents du club. Veuillez vous connecter avec un compte adhérent pour y accéder."
    >
      <div className={`${(activeTab === 'participation' || activeTab === 'volunteers') ? 'space-y-4' : 'space-y-8'}`}>
        <Helmet>
          <title>Récapitulatif Annuel et Financier - ALJ Escalade Jonage</title>
          <meta name="description" content="Récapitulatif annuel des participations aux compétitions et suivi financier." />
        </Helmet>

        {(activeTab !== 'participation' && activeTab !== 'volunteers') && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/competitions')}><ArrowLeft /></Button>
              <h1 className="text-4xl font-bold headline flex items-center gap-3">
                <ListChecks className="w-10 h-10 text-primary" />
                Récapitulatif Annuel et Financier
              </h1>
            </div>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="participation">Liste des compétitions</TabsTrigger>
            <TabsTrigger value="financial">Récapitulatif Financier</TabsTrigger>
            <TabsTrigger value="volunteers">Participation des adhérents</TabsTrigger>
          </TabsList>
          <TabsContent value="participation" className="pt-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
              {/* Filtres */}
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="w-4 h-4" />
                    Filtres
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Mode d'affichage */}
                  <div className="flex items-center gap-4">
                    <Label className="font-semibold">
                      Mode d'affichage:
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === 'by-group' ? 'default' : 'outline'}
                        onClick={() => setViewMode('by-group')}
                      >
                        Par groupe
                      </Button>
                      <Button
                        variant={viewMode === 'by-competition' ? 'default' : 'outline'}
                        onClick={() => setViewMode('by-competition')}
                      >
                        Par compétition
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[160px]">
                      <Label htmlFor="dateDebut" className="flex items-center gap-1 mb-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        Du
                      </Label>
                      <Input
                        id="dateDebut"
                        type="date"
                        size="sm"
                        className="text-sm h-8"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <Label htmlFor="dateFin" className="flex items-center gap-1 mb-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        Au
                      </Label>
                      <Input
                        id="dateFin"
                        type="date"
                        size="sm"
                        className="text-sm h-8"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Checkbox
                        id="showOnlyWithParticipation"
                        checked={showOnlyWithParticipation}
                        onCheckedChange={setShowOnlyWithParticipation}
                      />
                      <Label htmlFor="showOnlyWithParticipation" className="cursor-pointer text-xs">
                        Avec participation
                      </Label>
                    </div>
                    {(dateDebut || dateFin || showOnlyWithParticipation) && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setDateDebut('');
                          setDateFin('');
                          setShowOnlyWithParticipation(false);
                        }}
                        className="text-xs h-8"
                      >
                        Réinit.
                      </Button>
                    )}
                  </div>

                  {/* Statistiques des participants */}
                  {(() => {
                    // Calculer pour U11-U15
                    const u11_u15_filteredComps = competitions.u11_u15.filter(comp => {
                      const compDate = new Date(comp.start_date);
                      if (dateDebut && new Date(dateDebut) > compDate) return false;
                      if (dateFin && new Date(dateFin) < compDate) return false;
                      return true;
                    });
                    const u11_u15_filteredCompetitors = summaryData.u11_u15.filter(({ participations }) => {
                      if (!showOnlyWithParticipation) return true;
                      return u11_u15_filteredComps.some(comp => participations[comp.id]);
                    });

                    // Calculer pour U15-U19
                    const u15_u19_filteredComps = competitions.u15_u19.filter(comp => {
                      const compDate = new Date(comp.start_date);
                      if (dateDebut && new Date(dateDebut) > compDate) return false;
                      if (dateFin && new Date(dateFin) < compDate) return false;
                      return true;
                    });
                    const u15_u19_filteredCompetitors = summaryData.u15_u19.filter(({ participations }) => {
                      if (!showOnlyWithParticipation) return true;
                      return u15_u19_filteredComps.some(comp => participations[comp.id]);
                    });

                    const totalCompetitors = u11_u15_filteredCompetitors.length + u15_u19_filteredCompetitors.length;
                    const totalCompetitions = u11_u15_filteredComps.length + u15_u19_filteredComps.length;

                    return (
                      <div className="flex flex-wrap gap-3 pt-3 border-t text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="font-semibold">
                            {totalCompetitors}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            compétiteurs
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Medal className="w-4 h-4 text-primary" />
                          <span className="font-semibold">
                            {totalCompetitions}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            compétitions
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Tableaux */}
              {viewMode === 'by-group' ? (
                <>
                  <ParticipationSummaryTable
                    title="Groupe U11-U15"
                    competitors={summaryData.u11_u15}
                    competitions={competitions.u11_u15}
                    dateDebut={dateDebut}
                    dateFin={dateFin}
                    showOnlyWithParticipation={showOnlyWithParticipation}
                  />
                  <ParticipationSummaryTable
                    title="Groupe U15-U19"
                    competitors={summaryData.u15_u19}
                    competitions={competitions.u15_u19}
                    dateDebut={dateDebut}
                    dateFin={dateFin}
                    showOnlyWithParticipation={showOnlyWithParticipation}
                  />
                </>
              ) : (
                <CompetitionGroupedTable
                  competitions={competitions.all}
                  allCompetitors={
                    showOnlyWithParticipation
                      ? allCompetitors.filter(({ participations }) => {
                          // Filtrer par compétitions dans la plage de dates
                          const filteredComps = competitions.all.filter(comp => {
                            const compDate = new Date(comp.start_date);
                            if (dateDebut && new Date(dateDebut) > compDate) return false;
                            if (dateFin && new Date(dateFin) < compDate) return false;
                            return true;
                          });
                          return filteredComps.some(comp => participations[comp.id]);
                        })
                      : allCompetitors
                  }
                  dateDebut={dateDebut}
                  dateFin={dateFin}
                  showOnlyWithParticipation={showOnlyWithParticipation}
                />
              )}
            </motion.div>
          </TabsContent>
          <TabsContent value="financial" className="pt-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-8">
              <FinancialSummaryTable title="Groupe U11-U15" competitors={summaryData.u11_u15} competitions={competitions.u11_u15} />
              <FinancialSummaryTable title="Groupe U15-U19" competitors={summaryData.u15_u19} competitions={competitions.u15_u19} />
            </motion.div>
          </TabsContent>
          <TabsContent value="volunteers" className="pt-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <VolunteerSection coaches={volunteerData.coaches} referees={volunteerData.referees} competitions={competitions.all} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
};

export default AnnualSummary;
