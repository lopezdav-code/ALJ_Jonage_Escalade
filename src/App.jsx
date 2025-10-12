
import React, { useState } from 'react';
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
import SessionLog from '@/pages/SessionLog';
import CycleManagement from '@/pages/CycleManagement';
import CycleDetail from '@/pages/CycleDetail';
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
import ConnectionLogs from '@/pages/ConnectionLogs';
import AccessLogs from '@/pages/AccessLogs';
import CompetitionParticipants from '@/pages/CompetitionParticipants';
import PasseportValidation from '@/pages/PasseportValidation';
import PasseportViewer from '@/pages/PasseportViewer';
import PasseportGuide from '@/pages/PasseportGuide';
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

// Composant wrapper pour MemberForm avec contexte
const MemberFormWrapper = () => {
  const { isFormVisible, editingMember, closeEditForm } = useMemberDetail();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const uploadImage = async (file, memberData) => {
    // Utiliser le nouvel utilitaire Supabase Storage avec RLS
    const result = await uploadMemberPhoto(file, {
      first_name: memberData.first_name,
      last_name: memberData.last_name
    });

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de l\'upload de l\'image');
    }

    return result.url;
  };

  const handleSave = async (memberData, newImageFile) => {
    setIsSaving(true);
    try {
      let photo_url = memberData.photo_url;
      
      // Gestion de l'upload d'image si nécessaire
      if (newImageFile) {
        photo_url = await uploadImage(newImageFile, memberData);
      } else if (memberData.photo_url === null) {
        photo_url = null;
      }
      
      // Préparer les données à sauvegarder en excluant les propriétés qui ne sont pas dans la table members
      const { 
        profiles, 
        dynamic_roles, 
        isEmergencyContactFor, 
        emergency_contact_1, 
        emergency_contact_2, 
        ...dataToSave 
      } = { ...memberData, photo_url };

      // Sauvegarder en base de données
      const { error } = await supabase
        .from('members')
        .update(dataToSave)
        .eq('id', editingMember.id);
        
      if (error) throw error;

      toast({
        title: "Succès",
        description: "Membre modifié avec succès",
      });
      
      closeEditForm();
      
      // Recharger les données si on est sur une page qui en a besoin
      window.location.reload(); // Solution simple pour rafraîchir les données
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du membre",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isFormVisible || !editingMember) {
    return null;
  }

  return (
    <MemberForm
      member={editingMember}
      onSave={handleSave}
      onCancel={closeEditForm}
      isSaving={isSaving}
    />
  );
};
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
          <Route path="/cycles" element={<CycleManagement />} />
          <Route path="/cycles/:id" element={<CycleDetail />} />
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
          <Route path="/connection-logs" element={<ConnectionLogs />} />
          <Route path="/access-logs" element={<AccessLogs />} />
          <Route path="/passeport-validation" element={<PasseportValidation />} />
          <Route path="/passeport-viewer" element={<PasseportViewer />} />
          <Route path="/passeport-guide" element={<PasseportGuide />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
      <MemberDetailCard />
      <MemberFormWrapper />
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
