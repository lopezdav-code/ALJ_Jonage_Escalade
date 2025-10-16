import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ListChecks, ArrowLeft, CheckCircle2, Euro, Shield, User, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const DISCIPLINE_COLORS = {
  'Bloc': 'bloc',
  'Difficulté': 'difficulte',
  'Vitesse': 'vitesse'
};

const ParticipationSummaryTable = ({ title, competitors, competitions }) => {
  if (competitions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {competitors.length > 0 ? (
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map(({ member, participations }) => (
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

const VolunteerSummaryTable = ({ title, volunteers, competitions, icon: Icon }) => {
  if (competitions.length === 0 || volunteers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">Bénévole</TableHead>
              {competitions.map(comp => (
                <TableHead key={comp.id} className="text-center min-w-[150px]">
                  <div className="flex flex-col items-center">
                    <span>{comp.short_title || comp.name}</span>
                    <div className="text-xs text-muted-foreground font-normal">
                      {new Date(comp.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right font-bold sticky right-0 bg-background z-10 min-w-[100px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteers.map(({ member, participations }) => {
              const total = Object.keys(participations).length;
              if (total === 0) return null;

              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{formatName(member.first_name, member.last_name, true)}</TableCell>
                  {competitions.map(comp => (
                    <TableCell key={comp.id} className="text-center">
                      {participations[comp.id] && <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold sticky right-0 bg-background z-10 text-primary">
                    {total}
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

const AnnualSummary = () => {
  const [summaryData, setSummaryData] = useState({ u11_u15: [], u15_u19: [] });
  const [volunteerData, setVolunteerData] = useState({ coaches: [], referees: [] });
  const [competitions, setCompetitions] = useState({ u11_u15: [], u15_u19: [], all: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('participation');

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
      
      setSummaryData({ u11_u15: u11_u15_data.members, u15_u19: u15_u19_data.members });
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
      <div className="space-y-8">
        <Helmet>
          <title>Récapitulatif Annuel et Financier - ALJ Escalade Jonage</title>
          <meta name="description" content="Récapitulatif annuel des participations aux compétitions et suivi financier." />
        </Helmet>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/competitions')}><ArrowLeft /></Button>
            <h1 className="text-4xl font-bold headline flex items-center gap-3">
              <ListChecks className="w-10 h-10 text-primary" />
              Récapitulatif Annuel et Financier
            </h1>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="participation">Liste des compétitions</TabsTrigger>
            <TabsTrigger value="financial">Récapitulatif Financier</TabsTrigger>
            <TabsTrigger value="volunteers">Participation des adhérents</TabsTrigger>
          </TabsList>
          <TabsContent value="participation" className="pt-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-8">
              <ParticipationSummaryTable title="Groupe U11-U15" competitors={summaryData.u11_u15} competitions={competitions.u11_u15} />
              <ParticipationSummaryTable title="Groupe U15-U19" competitors={summaryData.u15_u19} competitions={competitions.u15_u19} />
            </motion.div>
          </TabsContent>
          <TabsContent value="financial" className="pt-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-8">
              <FinancialSummaryTable title="Groupe U11-U15" competitors={summaryData.u11_u15} competitions={competitions.u11_u15} />
              <FinancialSummaryTable title="Groupe U15-U19" competitors={summaryData.u15_u19} competitions={competitions.u15_u19} />
            </motion.div>
          </TabsContent>
          <TabsContent value="volunteers" className="pt-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-8">
              <VolunteerSummaryTable title="Coachs" volunteers={volunteerData.coaches} competitions={competitions.all} icon={User} />
              <VolunteerSummaryTable title="Arbitres" volunteers={volunteerData.referees} competitions={competitions.all} icon={Shield} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default AnnualSummary;
