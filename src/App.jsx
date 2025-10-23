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
import Contact from '@/pages/Contact';

// Pages chargées paresseusement (code-splitting)
const SessionLog = lazy(() => import('@/pages/SessionLog'));
const SessionEdit = lazy(() => import('@/pages/SessionEdit'));
const SessionLogDetail = lazy(() => import('@/pages/SessionLogDetail'));
const SessionCommentsEdit = lazy(() => import('@/pages/SessionCommentsEdit'));
const CycleManagement = lazy(() => import('@/pages/CycleManagement'));
const CycleDetail = lazy(() => import('@/pages/CycleDetail'));
const Pedagogy = lazy(() => import('@/pages/Pedagogy'));
const PedagogyEditor = lazy(() => import('@/pages/PedagogyEditor'));
const SiteSettings = lazy(() => import('@/pages/SiteSettings'));
const AnnualSummary = lazy(() => import('@/pages/AnnualSummary'));
const AdminManagement = lazy(() => import('@/pages/AdminManagement'));
const Inscriptions = lazy(() => import('@/pages/Inscriptions'));
const ImageAdmin = lazy(() => import('@/pages/ImageAdmin'));
const Setup = lazy(() => import('@/pages/Setup'));
const InscriptionsSummary = lazy(() => import('@/pages/InscriptionsSummary'));
const CompetitionsSummary = lazy(() => import('@/pages/CompetitionsSummary'));
const CompetitionEditor = lazy(() => import('@/pages/CompetitionEditor'));
const CompetitionDetail = lazy(() => import('@/pages/CompetitionDetail'));
const UserRoles = lazy(() => import('@/pages/UserRoles'));
const Permissions = lazy(() => import('@/pages/Permissions'));
const ConnectionLogs = lazy(() => import('@/pages/ConnectionLogs'));
const AccessLogs = lazy(() => import('@/pages/AccessLogs'));
const CompetitionParticipants = lazy(() => import('@/pages/CompetitionParticipants'));
const CompetitionResultsEditor = lazy(() => import('@/pages/CompetitionResultsEditor'));
const DatabaseSchema = lazy(() => import('@/pages/DatabaseSchema'));
const PasseportValidation = lazy(() => import('@/pages/PasseportValidation'));
const PasseportViewer = lazy(() => import('@/pages/PasseportViewer'));
const PasseportGuide = lazy(() => import('@/pages/PasseportGuide'));
const TestImages = lazy(() => import('@/pages/TestImages'));
const MemberScheduleTest = lazy(() => import('@/pages/MemberScheduleTest'));
const GroupeAdmin = lazy(() => import('@/pages/GroupeAdmin'));
const MemberEdit = lazy(() => import('@/pages/MemberEdit'));
const MemberView = lazy(() => import('@/pages/MemberView'));
const NewsEdit = lazy(() => import('@/pages/news_edit')); // Import NewsEdit
const AttendanceRecap = lazy(() => import('@/pages/AttendanceRecap'));
const ScheduleAdmin = lazy(() => import('@/pages/ScheduleAdmin'));
const ScheduleEdit = lazy(() => import('@/pages/ScheduleEdit'));
const MemberGroupTest = lazy(() => import('@/pages/MemberGroupTest'));
const BureauManagement = lazy(() => import('@/pages/BureauManagement'));

import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { MemberDetailProvider, useMemberDetail } from '@/contexts/MemberDetailContext';
import { supabase } from '@/lib/customSupabaseClient';
import MemberDetailCard from '@/components/MemberDetailCard';
import MemberForm from '@/components/MemberForm';
import { uploadMemberPhoto } from '@/lib/memberStorageUtils';

