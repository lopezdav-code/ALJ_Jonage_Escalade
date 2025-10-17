import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { uploadNewsImage, getSignedUrl } from '@/lib/newsStorageUtils';

const SHARED_BUCKET = 'exercise_images';

const NewsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    short_description: '',
    long_description: '',
    external_link: '',
    image_url: '',
    document_url: '',
    theme: '',
    is_pinned: false,
    is_private: false, // Initialize is_private
    competition_id: null, // Initialize competition_id
    status: 'publie', // Initialize status with default value
  });
  const [imageFile, setImageFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [competitions, setCompetitions] = useState([]); // State to store competitions
  const [signedImageUrl, setSignedImageUrl] = useState(null);

  const themes = [
    "Compétition",
    "Information générale",
    "Stage / sortie",
    "Événement au club",
    "Appel au bénévolat"
  ];

  // Fetch competitions
  const fetchCompetitions = useCallback(async () => {
    const { data, error } = await supabase.from('competitions').select('id, short_title');
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les compétitions.", variant: "destructive" });
    } else {
      setCompetitions(data || []); // Ensure competitions is always an array
    }
  }, [toast]);

  useEffect(() => {
    fetchCompetitions(); // Fetch competitions on component mount

    if (!id) { // If id is undefined, it's the create route '/news/new'
      // Reset form for new news item
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        short_description: '',
        long_description: '',
        external_link: '',
        image_url: '',
        document_url: '',
        theme: '',
        is_pinned: false,
        is_private: false,
        competition_id: null,
        status: 'publie',
      });
      setIsLoading(false);
    } else { // If id exists, it's an edit route '/news/edit/:id'
      setIsLoading(true);
      const fetchNewsItem = async () => {
        try {
          const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
          if (error) throw error;
          setFormData({
            ...data,
            date: data.date ? data.date.split('T')[0] : new Date().toISOString().split('T')[0],
          });

          // Générer une signed URL pour l'image existante
          if (data.image_url) {
            const signedUrl = await getSignedUrl(data.image_url);
            setSignedImageUrl(signedUrl);
          }
        } catch (error) {
          toast({ title: "Erreur", description: `Impossible de charger l'actualité : ${error.message}`, variant: "destructive" });
          navigate('/news');
        } finally {
          setIsLoading(false);
        }
      };
      fetchNewsItem();
    }
  }, [id, navigate, toast, fetchCompetitions]); // Dependencies for useEffect

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file, bucket) => {
    if (!file) return null;

    // Pour les images dans exercise_images, utiliser la fonction utilitaire
    if (bucket === SHARED_BUCKET) {
      const result = await uploadNewsImage(file);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.path;
    }

    // Pour les autres buckets (documents), utiliser l'ancienne méthode
    const fileExt = file.name.split('.').pop();
    const fileName = `news/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let updatedFormData = { ...formData };

      // Upload image if a new one is selected
      if (imageFile) {
        const imagePath = await uploadFile(imageFile, SHARED_BUCKET);
        updatedFormData.image_url = imagePath;
      }
      // Upload document if a new one is selected
      if (documentFile) {
        const documentUrl = await uploadFile(documentFile, SHARED_BUCKET);
        updatedFormData.document_url = documentUrl;
      }

      // Remove file objects before saving to DB
      delete updatedFormData.imageFile;
      delete updatedFormData.documentFile;

      // Ensure competition_id is null if theme is not "Compétition"
      if (updatedFormData.theme !== "Compétition") {
        updatedFormData.competition_id = null;
      }

      let result;
      if (id) {
        // Update existing news
        const { error } = await supabase.from('news').update(updatedFormData).eq('id', id);
        if (error) throw error;
        result = "Actualité mise à jour avec succès.";
      } else {
        // Create new news
        const { error } = await supabase.from('news').insert(updatedFormData);
        if (error) throw error;
        result = "Actualité créée avec succès.";
      }
      
      toast({ title: "Succès", description: result });
      navigate('/news'); // Redirect back to news list
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Helmet>
        <title>{id ? "Modifier l'actualité" : "Créer une actualité"} - ALJ Escalade Jonage</title>
      </Helmet>
      <h1 className="text-4xl font-bold headline mb-8 flex items-center gap-3">
        {id ? "Modifier l'actualité" : "Créer une actualité"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-md">
        <div>
          <Label htmlFor="title">Titre</Label>
          <Input id="title" name="title" value={formData.title} onChange={handleChange} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="short_description">Description courte</Label>
          <Textarea id="short_description" name="short_description" value={formData.short_description} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="long_description">Description longue</Label>
          <Textarea id="long_description" name="long_description" value={formData.long_description} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="external_link">Lien externe</Label>
          <Input id="external_link" name="external_link" value={formData.external_link} onChange={handleChange} placeholder="https://..." className="mt-1" />
        </div>
        <div>
          <Label htmlFor="image">Image</Label>
          <Input id="image" type="file" onChange={(e) => handleFileChange(e, setImageFile)} className="mt-1" accept="image/*" />
          {signedImageUrl && !imageFile && (
            <div className="mt-2">
              <img src={signedImageUrl} alt="Aperçu actuel" className="h-20 rounded-md" />
              <p className="text-sm text-muted-foreground">Image actuelle. Téléchargez une nouvelle image pour la remplacer.</p>
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="document">Document</Label>
          <Input id="document" type="file" onChange={(e) => handleFileChange(e, setDocumentFile)} className="mt-1" />
          {formData.document_url && !documentFile && (
            <div className="mt-2">
              <a href={formData.document_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Voir le document actuel</a>
            </div>
          )}
        </div>
        
        {/* Thématique Field */}
        <div>
          <Label htmlFor="theme">Thématique</Label>
          <Select name="theme" value={formData.theme} onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))} required>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionnez une thématique" />
            </SelectTrigger>
            <SelectContent>
              {themes.map(theme => (
                <SelectItem key={theme} value={theme}>{theme}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Competition Link Field (conditional) */}
        {formData.theme === "Compétition" && (
          <div>
            <Label htmlFor="competition_id">Compétition liée</Label>
            <Select 
              name="competition_id" 
              value={formData.competition_id || ''} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, competition_id: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionnez une compétition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucune</SelectItem>
                {competitions.map(comp => (
                  <SelectItem key={comp.id} value={comp.id}>{comp.short_title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pinned Field */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_pinned"
            name="is_pinned"
            checked={formData.is_pinned}
            onChange={handleChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <Label htmlFor="is_pinned">Épingler cette actualité (affichée en haut)</Label>
        </div>

        {/* Private Field */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_private"
            name="is_private"
            checked={formData.is_private}
            onChange={handleChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <Label htmlFor="is_private">Actualité privée (réservée aux adhérents du club)</Label>
        </div>

        {/* Status Field */}
        <div>
          <Label htmlFor="status">Statut de publication</Label>
          <Select
            name="status"
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            required
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionnez un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en_cours_redaction">En cours de rédaction</SelectItem>
              <SelectItem value="publie">Publié</SelectItem>
              <SelectItem value="archive">Archivé</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Les news "en cours de rédaction" ne sont visibles que par les personnes autorisées.
          </p>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/news')}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : (id ? "Mettre à jour" : "Créer")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsEdit;
