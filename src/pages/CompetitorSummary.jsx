import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Trophy, Calendar, MapPin, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import SafeMemberAvatar from '@/components/SafeMemberAvatar';

const DISCIPLINE_COLORS = {
  'Bloc': 'bloc',
  'Difficulté': 'difficulte',
  'Vitesse': 'vitesse'
};

const CompetitorSummary = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [participations, setParticipations] = useState([]);

  const fetchData = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;
      setMember(memberData);

      const { data: participationData, error: participationError } = await supabase
        .from('competition_participants')
        .select(`
          ranking,
          competitions (id, name, start_date, location, disciplines, nature)
        `)
        .eq('member_id', memberId)
        .eq('role', 'Competiteur')
        .order('start_date', { foreignTable: 'competitions', ascending: false });

      if (participationError) throw participationError;
      setParticipations(participationData);

    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le résumé du compétiteur.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [memberId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (!member) {
    return <div className="text-center">Compétiteur non trouvé.</div>;
  }

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Palmarès de {formatName(member.first_name, member.last_name, true)} - ALJ Escalade Jonage</title>
        <meta name="description" content={`Palmarès et récapitulatif des compétitions pour ${formatName(member.first_name, member.last_name, true)}.`} />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft /></Button>
          <div className="flex items-center gap-4">
            <SafeMemberAvatar 
              member={member} 
              size="default"
              className="w-16 h-16"
            />
            <div>
              <h1 className="text-4xl font-bold headline flex items-center gap-3">
                <Trophy className="w-10 h-10 text-primary" />
                Palmarès de {formatName(member.first_name, member.last_name, true)}
              </h1>
              <p className="text-muted-foreground">{member.title}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif des compétitions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compétition</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead className="text-right">Classement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participations.length > 0 ? (
                  participations.map(({ competitions: comp, ranking }) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium">{comp.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(comp.start_date).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {comp.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {comp.disciplines.map(d => <Badge key={d} variant={DISCIPLINE_COLORS[d] || 'default'}>{d}</Badge>)}
                          {comp.nature && <Badge variant="outline">{comp.nature}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {ranking ? (
                          <div className="flex items-center justify-end gap-2 text-primary">
                            <Medal className="w-5 h-5" />
                            <span>{ranking}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aucune participation à une compétition enregistrée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompetitorSummary;