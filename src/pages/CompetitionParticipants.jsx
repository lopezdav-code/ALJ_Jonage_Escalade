import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Search, Save, X, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useMemberDetail } from '@/contexts/MemberDetailContext';
import ParticipantsDisplay from '@/components/ParticipantsDisplay';

const CompetitionParticipants = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { showMemberDetails } = useMemberDetail();

  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('Competiteur');
  const [saving, setSaving] = useState(false);

  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // Nouveaux filtres
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSexe, setSelectedSexe] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);

  const roles = ['Competiteur', 'Coach', 'Arbitre', 'Organisateur'];
  const sexeOptions = ['Homme', 'Femme'];

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Charger la compétition
        const { data: compData, error: compError } = await supabase
          .from('competitions')
          .select('*')
          .eq('id', id)
          .single();

        if (compError) throw compError;
        setCompetition(compData);

        // Charger les participants existants
        const { data: rawParticipants, error: participantsError } = await supabase
          .from('competition_participants')
          .select('*')
          .eq('competition_id', id)
          .order('role')
          .order('created_at');

        if (participantsError) throw participantsError;

        // Si on a des participants, récupérer les données des membres
        let enrichedParticipants = [];
        if (rawParticipants && rawParticipants.length > 0) {
          const memberIds = rawParticipants.map(p => p.member_id);
          const { data: membersData, error: membersError } = await supabase
            .from('secure_members')
            .select('*')
            .in('id', memberIds);

          if (membersError) throw membersError;

          // Associer les membres aux participants
          enrichedParticipants = rawParticipants.map(participant => ({
            ...participant,
            members: membersData?.find(member => member.id === participant.member_id) || null
          }));
        }

        setParticipants(enrichedParticipants);

        // Charger tous les membres
        const { data: membersData, error: membersError } = await supabase
          .from('secure_members')
          .select('*')
          .order('last_name');

        if (membersError) throw membersError;
        setAllMembers(membersData || []);
        setFilteredMembers(membersData || []);

        // Extraire les catégories uniques des membres
        const categories = [...new Set(membersData?.map(member => member.category).filter(Boolean))];
        setAvailableCategories(categories.sort());

        // Par défaut, toutes les catégories sont sélectionnées
        setSelectedCategories(categories);

      } catch (error) {
        console.error('Error loading data:', error);
        toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, toast]);

  // Filtrer les membres
  useEffect(() => {
    let filtered = allMembers;

    // Exclure les membres déjà participants
    const participantMemberIds = participants.map(p => p.member_id);
    filtered = filtered.filter(member => !participantMemberIds.includes(member.id));

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(member =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par catégories sélectionnées
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(member =>
        selectedCategories.includes(member.category)
      );
    }

    // Filtrer par sexe
    if (selectedSexe) {
      filtered = filtered.filter(member => member.sexe === selectedSexe);
    }

    setFilteredMembers(filtered);
  }, [allMembers, participants, searchTerm, selectedCategories, selectedSexe]);

  // Ajouter des participants
  const handleAddParticipants = async () => {
    if (selectedMembers.length === 0) {
      toast({ title: "Attention", description: "Veuillez sélectionner au moins un membre." });
      return;
    }

    setSaving(true);
    try {
      const participantsToAdd = selectedMembers.map(memberId => ({
        competition_id: id,
        member_id: memberId,
        role: selectedRole
      }));

      const { error } = await supabase
        .from('competition_participants')
        .insert(participantsToAdd);

      if (error) throw error;

      toast({ title: "Succès", description: `${selectedMembers.length} participant(s) ajouté(s).` });

      // Recharger les participants avec le même pattern que le chargement initial
      const { data: rawParticipants, error: reloadError } = await supabase
        .from('competition_participants')
        .select('*')
        .eq('competition_id', id)
        .order('role')
        .order('created_at');

      if (reloadError) {
        console.error('Error reloading participants:', reloadError);
      } else if (rawParticipants && rawParticipants.length > 0) {
        const memberIds = rawParticipants.map(p => p.member_id);
        const { data: membersData, error: membersError } = await supabase
          .from('secure_members')
          .select('*')
          .in('id', memberIds);

        if (membersError) {
          console.error('Error loading members:', membersError);
        } else {
          // Associer les membres aux participants
          const enrichedParticipants = rawParticipants.map(participant => ({
            ...participant,
            members: membersData?.find(member => member.id === participant.member_id) || null
          }));
          setParticipants(enrichedParticipants);
        }
      }

      setSelectedMembers([]);

    } catch (error) {
      console.error('Error adding participants:', error);
      toast({ title: "Erreur", description: "Impossible d'ajouter les participants.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer un participant
  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce participant ?')) return;

    try {
      const { error } = await supabase
        .from('competition_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      setParticipants(prev => prev.filter(p => p.id !== participantId));
      toast({ title: "Succès", description: "Participant retiré de la compétition." });

    } catch (error) {
      console.error('Error removing participant:', error);
      toast({ title: "Erreur", description: "Impossible de retirer le participant.", variant: "destructive" });
    }
  };

  // Toggle catégorie
  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  // Sélectionner/désélectionner toutes les catégories
  const toggleAllCategories = () => {
    if (selectedCategories.length === availableCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...availableCategories]);
    }
  };

  // Toggle sélection membre
  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center py-8">Chargement...</div>;
  }

  if (!competition) {
    return <div className="text-center py-8">Compétition non trouvée.</div>;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <BackButton to={`/competitions/detail/${id}`}>
          Retour à la compétition
        </BackButton>
        <div>
          <h1 className="text-2xl font-bold">{competition.name}</h1>
          <p className="text-muted-foreground">Gestion des participants</p>
        </div>
      </div>

      {/* Section Participants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({participants.length})
            </CardTitle>

            {/* Edit mode toggle */}
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (selectedParticipants.length === 0) return;

                      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedParticipants.length} participant(s) ?`)) return;

                      try {
                        const { error } = await supabase
                          .from('competition_participants')
                          .delete()
                          .in('id', selectedParticipants);

                        if (error) throw error;

                        setParticipants(prev => prev.filter(p => !selectedParticipants.includes(p.id)));
                        setSelectedParticipants([]);
                        setEditMode(false);
                        toast({ title: "Succès", description: `${selectedParticipants.length} participant(s) supprimé(s).` });
                      } catch (error) {
                        console.error('Error removing participants:', error);
                        toast({ title: "Erreur", description: "Impossible de supprimer les participants.", variant: "destructive" });
                      }
                    }}
                    disabled={selectedParticipants.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer ({selectedParticipants.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditMode(false);
                      setSelectedParticipants([]);
                    }}
                  >
                    Annuler
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Mode édition
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ParticipantsDisplay
            participants={participants}
            onParticipantClick={showMemberDetails}
            compact={false}
            editMode={editMode}
            selectedIds={selectedParticipants}
            onSelectionChange={setSelectedParticipants}
          />
        </CardContent>
      </Card>

      {/* Section d'ajout de participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ajouter des participants</span>
            <Badge variant="outline">
              {filteredMembers.length} membre(s) disponible(s)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Rechercher un membre</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Nom, prénom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Rôle à attribuer</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtres par catégorie */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Catégories</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllCategories}
                  className="text-xs"
                >
                  {selectedCategories.length === availableCategories.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map(category => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Filtre par sexe */}
            <div>
              <Label>Sexe</Label>
              <Select value={selectedSexe} onValueChange={setSelectedSexe}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  {sexeOptions.map(sexe => (
                    <SelectItem key={sexe} value={sexe}>{sexe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMembers.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-600">
                    {selectedMembers.length} membre(s) sélectionné(s)
                  </Badge>
                  <span className="text-sm text-blue-700">
                    sur {filteredMembers.length} disponible(s)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMembers([])}
                  className="text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                >
                  <X className="w-3 h-3 mr-1" />
                  Tout désélectionner
                </Button>
              </div>
            )}
          </div>

          {/* Liste des membres disponibles */}
          <div className="space-y-2">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || selectedCategories.length < availableCategories.length || selectedSexe
                  ? 'Aucun membre trouvé avec ces filtres.'
                  : 'Tous les membres sont déjà participants.'}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* En-tête du tableau */}
                <div className="bg-primary text-primary-foreground">
                  <div className="grid grid-cols-12 gap-4 p-3 font-medium">
                    <div className="col-span-1 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                        onChange={() => {
                          if (selectedMembers.length === filteredMembers.length) {
                            setSelectedMembers([]);
                          } else {
                            setSelectedMembers(filteredMembers.map(m => m.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="col-span-3">Nom</div>
                    <div className="col-span-3">Prénom</div>
                    <div className="col-span-2">Licence</div>
                    <div className="col-span-3">Catégorie</div>
                  </div>
                </div>

                {/* Corps du tableau */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredMembers
                    .sort((a, b) => a.last_name.localeCompare(b.last_name))
                    .map((member, index) => (
                      <div
                        key={member.id}
                        className={`grid grid-cols-12 gap-4 p-3 border-b cursor-pointer transition-colors ${selectedMembers.includes(member.id)
                          ? 'bg-blue-50 border-blue-200'
                          : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          } hover:bg-blue-100`}
                        onClick={() => toggleMemberSelection(member.id)}
                      >
                        <div className="col-span-1 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => toggleMemberSelection(member.id)}
                            className="w-4 h-4"
                          />
                        </div>
                        <div className="col-span-3 font-medium">
                          {member.last_name?.toUpperCase() || ''}
                        </div>
                        <div className="col-span-3">
                          {member.first_name || ''}
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {member.licence || '-'}
                        </div>
                        <div className="col-span-3">
                          <Badge
                            variant={selectedMembers.includes(member.id) ? "default" : "outline"}
                            className="text-xs"
                          >
                            {member.category || '-'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              onClick={handleAddParticipants}
              disabled={selectedMembers.length === 0 || saving}
            >
              {saving && <Save className="w-4 h-4 mr-2 animate-spin" />}
              Ajouter {selectedMembers.length > 0 && `(${selectedMembers.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionParticipants;
