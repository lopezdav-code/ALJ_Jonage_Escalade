import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Vocabulary = () => (
  <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
    <h2 className="text-3xl font-bold headline flex items-center gap-3"><BookOpen className="w-8 h-8 text-primary" /> Vocabulaire</h2>
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg">Contest</h3>
          <p className="text-muted-foreground">Manifestation avec un règlement souple (idéal pour commencer). Ouvert aux compétiteurs concernés sous certaines réserves (niveau trop élevé notamment). À ne pas confondre avec une compétition en ‘mode contest’.</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Open</h3>
          <p className="text-muted-foreground">Ouvert aux compétiteurs concernés sous certaines réserves (géographiques, nombre de places,…).</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Coupe</h3>
          <p className="text-muted-foreground">Ensemble de compétitions ouvert aux compétiteurs concernés avec ou sans critère de sélection.</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Championnat</h3>
          <p className="text-muted-foreground">Une compétition avec généralement un critère de sélection.</p>
        </div>
      </CardContent>
    </Card>
  </motion.section>
);

export default Vocabulary;
