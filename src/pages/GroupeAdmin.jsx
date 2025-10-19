import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const GroupeAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchResult, setFetchResult] = useState(null);
  const [editing, setEditing] = useState(null); // groupe being edited
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }
    if (isAdmin) fetchGroupes();
  }, [isAdmin, authLoading, navigate]);

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
        .select('*');

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
    setDescription(g.description || '');
  };

  const handleNew = () => {
    setEditing({ id: null });
    setDescription('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ title: 'Erreur', description: 'La description est requise.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editing && editing.id) {
        const { data, error } = await supabase
          .from('groupe')
          .update({ description: description.trim() })
          .eq('id', editing.id)
          .select();

        console.log('[GroupeAdmin] update response:', { data, error });

        if (error) throw error;
        toast({ title: 'Groupe modifié' });
      } else {
        const { data, error } = await supabase
          .from('groupe')
          .insert([{ description: description.trim() }])
          .select();

        console.log('[GroupeAdmin] insert response:', { data, error });

        if (error) throw error;
        toast({ title: 'Groupe créé' });
      }

      setEditing(null);
      setDescription('');
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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <Helmet>
        <title>Gestion des groupes</title>
      </Helmet>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <h1 className="text-3xl font-bold">Gestion des groupes</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNew}>
              <PlusCircle className="w-4 h-4 mr-2" /> Nouveau groupe
            </Button>
          </div>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des groupes ({groupes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucun groupe</TableCell>
                  </TableRow>
                ) : (
                  groupes.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-mono text-sm">{g.id}</TableCell>
                      <TableCell>{g.description}</TableCell>
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
                <div>
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => { setEditing(null); setDescription(''); }}>Annuler</Button>
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
  );
};

export default GroupeAdmin;
