import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { BookMarked, Loader2, Save, UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePageAccess } from '@/hooks/usePageAccess';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate, useParams } from 'react-router-dom';

const BUCKET_NAME = 'pedagogy_files';
const CATEGORIES = ["Sécurité", "Noeud", "Secours", "Manip", "Information"];
const SHEET_TYPES = {
  'educational_game': 'Jeu éducatif',
  'warm_up_exercise': 'Exercice d\'échauffement',
  'strength_exercise': 'Exercice de renfo',
  'review_sheet': 'Fiche de révision',
  'technical_sheet': 'Fiche technique',
  'safety_sheet': 'Fiche sécurité',
  'meeting_report': 'Compte rendu de réunion'
};

const PedagogyEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { hasAccess, loading: pageAccessLoading } = usePageAccess();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [existingThemes, setExistingThemes] = useState([]);
  const [file, setFile] = useState(null);
  const [illustrationFile, setIllustrationFile] = useState(null);
  const [illustrationPreview, setIllustrationPreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    sheet_type: '',
    type: '',
    theme: '',
    starting_situation: '',
    game_goal: '',
    evolution: '',
    skill_to_develop: '',
    success_criteria: '',
    remarks: '',
    description: '',
    structure: 'SAE',
    categories: [],
    url: '',
    illustration_image: '',
  });

  // Charger les thèmes existants
  useEffect(() => {
    const fetchExistingThemes = async () => {
      try {
        const { data, error } = await supabase
          .from('pedagogy_sheets')
          .select('theme')
          .not('theme', 'is', null)
          .neq('theme', '');

        if (error) throw error;

        const uniqueThemes = [...new Set(data.map(item => item.theme))];
        setExistingThemes(uniqueThemes);
      } catch (error) {
        console.error('Erreur lors du chargement des thèmes:', error);
      }
    };

    fetchExistingThemes();
  }, []);

  // Charger la fiche si on est en mode édition
  useEffect(() => {
    if (id) {
      const fetchSheet = async () => {
        try {
          const { data, error } = await supabase
            .from('pedagogy_sheets')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          setFormData({
            title: data.title || '',
            sheet_type: data.sheet_type || '',
            type: data.type || '',
            theme: data.theme || '',
            starting_situation: data.starting_situation || '',
            game_goal: data.game_goal || '',
            evolution: data.evolution || '',
            skill_to_develop: data.skill_to_develop || '',
            success_criteria: data.success_criteria || '',
            remarks: data.remarks || '',
            description: data.description || '',
            structure: data.structure || 'SAE',
            categories: data.categories || [],
            url: data.url || '',
            illustration_image: data.illustration_image || '',
          });
        } catch (error) {
          toast({
            title: "Erreur",
            description: `Impossible de charger la fiche: ${error.message}`,
            variant: "destructive",
          });
          navigate('/pedagogy');
        } finally {
          setIsLoading(false);
        }
      };

      fetchSheet();
    }
  }, [id, navigate, toast]);

  // Charger l'URL signée quand un fichier existe
  useEffect(() => {
    const loadSignedUrl = async () => {
      if (formData.url && !file && formData.type === 'image_file') {
        const url = await getSignedUrl(formData.url);
        setFilePreview(url);
      }
    };

    loadSignedUrl();
  }, [formData.url, formData.type, file]);

  // Charger l'URL signée pour l'image d'illustration
  useEffect(() => {
    const loadIllustrationUrl = async () => {
      if (formData.illustration_image && !illustrationFile) {
        const url = await getSignedUrl(formData.illustration_image);
        setIllustrationPreview(url);
      }
    };

    loadIllustrationUrl();
  }, [formData.illustration_image, illustrationFile]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSheetTypeChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, sheet_type: value }));
  }, []);

  const handleTypeChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, type: value }));
  }, []);

  const handleStructureChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, structure: value }));
  }, []);

  const handleCategoryChange = useCallback((category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Créer une prévisualisation si c'est une image
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  }, []);

  const handleIllustrationChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setIllustrationFile(selectedFile);

      // Créer une prévisualisation
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setIllustrationPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  }, []);

  const uploadFile = async (fileToUpload) => {
    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileToUpload);

    if (error) throw error;

    // Retourner le nom du fichier au lieu de l'URL publique
    return fileName;
  };

  // Fonction pour obtenir l'URL signée d'un fichier
  const getSignedUrl = async (fileNameOrUrl) => {
    if (!fileNameOrUrl) return null;

    try {
      // Si c'est déjà une URL complète, on l'utilise directement
      if (fileNameOrUrl.startsWith('http://') || fileNameOrUrl.startsWith('https://')) {
        return fileNameOrUrl;
      }

      // Sinon, générer une URL signée depuis le nom du fichier
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(fileNameOrUrl, 3600); // URL valide 1 heure

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'URL signée:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      let fileUrl = formData.url;
      let illustrationImageUrl = formData.illustration_image;

      // Upload du fichier principal si nécessaire
      if (file) {
        fileUrl = await uploadFile(file);
      }

      // Upload de l'image d'illustration si nécessaire
      if (illustrationFile) {
        illustrationImageUrl = await uploadFile(illustrationFile);
      }

      const baseData = {
        title: formData.title,
        sheet_type: formData.sheet_type,
        type: formData.type,
        theme: formData.theme || null,
        starting_situation: formData.starting_situation || null,
        game_goal: formData.game_goal || null,
        evolution: formData.evolution || null,
        skill_to_develop: formData.skill_to_develop || null,
        success_criteria: formData.success_criteria || null,
        remarks: formData.remarks || null,
        description: formData.description || null,
        structure: formData.structure,
        categories: formData.categories || [],
        url: fileUrl,
        illustration_image: illustrationImageUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        // Mise à jour - ne pas inclure created_by
        const { error } = await supabase
          .from('pedagogy_sheets')
          .update(baseData)
          .eq('id', id);

        if (error) {
          console.error('Erreur Supabase détaillée lors de la mise à jour:', error);
          throw error;
        }

        toast({
          title: "Succès",
          description: "Fiche pédagogique mise à jour avec succès.",
        });
      } else {
        // Création
        const { error } = await supabase
          .from('pedagogy_sheets')
          .insert(baseData);

        if (error) {
          console.error('Erreur Supabase détaillée lors de la création:', error);
          throw error;
        }

        toast({
          title: "Succès",
          description: "Fiche pédagogique créée avec succès.",
        });
      }

      navigate('/pedagogy');
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder la fiche: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isGameType = formData.sheet_type === 'educational_game';
  const isUrlType = formData.type?.includes('url');
  const isFileType = formData.type?.includes('file');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
              <p className="text-muted-foreground">
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{id ? 'Modifier la fiche' : 'Nouvelle fiche pédagogique'} - ALJ Escalade</title>
      </Helmet>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <BackButton to="/pedagogy" className="mb-4">
              Retour à la pédagogie
            </BackButton>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {id ? 'Modifier la fiche pédagogique' : 'Nouvelle fiche pédagogique'}
            </h1>
            <p className="text-lg text-gray-600">
              {id ? 'Modifiez les informations de la fiche' : 'Créez une nouvelle fiche pédagogique'}
            </p>
          </div>

          {/* Formulaire */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de la fiche</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Titre de la fiche"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sheet_type">Type de Fiche *</Label>
                      <Select value={formData.sheet_type} onValueChange={handleSheetTypeChange}>
                        <SelectTrigger id="sheet_type">
                          <SelectValue placeholder="Sélectionner un type de fiche" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SHEET_TYPES).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type de Média *</Label>
                      <Select value={formData.type} onValueChange={handleTypeChange}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video_url">Vidéo (URL)</SelectItem>
                          <SelectItem value="image_file">Image (Fichier)</SelectItem>
                          <SelectItem value="document_file">Document (Fichier)</SelectItem>
                          <SelectItem value="document_url">Document (URL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isGameType ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="theme">Thème</Label>
                        <Input
                          id="theme"
                          name="theme"
                          value={formData.theme || ''}
                          onChange={handleChange}
                          list="existing-themes"
                          placeholder="Choisir ou créer un thème"
                        />
                        <datalist id="existing-themes">
                          {existingThemes.map(theme => <option key={theme} value={theme} />)}
                        </datalist>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="illustration-upload">Image d'illustration</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Cette image sera affichée comme illustration de la fiche (distincte de l'image de l'exercice)
                        </p>
                        <div className="flex items-center justify-center w-full">
                          <Label htmlFor="illustration-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Cliquez pour téléverser</span> une image
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {illustrationFile ? illustrationFile.name : 'PNG, JPG, GIF...'}
                              </p>
                            </div>
                            <Input id="illustration-upload" type="file" accept="image/*" className="hidden" onChange={handleIllustrationChange} />
                          </Label>
                        </div>
                        {illustrationPreview && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Prévisualisation :</p>
                            <img
                              src={illustrationPreview}
                              alt="Prévisualisation illustration"
                              className="max-w-full h-48 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                        {id && !illustrationFile && formData.illustration_image && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Fichier actuel : {formData.illustration_image.split('/').pop()}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="starting_situation">Situation de départ</Label>
                          <Textarea
                            id="starting_situation"
                            name="starting_situation"
                            value={formData.starting_situation || ''}
                            onChange={handleChange}
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="game_goal">But du jeu</Label>
                          <Textarea
                            id="game_goal"
                            name="game_goal"
                            value={formData.game_goal || ''}
                            onChange={handleChange}
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="evolution">Évolution</Label>
                          <Textarea
                            id="evolution"
                            name="evolution"
                            value={formData.evolution || ''}
                            onChange={handleChange}
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="skill_to_develop">Capacité à développer</Label>
                          <Textarea
                            id="skill_to_develop"
                            name="skill_to_develop"
                            value={formData.skill_to_develop || ''}
                            onChange={handleChange}
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="success_criteria">Critères de réussite</Label>
                          <Textarea
                            id="success_criteria"
                            name="success_criteria"
                            value={formData.success_criteria || ''}
                            onChange={handleChange}
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="remarks">Remarques</Label>
                          <Textarea
                            id="remarks"
                            name="remarks"
                            value={formData.remarks || ''}
                            onChange={handleChange}
                            rows={3}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description || ''}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Description de la fiche pédagogique"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="structure">Structure</Label>
                          <Select value={formData.structure || 'SAE'} onValueChange={handleStructureChange}>
                            <SelectTrigger id="structure">
                              <SelectValue placeholder="Sélectionner une structure" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SAE">SAE</SelectItem>
                              <SelectItem value="SNE">SNE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Catégories</Label>
                        <div className="flex flex-wrap gap-4">
                          {CATEGORIES.map(category => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category}`}
                                checked={(formData.categories || []).includes(category)}
                                onCheckedChange={() => handleCategoryChange(category)}
                              />
                              <Label htmlFor={`category-${category}`} className="font-normal">{category}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {isUrlType ? (
                    <div className="space-y-2">
                      <Label htmlFor="url">URL du média *</Label>
                      <Input
                        id="url"
                        name="url"
                        value={formData.url}
                        onChange={handleChange}
                        placeholder="https://example.com/..."
                        required
                      />
                    </div>
                  ) : isFileType ? (
                    <div className="space-y-2">
                      <Label htmlFor="file-upload">Fichier de l'exercice</Label>
                      <div className="flex items-center justify-center w-full">
                        <Label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Cliquez pour téléverser</span> ou glissez-déposez
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file ? file.name : 'Image, PDF, PPT...'}
                            </p>
                          </div>
                          <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                        </Label>
                      </div>
                      {formData.type === 'image_file' && filePreview && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Prévisualisation :</p>
                          <img
                            src={filePreview}
                            alt="Prévisualisation fichier"
                            className="max-w-full h-48 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                      {id && !file && formData.url && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Fichier actuel : {formData.url.split('/').pop()}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/pedagogy')}
                    disabled={isSaving}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default PedagogyEditor;