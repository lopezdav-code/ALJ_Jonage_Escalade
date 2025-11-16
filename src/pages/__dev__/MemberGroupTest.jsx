import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Save, Loader2, Filter, CheckSquare, Square, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const MemberGroupTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const [members, setMembers] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bureauMap, setBureauMap] = useState({});

  // Filtres
  const [titleFilter, setTitleFilter] = useState('');
  const [subGroupFilter, setSubGroupFilter] = useState('');
  const [showWithoutGroup, setShowWithoutGroup] = useState(false);

  // Sélection
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [selectedGroupeId, setSelectedGroupeId] = useState(null);
  const [isVolunteer, setIsVolunteer] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchMembers();
      fetchGroupes();
    }
  }, [isAdmin]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, title, sub_group, groupe_id')
        .order('last_name')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);

      // Charger les entrées 'bureau' et construire une map member_id -> [roles]
      try {
        const { data: bureauData, error: bErr } = await supabase
          .from('bureau')
          .select('id, members_id, role, sub_role');

        if (bErr) throw bErr;

        const map = {};
        (bureauData || []).forEach(b => {
          const mid = b.members_id;
          if (!map[mid]) map[mid] = [];
          map[mid].push(b);
        });
        setBureauMap(map);
      } catch (innerErr) {
        console.error('Erreur lors du chargement des entrées bureau:', innerErr);
        // Ne pas bloquer le chargement des membres, mais avertir
        toast({ title: 'Erreur', description: 'Impossible de charger les données du bureau.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les membres.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupes = async () => {
    try {
      const { data, error } = await supabase
        .from('groupe')
        .select('id, category, sous_category, Groupe_schedule')
        .order('category')
        .order('sous_category');

      if (error) throw error;

      console.log(`${(data || []).length} groupes chargés:`, data);
      setGroupes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les groupes.',
        variant: 'destructive',
      });
    }
  };

  // Récupérer les valeurs uniques pour les filtres
  const getUniqueTitles = () => {
    const titles = members
      .map(m => m.title)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return titles.sort();
  };

  const getUniqueSubGroups = () => {
    const filteredByTitle = titleFilter
      ? members.filter(m => m.title === titleFilter)
      : members;

    const subGroups = filteredByTitle
      .map(m => m.sub_group)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return subGroups.sort();
  };

  const getFilteredMembers = () => {
    return members.filter(member => {
      const titleMatch = !titleFilter || member.title === titleFilter;
      const subGroupMatch = !subGroupFilter || member.sub_group === subGroupFilter;
      const groupMatch = !showWithoutGroup || !member.groupe_id;

      return titleMatch && subGroupMatch && groupMatch;
    });
  };

  const filteredMembers = getFilteredMembers();
  const uniqueTitles = getUniqueTitles();
  const uniqueSubGroups = getUniqueSubGroups();

  const handleTitleChange = (value) => {
    setTitleFilter(value);
    // Réinitialiser sub_group si le nouveau filtre title ne contient pas le sub_group actuel
    if (value && subGroupFilter) {
      const hasSubGroup = members.some(m => m.title === value && m.sub_group === subGroupFilter);
      if (!hasSubGroup) {
        setSubGroupFilter('');
      }
    }
  };

  const handleSelectAll = () => {
    const allVisible = filteredMembers.map(m => m.id);
    if (selectedMembers.size === allVisible.length &&
        allVisible.every(id => selectedMembers.has(id))) {
      // Tout désélectionner
      setSelectedMembers(new Set());
    } else {
      // Tout sélectionner
      setSelectedMembers(new Set(allVisible));
    }
  };

  const handleToggleMember = (memberId) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (selectedMembers.size === 0) {
      toast({
        title: 'Aucune sélection',
        description: 'Veuillez sélectionner au moins un membre.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedGroupeId) {
      toast({
        title: 'Aucun groupe sélectionné',
        description: 'Veuillez sélectionner un groupe.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const updates = Array.from(selectedMembers).map(memberId => ({
        id: memberId,
        groupe_id: selectedGroupeId === 'null' ? null : parseInt(selectedGroupeId)
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('members')
          .update({ groupe_id: update.groupe_id })
          .eq('id', update.id);

        if (error) throw error;

        // Si la checkbox "Bénévole ?" est cochée, ajouter une ligne dans 'bureau'
        if (isVolunteer) {
          try {
            // Eviter les doublons : vérifier s'il existe déjà une ligne pour ce membre avec role 'Bénévole'
            const { data: existing, error: checkErr } = await supabase
              .from('bureau')
              .select('id')
              .eq('members_id', update.id)
              .eq('role', 'Bénévole')
              .limit(1);

            if (checkErr) throw checkErr;

            if (!existing || existing.length === 0) {
              const { error: insertErr } = await supabase
                .from('bureau')
                .insert([{ members_id: update.id, role: 'Bénévole', sub_role: null }]);

              if (insertErr) throw insertErr;
            }
          } catch (err) {
            console.error('Erreur lors de l\'insertion bureau (Bénévole):', err);
            // Ne pas bloquer l'ensemble, on enregistre l'erreur pour notifier
            toast({ title: 'Erreur', description: `Impossible d'ajouter Bénévole pour l'id ${update.id}.`, variant: 'destructive' });
          }
        }
      }

      toast({
        title: 'Mise à jour réussie',
        description: `${selectedMembers.size} membre(s) ont été mis à jour.`,
      });

      // Rafraîchir la liste
      await fetchMembers();
      setSelectedMembers(new Set());
      setSelectedGroupeId(null);
      setIsVolunteer(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les membres.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatGroupe = (groupeId) => {
    if (!groupeId) return '-';
    const groupe = groupes.find(g => g.id === groupeId);
    if (!groupe) return '-';

    let display = groupe.category;
    if (groupe.sous_category) {
      display += ` - ${groupe.sous_category}`;
    }
    if (groupe.Groupe_schedule) {
      display += ` (${groupe.Groupe_schedule})`;
    }
    return display;
  };

  const allVisibleSelected = filteredMembers.length > 0 &&
    filteredMembers.every(m => selectedMembers.has(m.id));

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute pageTitle="Gestion des Groupes" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-6">
        <Helmet>
          <title>Gestion des Groupes</title>
        </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <BackButton to="/admin-dashboard" />
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <Users className="w-10 h-10 text-primary" />
            Gestion des Groupes
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/groupes/admin')} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Gestion des groupes
            </Button>
            <Button onClick={() => navigate('/bureau-management')} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Gestion du bureau
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titleFilter">Titre</Label>
                <Select
                  value={titleFilter}
                  onValueChange={handleTitleChange}
                >
                  <SelectTrigger id="titleFilter">
                    <SelectValue placeholder="Tous les titres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les titres</SelectItem>
                    {uniqueTitles.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subGroupFilter">Sous-groupe</Label>
                <Select
                  value={subGroupFilter}
                  onValueChange={setSubGroupFilter}
                  disabled={uniqueSubGroups.length === 0}
                >
                  <SelectTrigger id="subGroupFilter">
                    <SelectValue placeholder="Tous les sous-groupes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les sous-groupes</SelectItem>
                    {uniqueSubGroups.map((subGroup) => (
                      <SelectItem key={subGroup} value={subGroup}>
                        {subGroup}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <Checkbox
                id="showWithoutGroup"
                checked={showWithoutGroup}
                onCheckedChange={setShowWithoutGroup}
              />
              <Label
                htmlFor="showWithoutGroup"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Afficher uniquement les membres sans groupe
              </Label>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions en masse */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Actions en masse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[250px] space-y-2">
                <Label htmlFor="groupeSelect">
                  Groupe à assigner {groupes.length > 0 && <span className="text-muted-foreground text-xs">({groupes.length} groupes disponibles)</span>}
                </Label>
                <Select
                  value={selectedGroupeId?.toString() || ''}
                  onValueChange={(value) => setSelectedGroupeId(value)}
                >
                  <SelectTrigger id="groupeSelect">
                    <SelectValue placeholder="Sélectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Aucun groupe</SelectItem>
                    {groupes.map((groupe) => (
                      <SelectItem key={groupe.id} value={groupe.id.toString()}>
                        {groupe.category}
                        {groupe.sous_category ? ` - ${groupe.sous_category}` : ''}
                        {groupe.Groupe_schedule ? ` (${groupe.Groupe_schedule})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isVolunteer" checked={isVolunteer} onCheckedChange={setIsVolunteer} />
                <Label htmlFor="isVolunteer" className="cursor-pointer">Bénévole ?</Label>
              </div>
              <Button
                onClick={handleBulkUpdate}
                disabled={saving || selectedMembers.size === 0}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Mettre à jour ({selectedMembers.size})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tableau des membres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Membres ({filteredMembers.length} / {members.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="gap-2"
              >
                {allVisibleSelected ? (
                  <>
                    <Square className="w-4 h-4" />
                    Tout désélectionner
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    Tout sélectionner
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Sous-groupe</TableHead>
                    <TableHead>Groupe actuel</TableHead>
                    <TableHead>Bureau</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun membre trouvé avec ces filtres.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow
                        key={member.id}
                        className={selectedMembers.has(member.id) ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedMembers.has(member.id)}
                            onCheckedChange={() => handleToggleMember(member.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{member.last_name}</TableCell>
                        <TableCell>{member.first_name}</TableCell>
                        <TableCell>{member.title || '-'}</TableCell>
                        <TableCell>{member.sub_group || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {formatGroupe(member.groupe_id)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {bureauMap[member.id] ? (
                            <div className="flex flex-col text-sm">
                              {bureauMap[member.id].map(b => (
                                <div key={b.id} className="py-0.5">
                                  {b.role}{b.sub_role ? ` (${b.sub_role})` : ''}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default MemberGroupTest;
