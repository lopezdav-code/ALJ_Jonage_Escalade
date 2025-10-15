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
import { Dialog, DialogContent } from '@/components/ui/dialog'; // Only Dialog and DialogContent needed for image viewer
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from 'react-router-dom';

const SHARED_BUCKET = 'exercise_images';

const themes = [
  "Compétition",
  "Information générale",
  "Stage / sortie",
  "Événement au club",
  "Appel au bénévolat"
];

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

const News = () => {
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // Default to descending (newest first)
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    // Fetch all relevant columns, including theme and is_pinned
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

  const filteredAndSortedNews = useMemo(() => {
    let processedNews = [...news];

    // Apply theme filter
    if (selectedTheme) {
      processedNews = processedNews.filter(item => item.theme === selectedTheme);
    }

    // Apply date filter
    if (selectedDate) {
      processedNews = processedNews.filter(item => item.date && item.date.startsWith(selectedDate));
    }

    // Separate pinned and non-pinned news
    const pinnedNews = processedNews.filter(item => item.is_pinned);
    const nonPinnedNews = processedNews.filter(item => !item.is_pinned);

    // Sort pinned news (e.g., by date descending)
    pinnedNews.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Sort non-pinned news by date
    nonPinnedNews.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return { pinnedNews, nonPinnedNews };
  }, [news, sortOrder, selectedTheme, selectedDate]);

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

  const renderNewsItems = (items) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {items.map((item) => (
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
                  {item.theme === "Compétition" && item.competition_id && item.competitions && (
                    <Button asChild variant="link" size="sm">
                      <Link to={`/competitions/${item.competition_id}`}><ExternalLink className="w-4 h-4 mr-2" />{item.competitions.short_title}</Link>
                    </Button>
                  )}
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
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/news/edit/${item.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
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

  const renderContent = () => {
    if (loadingNews || authLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    const { pinnedNews, nonPinnedNews } = filteredAndSortedNews;

    if (pinnedNews.length === 0 && nonPinnedNews.length === 0) {
      return <p className="text-center text-muted-foreground py-16">Aucune actualité pour le moment.</p>;
    }

    return (
      <>
        {pinnedNews.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="mb-8 p-6 bg-primary/10 border-l-4 border-primary rounded-md shadow-sm"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-primary" /> Informations Importantes
            </h2>
            {renderNewsItems(pinnedNews)}
          </motion.section>
        )}
        {nonPinnedNews.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            {renderNewsItems(nonPinnedNews)}
          </motion.div>
        )}
      </>
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
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <Newspaper className="w-10 h-10 text-primary" />
            Actualités du Club
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="date-filter">Date:</Label>
              <Input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <Button variant="outline" onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}>
              <ArrowDownUp className="w-4 h-4 mr-2" />
              Trier par date ({sortOrder === 'desc' ? 'récent' : 'ancien'})
            </Button>
            {showAdminFeatures && (
              <Button asChild>
                <Link to="/news/new">
                  <PlusCircle className="w-4 h-4 mr-2" /> Ajouter
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Theme filter buttons */}
        <motion.div
          className="flex flex-wrap gap-2 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Button
            variant={selectedTheme === '' ? 'default' : 'outline'}
            onClick={() => setSelectedTheme('')}
            className="rounded-full"
          >
            Tous les thèmes
          </Button>
          {themes.map(theme => (
            <Button
              key={theme}
              variant={selectedTheme === theme ? 'default' : 'outline'}
              onClick={() => setSelectedTheme(theme)}
              className="rounded-full"
            >
              {theme}
            </Button>
          ))}
        </motion.div>
      </motion.div>

      {/* Removed the Dialog for NewsForm as it's now handled by news_edit.jsx */}

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
