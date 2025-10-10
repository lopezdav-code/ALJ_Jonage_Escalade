import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Award, Users, Loader2, Search, Filter, X, UserCheck, User, Eye } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import PasseportBlancForm from '@/components/PasseportBlancForm';
import PasseportJauneForm from '@/components/PasseportJauneForm';
import PasseportOrangeForm from '@/components/PasseportOrangeForm';

const PasseportValidation = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPasseportType, setSelectedPasseportType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // États pour les filtres
  const [selectedTitle, setSelectedTitle] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  const titles = [
    { value: 'all', label: 'Tous les membres' },
    { value: 'Loisir enfants', label: 'Loisir enfants' },
    { value: 'Loisir collége', label: 'Loisir collège' },
    { value: 'Loisir lycée', label: 'Loisir lycée' },
    { value: 'Loisir adulte', label: 'Loisir adulte' },
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    // Filtrer les membres selon le titre et la recherche
    let filtered = members;

    // Filtre par titre
    if (selectedTitle !== 'all') {
      filtered = filtered.filter(m => m.title === selectedTitle);
    }

    // Filtre par recherche (nom ou prénom)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m => 
        m.first_name?.toLowerCase().includes(query) ||
        m.last_name?.toLowerCase().includes(query) ||
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(query) ||
        `${m.last_name} ${m.first_name}`.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(filtered);
  }, [members, selectedTitle, searchQuery]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .in('title', ['Loisir enfants', 'Loisir collége', 'Loisir lycée', 'Loisir adulte'])
        .order('last_name')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
      setFilteredMembers(data || []);
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

  const handleMemberSelect = (memberId) => {
    const member = members.find(m => m.id === memberId);
    setSelectedMember(member);
    setOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedTitle('all');
    setSearchQuery('');
    setSelectedMember(null);
  };

  const handlePasseportTypeSelect = (type) => {
    setSelectedPasseportType(type);
    if (selectedMember && type) {
      setShowForm(true);
    }
  };

  const handleSaveValidation = async (formData) => {
    try {
      // Sauvegarder les données de validation du passeport
      const validationData = {
        member_id: selectedMember.id,
        passeport_type: selectedPasseportType.toLowerCase(),
        competences: formData.competences,
        date_validation: formData.dateValidation,
        validateur: formData.validateur,
        observations: formData.observations,
        module: formData.module || null, // Ajouter le module (bloc/difficulte) s'il existe
        validated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('passeport_validations')
        .insert(validationData);

      if (error) throw error;

      // Mettre à jour le passeport du membre dans la table members
      const { error: updateError } = await supabase
        .from('members')
        .update({ passeport: selectedPasseportType })
        .eq('id', selectedMember.id);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: `Le passeport ${selectedPasseportType.toLowerCase()} de ${selectedMember.first_name} ${selectedMember.last_name} a été validé.`,
      });

      setShowForm(false);
      setSelectedMember(null);
      setSelectedPasseportType('');
      fetchMembers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la validation",
        variant: "destructive",
      });
      console.error('Erreur de sauvegarde:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showForm && selectedMember && selectedPasseportType) {
    const formComponents = {
      'Blanc': PasseportBlancForm,
      'Jaune': PasseportJauneForm,
      'Orange': PasseportOrangeForm,
    };
    
    const FormComponent = formComponents[selectedPasseportType];
    
    return (
      <FormComponent
        member={selectedMember}
        onSave={handleSaveValidation}
        onCancel={() => {
          setShowForm(false);
          setSelectedMember(null);
          setSelectedPasseportType('');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Validation des Passeports - Club d'Escalade</title>
      </Helmet>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Award className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold headline">Validation des Passeports</h1>
            <p className="text-muted-foreground">Validez les passeports d'escalade de vos grimpeurs</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate('/passeport-viewer')}
        >
          <Eye className="w-4 h-4" />
          Consultation des Passeports
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres de recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtre par titre */}
          <div>
            <Label htmlFor="title-filter">Filtrer par catégorie</Label>
            <Select value={selectedTitle} onValueChange={setSelectedTitle}>
              <SelectTrigger id="title-filter" className="w-full">
                <SelectValue placeholder="Sélectionner une catégorie..." />
              </SelectTrigger>
              <SelectContent>
                {titles.map((title) => (
                  <SelectItem key={title.value} value={title.value}>
                    {title.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recherche avec autocomplétion */}
          <div>
            <Label>Rechercher un membre par nom ou prénom</Label>
            <p className="text-xs text-muted-foreground mb-2">
              {selectedTitle !== 'all' 
                ? "Recherchez dans la catégorie sélectionnée ou consultez la liste ci-dessous"
                : "Utilisez la recherche rapide ou sélectionnez une catégorie pour voir tous les membres"}
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedMember ? (
                        <span className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-green-600" />
                          {selectedMember.last_name} {selectedMember.first_name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Search className="w-4 h-4" />
                          Sélectionner un membre...
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Rechercher par nom ou prénom..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                      <CommandList>
                        <CommandGroup heading={`${filteredMembers.length} membre(s) trouvé(s)`}>
                          {filteredMembers.slice(0, 50).map((member) => (
                            <CommandItem
                              key={member.id}
                              value={`${member.last_name} ${member.first_name}`}
                              onSelect={() => handleMemberSelect(member.id)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {member.last_name} {member.first_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {member.title}
                                  </span>
                                </div>
                                {member.passeport && (
                                  <Badge variant="outline" className="ml-2">
                                    {member.passeport}
                                  </Badge>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {(selectedTitle !== 'all' || searchQuery || selectedMember) && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleResetFilters}
                  title="Réinitialiser les filtres"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Statistiques de filtrage */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {filteredMembers.length} membre(s) {selectedTitle !== 'all' && `en ${selectedTitle}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {selectedMember && (
        <Card className="border-2 border-primary/50">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Membre sélectionné
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-semibold">{selectedMember.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prénom</p>
                <p className="font-semibold">{selectedMember.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Catégorie</p>
                <Badge variant="outline">{selectedMember.title}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passeport actuel</p>
                <Badge className={selectedMember.passeport ? "bg-green-600" : "bg-gray-400"}>
                  {selectedMember.passeport || 'Aucun'}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="passeport-type">Type de passeport à valider</Label>
              <Select onValueChange={handlePasseportTypeSelect} value={selectedPasseportType}>
                <SelectTrigger id="passeport-type" className="w-full">
                  <SelectValue placeholder="Sélectionner un type de passeport..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Blanc">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-white border-2 border-gray-400 rounded-full"></div>
                      <span>Passeport Blanc - Moulinette autonome</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Jaune">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                      <span>Passeport Jaune - Grimpe en tête</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Orange">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      <span>Passeport Orange - Autonomie SAE</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedMember && filteredMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {selectedTitle !== 'all' ? (
                  <span>Membres - {titles.find(t => t.value === selectedTitle)?.label}</span>
                ) : (
                  <span>Tous les membres</span>
                )}
              </div>
              <Badge variant="secondary" className="text-lg">
                {filteredMembers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <Card
                  key={member.id}
                  className="cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-200 group"
                  onClick={() => handleMemberSelect(member.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {member.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.first_name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {member.title}
                          </Badge>
                          {member.passeport && (
                            <Badge 
                              className={cn(
                                "text-xs",
                                member.passeport === 'Blanc' && "bg-white border-2 border-gray-400 text-gray-800",
                                member.passeport === 'Jaune' && "bg-yellow-400 text-gray-900",
                                member.passeport === 'Orange' && "bg-orange-500 text-white",
                                member.passeport === 'Rouge' && "bg-red-500 text-white"
                              )}
                            >
                              {member.passeport}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedMember && filteredMembers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Aucun membre trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">
              Essayez de modifier vos critères de recherche
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PasseportValidation;
