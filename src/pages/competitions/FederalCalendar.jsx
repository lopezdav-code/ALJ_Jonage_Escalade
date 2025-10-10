import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const TypeBadge = ({ type }) => {
  const isChampionnat = type === 'Championnats';
  return (
    <Badge 
      variant={isChampionnat ? 'destructive' : 'secondary'}
      className={isChampionnat ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}
    >
      {type}
    </Badge>
  );
};

const RegionalCupsSection = () => {
  const u13u15 = [
    { type: 'Coupes Régionales', location: 'Ambérieu en Bugey', date: 'samedi 11 octobre 2025', discipline: 'Bloc', note: '' },
    { type: 'Coupes Régionales', location: 'Cusset Vichy Escalade', date: 'samedi 8 novembre 2025', discipline: 'Bloc', note: '' },
    { type: 'Coupes Régionales', location: 'Voiron (U13)', date: 'samedi 28 février 2026', discipline: 'Vitesse', note: '' },
    { type: 'Coupes Régionales', location: 'La Dégaine Charbonnière', date: 'samedi 28 mars 2026', discipline: 'Difficulté et Vitesse', note: '' },
    { type: 'Championnats', location: 'Voiron (U15)', date: 'samedi 28 février 2026', discipline: 'Vitesse', note: '' },
    { type: 'Championnats', location: 'Jonage (U13/U11)', date: '25 et 26 avril 2026', discipline: 'Bloc/Difficulté et Vitesse', note: 'Organisé par notre club ! Qualificatif France.' },
  ];
  const u17plus = [
    { type: 'Coupes Régionales', location: 'Marignier', date: 'samedi 4 octobre 2025', discipline: 'Bloc', note: '' },
    { type: 'Coupes Régionales', location: 'Clermont Ferrand', date: 'samedi 22 novembre 2025', discipline: 'Bloc', note: '' },
    { type: 'Coupes Régionales', location: 'Le Pouzin', date: 'samedi 31 janvier 2026', discipline: 'Difficulté', note: '' },
    { type: 'Coupes Régionales', location: 'Pont En Royans', date: 'samedi 21 mars 2026', discipline: 'Difficulté', note: '' },
    { type: 'Championnats', location: 'Anse', date: '13 et 14 décembre 2025', discipline: 'Bloc', note: 'Qualificatif France' },
    { type: 'Championnats', location: 'Voiron', date: 'samedi 28 février 2026', discipline: 'Vitesse', note: 'Qualificatif France' },
    { type: 'Championnats', location: 'Voiron', date: '18 et 19 avril 2026', discipline: 'Difficulté', note: 'Qualificatif France' },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
      <h2 className="text-3xl font-bold headline">Coupes Régionales AURA</h2>
      <p className="text-muted-foreground">Le circuit de la Fédération Française de Montagne et d'Escalade – Ligue Auvergne Rhône Alpes. Notre club participe aux Coupes régionales escalade AURA. La ligue met en place 2 circuits de compétitions répartis sur l’ensemble de la région.</p>
      <div className="flex gap-4 flex-wrap">
        <Button asChild variant="link"><a href="https://www.ffmeaura.fr/competition/coupes-regionales-escalade/" target="_blank" rel="noreferrer">Plus d'infos sur les Coupes Régionales <ExternalLink className="w-4 h-4 ml-2" /></a></Button>
        <Button asChild variant="link"><a href="https://www.ffmeaura.fr/competition/championnats-regionaux-escalade/" target="_blank" rel="noreferrer">Plus d'infos sur les Championnats Régionaux <ExternalLink className="w-4 h-4 ml-2" /></a></Button>
      </div>
      <div className="space-y-8">
        <Card><CardHeader><CardTitle>U13 / U15</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Lieu</TableHead><TableHead>Date</TableHead><TableHead>Discipline</TableHead><TableHead>Note</TableHead></TableRow></TableHeader><TableBody>{u13u15.map((c, i) => <TableRow key={i}><TableCell><TypeBadge type={c.type} /></TableCell><TableCell>{c.location}</TableCell><TableCell>{c.date}</TableCell><TableCell><DisciplineBadge discipline={c.discipline} /></TableCell><TableCell>{c.note}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        <Card><CardHeader><CardTitle>U17 / U19 / Senior / Vétéran</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Lieu</TableHead><TableHead>Date</TableHead><TableHead>Discipline</TableHead><TableHead>Note</TableHead></TableRow></TableHeader><TableBody>{u17plus.map((c, i) => <TableRow key={i}><TableCell><TypeBadge type={c.type} /></TableCell><TableCell>{c.location}</TableCell><TableCell>{c.date}</TableCell><TableCell><DisciplineBadge discipline={c.discipline} /></TableCell><TableCell>{c.note}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      </div>
    </motion.section>
  );
};

const ContestTourSection = () => {
  const contests = [
    { location: 'Corbas', date: 'Dimanche 12 Octobre', discipline: 'Difficulté', category: 'U11/U13/U15', note: '' },
    { location: 'Saint-Genis-Laval (Mousteclip)', date: 'Dimanche 9 Novembre', discipline: 'Difficulté', category: 'De U11 à Vet', note: '' },
    { location: 'Anse', date: 'Mardi 11 Novembre', discipline: 'Vitesse', category: 'Championnat dep', note: '' },
    { location: 'St Pierre de Chandieu', date: 'Le samedi 15 et Dimanche 16 Novembre', discipline: 'Bloc', category: 'De U13 à Vet', note: 'Championnat dep' },
  ];
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-6">
      <h2 className="text-3xl font-bold headline">Le contest Tour : Le circuit pour tous !</h2>
      <p className="text-muted-foreground">Ce sont des compétitions, près de chez vous, accessibles à tous : débutants, handi-grimpeurs, adultes et enfants. Elles sont conviviales et festives, le format favorise la grimpe : essais illimités, prises bonus, voies en moulinette… Pour garantir l’équité, les meilleurs grimpeurs du territoire n’ont pas le droit de concourir sur ce circuit.</p>
      <Button asChild variant="link"><a href="https://www.ffme69.fr/competition/departementales-et-metropolitaines/" target="_blank" rel="noreferrer">Info FFME69 <ExternalLink className="w-4 h-4 ml-2" /></a></Button>
      <Card><CardContent className="p-6"><Table><TableHeader><TableRow><TableHead>Lieu</TableHead><TableHead>Date</TableHead><TableHead>Discipline</TableHead><TableHead>Catégorie</TableHead><TableHead>Note</TableHead></TableRow></TableHeader><TableBody>{contests.map((c, i) => <TableRow key={i}><TableCell>{c.location}</TableCell><TableCell>{c.date}</TableCell><TableCell><DisciplineBadge discipline={c.discipline} /></TableCell><TableCell>{c.category}</TableCell><TableCell>{c.note}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </motion.section>
  );
};

const FederalCalendar = () => {
    return (
        <div className="space-y-12">
            <RegionalCupsSection />
            <ContestTourSection />
        </div>
    );
};

export default FederalCalendar;
