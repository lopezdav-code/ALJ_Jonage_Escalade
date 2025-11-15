import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Save, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const GroupeAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchResult, setFetchResult] = useState(null);
  const [editing, setEditing] = useState(null); // groupe being edited
  const [category, setCategory] = useState('');
  const [sousCategory, setSousCategory] = useState('');
  const [groupeSchedule, setGroupeSchedule] = useState('');
  const [saving, setSaving] = useState(false);

  // Filtres et tri
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sousCategoryFilter, setSousCategoryFilter] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    if (isAdmin) fetchGroupes();
  }, [isAdmin]);

  const fetchGroupes = async () => {
    setLoading(true);
    try {
      // Log auth session/user to help debug permission / RLS issues
      try {
        const sessionRes = await supabase.auth.getSession();
        const userRes = await supabase.auth.getUser();
        console.log('[GroupeAdmin] auth sessionRes:', sessionRes);
        console.log('[GroupeAdmin] auth userRes:', userRes);
      } catch (authErr) {
        console.warn('[GroupeAdmin] could not get auth session/user', authErr);
      }

      const { data, error } = await supabase
        .from('groupe')
        .select('id, category, sous_category, Groupe_schedule')
        .order('category')
        .order('sous_category');

      console.log('[GroupeAdmin] fetchGroupes response:', { data, error });
  setFetchResult({ data, error });

      if (error) throw error;
      setGroupes(data || []);
    } catch (err) {
      console.error('Erreur chargement groupes:', err);
      toast({ title: 'Erreur', description: 'Impossible de charger les groupes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (g) => {
    setEditing(g);
    setCategory(g.category || '');
    setSousCategory(g.sous_category || '');
    setGroupeSchedule(g.Groupe_schedule || '');
  };

  const handleNew = () => {
    setEditing({ id: null });
    setCategory('');
    setSousCategory('');
    setGroupeSchedule('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!category.trim()) {
      toast({ title: 'Erreur', description: 'La catégorie est requise.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        category: category.trim(),
        sous_category: sousCategory.trim() || null,
        Groupe_schedule: groupeSchedule.trim() || null
      };

      if (editing && editing.id) {
        const { data, error } = await supabase
          .from('groupe')
          .update(dataToSave)
          .eq('id', editing.id)
          .select();

        console.log('[GroupeAdmin] update response:', { data, error });

        if (error) throw error;
        toast({ title: 'Groupe modifié' });
      } else {
        const { data, error } = await supabase
          .from('groupe')
          .insert([dataToSave])
          .select();

        console.log('[GroupeAdmin] insert response:', { data, error });

        if (error) throw error;
        toast({ title: 'Groupe créé' });
      }

      setEditing(null);
      setCategory('');
      setSousCategory('');
      setGroupeSchedule('');
      fetchGroupes();
    } catch (err) {
      console.error('Erreur sauvegarde groupe:', err);
      toast({ title: 'Erreur', description: err.message || 'Impossible de sauvegarder.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    try {
      const { data, error } = await supabase
        .from('groupe')
        .delete()
        .eq('id', id)
        .select();

      console.log('[GroupeAdmin] delete response:', { data, error });

      if (error) throw error;
      toast({ title: 'Groupe supprimé' });
      fetchGroupes();
    } catch (err) {
      console.error('Erreur suppression groupe:', err);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le groupe.', variant: 'destructive' });
    }
  };

  // Fonctions de tri
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // Filtrage et tri
  const getFilteredAndSortedGroupes = () => {
    let filtered = groupes.filter(g => {
      const categoryMatch = !categoryFilter ||
        (g.category && g.category.toLowerCase().includes(categoryFilter.toLowerCase()));
      const sousCategoryMatch = !sousCategoryFilter ||
        (g.sous_category && g.sous_category.toLowerCase().includes(sousCategoryFilter.toLowerCase()));
      const scheduleMatch = !scheduleFilter ||
        (g.Groupe_schedule && g.Groupe_schedule.toLowerCase().includes(scheduleFilter.toLowerCase()));

      return categoryMatch && sousCategoryMatch && scheduleMatch;
    });

    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key] || '';
      let bValue = b[sortConfig.key] || '';

      if (sortConfig.key === 'id') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredGroupes = getFilteredAndSortedGroupes();

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute pageTitle="Gestion des groupes" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-8 max-w-4xl mx-auto p-6">
        <Helmet>
          <title>Gestion des groupes</title>
        </Helmet>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold">Gestion des groupes</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNew}>
              <PlusCircle className="w-4 h-4 mr-2" /> Nouveau groupe
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filtres */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryFilter">Catégorie</Label>
                <Input
                  id="categoryFilter"
                  placeholder="Filtrer par catégorie..."
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sousCategoryFilter">Sous-catégorie</Label>
                <Input
                  id="sousCategoryFilter"
                  placeholder="Filtrer par sous-catégorie..."
                  value={sousCategoryFilter}
                  onChange={(e) => setSousCategoryFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduleFilter">Groupe Schedule</Label>
                <Input
                  id="scheduleFilter"
                  placeholder="Filtrer par schedule..."
                  value={scheduleFilter}
                  onChange={(e) => setScheduleFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des groupes ({filteredGroupes.length} / {groupes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('id')}
                      className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                    >
                      ID
                      {getSortIcon('id')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('category')}
                      className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                    >
                      Catégorie
                      {getSortIcon('category')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('sous_category')}
                      className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                    >
                      Sous-catégorie
                      {getSortIcon('sous_category')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('Groupe_schedule')}
                      className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                    >
                      Groupe Schedule
                      {getSortIcon('Groupe_schedule')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredGroupes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {groupes.length === 0 ? 'Aucun groupe' : 'Aucun groupe ne correspond aux filtres'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroupes.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-mono text-sm">{g.id}</TableCell>
                      <TableCell className="font-medium">{g.category || '-'}</TableCell>
                      <TableCell>{g.sous_category || '-'}</TableCell>
                      <TableCell>{g.Groupe_schedule || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(g)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(g.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editing !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>{editing.id ? 'Modifier le groupe' : 'Nouveau groupe'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Catégorie <span className="text-red-500">*</span></Label>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Sous-catégorie</Label>
                    <Input value={sousCategory} onChange={(e) => setSousCategory(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Groupe Schedule</Label>
                  <Input
                    value={groupeSchedule}
                    onChange={(e) => setGroupeSchedule(e.target.value)}
                    placeholder="Nom du groupe pour le planning"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={() => {
                    setEditing(null);
                    setCategory('');
                    setSousCategory('');
                    setGroupeSchedule('');
                  }}>Annuler</Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
      </div>
    </ProtectedRoute>
  );
};

export default GroupeAdmin;
