import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, PlusCircle, Loader2, Edit, Trash2, ExternalLink, Download, Users, Heart, MountainSnow as Ski, Share2, Eye, ArrowDownUp, Lock, Archive, FileEdit, MoreVertical } from 'lucide-react';
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
import { getSignedUrl } from '@/lib/newsStorageUtils';
import { useNewsPermissions } from '@/hooks/useNewsPermissions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const [statusFilter, setStatusFilter] = useState('publie'); // Filter by status
  const [signedUrls, setSignedUrls] = useState({});
  const [signedDocUrls, setSignedDocUrls] = useState({});
  const { toast } = useToast();
  const { isAdmin, isAdherent, loading: authLoading } = useAuth();
  const { canDelete, canArchive, canViewUnpublished, canEdit, loading: permissionsLoading } = useNewsPermissions();

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    // Fetch articles with pagination (limit to 10)
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('date', { ascending: false })
      .range(0, 9); // Limit to 10 articles (0-indexed, so 0-9 = 10 items)

    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les actualités.", variant: "destructive" });
    } else {
      setNews(data);

      // Générer les signed URLs (getSignedUrl est synchrone, donc c'est instantané)
      const urlsMap = {};
      const docUrlsMap = {};

      for (const item of data) {
        if (item.image_url) {
          const signedUrl = getSignedUrl(item.image_url);
          if (signedUrl) {
            urlsMap[item.id] = signedUrl;
          }
        }
        if (item.document_url) {
          const signedDocUrl = getSignedUrl(item.document_url);
          if (signedDocUrl) {
            docUrlsMap[item.id] = signedDocUrl;
          }
        }
      }

      setSignedUrls(urlsMap);
      setSignedDocUrls(docUrlsMap);
    }
    setLoadingNews(false);
  }, []);

  useEffect(() => {
    // Fetch news immediately on mount - RLS protects sensitive data on the server
    fetchNews();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const filteredAndSortedNews = useMemo(() => {
    let processedNews = [...news];

    // Filter private news: only show if user is adherent or admin
    processedNews = processedNews.filter(item => {
      if (item.is_private) {
        return isAdherent; // Only adherents, encadrants and admins can see private news
      }
      return true; // Public news visible to everyone
    });

    // Filter by status
    processedNews = processedNews.filter(item => {
      const itemStatus = item.status || 'publie'; // Default to 'publie' for old news without status

      // If status is 'en_cours_redaction', only show if user has permission to view unpublished
      if (itemStatus === 'en_cours_redaction') {
        return canViewUnpublished;
      }

      // Apply status filter
      if (statusFilter === 'all') {
        return true; // Show all statuses if filter is 'all'
      }

      return itemStatus === statusFilter;
    });

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
  }, [news, sortOrder, selectedTheme, selectedDate, isAdherent, statusFilter, canViewUnpublished]);

  const handleDelete = async (newsId) => {
    if (!canDelete) {
      toast({ title: "Erreur", description: "Vous n'avez pas la permission de supprimer des actualités.", variant: "destructive" });
      return;
    }
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

  const handleStatusChange = async (newsId, newStatus) => {
    if (newStatus === 'archive' && !canArchive) {
      toast({ title: "Erreur", description: "Vous n'avez pas la permission d'archiver des actualités.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from('news').update({ status: newStatus }).eq('id', newsId);
      if (error) throw error;

      const statusLabels = {
        'en_cours_redaction': 'en cours de rédaction',
        'publie': 'publiée',
        'archive': 'archivée'
      };

      toast({ title: "Succès", description: `Actualité ${statusLabels[newStatus]}.` });
      fetchNews();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const showAdminFeatures = !authLoading && (isAdmin || canEdit);

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
              {signedUrls[item.id] && (
                <div
                  className="cursor-pointer bg-muted rounded-t-lg"
                  onClick={() => setViewingImage(signedUrls[item.id])}
                >
                  <div className="w-full h-48 flex items-center justify-center p-2">
                    <img
                      src={signedUrls[item.id]}
                      alt={item.title}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="flex-1">{item.title}</CardTitle>
                  {item.is_private && (
                    <div className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full">
                      <Lock className="w-3 h-3" />
                      <span>Privé</span>
                    </div>
                  )}
                  {(item.status === 'en_cours_redaction') && (
                    <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                      <FileEdit className="w-3 h-3" />
                      <span>En rédaction</span>
                    </div>
                  )}
                  {(item.status === 'archive') && (
                    <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full">
                      <Archive className="w-3 h-3" />
                      <span>Archivé</span>
                    </div>
                  )}
                </div>
                <CardDescription>{new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm">{item.short_description}</p>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2">
                <div className="flex gap-2 flex-wrap">
                  <Button asChild variant="link" size="sm"><Link to={`/news/${item.id}`}><Eye className="w-4 h-4 mr-2" />Voir plus</Link></Button>
                  {signedDocUrls[item.id] && <Button asChild variant="link" size="sm"><a href={signedDocUrls[item.id]} target="_blank" rel="noreferrer"><Download className="w-4 h-4 mr-2" />Télécharger</a></Button>}
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
                      {canEdit && (
                        <Button asChild variant="ghost" size="icon">
                          <Link to={`/news/edit/${item.id}`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                      {(canArchive || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canArchive && (
                              <>
                                {item.status !== 'publie' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'publie')}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Publier
                                  </DropdownMenuItem>
                                )}
                                {item.status !== 'en_cours_redaction' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'en_cours_redaction')}>
                                    <FileEdit className="w-4 h-4 mr-2" />
                                    Mettre en rédaction
                                  </DropdownMenuItem>
                                )}
                                {item.status !== 'archive' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'archive')}>
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archiver
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(item.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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

        {/* Status filter - only show if user has permission to view unpublished */}
        {canViewUnpublished && (
          <motion.div
            className="flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <span className="text-sm font-medium self-center text-muted-foreground">Statut :</span>
            <Button
              size="sm"
              variant={statusFilter === 'publie' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('publie')}
              className="rounded-full"
            >
              Publiées
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'en_cours_redaction' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('en_cours_redaction')}
              className="rounded-full"
            >
              <FileEdit className="w-3 h-3 mr-1" />
              En rédaction
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'archive' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('archive')}
              className="rounded-full"
            >
              <Archive className="w-3 h-3 mr-1" />
              Archivées
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className="rounded-full"
            >
              Toutes
            </Button>
          </motion.div>
        )}

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
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-black/95 border-0">
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <img
              src={viewingImage}
              alt="Aperçu de l'actualité"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default News;
