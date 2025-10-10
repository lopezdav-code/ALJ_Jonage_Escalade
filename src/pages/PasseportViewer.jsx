import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Calendar, User as UserIcon, FileText, Loader2, Award, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatName } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const PasseportViewer = () => {
  const { isAdmin, isAdherent } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [validations, setValidations] = useState([]);
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .not('passeport', 'is', null)
        .order('last_name')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des membres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchValidations = async (memberId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('passeport_validations')
        .select('*')
        .eq('member_id', memberId)
        .order('date_validation', { ascending: false });

      if (error) throw error;
      setValidations(data || []);
      
      if (data && data.length > 0) {
        setSelectedValidation(data[0]);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les validations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (memberId) => {
    const member = members.find(m => m.id === memberId);
    setSelectedMember(member);
    setValidations([]);
    setSelectedValidation(null);
    if (member) {
      fetchValidations(memberId);
    }
  };

  const getPasseportColor = (type) => {
    const colors = {
      blanc: 'from-blue-500 to-blue-600',
      jaune: 'from-yellow-500 to-yellow-600',
      orange: 'from-orange-500 to-orange-600',
      rouge: 'from-red-500 to-red-600',
    };
    return colors[type?.toLowerCase()] || 'from-gray-500 to-gray-600';
  };

  const getPasseportBadgeColor = (type) => {
    const colors = {
      blanc: 'bg-white border-2 border-gray-400 text-gray-800',
      jaune: 'bg-yellow-400 text-gray-900',
      orange: 'bg-orange-500 text-white',
      rouge: 'bg-red-500 text-white',
    };
    return colors[type?.toLowerCase()] || 'bg-gray-400 text-white';
  };

  if (!isAdherent && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Accès réservé aux membres du club</p>
      </div>
    );
  }

  if (loading && !selectedMember) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedValidation) {
    const competencesEntries = Object.entries(selectedValidation.competences || {});
    const validatedCount = competencesEntries.filter(([_, value]) => value === true).length;
    const totalCount = competencesEntries.length;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => setSelectedValidation(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>

        <Card>
          <CardHeader className={`bg-gradient-to-r ${getPasseportColor(selectedValidation.passeport_type)} text-white`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Award className="w-8 h-8" />
                Passeport {selectedValidation.passeport_type.charAt(0).toUpperCase() + selectedValidation.passeport_type.slice(1)}
              </CardTitle>
              <Badge className={getPasseportBadgeColor(selectedValidation.passeport_type)}>
                {validatedCount}/{totalCount} compétences
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Informations du grimpeur */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Informations du grimpeur</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom</p>
                  <p className="font-medium">{selectedMember.last_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prénom</p>
                  <p className="font-medium">{selectedMember.first_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date de naissance</p>
                  <p className="font-medium">
                    {selectedMember.date_of_birth 
                      ? new Date(selectedMember.date_of_birth).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Club</p>
                  <p className="font-medium">Association Lyonnaise de Jonage Escalade</p>
                </div>
              </div>
            </div>

            {/* Informations de validation */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date de validation</p>
                    <p className="font-semibold">
                      {new Date(selectedValidation.date_validation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Validateur</p>
                    <p className="font-semibold">{selectedValidation.validateur}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compétences validées */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Compétences validées</h3>
              <div className="space-y-3">
                {competencesEntries.map(([key, isValidated], index) => (
                  <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isValidated ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {isValidated && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`flex-1 ${isValidated ? 'text-green-700' : 'text-gray-500'}`}>
                      Compétence {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Observations */}
            {selectedValidation.observations && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Observations</h3>
                    <p className="text-sm text-gray-700">{selectedValidation.observations}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Award className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold headline">Consultation des Passeports</h1>
          <p className="text-muted-foreground">Consultez les passeports validés des membres</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Sélectionner un membre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="member-select">Choisir un membre</Label>
            <Select onValueChange={handleMemberSelect} value={selectedMember?.id || ''}>
              <SelectTrigger id="member-select" className="w-full">
                <SelectValue placeholder="Sélectionner un membre..." />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Badge className={getPasseportBadgeColor(member.passeport?.toLowerCase())}>
                        {member.passeport}
                      </Badge>
                      <span>{member.last_name} {member.first_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMember && validations.length > 0 && (
            <div>
              <Label htmlFor="validation-select">Historique des validations</Label>
              <Select 
                onValueChange={(id) => setSelectedValidation(validations.find(v => v.id === id))} 
                value={selectedValidation?.id || ''}
              >
                <SelectTrigger id="validation-select" className="w-full">
                  <SelectValue placeholder="Sélectionner une validation..." />
                </SelectTrigger>
                <SelectContent>
                  {validations.map((validation) => (
                    <SelectItem key={validation.id} value={validation.id}>
                      Passeport {validation.passeport_type} - {new Date(validation.date_validation).toLocaleDateString('fr-FR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedMember && validations.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune validation enregistrée pour ce membre</p>
            </div>
          )}

          {loading && selectedMember && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasseportViewer;
