
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Users, Mountain, GitBranch, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { formatName } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const InscriptionsSummary = () => {
  const [competitions, setCompetitions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: comps, error: compsError } = await supabase
        .from('competitions')
        .select('id, name, start_date, categories, disciplines')
        .order('start_date', { ascending: true });

      if (compsError) {
        toast({ title: "Erreur", description: "Impossible de charger les compétitions.", variant: "destructive" });
        setLoading(false);
        return;
      }
      setCompetitions(comps);

      const { data: parts, error: partsError } = await supabase
        .from('competition_participants')
        .select('competition_id, role, members(id, first_name, last_name, category)')
        .eq('role', 'competitor');

      if (partsError) {
        toast({ title: "Erreur", description: "Impossible de charger les participants.", variant: "destructive" });
        setLoading(false);
        return;
      }
      setParticipants(parts);
      setLoading(false);
    };

    fetchData();
  }, [toast]);

  const getCompetitorDataForDiscipline = (discipline) => {
    const relevantComps = competitions.filter(c => c.disciplines.includes(discipline));
    if (relevantComps.length === 0) return { competitors: [], competitions: [] };

    const competitorMap = new Map();

    participants.forEach(p => {
      if (relevantComps.some(rc => rc.id === p.competition_id)) {
        if (!p.members) return;
        const memberId = p.members.id;
        if (!competitorMap.has(memberId)) {
          competitorMap.set(memberId, {
            member: p.members,
            inscriptions: new Array(relevantComps.length).fill(false)
          });
        }

        const compIndex = relevantComps.findIndex(rc => rc.id === p.competition_id);
        if (compIndex !== -1) {
          competitorMap.get(memberId).inscriptions[compIndex] = true;
        }
      }
    });

    const competitors = Array.from(competitorMap.values()).sort((a, b) => 
      a.member.last_name.localeCompare(b.member.last_name)
    );

    return { competitors, competitions: relevantComps };
  };

  const CompetitorTable = ({ title, discipline }) => {
    const { competitors, competitions: comps } = getCompetitorDataForDiscipline(discipline);

    if (comps.length === 0) return null;

    const DisciplineIcon = discipline === 'Bloc' ? Mountain : discipline === 'Difficulté' ? GitBranch : Users;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <DisciplineIcon className={`w-6 h-6 ${discipline === 'Bloc' ? 'text-purple-500' : 'text-green-500'}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {competitors.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] min-w-[150px]">Compétiteur</TableHead>
                    {comps.map(comp => (
                      <TableHead key={comp.id} className="text-center min-w-[100px]">
                        <div className="flex flex-col items-center">
                          <span>{comp.name}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {new Date(comp.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map(({ member, inscriptions }) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{formatName(member.first_name, member.last_name, true)}</TableCell>
                      {inscriptions.map((isInscribed, index) => (
                        <TableCell key={index} className="text-center">
                          {isInscribed && <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Aucun compétiteur inscrit pour cette discipline.</p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Récapitulatif par Compétiteur - Club d'Escalade</title>
        <meta name="description" content="Tableau récapitulatif des inscriptions par compétiteur et par discipline" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-4"
      >
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-4xl font-bold headline">Inscriptions par Compétiteur</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Qui participe à quelle compétition ?
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-12"
      >
        <CompetitorTable title="Discipline Bloc" discipline="Bloc" />
        <CompetitorTable title="Discipline Difficulté" discipline="Difficulté" />
        <CompetitorTable title="Discipline Vitesse" discipline="Vitesse" />
      </motion.div>
    </div>
  );
};

export default InscriptionsSummary;
