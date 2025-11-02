import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePageAccess } from '@/hooks/usePageAccess';
import ClubCompetitions from './competitions/ClubCompetitions';
import FederalCalendar from './competitions/FederalCalendar';
import Palmares from './competitions/Palmares';
import Vocabulary from './competitions/Vocabulary';

const Competitions = () => {
  const { isAdmin, isBureau, isEncadrant } = useAuth();
  const { hasAccess, loading: pageAccessLoading } = usePageAccess();
  const canEdit = isAdmin || isBureau || isEncadrant;

  return (
    <ProtectedRoute pageTitle="Compétitions">

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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="club" className="text-xs sm:text-sm">Compétitions du club</TabsTrigger>
          <TabsTrigger value="federal" className="text-xs sm:text-sm">Calendrier</TabsTrigger>
          <TabsTrigger value="palmares" className="text-xs sm:text-sm">Palmarès 2024-2025</TabsTrigger>
          <TabsTrigger value="vocabulaire" className="text-xs sm:text-sm">Vocabulaire</TabsTrigger>
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

      {canEdit && (
        <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <h3 className="text-sm font-semibold text-blue-800">Note pour les administrateurs, bureau et encadrants :</h3>
          <p className="text-sm text-blue-700 mt-1">
            Vous disposez des droits pour créer et modifier les compétitions du club. Le bouton "Créer une compétition" est visible pour vous dans l'onglet "Compétitions du club", et le bouton "Éditer" est disponible sur la page de détail de chaque compétition.
          </p>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
};

export default Competitions;
