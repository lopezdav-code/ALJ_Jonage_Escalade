import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Edit, Save, X, Calendar, MapPin, Euro, ExternalLink,
  Info, Trophy, Award, Users, Settings, Plus, ChevronLeft, ChevronRight,
  ZoomIn, Upload, Loader2, Printer
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useMemberDetail } from '@/contexts/MemberDetailContext';
import { uploadCompetitionPhoto, getCompetitionPhotoUrl } from '@/lib/competitionStorageUtils';
import ParticipantsDisplay from '@/components/ParticipantsDisplay';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePageAccess } from '@/hooks/usePageAccess';
import { formatName } from '@/lib/utils';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { exportCompetitionToPNG } from '@/lib/competitionExportUtils';

const CompetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showMemberDetails } = useMemberDetail();
  const { isAdmin, isBureau, isEncadrant } = useAuth();
  const { hasAccess, loading: pageAccessLoading } = usePageAccess();
  const canEdit = isAdmin || isBureau || isEncadrant;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [competition, setCompetition] = useState(null);
  const [formData, setFormData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [signedUrls, setSignedUrls] = useState({ main: null, gallery: [] });

  const [photoGallery, setPhotoGallery] = useState({
    isOpen: false,
    photos: [],
    currentIndex: 0,
    competitionName: ''
  });

  const niveauOptions = ['Départemental', 'Régional', 'Inter-régional', 'National', 'International'];
  const natureOptions = ['Contest', 'Open', 'Coupe', 'Championnat'];
  const disciplineOptions = ['Bloc', 'Difficulté', 'Vitesse', 'Combiné'];
  const categoryOptions = ['U11', 'U13', 'U15', 'U17', 'U19', 'Sénior', 'Vétéran'];
  const statusOptions = ['À venir', 'En cours', 'Clos'];

  // Charger la compétition et ses participants
  const fetchCompetition = useCallback(async () => {
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
      setFormData({
        ...compData,
        numero: compData.numero || '',
        disciplines: compData.disciplines || [],
        categories: compData.categories || [],
        photo_gallery: compData.photo_gallery || []
      });

      // Generate signed URLs for photos
      const mainImageUrl = compData.image_url ? await getCompetitionPhotoUrl(compData.image_url) : null;
      const galleryUrls = compData.photo_gallery ? await Promise.all(compData.photo_gallery.map(p => getCompetitionPhotoUrl(p))) : [];
      setSignedUrls({ main: mainImageUrl, gallery: galleryUrls.filter(Boolean) });

      // Charger les participants
      const { data: rawParticipants, error: participantsError } = await supabase
        .from('competition_participants')
        .select('*')
        .eq('competition_id', id)
        .order('role')
        .order('created_at');

      if (participantsError) throw participantsError;

      // Enrichir avec les données des membres
      if (rawParticipants && rawParticipants.length > 0) {
        const memberIds = [...new Set(rawParticipants.map(p => p.member_id))];
        const { data: membersData, error: membersError } = await supabase
          .from('secure_members')
          .select('*')
          .in('id', memberIds);

        if (membersError) throw membersError;

        const enrichedParticipants = rawParticipants.map(participant => ({
          ...participant,
          members: membersData?.find(member => member.id === participant.member_id) || null
        }));

        setParticipants(enrichedParticipants);
      }
    } catch (error) {
      console.error('Error loading competition:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la compétition.",
        variant: "destructive"
      });
      navigate('/competitions');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchCompetition();
  }, [fetchCompetition]);

  // Gestion de l'édition
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDiscipline = (discipline) => {
    setFormData(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter(d => d !== discipline)
        : [...prev.disciplines, discipline]
    }));
  };

  const toggleCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleAddPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);

    try {
      const result = await uploadCompetitionPhoto(file, formData.name);

      if (!result.success) {
        throw new Error(result.error);
      }

      setFormData(prev => ({
        ...prev,
        photo_gallery: [...prev.photo_gallery, result.url]
      }));

      toast({
        title: "Succès",
        description: `Photo "${file.name}" ajoutée à la galerie !`,
        variant: "default"
      });

      e.target.value = '';
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

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photo_gallery: prev.photo_gallery.filter((_, i) => i !== index)
    }));
  };

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

  const handleSave = async () => {
    setSaving(true);
    try {
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
        photo_gallery: Array.isArray(formData.photo_gallery) && formData.photo_gallery.length > 0 ? formData.photo_gallery : [],
        helloasso_widget_url: formData.helloasso_widget_url || null
      };

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

      setCompetition({ ...competition, ...dataToSave });
      setIsEditMode(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      ...competition,
      numero: competition.numero || '',
      disciplines: competition.disciplines || [],
      categories: competition.categories || [],
      photo_gallery: competition.photo_gallery || []
    });
    setIsEditMode(false);
  };

  // Galerie photo
  const openPhotoGallery = (photos, competitionName, startIndex = 0) => {
    setPhotoGallery({
      isOpen: true,
      photos,
      currentIndex: startIndex,
      competitionName
    });
  };

  const closePhotoGallery = () => {
    setPhotoGallery({ isOpen: false, photos: [], currentIndex: 0, competitionName: '' });
  };

  const nextPhoto = () => {
    setPhotoGallery(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.photos.length
    }));
  };

  const prevPhoto = () => {
    setPhotoGallery(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1
    }));
  };

  // Fonctions de couleur
  const getDisciplineColor = (discipline) => {
    const colors = {
      'Bloc': 'bg-purple-100 text-purple-700 border-purple-200',
      'Difficulté': 'bg-red-100 text-red-700 border-red-200',
      'Vitesse': 'bg-blue-100 text-blue-700 border-blue-200',
      'Combiné': 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[discipline] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getNatureColor = (nature) => {
    const colors = {
      'Contest': 'bg-green-100 text-green-700 border-green-200',
      'Open': 'bg-blue-100 text-blue-700 border-blue-200',
      'Coupe': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Championnat': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[nature] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getNiveauColor = (niveau) => {
    const colors = {
      'Départemental': 'bg-green-100 text-green-700 border-green-200',
      'Régional': 'bg-blue-100 text-blue-700 border-blue-200',
      'Inter-régional': 'bg-purple-100 text-purple-700 border-purple-200',
      'National': 'bg-red-100 text-red-700 border-red-200',
      'International': 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[niveau] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'À venir': 'bg-blue-100 text-blue-700 border-blue-300',
      'En cours': 'bg-green-100 text-green-700 border-green-300',
      'Clos': 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('competitions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setCompetition(prev => ({ ...prev, status: newStatus }));
      setFormData(prev => ({ ...prev, status: newStatus }));

      toast({
        title: "Statut modifié",
        description: `Le statut de la compétition a été changé en "${newStatus}".`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      toast({
        title: "Erreur",
        description: `Impossible de modifier le statut: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Fonction pour exporter la compétition en PNG
  const handleExportPNG = async () => {
    await exportCompetitionToPNG(competition, toast);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!competition || !formData) {
    return null;
  }

  const dataToDisplay = isEditMode ? formData : competition;

  return (
    <ProtectedRoute
      requireAdherent={true}
      pageTitle="Détail de la compétition"
      message="Les détails des compétitions sont réservés aux adhérents du club. Veuillez vous connecter avec un compte adhérent pour y accéder."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <BackButton to="/competitions" variant="outline">
            Retour à la liste
          </BackButton>

          <div className="flex gap-2">
            <Button
              onClick={handleExportPNG}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Exporter PNG
            </Button>
            {canEdit && !isEditMode ? (
              <Button onClick={() => setIsEditMode(true)} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Éditer
              </Button>
            ) : canEdit && isEditMode ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {/* Statut de la compétition */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Statut de la compétition:</span>
                <Badge
                  variant="outline"
                  className={`text-base px-4 py-1 ${getStatusColor(dataToDisplay.status || 'À venir')}`}
                >
                  {dataToDisplay.status || 'À venir'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="status-select" className="text-sm text-muted-foreground">Changer le statut:</Label>
                <Select
                  value={dataToDisplay.status || 'À venir'}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="status-select" className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image et titre principal */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {signedUrls.main && (
                <div className="w-full md:w-48 h-48 flex-shrink-0">
                  <img
                    src={signedUrls.main}
                    alt={dataToDisplay.name}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                </div>
              )}
              <div className="flex-1 space-y-4">
                {isEditMode ? (
                  <>
                    <div>
                      <Label htmlFor="name">Nom de la compétition *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="short_title">Titre court</Label>
                      <Input
                        id="short_title"
                        value={formData.short_title}
                        onChange={(e) => handleChange('short_title', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="numero">Numéro officiel</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => handleChange('numero', e.target.value)}
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
                          placeholder="Chemin de l'image"
                        />
                        <Label
                          htmlFor="main-image-upload-detail"
                          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {uploadingPhoto ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span>Choisir</span>
                          <Input
                            id="main-image-upload-detail"
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
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold">{dataToDisplay.name}</h1>
                    {dataToDisplay.short_title && (
                      <p className="text-lg text-primary font-medium">{dataToDisplay.short_title}</p>
                    )}
                    {dataToDisplay.numero && (
                      <p className="text-sm text-muted-foreground">Numéro: {dataToDisplay.numero}</p>
                    )}
                  </>
                )}

                <div className="flex flex-wrap gap-2">
                  {dataToDisplay.niveau && (
                    <Badge className={getNiveauColor(dataToDisplay.niveau)}>
                      {dataToDisplay.niveau}
                    </Badge>
                  )}
                  {dataToDisplay.nature && (
                    <Badge className={getNatureColor(dataToDisplay.nature)}>
                      {dataToDisplay.nature}
                    </Badge>
                  )}
                  {dataToDisplay.disciplines && dataToDisplay.disciplines.map(discipline => (
                    <Badge key={discipline} className={getDisciplineColor(discipline)}>
                      {discipline}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(dataToDisplay.start_date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {dataToDisplay.end_date && dataToDisplay.end_date !== dataToDisplay.start_date && (
                        <> au {new Date(dataToDisplay.end_date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{dataToDisplay.location}</span>
                  </div>
                  {dataToDisplay.prix && (
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4" />
                      <span>Prix d'entrée: {dataToDisplay.prix}€</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suite du composant dans le prochain message... */}
        {/* Informations détaillées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Informations détaillées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode ? (
              <>
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
                      value={formData.end_date || ''}
                      onChange={(e) => handleChange('end_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Lieu *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prix">Prix d'entrée (€)</Label>
                    <Input
                      id="prix"
                      type="number"
                      step="0.01"
                      value={formData.prix || ''}
                      onChange={(e) => handleChange('prix', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="niveau">Niveau</Label>
                    <Select
                      value={formData.niveau || ''}
                      onValueChange={(value) => handleChange('niveau', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
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
                    <Select
                      value={formData.nature || ''}
                      onValueChange={(value) => handleChange('nature', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {natureOptions.map(nature => (
                          <SelectItem key={nature} value={nature}>{nature}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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

                <div>
                  <Label htmlFor="more_info_link">Lien pour plus d'informations</Label>
                  <Input
                    id="more_info_link"
                    type="url"
                    value={formData.more_info_link || ''}
                    onChange={(e) => handleChange('more_info_link', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ffme_results_id">
                    ID FFME pour les résultats
                    <span className="text-xs text-gray-500 ml-2">(ex: 13156)</span>
                  </Label>
                  <Input
                    id="ffme_results_id"
                    type="text"
                    value={formData.ffme_results_id || ''}
                    onChange={(e) => handleChange('ffme_results_id', e.target.value)}
                    placeholder="13156"
                  />
                  {formData.ffme_results_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Lien: https://mycompet.ffme.fr/resultat/resultat_{formData.ffme_results_id}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="details_description">Informations pratiques</Label>
                  <Textarea
                    id="details_description"
                    value={formData.details_description || ''}
                    onChange={(e) => handleChange('details_description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="details_format">Format de la compétition</Label>
                  <Textarea
                    id="details_format"
                    value={formData.details_format || ''}
                    onChange={(e) => handleChange('details_format', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="details_schedule">Planning</Label>
                  <Textarea
                    id="details_schedule"
                    value={formData.details_schedule || ''}
                    onChange={(e) => handleChange('details_schedule', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="helloasso_widget_url">URL du widget HelloAsso (iframe src)</Label>
                  <Input
                    id="helloasso_widget_url"
                    type="url"
                    value={formData.helloasso_widget_url || ''}
                    onChange={(e) => handleChange('helloasso_widget_url', e.target.value)}
                    placeholder="https://www.helloasso-sandbox.com/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Copiez l'URL "src" de l'iframe fournie par HelloAsso.
                  </p>
                </div>
              </>
            ) : (
              <>
                {dataToDisplay.details_description && (
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      Informations pratiques
                    </h5>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {dataToDisplay.details_description}
                    </p>
                  </div>
                )}

                {dataToDisplay.details_format && (
                  <div className="p-3 bg-green-50 rounded-md border border-green-200">
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-green-600" />
                      Format de la compétition
                    </h5>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {dataToDisplay.details_format}
                    </p>
                  </div>
                )}

                {dataToDisplay.details_schedule && (
                  <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      Planning
                    </h5>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {dataToDisplay.details_schedule}
                    </p>
                  </div>
                )}

                {dataToDisplay.helloasso_widget_url && (
                  <div className="mt-6">
                    <Card className="border-2 border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ExternalLink className="w-5 h-5 text-primary" />
                          Inscription en ligne
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <iframe
                          id="haWidget"
                          allowTransparency="true"
                          src={dataToDisplay.helloasso_widget_url}
                          style={{ width: '100%', border: 'none', minHeight: '600px' }}
                          onLoad={() => {
                            window.addEventListener('message', function (e) {
                              if (e.data && e.data.height) {
                                const haWidgetElement = document.getElementById('haWidget');
                                if (haWidgetElement) {
                                  haWidgetElement.style.height = e.data.height + 'px';
                                }
                              }
                            });
                          }}
                        ></iframe>
                      </CardContent>
                    </Card>
                  </div>
                )}


                {dataToDisplay.more_info_link && (
                  <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
                    <h5 className="font-semibold mb-3 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-orange-600" />
                      Plus d'informations
                    </h5>
                    <Button variant="outline" size="sm" asChild>
                      <a href={dataToDisplay.more_info_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Consulter le site officiel
                      </a>
                    </Button>
                  </div>
                )}

                {dataToDisplay.ffme_results_id && (
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <h5 className="font-semibold mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-blue-600" />
                      Résultats FFME
                    </h5>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://mycompet.ffme.fr/resultat/resultat_${dataToDisplay.ffme_results_id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Voir les résultats
                      </a>
                    </Button>
                  </div>
                )}

                {dataToDisplay.categories && dataToDisplay.categories.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Catégories:</span>
                    <div className="flex flex-wrap gap-1">
                      {dataToDisplay.categories.map(category => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Galerie photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Photos {dataToDisplay.photo_gallery && dataToDisplay.photo_gallery.length > 0 && `(${dataToDisplay.photo_gallery.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditMode && (
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={addPhotoUrl}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter URL
                </Button>
                <Label
                  htmlFor="photo-upload"
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
                    id="photo-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleAddPhotoFile}
                    accept="image/*"
                    disabled={uploadingPhoto}
                  />
                </Label>
              </div>
            )}

            {signedUrls.gallery && signedUrls.gallery.length > 0 ? (
              <>
                {!isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPhotoGallery(signedUrls.gallery, dataToDisplay.name, 0)}
                    className="mb-4 flex items-center gap-1"
                  >
                    <ZoomIn className="w-3 h-3" />
                    Voir en grand
                  </Button>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {signedUrls.gallery.map((photoUrl, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => !isEditMode && openPhotoGallery(signedUrls.gallery, dataToDisplay.name, index)}
                    >
                      <img
                        src={photoUrl}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                      {isEditMode && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto(index);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune photo pour le moment.</p>
            )}
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/competitions/participants/${id}`)}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span className="whitespace-nowrap">Modifier les participants</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/competitions/results/${id}`)}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Trophy className="w-4 h-4" />
                  <span className="whitespace-nowrap">Modifier les résultats</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {participants.length > 0 ? (
              <ParticipantsDisplay
                participants={participants}
                onParticipantClick={showMemberDetails}
                compact={false}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Aucun participant pour le moment.</p>
            )}
          </CardContent>
        </Card>

        {/* Galerie photo modale */}
        <Dialog open={photoGallery.isOpen} onOpenChange={closePhotoGallery}>
          <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-black/95 border-0">
            <DialogHeader className="absolute top-4 left-4 right-4 z-10 flex flex-row justify-between items-center text-white p-4">
              <DialogTitle className="text-lg font-semibold text-white">
                {photoGallery.competitionName} - Photo {photoGallery.currentIndex + 1} sur {photoGallery.photos.length}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePhotoGallery}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogHeader>

            <div className="relative w-full h-full flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center p-16">
                <img
                  src={photoGallery.photos[photoGallery.currentIndex]}
                  alt={`Photo ${photoGallery.currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {photoGallery.photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default CompetitionDetail;
