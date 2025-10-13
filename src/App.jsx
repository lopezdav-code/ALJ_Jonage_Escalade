
import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from '@/components/ui/helmet';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
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
import Members from '@/pages/Members';
import Contact from '@/pages/Contact';

// Pages chargées paresseusement (code-splitting)
const SessionLog = lazy(() => import('@/pages/SessionLog'));
const CycleManagement = lazy(() => import('@/pages/CycleManagement'));
const CycleDetail = lazy(() => import('@/pages/CycleDetail'));
const Pedagogy = lazy(() => import('@/pages/Pedagogy'));
const SiteSettings = lazy(() => import('@/pages/SiteSettings'));
const AnnualSummary = lazy(() => import('@/pages/AnnualSummary'));
const AdminManagement = lazy(() => import('@/pages/AdminManagement'));
const Inscriptions = lazy(() => import('@/pages/Inscriptions'));
const ImageAdmin = lazy(() => import('@/pages/ImageAdmin'));
const Setup = lazy(() => import('@/pages/Setup'));
const CompetitorSummary = lazy(() => import('@/pages/CompetitorSummary'));
const InscriptionsSummary = lazy(() => import('@/pages/InscriptionsSummary'));
const CompetitionsSummary = lazy(() => import('@/pages/CompetitionsSummary'));
const CompetitionEditor = lazy(() => import('@/pages/CompetitionEditor'));
const ConnectionLogs = lazy(() => import('@/pages/ConnectionLogs'));
const AccessLogs = lazy(() => import('@/pages/AccessLogs'));
const CompetitionParticipants = lazy(() => import('@/pages/CompetitionParticipants'));
const PasseportValidation = lazy(() => import('@/pages/PasseportValidation'));
const PasseportViewer = lazy(() => import('@/pages/PasseportViewer'));
const PasseportGuide = lazy(() => import('@/pages/PasseportGuide'));
const TestImages = lazy(() => import('@/pages/TestImages'));
const MemberEdit = lazy(() => import('@/pages/MemberEdit'));
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { MemberDetailProvider, useMemberDetail } from '@/contexts/MemberDetailContext';
import { supabase } from '@/lib/customSupabaseClient';
import MemberDetailCard from '@/components/MemberDetailCard';
import MemberForm from '@/components/MemberForm';
import { uploadMemberPhoto } from '@/lib/memberStorageUtils';

// Composant pour afficher le loading initial
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-lg font-medium text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

// Composant wrapper pour les routes lazy
const LazyRoute = ({ children }) => (
  <Suspense fallback={<LoadingScreen />}>
    {children}
  </Suspense>
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
          <Route path="/competitions/new" element={<LazyRoute><CompetitionEditor /></LazyRoute>} />
          <Route path="/competitions/edit/:id" element={<LazyRoute><CompetitionEditor /></LazyRoute>} />
          <Route path="/competitions/participants/:id" element={<LazyRoute><CompetitionParticipants /></LazyRoute>} />
          <Route path="/competitions-summary" element={<LazyRoute><CompetitionsSummary /></LazyRoute>} />
          <Route path="/inscriptions-summary" element={<LazyRoute><InscriptionsSummary /></LazyRoute>} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/member-edit/:id" element={<LazyRoute><MemberEdit /></LazyRoute>} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/session-log" element={<LazyRoute><SessionLog /></LazyRoute>} />
          <Route path="/cycles" element={<LazyRoute><CycleManagement /></LazyRoute>} />
          <Route path="/cycles/:id" element={<LazyRoute><CycleDetail /></LazyRoute>} />
          <Route path="/pedagogy" element={<LazyRoute><Pedagogy /></LazyRoute>} />
          <Route path="/members" element={<Members />} />
          <Route path="/inscriptions" element={<LazyRoute><Inscriptions /></LazyRoute>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/site-settings" element={<LazyRoute><SiteSettings /></LazyRoute>} />
          <Route path="/annual-summary" element={<LazyRoute><AnnualSummary /></LazyRoute>} />
          <Route path="/admin-management" element={<LazyRoute><AdminManagement /></LazyRoute>} />
          <Route path="/image-admin" element={<LazyRoute><ImageAdmin /></LazyRoute>} />
          <Route path="/setup" element={<LazyRoute><Setup /></LazyRoute>} />
          <Route path="/competitor-summary/:memberId" element={<LazyRoute><CompetitorSummary /></LazyRoute>} />
          <Route path="/connection-logs" element={<LazyRoute><ConnectionLogs /></LazyRoute>} />
          <Route path="/access-logs" element={<LazyRoute><AccessLogs /></LazyRoute>} />
          <Route path="/passeport-validation" element={<LazyRoute><PasseportValidation /></LazyRoute>} />
          <Route path="/passeport-viewer" element={<LazyRoute><PasseportViewer /></LazyRoute>} />
          <Route path="/passeport-guide" element={<LazyRoute><PasseportGuide /></LazyRoute>} />
          <Route path="/test-images" element={<LazyRoute><TestImages /></LazyRoute>} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
      <MemberDetailCard />
    </div>
  );
};

function App() {
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
