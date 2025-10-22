import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, User, Mail, Phone, Award, Shield, FileText, Calendar, Users, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMemberViewPermissions } from '@/hooks/useMemberViewPermissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberPhotoUrl } from '@/lib/memberStorageUtils';
import { Badge } from '@/components/ui/badge';

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value}</p>
      </div>
    </div>
  );
};

const MemberView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { loading: authLoading } = useAuth();
  const { canViewDetail, loading: permissionsLoading } = useMemberViewPermissions();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState({ contact1: null, contact2: null });
  const [isEmergencyContactFor, setIsEmergencyContactFor] = useState([]);

  // Get the tab to return to from navigation state
  const fromTab = location.state?.fromTab;

  const navigateToVolunteers = () => {
    const url = fromTab ? `/volunteers?tab=${encodeURIComponent(fromTab)}` : '/volunteers';
    navigate(url);
  };

  useEffect(() => {
    // Only fetch when permissions are loaded
    if (authLoading || permissionsLoading) return;

    // Check permission
    if (!canViewDetail) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas la permission de consulter les détails des membres.",
        variant: "destructive",
      });
      navigateToVolunteers();
      return;
    }

    const fetchMember = async () => {
      setLoading(true);

      try {
        // Fetch member data
        const { data, error } = await supabase
          .from('secure_members')
          .select('*')
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

        // Fetch emergency contacts if they exist
        if (data.emergency_contact_1_id || data.emergency_contact_2_id) {
          const contactIds = [data.emergency_contact_1_id, data.emergency_contact_2_id].filter(Boolean);
          const { data: contacts } = await supabase
            .from('secure_members')
            .select('id, first_name, last_name, phone, email')
            .in('id', contactIds);

          if (contacts) {
            const contact1 = contacts.find(c => c.id === data.emergency_contact_1_id);
            const contact2 = contacts.find(c => c.id === data.emergency_contact_2_id);
            setEmergencyContacts({ contact1, contact2 });
          }
        }

        // Fetch members for whom this person is an emergency contact
        const { data: contactFor } = await supabase
          .from('secure_members')
          .select('id, first_name, last_name')
          .or(`emergency_contact_1_id.eq.${id},emergency_contact_2_id.eq.${id}`);

        if (contactFor) {
          setIsEmergencyContactFor(contactFor);
        }

        // Get photo URL if exists
        if (data.photo_url) {
          const url = await getMemberPhotoUrl(data.photo_url);
          setPhotoUrl(url);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des données",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMember();
    }
  }, [id, canViewDetail, authLoading, permissionsLoading]);

  if (loading || authLoading || permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center p-8">
        <p className="text-lg text-muted-foreground mb-4">Membre non trouvé</p>
        <Button onClick={() => navigateToVolunteers()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux adhérents
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Helmet>
        <title>{member.first_name} {member.last_name} - Club d'Escalade</title>
      </Helmet>

      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigateToVolunteers()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux adhérents
        </Button>
      </div>

      {/* Header with photo and name */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={photoUrl} alt={`${member.first_name} ${member.last_name}`} />
              <AvatarFallback>
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl mb-2">
                {member.first_name} {member.last_name}
              </CardTitle>
              {member.title && (
                <Badge variant="secondary" className="text-base">
                  {member.title}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={User} label="Sexe" value={member.sexe === 'H' ? 'Homme' : member.sexe === 'F' ? 'Femme' : null} />
            <InfoRow icon={Users} label="Catégorie" value={member.category} />
            <InfoRow icon={Users} label="Sous-groupe" value={member.sub_group} />
            <InfoRow icon={FileText} label="Licence" value={member.licence} />
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Mail} label="Email" value={member.email} />
            <InfoRow icon={Phone} label="Téléphone" value={member.phone} />
          </CardContent>
        </Card>

        {/* Escalade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Escalade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Award} label="Passeport" value={member.passeport} />
            {member.brevet_federaux && member.brevet_federaux.length > 0 && (
              <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Brevets fédéraux</p>
                <div className="flex flex-wrap gap-2">
                  {member.brevet_federaux.map((brevet, index) => (
                    <Badge key={index} variant="outline">
                      {brevet}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency contacts */}
        {(emergencyContacts.contact1 || emergencyContacts.contact2) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Contacts d'urgence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {emergencyContacts.contact1 && (
                <div className="pb-3 border-b last:border-b-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Contact 1</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/member-view/${emergencyContacts.contact1.id}`, { state: { fromTab } })}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Voir la fiche
                    </Button>
                  </div>
                  <p className="text-base font-semibold mb-1">{emergencyContacts.contact1.first_name} {emergencyContacts.contact1.last_name}</p>
                  <div className="space-y-1">
                    {emergencyContacts.contact1.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{emergencyContacts.contact1.phone}</span>
                      </div>
                    )}
                    {emergencyContacts.contact1.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{emergencyContacts.contact1.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {emergencyContacts.contact2 && (
                <div className="pb-3 border-b last:border-b-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Contact 2</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/member-view/${emergencyContacts.contact2.id}`, { state: { fromTab } })}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Voir la fiche
                    </Button>
                  </div>
                  <p className="text-base font-semibold mb-1">{emergencyContacts.contact2.first_name} {emergencyContacts.contact2.last_name}</p>
                  <div className="space-y-1">
                    {emergencyContacts.contact2.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{emergencyContacts.contact2.phone}</span>
                      </div>
                    )}
                    {emergencyContacts.contact2.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{emergencyContacts.contact2.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Is emergency contact for */}
        {isEmergencyContactFor.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Contact d'urgence pour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {isEmergencyContactFor.map((person) => (
                  <Button
                    key={person.id}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/member-view/${person.id}`, { state: { fromTab } })}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-3 h-3" />
                    {person.first_name} {person.last_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MemberView;
