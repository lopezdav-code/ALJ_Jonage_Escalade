import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const DisciplineBadge = ({ discipline }) => {
  const normalizedDiscipline = discipline.toLowerCase().replace(/ /g, '');
  let variant = 'default';
  if (normalizedDiscipline.includes('bloc')) variant = 'bloc';
  else if (normalizedDiscipline.includes('difficulté')) variant = 'difficulte';
  else if (normalizedDiscipline.includes('vitesse')) variant = 'vitesse';
  return <Badge variant={variant}>{discipline}</Badge>;
};

const Palmares = () => {
  const results = [
    { name: 'DIDIER Camille', category: 'DIFFICULTE-u20', rank: 31 },
    { name: 'ANTOLINOS Clément', category: 'BLOC-u18', rank: 42 },
    { name: 'SOLEYMIEUX OUSSELIN Lola', category: 'DIFFICULTE-Sen', rank: 77 },
    { name: 'NADRCIC Arsène', category: 'BLOC-u18', rank: 60 },
    { name: 'CAPUANO Olivia', category: 'DIFFICULTE-u20', rank: 144 },
    { name: 'COCHE Eden', category: 'DIFFICULTE-u16', rank: 63 },
    { name: 'POZZOBON Lucie', category: 'DIFFICULTE-u18', rank: 169 },
    { name: 'ROZIE Benoit', category: 'DIFFICULTE-u18', rank: 70 },
  ];
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="space-y-6">
      <h2 className="text-3xl font-bold headline flex items-center gap-3"><Star className="w-8 h-8 text-primary" /> Palmarès 2025</h2>
      <p className="text-xl font-semibold">ALJ Escalade Jonage : 83ème club de France !</p>
      <p className="text-muted-foreground">Félicitations à tous nos compétiteurs pour cette saison exceptionnelle ! Voici les résultats individuels qui ont contribué à ce classement historique.</p>
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Discipline/Catégorie</TableHead><TableHead>Classement</TableHead></TableRow></TableHeader>
            <TableBody>{results.map((r, i) => {
              const [discipline, cat] = r.category.split('-');
              return (
                <TableRow key={i}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <DisciplineBadge discipline={discipline} />
                    <span>{cat}</span>
                  </TableCell>
                  <TableCell>{r.rank}</TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default Palmares;