// Client-side redirect for dev environment
if (window.location.pathname === '/ALJ_Jonage_Escalade') {
  window.location.pathname = '/ALJ_Jonage_Escalade/';
}

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
        <meta name="description" content="Application web du club d'escalade ALJ Escalade Jonage - Compétitions, planning et adhérents" />
      </Helmet>
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<News />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/news/new" element={<LazyRoute><NewsEdit /></LazyRoute>} /> {/* Route for creating new news */}
          <Route path="/news/edit/:id" element={<LazyRoute><NewsEdit /></LazyRoute>} /> {/* Route for editing existing news */}
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/competitions/detail/:id" element={<LazyRoute><CompetitionDetail /></LazyRoute>} />
          <Route path="/competitions/new" element={<LazyRoute><CompetitionEditor /></LazyRoute>} />
          <Route path="/competitions/edit/:id" element={<LazyRoute><CompetitionEditor /></LazyRoute>} />
          <Route path="/competitions/participants/:id" element={<LazyRoute><CompetitionParticipants /></LazyRoute>} />
          <Route path="/competitions/results/:id" element={<LazyRoute><CompetitionResultsEditor /></LazyRoute>} />
          <Route path="/competitions-summary" element={<LazyRoute><CompetitionsSummary /></LazyRoute>} />
          <Route path="/inscriptions-summary" element={<LazyRoute><InscriptionsSummary /></LazyRoute>} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/member-edit/:id" element={<LazyRoute><MemberEdit /></LazyRoute>} />
          <Route path="/member-view/:id" element={<LazyRoute><MemberView /></LazyRoute>} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/schedule/admin" element={<LazyRoute><ScheduleAdmin /></LazyRoute>} />
          <Route path="/schedule/admin/new" element={<LazyRoute><ScheduleEdit /></LazyRoute>} />
          <Route path="/schedule/admin/edit/:id" element={<LazyRoute><ScheduleEdit /></LazyRoute>} />
          <Route path="/session-log" element={<LazyRoute><SessionLog /></LazyRoute>} />
          <Route path="/session-log/:id" element={<LazyRoute><SessionLogDetail /></LazyRoute>} /> {/* Route for viewing a specific session log detail */}
          <Route path="/session-log/new" element={<LazyRoute><SessionEdit /></LazyRoute>} />
          <Route path="/session-log/edit/:id" element={<LazyRoute><SessionEdit /></LazyRoute>} />
          <Route path="/session-log/:id/comments" element={<LazyRoute><SessionCommentsEdit /></LazyRoute>} /> {/* Route for editing session comments */}
          <Route path="/cycles" element={<LazyRoute><CycleManagement /></LazyRoute>} />
          <Route path="/cycles/:id" element={<LazyRoute><CycleDetail /></LazyRoute>} />
          <Route path="/pedagogy" element={<LazyRoute><Pedagogy /></LazyRoute>} />
          <Route path="/pedagogy/new" element={<LazyRoute><PedagogyEditor /></LazyRoute>} />
          <Route path="/pedagogy/edit/:id" element={<LazyRoute><PedagogyEditor /></LazyRoute>} />
          <Route path="/inscriptions" element={<LazyRoute><Inscriptions /></LazyRoute>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/site-settings" element={<LazyRoute><SiteSettings /></LazyRoute>} />
          <Route path="/annual-summary" element={<LazyRoute><AnnualSummary /></LazyRoute>} />
          <Route path="/admin-management" element={<LazyRoute><AdminManagement /></LazyRoute>} />
          <Route path="/user-roles" element={<LazyRoute><UserRoles /></LazyRoute>} />
          <Route path="/permissions" element={<LazyRoute><Permissions /></LazyRoute>} />
          <Route path="/image-admin" element={<LazyRoute><ImageAdmin /></LazyRoute>} />
          <Route path="/setup" element={<LazyRoute><Setup /></LazyRoute>} />
          <Route path="/connection-logs" element={<LazyRoute><ConnectionLogs /></LazyRoute>} />
          <Route path="/access-logs" element={<LazyRoute><AccessLogs /></LazyRoute>} />
          <Route path="/database-schema" element={<LazyRoute><DatabaseSchema /></LazyRoute>} />
          <Route path="/passeport-validation" element={<LazyRoute><PasseportValidation /></LazyRoute>} />
          <Route path="/passeport-viewer" element={<LazyRoute><PasseportViewer /></LazyRoute>} />
          <Route path="/passeport-guide" element={<LazyRoute><PasseportGuide /></LazyRoute>} />
          <Route path="/test-images" element={<LazyRoute><TestImages /></LazyRoute>} />
          <Route path="/member-schedule-test" element={<LazyRoute><MemberScheduleTest /></LazyRoute>} />
          <Route path="/member-group-test" element={<LazyRoute><MemberGroupTest /></LazyRoute>} />
          <Route path="/bureau-management" element={<LazyRoute><BureauManagement /></LazyRoute>} />
          <Route path="/groupes/admin" element={<LazyRoute><GroupeAdmin /></LazyRoute>} />
          <Route path="/attendance-recap" element={<LazyRoute><AttendanceRecap /></LazyRoute>} />
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
