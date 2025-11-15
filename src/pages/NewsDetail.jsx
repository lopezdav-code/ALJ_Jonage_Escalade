
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Calendar, ExternalLink, Download, Share2, ImagePlus, X, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadNewsGalleryImage, getSignedUrl, getSignedUrls, deleteNewsImage } from '@/lib/newsStorageUtils';

const PhotoUploadForm = ({ newsItem, onSave, onCancel, isSaving }) => {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length > 0) {
      onSave(newsItem.id, files);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter des photos pour {newsItem.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="photos">Sélectionner des photos</Label>
            <Input
              id="photos"
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*"
            />
            {files.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">{files.length} photo(s) sélectionnée(s)</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={isSaving || files.length === 0}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'Télécharger'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const NewsDetail = () => {
  const { id } = useParams();
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoUploadFormVisible, setIsPhotoUploadFormVisible] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [signedImageUrl, setSignedImageUrl] = useState(null);
  const [signedGalleryUrls, setSignedGalleryUrls] = useState([]);
  const [signedDocUrl, setSignedDocUrl] = useState(null);
  const { toast } = useToast();
  const { isAdmin, isAdherent, loading: authLoading } = useAuth();

  const fetchNewsItem = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger cette actualité.", variant: "destructive" });
    } else {
      setNewsItem(data);

      // Générer les URLs publiques pour l'image principale, la galerie et le document
      if (data.image_url) {
        const publicUrl = getSignedUrl(data.image_url);
        setSignedImageUrl(publicUrl);
      }

      if (data.photo_gallery && data.photo_gallery.length > 0) {
        const publicUrls = getSignedUrls(data.photo_gallery);
        setSignedGalleryUrls(publicUrls);
      }

      if (data.document_url) {
        const docUrl = getSignedUrl(data.document_url);
        setSignedDocUrl(docUrl);
      }
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    fetchNewsItem();
  }, [fetchNewsItem]);

  const uploadFile = async (file) => {
    if (!file) return null;
    const result = await uploadNewsGalleryImage(file, id);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.path;
  };

  const handleSavePhotos = async (newsId, files) => {
    setIsSaving(true);
    try {
      const uploadPromises = files.map(file => uploadFile(file));
      const photoPaths = await Promise.all(uploadPromises);

      const existingPhotos = newsItem.photo_gallery || [];
      const updatedPhotos = [...existingPhotos, ...photoPaths.filter(path => path)];

      const { error: updateError } = await supabase
        .from('news')
        .update({ photo_gallery: updatedPhotos })
        .eq('id', newsId);

      if (updateError) throw updateError;

      toast({ title: "Succès", description: "Photos ajoutées." });
      setIsPhotoUploadFormVisible(false);
      fetchNewsItem();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePhoto = async (photoPath) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) return;

    const updatedPhotos = (newsItem.photo_gallery || []).filter(p => p !== photoPath);

    const { error: updateError } = await supabase
      .from('news')
      .update({ photo_gallery: updatedPhotos })
      .eq('id', id);

    if (updateError) {
      toast({ title: "Erreur", description: "Impossible de supprimer la photo.", variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Photo supprimée." });
      fetchNewsItem();

      await deleteNewsImage(photoPath);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `${newsItem.title}\n\n${newsItem.short_description || ''}\n\nPour en savoir plus, visitez notre site !`;
    let shareUrl = '';

    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + url)}`;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const showAdminFeatures = !authLoading && isAdmin;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Actualité non trouvée</h1>
        <p className="text-muted-foreground">Cette actualité n'existe pas ou a été supprimée.</p>
        <BackButton to="/news" className="mt-4">
          Retour aux actualités
        </BackButton>
      </div>
    );
  }

  // Check if user has access to private news
  if (newsItem.is_private && !isAdherent && !authLoading) {
    return (
      <div className="text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="mb-6 flex justify-center">
            <div className="bg-amber-100 dark:bg-amber-900 p-6 rounded-full">
              <Lock className="w-16 h-16 text-amber-600 dark:text-amber-300" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Actualité privée
          </h1>
          <p className="text-muted-foreground mb-6">
            Cette actualité est réservée aux adhérents du club. Veuillez vous connecter avec un compte adhérent pour y accéder.
          </p>
          <div className="flex gap-4 justify-center">
            <BackButton to="/news" variant="outline">
              Retour aux actualités
            </BackButton>
            <Button asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${newsItem.title} - Actualités`}</title>
        <meta name="description" content={newsItem.short_description} />
        <meta property="og:title" content={newsItem.title} />
        <meta property="og:description" content={newsItem.short_description} />
        {newsItem.image_url && <meta property="og:image" content={newsItem.image_url} />}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BackButton to="/news" variant="outline" className="mb-8">
          Retour aux actualités
        </BackButton>
        <Card>
          {signedImageUrl && (
            <img src={signedImageUrl} alt={newsItem.title} className="w-full h-64 md:h-96 object-cover rounded-t-lg" />
          )}
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <CardTitle className="text-3xl md:text-4xl font-bold headline flex-1">{newsItem.title}</CardTitle>
              {newsItem.is_private && (
                <div className="flex items-center gap-2 text-sm bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-3 py-1.5 rounded-full">
                  <Lock className="w-4 h-4" />
                  <span>Actualité privée</span>
                </div>
              )}
            </div>
            <CardDescription className="flex items-center gap-2 pt-2">
              <Calendar className="w-4 h-4" />
              {new Date(newsItem.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-lg">
            <p className="font-semibold">{newsItem.short_description}</p>
            {newsItem.long_description && <p className="text-muted-foreground whitespace-pre-wrap">{newsItem.long_description}</p>}
            
            {signedGalleryUrls && signedGalleryUrls.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold mb-4">Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {signedGalleryUrls.map((signedUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={signedUrl}
                        alt={`Photo de l'actualité ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md cursor-pointer"
                        onClick={() => setViewingImage(signedUrl)}
                      />
                      {showAdminFeatures && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeletePhoto(newsItem.photo_gallery[index])}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {newsItem.external_link && <Button asChild variant="outline"><a href={newsItem.external_link} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Plus d'infos</a></Button>}
              {signedDocUrl && <Button asChild variant="outline"><a href={signedDocUrl} target="_blank" rel="noreferrer"><Download className="w-4 h-4 mr-2" />Télécharger</a></Button>}
              {showAdminFeatures && (
                <Button variant="outline" onClick={() => setIsPhotoUploadFormVisible(true)}>
                  <ImagePlus className="w-4 h-4 mr-2" /> Ajouter des photos
                </Button>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon"><Share2 className="w-5 h-5" /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleShare('facebook')}>Facebook</Button>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleShare('whatsapp')}>WhatsApp</Button>
                </div>
              </PopoverContent>
            </Popover>
          </CardFooter>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isPhotoUploadFormVisible && showAdminFeatures && (
          <PhotoUploadForm
            newsItem={newsItem}
            onSave={handleSavePhotos}
            onCancel={() => setIsPhotoUploadFormVisible(false)}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>

      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          <img src={viewingImage} alt="Aperçu de la photo" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewsDetail;
