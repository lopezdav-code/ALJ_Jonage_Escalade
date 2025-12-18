import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Euro, ExternalLink, Info, Save, Plus, X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { uploadCompetitionPhoto, getCompetitionPhotoUrl } from '@/lib/competitionStorageUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const CompetitionEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  // Définitions pour les info-bulles
  const natureDefinitions = {
    'Contest': 'Compétition locale ou régionale, souvent organisée par les clubs',
    'Open': 'Compétition ouverte à tous les niveaux, généralement moins formelle',
    'Coupe': 'Compétition officielle faisant partie d\'un circuit ou d\'une série',
    'Championnat': 'Compétition de haut niveau (départemental, régional, national)'
  };

  const disciplineDefinitions = {
    'Bloc': 'Escalade sur murs de 4,5m sans corde, résolution de problèmes courts et intenses',
    'Difficulté': 'Escalade en hauteur (15m+) avec corde, un seul essai pour monter le plus haut possible',
    'Vitesse': 'Duel sur voie standardisée de 15m, objectif: temps le plus rapide',
    'Combiné': 'Format olympique combinant Bloc et Difficulté en un seul classement'
  };

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    short_title: '',
    numero: '',
    start_date: '',
    end_date: '',
    location: '',
    prix: '',
    niveau: '',
    nature: '',
    disciplines: [],
    categories: [],
    more_info_link: '',
    ffme_results_id: '',
    details_description: '',
    details_format: '',
    details_schedule: '',
    image_url: '',
    photo_gallery: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState([]);

  // Options pour les sélecteurs
  const niveauOptions = ['Départemental', 'Régional', 'Inter-régional', 'National', 'International'];
  const natureOptions = ['Contest', 'Open', 'Coupe', 'Championnat'];
  const disciplineOptions = ['Bloc', 'Difficulté', 'Vitesse', 'Combiné'];
  const categoryOptions = ['U11', 'U13', 'U15', 'U17', 'U19', 'Sénior', 'Vétéran'];

  // Charger les données de la compétition si en mode édition
  useEffect(() => {
    if (isEdit) {
      fetchCompetition();
    }
  }, [id]);

  useEffect(() => {
    const generateUrls = async () => {
      if (formData.photo_gallery && formData.photo_gallery.length > 0) {
        const urls = await Promise.all(formData.photo_gallery.map(p => getCompetitionPhotoUrl(p)));
        setGalleryUrls(urls.filter(Boolean));
      } else {
        setGalleryUrls([]);
      }
    };
    generateUrls();
  }, [formData.photo_gallery]);

  const fetchCompetition = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        short_title: data.short_title || '',
        numero: data.numero || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        location: data.location || '',
        prix: data.prix || '',
        niveau: data.niveau || '',
        nature: data.nature || '',
        disciplines: data.disciplines || [],
        categories: data.categories || [],
        more_info_link: data.more_info_link || '',
        ffme_results_id: data.ffme_results_id || '',
        details_description: data.details_description || '',
        details_format: data.details_format || '',
        details_schedule: data.details_schedule || '',
        image_url: data.image_url || '',
        photo_gallery: data.photo_gallery || []
      });
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la compétition.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Gestion des changements dans le formulaire
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestion des disciplines multiples
  const toggleDiscipline = (discipline) => {
    setFormData(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter(d => d !== discipline)
        : [...prev.disciplines, discipline]
    }));
  };

  // Gestion des catégories multiples
  const toggleCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // Gestion de la galerie photo
  const addPhotoUrl = () => {
    const url = prompt("URL de la photo:");
    if (url) {
      // Extract path from URL
      const path = new URL(url).pathname.split('/').pop();
      setFormData(prev => ({
        ...prev,
        photo_gallery: [...prev.photo_gallery, path]
      }));
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photo_gallery: prev.photo_gallery.filter((_, i) => i !== index)
    }));
  };

  const handleAddPhotoFile = async (e) => {
    console.log('handleAddPhotoFile appelé');
    const file = e.target.files?.[0];

    if (!file) {
      console.log('Aucun fichier sélectionné');
      return;
    }

    console.log('Fichier sélectionné:', file.name, 'Taille:', file.size, 'bytes');

    // Vérifier que le nom de la compétition est renseigné
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord saisir le nom de la compétition avant d'uploader une photo.",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    setUploadingPhoto(true);

    try {
      console.log('Début de l\'upload...');

      // Upload le fichier vers Supabase Storage
      const result = await uploadCompetitionPhoto(file, formData.name);

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('Upload réussi, URL:', result.url);

      // Ajouter l'URL de l'image uploadée à la galerie photo
      setFormData(prev => ({
        ...prev,
        photo_gallery: [...prev.photo_gallery, result.url]
      }));

      toast({
        title: "Succès",
        description: `Photo "${file.name}" ajoutée à la galerie !`,
        variant: "default"
      });

      // Réinitialiser l'input file
      e.target.value = '';
      setSelectedPhotoFile(null);

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'uploader la photo: ${error.message}`,
        variant: "destructive"
      });
      e.target.value = '';
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la compétition est obligatoire.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.start_date) {
      toast({
        title: "Erreur",
        description: "La date de début est obligatoire.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.location.trim()) {
      toast({
        title: "Erreur",
        description: "Le lieu est obligatoire.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.end_date && formData.end_date < formData.start_date) {
      toast({
        title: "Erreur",
        description: "La date de fin ne peut pas être antérieure à la date de début.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Sauvegarde de la compétition
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Nettoyer et préparer les données
      const dataToSave = {
        name: formData.name || '',
        short_title: formData.short_title || '',
        numero: formData.numero || null,
        start_date: formData.start_date || '',
        end_date: formData.end_date || null,
        location: formData.location || '',
        prix: formData.prix ? parseFloat(formData.prix) : null,
        niveau: formData.niveau || null,
        nature: formData.nature || null,
        disciplines: Array.isArray(formData.disciplines) && formData.disciplines.length > 0 ? formData.disciplines : [],
        categories: Array.isArray(formData.categories) && formData.categories.length > 0 ? formData.categories : [],
        more_info_link: formData.more_info_link || null,
        ffme_results_id: formData.ffme_results_id || null,
        details_description: formData.details_description || null,
        details_format: formData.details_format || null,
        details_schedule: formData.details_schedule || null,
        image_url: formData.image_url || null,
        photo_gallery: Array.isArray(formData.photo_gallery) && formData.photo_gallery.length > 0 ? formData.photo_gallery : []
      };

      console.log('Sauvegarde des données:', dataToSave);
      console.log('Type de disciplines:', typeof dataToSave.disciplines, 'Valeur:', JSON.stringify(dataToSave.disciplines));
      console.log('Type de categories:', typeof dataToSave.categories, 'Valeur:', JSON.stringify(dataToSave.categories));
      console.log('Type de photo_gallery:', typeof dataToSave.photo_gallery, 'Valeur:', JSON.stringify(dataToSave.photo_gallery));

      if (isEdit) {
        const { error } = await supabase
          .from('competitions')
          .update(dataToSave)
          .eq('id', id);

        if (error) {
          console.error('Erreur Supabase lors de la mise à jour:', error);
          throw error;
        }

        toast({
          title: "Succès",
          description: "Compétition modifiée avec succès !",
          variant: "default"
        });
      } else {
        const { error } = await supabase
          .from('competitions')
          .insert([dataToSave]);

        if (error) {
          console.error('Erreur Supabase lors de l\'insertion:', error);
          throw error;
        }

        toast({
          title: "Succès",
          description: "Compétition créée avec succès !",
          variant: "default"
        });
      }

      console.log('Sauvegarde réussie, navigation vers /competitions');
      navigate('/competitions');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder la compétition: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive"
      });
    } finally {
      console.log('Fin de la sauvegarde, setSaving(false)');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      pageTitle="Éditeur de compétition"
      message="Vous n'avez pas les droits nécessaires pour accéder à cette page."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
        <BackButton to="/competitions" variant="outline" />
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Modifier la compétition' : 'Créer une compétition'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modifiez les informations de la compétition' : 'Ajoutez une nouvelle compétition au club'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nom et titre court */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom de la compétition *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Championnat Régional d'Escalade"
              />
            </div>
            <div>
              <Label htmlFor="short_title">Titre court</Label>
              <Input
                id="short_title"
                value={formData.short_title}
                onChange={(e) => handleChange('short_title', e.target.value)}
                placeholder="Ex: Régional Escalade 2024"
              />
            </div>
          </div>

          {/* Numéro officiel */}
          <div>
            <Label htmlFor="numero">Numéro officiel de la compétition</Label>
            <Input
              id="numero"
              value={formData.numero}
              onChange={(e) => handleChange('numero', e.target.value)}
              placeholder="Ex: 2024-RA-001"
            />
          </div>
          <div>
            <Label>Image principale</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image_url"
                type="text"
                value={formData.image_url || ''}
                onChange={(e) => handleChange('image_url', e.target.value)}
                placeholder="Chemin de l'image ou URL"
              />
              <Label
                htmlFor="main-image-upload"
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Choisir</span>
                <Input
                  id="main-image-upload"
                  type="file"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingPhoto(true);
                    try {
                      const result = await uploadCompetitionPhoto(file, formData.name);
                      if (!result.success) throw new Error(result.error);
                      handleChange('image_url', result.filePath);
                      toast({ title: "Succès", description: "Image principale téléversée." });
                    } catch (error) {
                      toast({ title: "Erreur", description: error.message, variant: "destructive" });
                    } finally {
                      setUploadingPhoto(false);
                    }
                  }}
                  accept="image/*"
                  disabled={uploadingPhoto}
                />
              </Label>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Date de début *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Date de fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* Lieu et prix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Lieu *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Ex: Salle d'escalade de Lyon"
              />
            </div>
            <div>
              <Label htmlFor="prix">Prix d'entrée (€)</Label>
              <Input
                id="prix"
                type="number"
                step="0.01"
                value={formData.prix}
                onChange={(e) => handleChange('prix', e.target.value)}
                placeholder="Ex: 25.00"
              />
            </div>
          </div>

          {/* Niveau et nature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="niveau">Niveau</Label>
              <Select value={formData.niveau} onValueChange={(value) => handleChange('niveau', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {niveauOptions.map(niveau => (
                    <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="nature">Nature</Label>
                <Info 
                  className="w-4 h-4 text-muted-foreground cursor-help" 
                  title="Contest: Compétition locale ou régionale | Open: Compétition ouverte à tous | Coupe: Compétition officielle d'un circuit | Championnat: Compétition de haut niveau"
                />
              </div>
              <Select value={formData.nature} onValueChange={(value) => handleChange('nature', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une nature" />
                </SelectTrigger>
                <SelectContent>
                  {natureOptions.map(nature => (
                    <SelectItem key={nature} value={nature}>{nature}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disciplines et catégories */}
      <Card>
        <CardHeader>
          <CardTitle>Disciplines et catégories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Disciplines */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Disciplines</Label>
              <Info 
                className="w-4 h-4 text-muted-foreground cursor-help" 
                title="Bloc: Sprint sur 4,5m, résolution de problèmes | Difficulté: Marathon en hauteur, un essai | Vitesse: Duel rapide sur voie standardisée | Combiné: Format olympique bloc + difficulté"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {disciplineOptions.map(discipline => (
                <Button
                  key={discipline}
                  variant={formData.disciplines.includes(discipline) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDiscipline(discipline)}
                  title={disciplineDefinitions[discipline]}
                >
                  {discipline}
                </Button>
              ))}
            </div>
          </div>

          {/* Catégories */}
          <div>
            <Label>Catégories</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categoryOptions.map(category => (
                <Button
                  key={category}
                  variant={formData.categories.includes(category) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liens et détails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Liens et informations pratiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URLs */}
          <div>
            <Label htmlFor="more_info_link">Lien pour plus d'informations</Label>
            <Input
              id="more_info_link"
              type="url"
              value={formData.more_info_link}
              onChange={(e) => handleChange('more_info_link', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="ffme_results_id">
              ID FFME pour les résultats
              <span className="text-xs text-gray-500 ml-2">(ex: 13156)</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  id="ffme_results_id"
                  type="text"
                  value={formData.ffme_results_id}
                  onChange={(e) => handleChange('ffme_results_id', e.target.value)}
                  placeholder="13156"
                />
              </div>
              {formData.ffme_results_id && (
                <a
                  href={`https://mycompet.ffme.fr/resultat/resultat_${formData.ffme_results_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                  title="Voir les résultats FFME"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lien généré: {formData.ffme_results_id ? `https://mycompet.ffme.fr/resultat/resultat_${formData.ffme_results_id}` : 'Entrez un ID'}
            </p>
          </div>

          {/* Détails pratiques */}
          <div>
            <Label htmlFor="details_description">Informations pratiques</Label>
            <Textarea
              id="details_description"
              value={formData.details_description}
              onChange={(e) => handleChange('details_description', e.target.value)}
              placeholder="Horaires, matériel requis, consignes..."
              rows={3}
            />
          </div>

          {/* Format */}
          <div>
            <Label htmlFor="details_format">Format de la compétition</Label>
            <Textarea
              id="details_format"
              value={formData.details_format}
              onChange={(e) => handleChange('details_format', e.target.value)}
              placeholder="Qualification, demi-finales, finales..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Galerie photo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Galerie photo</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addPhotoUrl}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter URL
                </Button>
                <Label
                  htmlFor="local-photo-upload"
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Choisir un fichier
                    </>
                  )}
                  <Input
                    id="local-photo-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleAddPhotoFile}
                    accept="image/*"
                    disabled={uploadingPhoto}
                  />
                </Label>
              </div>
            </div>

            {galleryUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {galleryUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => navigate('/competitions')}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Modifier' : 'Créer'}
            </>
          )}
        </Button>
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default CompetitionEditor;
