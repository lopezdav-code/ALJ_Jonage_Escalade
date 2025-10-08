import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Euro, ExternalLink, Info, Save, ArrowLeft, Plus, X, Upload } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const CompetitionEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    short_title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    prix: '',
    niveau: '',
    nature: '',
    disciplines: [],
    categories: [],
    url_registration: '',
    url_details: '',
    details_pratiques: '',
    details_format: '',
    image_url: '',
    photo_gallery: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Options pour les sélecteurs
  const niveauOptions = ['national', 'Coupe', 'Bloc', 'régional', 'départemental'];
  const natureOptions = ['Compétition', 'Stage', 'Formation', 'Événement'];
  const disciplineOptions = ['Voie', 'Bloc', 'Vitesse', 'Combiné'];
  const categoryOptions = ['U11', 'U13', 'U15', 'U17', 'U19', 'Sénior', 'Vétéran'];

  // Charger les données de la compétition si en mode édition
  useEffect(() => {
    if (isEdit) {
      fetchCompetition();
    }
  }, [id]);

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
        ...data,
        disciplines: data.disciplines || [],
        categories: data.categories || [],
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
      setFormData(prev => ({
        ...prev,
        photo_gallery: [...prev.photo_gallery, url]
      }));
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photo_gallery: prev.photo_gallery.filter((_, i) => i !== index)
    }));
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
      const dataToSave = {
        ...formData,
        prix: formData.prix ? parseFloat(formData.prix) : null,
        end_date: formData.end_date || null
      };

      if (isEdit) {
        const { error } = await supabase
          .from('competitions')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Compétition modifiée avec succès !",
          variant: "default"
        });
      } else {
        const { error } = await supabase
          .from('competitions')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Compétition créée avec succès !",
          variant: "default"
        });
      }

      navigate('/competitions');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la compétition.",
        variant: "destructive"
      });
    } finally {
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/competitions')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
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

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description détaillée de la compétition..."
              rows={4}
            />
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
              <Label htmlFor="nature">Nature</Label>
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
            <Label>Disciplines</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {disciplineOptions.map(discipline => (
                <Button
                  key={discipline}
                  variant={formData.disciplines.includes(discipline) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDiscipline(discipline)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="url_registration">URL d'inscription</Label>
              <Input
                id="url_registration"
                type="url"
                value={formData.url_registration}
                onChange={(e) => handleChange('url_registration', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="url_details">URL de détails</Label>
              <Input
                id="url_details"
                type="url"
                value={formData.url_details}
                onChange={(e) => handleChange('url_details', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Détails pratiques */}
          <div>
            <Label htmlFor="details_pratiques">Informations pratiques</Label>
            <Textarea
              id="details_pratiques"
              value={formData.details_pratiques}
              onChange={(e) => handleChange('details_pratiques', e.target.value)}
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
          {/* Image principale */}
          <div>
            <Label htmlFor="image_url">Image principale (URL)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Galerie photo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Galerie photo</Label>
              <Button variant="outline" size="sm" onClick={addPhotoUrl}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter une photo
              </Button>
            </div>
            
            {formData.photo_gallery.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.photo_gallery.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
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
  );
};

export default CompetitionEditor;