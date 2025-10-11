import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Edit, Trash2, Eye, Calendar, Users, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CycleManagement = () => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [deletingCycle, setDeletingCycle] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isAdmin, isEncadrant } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    long_description: '',
  });

  const canManageCycles = isAdmin || isEncadrant;

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select(`
          *,
          sessions:sessions(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les cycles: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cycle = null) => {
    if (cycle) {
      setEditingCycle(cycle);
      setFormData({
        name: cycle.name,
        short_description: cycle.short_description || '',
        long_description: cycle.long_description || '',
      });
    } else {
      setEditingCycle(null);
      setFormData({
        name: '',
        short_description: '',
        long_description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCycle(null);
    setFormData({
      name: '',
      short_description: '',
      long_description: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du cycle est obligatoire",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingCycle) {
        // Mise à jour
        const { error } = await supabase
          .from('cycles')
          .update({
            name: formData.name,
            short_description: formData.short_description,
            long_description: formData.long_description,
          })
          .eq('id', editingCycle.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Cycle mis à jour avec succès",
        });
      } else {
        // Création
        const { error } = await supabase
          .from('cycles')
          .insert({
            name: formData.name,
            short_description: formData.short_description,
            long_description: formData.long_description,
            created_by: user.id,
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Cycle créé avec succès",
        });
      }

      handleCloseDialog();
      fetchCycles();
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder le cycle: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCycle) return;

    try {
      const { error } = await supabase
        .from('cycles')
        .update({ is_active: false })
        .eq('id', deletingCycle.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Cycle archivé avec succès",
      });

      setDeletingCycle(null);
      fetchCycles();
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible d'archiver le cycle: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleViewCycle = (cycleId) => {
    navigate(`/cycles/${cycleId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestion des Cycles - ALJ Escalade</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Gestion des Cycles
              </h1>
              <p className="text-gray-600">
                Organisez vos séances en cycles thématiques
              </p>
            </div>
            {canManageCycles && (
              <Button onClick={() => handleOpenDialog()} size="lg">
                <PlusCircle className="w-5 h-5 mr-2" />
                Nouveau Cycle
              </Button>
            )}
          </div>

          {/* Liste des cycles */}
          {cycles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-4">Aucun cycle pour le moment</p>
                {canManageCycles && (
                  <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Créer le premier cycle
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {cycles.map((cycle) => (
                  <motion.div
                    key={cycle.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-xl">{cycle.name}</CardTitle>
                          <Badge variant="secondary">
                            <Calendar className="w-3 h-3 mr-1" />
                            {cycle.sessions?.[0]?.count || 0} séances
                          </Badge>
                        </div>
                        {cycle.short_description && (
                          <CardDescription className="line-clamp-2">
                            {cycle.short_description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex-grow">
                        {cycle.long_description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {cycle.long_description}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCycle(cycle.id)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        {canManageCycles && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(cycle)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingCycle(cycle)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dialog de création/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCycle ? 'Modifier le cycle' : 'Créer un nouveau cycle'}
            </DialogTitle>
            <DialogDescription>
              {editingCycle
                ? 'Modifiez les informations du cycle'
                : 'Créez un nouveau cycle pour regrouper vos séances'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du cycle *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Initiation Bloc 2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Description courte</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Résumé en une phrase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="long_description">Description détaillée</Label>
              <Textarea
                id="long_description"
                value={formData.long_description}
                onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                placeholder="Décrivez les objectifs et le contenu du cycle..."
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCycle ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingCycle} onOpenChange={() => setDeletingCycle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver ce cycle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le cycle "{deletingCycle?.name}" sera archivé. Les séances associées ne seront pas supprimées.
              Cette action peut être annulée en restaurant le cycle depuis les archives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CycleManagement;
