import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Save, Loader2, Filter, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Checkbox } from '@/components/ui/checkbox';

const MemberGroupTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const [members, setMembers] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filtres
  const [titleFilter, setTitleFilter] = useState('');
  const [subGroupFilter, setSubGroupFilter] = useState('');

  // Sélection
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [selectedGroupeId, setSelectedGroupeId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }
    if (isAdmin) {
      fetchMembers();
      fetchGroupes();
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('secure_members')
        .select('id, first_name, last_name, title, sub_group, groupe_id')
        .order('last_name')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
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
      setGroupes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error);
    }
  };

  const getFilteredMembers = () => {
    return members.filter(member => {
      const titleMatch = !titleFilter ||
        (member.title && member.title.toLowerCase().includes(titleFilter.toLowerCase()));
      const subGroupMatch = !subGroupFilter ||
        (member.sub_group && member.sub_group.toLowerCase().includes(subGroupFilter.toLowerCase()));

      return titleMatch && subGroupMatch;
    });
  };

  const filteredMembers = getFilteredMembers();

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
      }

      toast({
        title: 'Mise à jour réussie',
        description: `${selectedMembers.size} membre(s) ont été mis à jour.`,
      });

      // Rafraîchir la liste
      await fetchMembers();
      setSelectedMembers(new Set());
      setSelectedGroupeId(null);
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Test - Gestion des Groupes Membres</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold headline flex items-center gap-3">
          <Users className="w-10 h-10 text-primary" />
          Test - Gestion des Groupes Membres
        </h1>
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
                <Input
                  id="titleFilter"
                  placeholder="Filtrer par titre..."
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subGroupFilter">Sous-groupe</Label>
                <Input
                  id="subGroupFilter"
                  placeholder="Filtrer par sous-groupe..."
                  value={subGroupFilter}
                  onChange={(e) => setSubGroupFilter(e.target.value)}
                />
              </div>
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
                <Label htmlFor="groupeSelect">Groupe à assigner</Label>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
  );
};

export default MemberGroupTest;
