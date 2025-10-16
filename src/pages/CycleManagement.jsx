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
import { Loader2, PlusCircle, Edit, Trash2, Eye, Calendar, Users, BookOpen, Upload, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const CYCLE_BUCKET_NAME = 'cycle_documents';

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

  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imagePosition, setImagePosition] = useState('center');

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
      setImagePreview(cycle.image_url || null);
      setImagePosition(cycle.image_position || 'center');
    } else {
      setEditingCycle(null);
      setFormData({
        name: '',
        short_description: '',
        long_description: '',
      });
      setImagePreview(null);
      setImagePosition('center');
    }
    setPdfFile(null);
    setImageFile(null);
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
    setPdfFile(null);
    setImageFile(null);
    setImagePreview(null);
    setImagePosition('center');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${editingCycle?.id || 'new'}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(CYCLE_BUCKET_NAME)
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Erreur d'upload: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(CYCLE_BUCKET_NAME).getPublicUrl(fileName);
    return data.publicUrl;
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
      const updateData = {
        name: formData.name,
        short_description: formData.short_description,
        long_description: formData.long_description,
        image_position: imagePosition,
      };

      // Upload PDF if provided
      if (pdfFile) {
        const pdfUrl = await uploadFile(pdfFile, 'pdfs');
        updateData.pdf_url = pdfUrl;
      }

      // Upload image if provided
      if (imageFile) {
        const imageUrl = await uploadFile(imageFile, 'images');
        updateData.image_url = imageUrl;
      }

      if (editingCycle) {
        // Mise à jour
        const { error } = await supabase
          .from('cycles')
          .update(updateData)
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
            ...updateData,
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
    <ProtectedRoute
      requireAdherent={true}
      pageTitle="Gestion des cycles"
      message="La gestion des cycles est réservée aux adhérents du club. Veuillez vous connecter avec un compte adhérent pour y accéder."
    >
      <>
        <Helmet>
          <title>Gestion des Cycles - ALJ Escalade</title>
        </Helmet>

        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Gestion des Cycles
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Organisez vos séances en cycles thématiques
                </p>
              </div>
              {canManageCycles && (
                <Button onClick={() => handleOpenDialog()} size="lg" className="w-full sm:w-auto">
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
                      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col overflow-hidden">
                        {/* Image en header si disponible */}
                        {cycle.image_url && (
                          <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                            <img
                              src={cycle.image_url}
                              alt={cycle.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              style={{ objectPosition: cycle.image_position || 'center' }}
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                            <CardTitle className="text-lg sm:text-xl break-words">{cycle.name}</CardTitle>
                            <Badge variant="secondary" className="w-fit flex-shrink-0">
                              <Calendar className="w-3 h-3 mr-1" />
                              {cycle.sessions?.[0]?.count || 0} séances
                            </Badge>
                          </div>
                          {cycle.short_description && (
                            <CardDescription className="line-clamp-2 break-words">
                              {cycle.short_description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="flex-grow">
                          {cycle.long_description && (
                            <p className="text-sm text-gray-600 line-clamp-3 break-words">
                              {cycle.long_description}
                            </p>
                          )}
                        </CardContent>
                        <CardFooter className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCycle(cycle.id)}
                            className="flex-1 sm:flex-initial w-full sm:w-auto"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                          {canManageCycles && (
                            <div className="flex gap-2 flex-1 sm:flex-initial">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDialog(cycle)}
                                className="flex-1 sm:flex-initial"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeletingCycle(cycle)}
                                  className="text-red-600 hover:text-red-700 flex-1 sm:flex-initial"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCycle ? 'Modifier le cycle' : 'Créer un nouveau cycle'}
              </DialogTitle>
              <DialogDescription>
                {editingCycle
                  ? 'Modifiez les informations du cycle et ajoutez des documents'
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
                  rows={4}
                />
              </div>

              {/* Image illustrative avec aperçu et positionnement */}
              <div className="space-y-2">
                <Label htmlFor="cycle-image">Image illustrative</Label>

                {/* Aperçu de l'image */}
                {imagePreview && (
                  <div className="space-y-2">
                    <div className="relative w-full h-48 overflow-hidden bg-gray-100 rounded-lg border-2 border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: imagePosition }}
                      />
                    </div>

                    {/* Contrôles de positionnement */}
                    <div className="space-y-2">
                      <Label className="text-sm">Position de l'image</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={imagePosition === 'top' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImagePosition('top')}
                          className="text-xs"
                        >
                          Haut
                        </Button>
                        <Button
                          type="button"
                          variant={imagePosition === 'center' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImagePosition('center')}
                          className="text-xs"
                        >
                          Centre
                        </Button>
                        <Button
                          type="button"
                          variant={imagePosition === 'bottom' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImagePosition('bottom')}
                          className="text-xs"
                        >
                          Bas
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    id="cycle-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  {imageFile && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Upload className="w-4 h-4" />
                      Prêt
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {imageFile ? 'Une nouvelle image sera téléchargée' : editingCycle?.image_url ? 'Laisser vide pour conserver l\'image actuelle' : 'Format recommandé: 16:9 (1200x675px)'}
                </p>
              </div>

              {/* Document PDF */}
              <div className="space-y-2">
                <Label htmlFor="cycle-pdf">Document PDF</Label>
                {editingCycle?.pdf_url && !pdfFile && (
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    <a
                      href={editingCycle.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Document actuel
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="cycle-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {pdfFile && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Upload className="w-4 h-4" />
                      Prêt
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pdfFile ? 'Un nouveau PDF sera téléchargé' : editingCycle?.pdf_url ? 'Laisser vide pour conserver le PDF actuel' : 'Optionnel: ajoutez un document PDF'}
                </p>
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
    </ProtectedRoute>
  );
};

export default CycleManagement;
