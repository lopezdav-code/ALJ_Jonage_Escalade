import React from 'react';
import { Badge } from '@/components/ui/badge';

const DisciplineBadge = ({ discipline }) => {
  const normalizedDiscipline = discipline.toLowerCase().replace(/ /g, '');
  let variant = 'default';
  if (normalizedDiscipline.includes('bloc')) variant = 'bloc';
  else if (normalizedDiscipline.includes('difficulté')) variant = 'difficulte';
  else if (normalizedDiscipline.includes('vitesse')) variant = 'vitesse';
  return <Badge variant={variant}>{discipline}</Badge>;
};

export default DisciplineBadge;
