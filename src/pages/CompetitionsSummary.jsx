
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const CompetitionsSummary = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true);
      const { data: competitions, error: competitionsError } = await supabase
        .from('competitions')
        .select('id, name, location, start_date, disciplines')
        .order('start_date', { ascending: false });

      if (competitionsError) {
        toast({ title: "Erreur", description: "Impossible de charger les compétitions.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data: participants, error: participantsError } = await supabase
        .from('competition_participants')
        .select('competition_id, role');

      if (participantsError) {
        toast({ title: "Erreur", description: "Impossible de charger les participants.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const summary = competitions.map(comp => {
        const compParticipants = participants.filter(p => p.competition_id === comp.id);
        const coaches = compParticipants.filter(p => p.role === 'belayer').length;
        const arbitres = compParticipants.filter(p => p.role === 'judge').length;
        const competiteurs = compParticipants.filter(p => p.role === 'competitor').length;
        
        return {
          ...comp,
          coaches,
          arbitres,
          competiteurs,
          total: compParticipants.length
        };
      });

      setSummaryData(summary);
      setLoading(false);
    };

    fetchSummaryData();
  }, [toast]);

  const DisciplineBadge = ({ discipline }) => {
    const normalizedDiscipline = discipline.toLowerCase().replace(/ /g, '');
    let variant = 'default';
    if (normalizedDiscipline.includes('bloc')) variant = 'bloc';
    else if (normalizedDiscipline.includes('difficulté')) variant = 'difficulte';
    else if (normalizedDiscipline.includes('vitesse')) variant = 'vitesse';
  
    return <Badge variant={variant}>{discipline}</Badge>;
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
        <title>Récapitulatif des Inscriptions - Club d'Escalade</title>
        <meta name="description" content="Tableau récapitulatif des inscriptions aux compétitions d'escalade" />
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
          <h1 className="text-4xl font-bold headline">Récapitulatif des Inscriptions</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Vue d'ensemble des participants par compétition
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Tableau des Inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compétition</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Discipline</TableHead>
                  <TableHead className="text-center">Coachs</TableHead>
                  <TableHead className="text-center">Arbitres</TableHead>
                  <TableHead className="text-center">Compétiteurs</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryData.map((competition) => (
                  <TableRow key={competition.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{competition.name}</div>
                        <div className="text-sm text-muted-foreground">{competition.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(competition.start_date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {competition.disciplines.map(d => <DisciplineBadge key={d} discipline={d} />)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{competition.coaches}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{competition.arbitres}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default">{competition.competiteurs}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold">
                        {competition.total}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid md:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {summaryData.reduce((sum, comp) => sum + comp.total, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Compétitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {summaryData.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Moyenne par Compétition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {summaryData.length > 0 ? Math.round(summaryData.reduce((sum, comp) => sum + comp.total, 0) / summaryData.length) : 0}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompetitionsSummary;
