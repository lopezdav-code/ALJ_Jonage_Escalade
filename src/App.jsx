
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from '@/components/ui/helmet';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import News from '@/pages/News';
import NewsDetail from '@/pages/NewsDetail';
import Competitions from '@/pages/Competitions';
import Volunteers from '@/pages/Volunteers';
import Agenda from '@/pages/Agenda';
import Schedule from '@/pages/Schedule';
import Competitors from '@/pages/Competitors';
import SessionLog from '@/pages/SessionLog';
import Pedagogy from '@/pages/Pedagogy';
import Members from '@/pages/Members';
import Contact from '@/pages/Contact';
import SiteSettings from '@/pages/SiteSettings';
import AnnualSummary from '@/pages/AnnualSummary';
import AdminManagement from '@/pages/AdminManagement';
import Inscriptions from '@/pages/Inscriptions';
import ImageAdmin from '@/pages/ImageAdmin';
import Setup from '@/pages/Setup';
import CompetitorSummary from '@/pages/CompetitorSummary';
import InscriptionsSummary from '@/pages/InscriptionsSummary';
import CompetitionsSummary from '@/pages/CompetitionsSummary';
import CompetitionEditor from '@/pages/CompetitionEditor';
import CompetitionParticipants from '@/pages/CompetitionParticipants';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { MemberDetailProvider } from '@/contexts/MemberDetailContext';
import MemberDetailCard from '@/components/MemberDetailCard';

// Composant pour afficher le loading initial
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-lg font-medium text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

// Composant principal de l'application (après authentification)
const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>ALJ Escalade Jonage</title>
        <meta name="description" content="Application web du club d'escalade ALJ Escalade Jonage - Compétitions, planning et bénévoles" />
      </Helmet>
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<News />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/competitions/new" element={<CompetitionEditor />} />
          <Route path="/competitions/edit/:id" element={<CompetitionEditor />} />
          <Route path="/competitions/participants/:id" element={<CompetitionParticipants />} />
          <Route path="/competitions-summary" element={<CompetitionsSummary />} />
          <Route path="/inscriptions-summary" element={<InscriptionsSummary />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/session-log" element={<SessionLog />} />
          <Route path="/pedagogy" element={<Pedagogy />} />
          <Route path="/members" element={<Members />} />
          <Route path="/inscriptions" element={<Inscriptions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/site-settings" element={<SiteSettings />} />
          <Route path="/annual-summary" element={<AnnualSummary />} />
          <Route path="/admin-management" element={<AdminManagement />} />
          <Route path="/image-admin" element={<ImageAdmin />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/competitor-summary/:memberId" element={<CompetitorSummary />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
      <MemberDetailCard />
    </div>
  );
};

function App() {
  // Log de débogage pour vérifier que React fonctionne
  console.log('⚛️ Composant App monté avec succès');
  console.log('🔧 React Router configuré pour GitHub Pages');
  
  return (
    <Router basename="/ALJ_Jonage_Escalade">
      <AuthProvider>
        <ConfigProvider>
          <MemberDetailProvider>
            <AppContent />
          </MemberDetailProvider>
        </ConfigProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
