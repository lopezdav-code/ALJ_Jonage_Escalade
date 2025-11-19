import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, PlusCircle, Loader2, Edit, Trash2, FileText, Video, Image, Link as LinkIcon, UploadCloud, Puzzle, Gamepad2, Dumbbell, BrainCircuit, FileQuestion, Award } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePageAccess } from '@/hooks/usePageAccess';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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

const TAB_CONFIG = {
  'educational_game': {
    icon: Gamepad2,
    label: 'Jeux Éducatifs',
    description: 'Jeux et activités ludiques pour l\'apprentissage'
  },
  'review_sheet': {
    icon: FileText,
    label: 'Fiches de Révision',
    description: 'Supports de révision et mémo techniques'
  },
  'technical_sheet': {
    icon: FileQuestion,
    label: 'Fiches Techniques',
    description: 'Techniques et méthodes d\'escalade'
  },
  'passeports': {
    icon: Award,
    label: 'Passeports',
    description: 'Systèmes de validation des compétences FFME'
  },
  'strength_exercise': {
    icon: Dumbbell,
    label: 'Exercices de Renfo',
    description: 'Exercices de renforcement musculaire'
  },
  'warm_up_exercise': {
    icon: BrainCircuit,
    label: 'Exercices d\'Échauffement',
    description: 'Préparation physique et mentale'
  },
  'safety_sheet': {
    icon: Puzzle,
    label: 'Fiches Sécurité',
    description: 'Procédures et consignes de sécurité'
  },
  'meeting_report': {
    icon: FileText,
    label: 'Comptes Rendus',
    description: 'Comptes rendus de réunions et assemblées'
  }
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

const GameSheetDetails = ({ sheet, onEdit, onDelete, isAdmin }) => {
  const [illustrationUrl, setIllustrationUrl] = useState(null);
  const [exerciseImageUrl, setExerciseImageUrl] = useState(null);

  useEffect(() => {
    const loadImages = async () => {
      // Charger l'image d'illustration si elle existe
      if (sheet.illustration_image) {
        const url = await getSignedUrl(sheet.illustration_image);
        setIllustrationUrl(url);
      }

      // Charger l'image de l'exercice si elle existe
      if (sheet.url && sheet.type === 'image_file') {
        const url = await getSignedUrl(sheet.url);
        setExerciseImageUrl(url);
      }
    };
    loadImages();
  }, [sheet.url, sheet.type, sheet.illustration_image]);

  return (
  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <Card className="h-full flex flex-col group relative">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg leading-tight flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-purple-500" />
              {sheet.title}
            </CardTitle>
            <div className="mt-1">
              <Badge variant="game">{sheet.theme || 'Jeu Éducatif'}</Badge>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(sheet)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(sheet)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {/* Afficher l'image d'illustration en priorité, sinon l'image de l'exercice */}
        {(illustrationUrl || exerciseImageUrl) && (
          <div className="w-full">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {illustrationUrl ? 'Illustration' : 'Image de l\'exercice'}
            </p>
            <div className="w-full h-64 bg-muted rounded-md overflow-hidden">
              <img
                src={illustrationUrl || exerciseImageUrl}
                alt={sheet.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Afficher l'image de l'exercice seulement si elle existe ET qu'il y a aussi une illustration */}
        {illustrationUrl && exerciseImageUrl && (
          <div className="w-full">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Image de l'exercice</p>
            <div className="w-full h-48 bg-muted rounded-md overflow-hidden">
              <img src={exerciseImageUrl} alt={sheet.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {sheet.starting_situation && (
            <div>
              <p className="font-semibold text-sm">Situation de départ</p>
              <p className="text-sm text-muted-foreground">{sheet.starting_situation}</p>
            </div>
          )}
          {sheet.game_goal && (
            <div>
              <p className="font-semibold text-sm">But du jeu</p>
              <p className="text-sm text-muted-foreground">{sheet.game_goal}</p>
            </div>
          )}
          {sheet.evolution && (
            <div>
              <p className="font-semibold text-sm">Évolution</p>
              <p className="text-sm text-muted-foreground">{sheet.evolution}</p>
            </div>
          )}
          {sheet.skill_to_develop && (
            <div>
              <p className="font-semibold text-sm">Capacité à développer</p>
              <p className="text-sm text-muted-foreground">{sheet.skill_to_develop}</p>
            </div>
          )}
          {sheet.success_criteria && (
            <div>
              <p className="font-semibold text-sm">Critères de réussite</p>
              <p className="text-sm text-muted-foreground">{sheet.success_criteria}</p>
            </div>
          )}
          {sheet.remarks && (
            <div>
              <p className="font-semibold text-sm">Remarques</p>
              <p className="text-sm text-muted-foreground">{sheet.remarks}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
  );
};

const SheetCard = ({ sheet, onEdit, onDelete, isAdmin }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [illustrationUrl, setIllustrationUrl] = useState(null);

  useEffect(() => {
    const loadImages = async () => {
      // Charger l'image d'illustration si elle existe
      if (sheet.illustration_image) {
        const url = await getSignedUrl(sheet.illustration_image);
        setIllustrationUrl(url);
      }

      // Charger la miniature
      if (sheet.thumbnail_url) {
        const url = await getSignedUrl(sheet.thumbnail_url);
        setThumbnailUrl(url);
      } else if (sheet.type === 'image_file') {
        const url = await getSignedUrl(sheet.url);
        setThumbnailUrl(url);
      } else if (sheet.type === 'video_url') {
        const videoId = sheet.url.split('v=')[1]?.split('&')[0] || sheet.url.split('/').pop();
        if (sheet.url.includes('youtube.com') || sheet.url.includes('youtu.be')) {
          setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        }
      }
    };
    loadImages();
  }, [sheet.thumbnail_url, sheet.url, sheet.type, sheet.illustration_image]);

  const getIcon = () => {
    switch (sheet.type) {
      case 'video_url': return <Video className="w-8 h-8 text-red-500" />;
      case 'image_file': return <Image className="w-8 h-8 text-blue-500" />;
      case 'document_file':
      case 'document_url': return <FileText className="w-8 h-8 text-green-500" />;
      default: return <LinkIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  const getSheetTypeIcon = () => {
    switch (sheet.sheet_type) {
      case 'educational_game': return <Gamepad2 className="w-4 h-4" />;
      case 'warm_up_exercise': return <Dumbbell className="w-4 h-4" />;
      case 'strength_exercise': return <BrainCircuit className="w-4 h-4" />;
      case 'review_sheet': return <FileQuestion className="w-4 h-4" />;
      case 'meeting_report': return <FileText className="w-4 h-4" />;
      default: return null;
    }
  };

  if (sheet.sheet_type === 'educational_game') {
    return <GameSheetDetails sheet={sheet} onEdit={onEdit} onDelete={onDelete} isAdmin={isAdmin} />;
  }

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Card className="h-full flex flex-col group relative">
        <CardHeader className="flex-row items-start gap-4">
            {illustrationUrl || thumbnailUrl ? (
              <a href={sheet.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={illustrationUrl || thumbnailUrl}
                  alt={sheet.title}
                  className="w-32 h-20 object-cover rounded-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </a>
            ) : (
                <div className="w-32 h-20 flex items-center justify-center bg-muted rounded-md">{getIcon()}</div>
            )}
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{sheet.title}</CardTitle>
            <div className="flex flex-wrap gap-1 mt-2">
              {sheet.sheet_type && <Badge variant="outline" className="flex items-center gap-1">{getSheetTypeIcon()} {SHEET_TYPES[sheet.sheet_type]}</Badge>}
              {sheet.structure && <Badge variant="secondary">{sheet.structure}</Badge>}
              {(sheet.categories || []).map(cat => <Badge key={cat}>{cat}</Badge>)}
            </div>
          </div>
          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(sheet)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(sheet)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground">{sheet.description}</p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="link" className="p-0 h-auto">
            <a href={sheet.url} target="_blank" rel="noopener noreferrer">
              Ouvrir le média <LinkIcon className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};


const Pedagogy = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Récupérer l'onglet actif depuis l'URL, sinon utiliser "educational_game" par défaut
  const activeTab = searchParams.get('tab') || 'educational_game';
  const activeTheme = searchParams.get('theme') || '';

  // Fonction pour changer d'onglet et mettre à jour l'URL
  const handleTabChange = useCallback((value) => {
    // Réinitialiser le thème quand on change d'onglet principal
    setSearchParams({ tab: value });
  }, [setSearchParams]);

  // Fonction pour changer de sous-onglet (thème) et mettre à jour l'URL
  const handleThemeChange = useCallback((value) => {
    setSearchParams({ tab: activeTab, theme: value });
  }, [setSearchParams, activeTab]);

  const fetchSheets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('pedagogy_sheets').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les fiches pédagogiques.", variant: "destructive" });
    } else {
      setSheets(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  const handleEdit = (sheet) => {
    navigate(`/pedagogy/edit/${sheet.id}`);
  };

  const handleDelete = async (sheet) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la fiche "${sheet.title}" ?`)) return;

    try {
      if (sheet.type === 'image_file' || sheet.type === 'document_file') {
        if (sheet.url) {
          const fileName = sheet.url.split('/').pop();
          await supabase.storage.from(BUCKET_NAME).remove([fileName]);
        }
      }
      const { error } = await supabase.from('pedagogy_sheets').delete().eq('id', sheet.id);
      if (error) throw error;
      toast({ title: "Fiche supprimée", variant: "destructive" });
      fetchSheets();
    } catch (error) {
      toast({ title: "Erreur de suppression", description: error.message, variant: "destructive" });
    }
  };

  const { sheetsByType, existingThemes } = useMemo(() => {
    const grouped = sheets.reduce((acc, sheet) => {
      const type = sheet.sheet_type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(sheet);
      return acc;
    }, {});

    // Pour les jeux éducatifs, grouper aussi par thème
    if (grouped.educational_game) {
      const gamesByTheme = grouped.educational_game.reduce((acc, sheet) => {
        const theme = sheet.theme || 'Sans thème';
        if (!acc[theme]) {
          acc[theme] = [];
        }
        acc[theme].push(sheet);
        return acc;
      }, {});
      grouped.educational_game = gamesByTheme;
    }
    
    const themes = [...new Set(sheets.filter(s => s.sheet_type === 'educational_game').map(s => s.theme).filter(Boolean))];

    return { sheetsByType: grouped, existingThemes: themes };
  }, [sheets]);

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Fiches Pédagogiques - ALJ Escalade Jonage</title>
          <meta name="description" content="Ressources et supports d'apprentissage pour l'escalade." />
        </Helmet>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold headline flex items-center gap-3">
              <BookMarked className="w-10 h-10 text-primary" />
              Fiches Pédagogiques
            </h1>
            {isAdmin && (
              <Button onClick={() => navigate('/pedagogy/new')}>
                <PlusCircle className="w-4 h-4 mr-2" /> Ajouter une fiche
              </Button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : sheets.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <p className="text-lg font-semibold">Aucune fiche pédagogique pour le moment.</p>
            <p className="text-muted-foreground mt-2">Cliquez sur "Ajouter une fiche" pour commencer à créer votre bibliothèque.</p>
          </div>
        ) : (
          <>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1">
              {Object.entries(TAB_CONFIG).map(([type, config]) => {
                // Pour l'onglet passeports, toujours l'afficher
                if (type === 'passeports') {
                  const Icon = config.icon;
                  return (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="flex flex-col items-center gap-1 h-auto py-3 px-2 text-center min-h-[4rem]"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs leading-tight">{config.label}</span>
                      <Badge variant="secondary" className="text-xs">3</Badge>
                    </TabsTrigger>
                  );
                }

                const count = type === 'educational_game'
                  ? Object.values(sheetsByType[type] || {}).flat().length
                  : (sheetsByType[type] || []).length;

                if (count === 0) return null;

                const Icon = config.icon;
                return (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="flex flex-col items-center gap-1 h-auto py-3 px-2 text-center min-h-[4rem]"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs leading-tight">{config.label}</span>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Onglet Passeports */}
            <TabsContent value="passeports" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold">Passeports</h2>
                    <p className="text-muted-foreground">Systèmes de validation des compétences FFME</p>
                  </div>
                </div>

                <motion.div
                  className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Passeport Blanc */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 bg-gradient-to-br from-blue-50 to-white group"
                      onClick={() => navigate('/passeport-guide')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <span className="text-3xl">⚪</span>
                          <span className="group-hover:text-blue-600 transition-colors">Passeport Blanc</span>
                        </CardTitle>
                        <CardDescription>Je grimpe en moulinette en autonomie sur SAE</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">39 compétences</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Validation en salle de bloc et voies en moulinette. Test de prise en charge et assurage.
                        </p>
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold text-primary">Modules :</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">Éco-responsabilité</Badge>
                            <Badge variant="secondary" className="text-xs">Bloc</Badge>
                            <Badge variant="secondary" className="text-xs">Difficulté</Badge>
                            <Badge variant="secondary" className="text-xs">Sécurité</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Passeport Jaune */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-yellow-500 bg-gradient-to-br from-yellow-50 to-white group"
                      onClick={() => navigate('/passeport-guide')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <span className="text-3xl">🟡</span>
                          <span className="group-hover:text-yellow-600 transition-colors">Passeport Jaune</span>
                        </CardTitle>
                        <CardDescription>Je grimpe en tête sur SAE</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">38 compétences</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Validation en salle de bloc (niveau 4a) et voies en tête (niveau 5b). Test de prise en charge.
                        </p>
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold text-primary">Modules :</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">Éco-responsabilité</Badge>
                            <Badge variant="secondary" className="text-xs">Bloc</Badge>
                            <Badge variant="secondary" className="text-xs">Difficulté</Badge>
                            <Badge variant="secondary" className="text-xs">Sécurité</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Passeport Orange */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500 bg-gradient-to-br from-orange-50 to-white group"
                      onClick={() => navigate('/passeport-guide')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <span className="text-3xl">🟠</span>
                          <span className="group-hover:text-orange-600 transition-colors">Passeport Orange</span>
                        </CardTitle>
                        <CardDescription>Je grimpe en autonomie sur SAE</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">30 compétences</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Maîtrise complète de l'autonomie sur SAE incluant la gestion des relais et des techniques avancées.
                        </p>
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold text-primary">Compétences :</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">Relais</Badge>
                            <Badge variant="secondary" className="text-xs">Assurage</Badge>
                            <Badge variant="secondary" className="text-xs">Autonomie</Badge>
                            <Badge variant="secondary" className="text-xs">Sécurité</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </div>
            </TabsContent>

            {Object.entries(TAB_CONFIG).map(([type, config]) => {
              const typeSheets = sheetsByType[type];
              if (!typeSheets || (Array.isArray(typeSheets) && typeSheets.length === 0) ||
                  (!Array.isArray(typeSheets) && Object.keys(typeSheets).length === 0)) {
                return null;
              }

              const Icon = config.icon;

              return (
                <TabsContent key={type} value={type} className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8 text-primary" />
                      <div>
                        <h2 className="text-2xl font-bold">{config.label}</h2>
                        <p className="text-muted-foreground">{config.description}</p>
                      </div>
                    </div>

                    {type === 'educational_game' ? (
                      // Affichage spécial pour les jeux éducatifs avec sous-onglets par thème
                      <Tabs value={activeTheme || Object.keys(typeSheets)[0]} onValueChange={handleThemeChange} className="w-full">
                        <TabsList className="w-full justify-start flex-wrap h-auto gap-2 p-2">
                          {Object.entries(typeSheets).map(([theme, themeSheets]) => (
                            <TabsTrigger key={theme} value={theme} className="flex items-center gap-2">
                              <span>{theme}</span>
                              <Badge variant="outline" className="text-xs">{themeSheets.length}</Badge>
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {Object.entries(typeSheets).map(([theme, themeSheets]) => (
                          <TabsContent key={theme} value={theme} className="mt-6">
                            <div className="space-y-4">
                              <h3 className="text-xl font-semibold border-b pb-2">{theme}</h3>
                              <AnimatePresence>
                                <motion.div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {themeSheets.map(sheet => (
                                    <SheetCard
                                      key={sheet.id}
                                      sheet={sheet}
                                      onEdit={handleEdit}
                                      onDelete={handleDelete}
                                      isAdmin={isAdmin}
                                    />
                                  ))}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    ) : (
                      // Affichage standard pour les autres types
                      <AnimatePresence>
                        <motion.div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {typeSheets.map(sheet => (
                            <SheetCard
                              key={sheet.id}
                              sheet={sheet}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              isAdmin={isAdmin}
                            />
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
          </>
        )}
      </div>
  );
};

const ProtectedPedagogy = () => (
  <ProtectedRoute>
    <Pedagogy />
  </ProtectedRoute>
);

export default ProtectedPedagogy;
