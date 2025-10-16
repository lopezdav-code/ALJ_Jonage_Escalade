import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import MemberForm from '@/components/MemberForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { uploadMemberPhoto } from '@/lib/memberStorageUtils';

const MemberEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Get the tab to return to from navigation state
  const fromTab = location.state?.fromTab;

  const navigateToVolunteers = () => {
    const url = fromTab ? `/volunteers?tab=${encodeURIComponent(fromTab)}` : '/volunteers';
    navigate(url);
  };

  useEffect(() => {
    const fetchMember = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('secure_members')
        .select(`
          *,
          emergency_contact_1:emergency_contact_1_id(id, first_name, last_name, phone),
          emergency_contact_2:emergency_contact_2_id(id, first_name, last_name, phone)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur chargement membre:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les informations du membre",
          variant: "destructive",
        });
        navigateToVolunteers();
        return;
      }

      setMember(data);
      setLoading(false);
    };

    if (id) {
      fetchMember();
    }
  }, [id, navigate, toast]);

  const uploadImage = async (file, memberData) => {
    const result = await uploadMemberPhoto(file, {
      first_name: memberData.first_name,
      last_name: memberData.last_name
    });

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de l\'upload de l\'image');
    }

    return result.filePath;
  };

  const handleSave = async (memberData, newImageFile) => {
    setIsSaving(true);
    try {
      let photo_url = memberData.photo_url;

      if (newImageFile) {
        photo_url = await uploadImage(newImageFile, memberData);
      } else if (memberData.photo_url === null) {
        photo_url = null;
      }

      const {
        profiles,
        dynamic_roles,
        isEmergencyContactFor,
        emergency_contact_1,
        emergency_contact_2,
        ...dataToSave
      } = { ...memberData, photo_url };

      if (dataToSave.passeport === '') {
        dataToSave.passeport = null;
      }
      if (dataToSave.sexe === '') {
        dataToSave.sexe = null;
      }

      const { error } = await supabase
        .from('members')
        .update(dataToSave)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Membre modifié avec succès",
      });

      // Stay on the page instead of navigating back
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

  const handleCancel = () => {
    navigateToVolunteers();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center">
        <p>Membre non trouvé</p>
        <Button onClick={() => navigateToVolunteers()} className="mt-4">
          Retour aux adhérents
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Helmet>
        <title>Modifier {member.first_name} {member.last_name} - Club d'Escalade</title>
      </Helmet>

      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigateToVolunteers()}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux adhérents
        </Button>
        <h1 className="text-xl font-bold">
          Modifier {member.first_name} {member.last_name}
        </h1>
      </div>

      <MemberForm
        member={member}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
      />
    </div>
  );
};

export default MemberEdit;
