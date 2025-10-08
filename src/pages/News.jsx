import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, PlusCircle, Loader2, Edit, Trash2, ExternalLink, Download, Users, Heart, MountainSnow as Ski, Share2, Eye, ArrowDownUp } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from 'react-router-dom';

const SHARED_BUCKET = 'exercise_images';

const NewsBanner = () => {
    const { config, loadingConfig } = useConfig();
    const imageUrl = config.news_banner_image || "https://cdn.helloasso.com/img/photos/adhesions/croppedimage-6803a6ee62bc411ba750df859ee08f93.png?resize=fill:1920:250";

    if (loadingConfig) {
        return <div className="w-full h-48 md:h-64 bg-muted rounded-lg animate-pulse mb-12"></div>;
    }

    return (
        <motion.div 
            className="mb-12 rounded-lg overflow-hidden shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
            <img src={imageUrl} alt="Bannière des actualités" className="w-full h-auto object-cover" />
        </motion.div>
    );
};

const AssociationInfo = () => (
    <motion.section 
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
    >
        <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Users className="w-8 h-8 text-primary"/>
                    <CardTitle>Pôle escalade</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Débutant ou confirmé, Enfants, Adolescents ou Adultes, Vous êtes tous les bienvenus.</p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Heart className="w-8 h-8 text-primary"/>
                    <CardTitle>L'amicale</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">L’ALJ est une association. Nous organisons diverses animations tout au long de l’année.</p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Ski className="w-8 h-8 text-primary"/>
                    <CardTitle>Pôle Ski</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">ALJ, c’est aussi du ski pour les élèves d’école primaire chaque hiver, les mercredis en janvier et février.</p>
                </CardContent>
            </Card>
        </div>
    </motion.section>
);


const NewsForm = ({ newsItem, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState(
    newsItem || {
      title: '',
      date: new Date().toISOString().split('T')[0],
      short_description: '',
      long_description: '',
      external_link: '',
      image_url: '',
      document_url: '',
    }
  );
  const [imageFile, setImageFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, imageFile, documentFile });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{newsItem ? "Modifier l'actualité" : "Créer une actualité"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Titre</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Date</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="short_description" className="text-right">Description courte</Label>
              <Textarea id="short_description" name="short_description" value={formData.short_description} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="long_description" className="text-right">Description longue</Label>
              <Textarea id="long_description" name="long_description" value={formData.long_description} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="external_link" className="text-right">Lien externe</Label>
              <Input id="external_link" name="external_link" value={formData.external_link} onChange={handleChange} className="col-span-3" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">Image</Label>
              <Input id="image" type="file" onChange={(e) => handleFileChange(e, setImageFile)} className="col-span-3" accept="image/*" />
            </div>
            {formData.image_url && !imageFile && <div className="col-start-2 col-span-3"><img src={formData.image_url} alt="Aperçu" className="h-20 rounded-md" /></div>}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document" className="text-right">Document</Label>
              <Input id="document" type="file" onChange={(e) => handleFileChange(e, setDocumentFile)} className="col-span-3" />
            </div>
            {formData.document_url && !documentFile && <div className="col-start-2 col-span-3"><a href={formData.document_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Voir le document actuel</a></div>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const News = () => {
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    const { data, error } = await supabase.from('news').select('*');
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les actualités.", variant: "destructive" });
    } else {
      setNews(data);
    }
    setLoadingNews(false);
  }, [toast]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const sortedNews = useMemo(() => {
    return [...news].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [news, sortOrder]);

  const uploadFile = async (file, bucket) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `news/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      const { id, imageFile, documentFile, ...newsData } = formData;
      
      const imageUrl = await uploadFile(imageFile, SHARED_BUCKET);
      if (imageUrl) newsData.image_url = imageUrl;

      const documentUrl = await uploadFile(documentFile, SHARED_BUCKET);
      if (documentUrl) newsData.document_url = documentUrl;

      if (editingNews) {
        const { error } = await supabase.from('news').update(newsData).eq('id', editingNews.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('news').insert(newsData);
        if (error) throw error;
      }
      toast({ title: "Succès", description: "Actualité sauvegardée." });
      setIsFormVisible(false);
      setEditingNews(null);
      fetchNews();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (newsId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette actualité ?")) return;
    try {
      const { error } = await supabase.from('news').delete().eq('id', newsId);
      if (error) throw error;
      toast({ title: "Succès", description: "Actualité supprimée." });
      fetchNews();
    } catch (error)      {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const showAdminFeatures = !authLoading && isAdmin;

  const handleShare = (platform, item) => {
    const url = `${window.location.origin}/news/${item.id}`;
    const text = `${item.title}\n\n${item.short_description || ''}\n\nPour en savoir plus, visitez notre site !`;
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

  const renderContent = () => {
    if (loadingNews || authLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    if (sortedNews.length === 0) {
      return <p className="text-center text-muted-foreground py-16">Aucune actualité pour le moment.</p>;
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {sortedNews.map((item) => (
            <motion.div 
              key={item.id} 
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="flex flex-col h-full">
                {item.image_url && (
                  <div className="cursor-pointer" onClick={() => setViewingImage(item.image_url)}>
                    <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover rounded-t-lg" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm">{item.short_description}</p>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2">
                  <div className="flex gap-2 flex-wrap">
                    <Button asChild variant="link" size="sm"><Link to={`/news/${item.id}`}><Eye className="w-4 h-4 mr-2" />Voir plus</Link></Button>
                    {item.document_url && <Button asChild variant="link" size="sm"><a href={item.document_url} target="_blank" rel="noreferrer"><Download className="w-4 h-4 mr-2" />Télécharger</a></Button>}
                  </div>
                  <div className="flex gap-2 self-end items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon"><Share2 className="w-4 h-4" /></Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="flex flex-col gap-1">
                          <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleShare('facebook', item)}>Facebook</Button>
                          <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleShare('whatsapp', item)}>WhatsApp</Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {showAdminFeatures && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingNews(item); setIsFormVisible(true); }}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Actualités - ALJ Escalade Jonage</title>
        <meta name="description" content="Les dernières actualités et annonces du club d'escalade." />
      </Helmet>

      <AssociationInfo />
      <NewsBanner />
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <Newspaper className="w-10 h-10 text-primary" />
            Actualités du Club
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}>
              <ArrowDownUp className="w-4 h-4 mr-2" />
              Trier par date ({sortOrder === 'desc' ? 'récent' : 'ancien'})
            </Button>
            {showAdminFeatures && (
              <Button onClick={() => { setEditingNews(null); setIsFormVisible(true); }}>
                <PlusCircle className="w-4 h-4 mr-2" /> Ajouter
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFormVisible && showAdminFeatures && (
          <NewsForm
            key={editingNews ? editingNews.id : 'new'}
            newsItem={editingNews}
            onSave={handleSave}
            onCancel={() => { setIsFormVisible(false); setEditingNews(null); }}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>

      {renderContent()}

      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          <img src={viewingImage} alt="Aperçu de l'actualité" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default News;