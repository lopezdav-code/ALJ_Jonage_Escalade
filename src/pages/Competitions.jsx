import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClubCompetitions from './competitions/ClubCompetitions';
import FederalCalendar from './competitions/FederalCalendar';
import Palmares from './competitions/Palmares';
import Vocabulary from './competitions/Vocabulary';

const Competitions = () => {
  return (
    <div className="space-y-8">
      <Helmet>
        <title>Compétitions - ALJ Escalade Jonage</title>
        <meta name="description" content="Consultez le calendrier des compétitions d'escalade et les résultats." />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <Trophy className="w-10 h-10 text-primary" />
            Compétitions
          </h1>
          <a
            href="/ALJ_Jonage_Escalade/annual-summary?tab=participation"
            className="ml-auto btn btn-primary px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition"
            style={{ textDecoration: 'none' }}
          >
            Récap Annuel
          </a>
        </div>
      </motion.div>

      <Tabs defaultValue="club" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="club">Compétitions du club</TabsTrigger>
          <TabsTrigger value="federal">Calendrier des compétitions</TabsTrigger>
          <TabsTrigger value="palmares">Palmarès 2024-2025</TabsTrigger>
          <TabsTrigger value="vocabulaire">Vocabulaire</TabsTrigger>
        </TabsList>
        <TabsContent value="club" className="mt-6">
          <ClubCompetitions />
        </TabsContent>
        <TabsContent value="federal" className="mt-6">
          <FederalCalendar />
        </TabsContent>
        <TabsContent value="palmares" className="mt-6">
          <Palmares />
        </TabsContent>
        <TabsContent value="vocabulaire" className="mt-6">
          <Vocabulary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Competitions;