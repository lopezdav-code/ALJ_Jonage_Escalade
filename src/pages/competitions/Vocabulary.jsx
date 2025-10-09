import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, Video, Image, Link as LinkIcon, Gamepad2, Dumbbell, BrainCircuit, FileQuestion, Loader2, ChevronDown, Search, Filter, X, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

// Réutilisation des constantes de Pedagogy.jsx
const SHEET_TYPES = {
  'educational_game': 'Jeu éducatif',
  'warm_up_exercise': 'Exercice d\'échauffement',
  'strength_exercise': 'Exercice de renfo',
  'review_sheet': 'Fiche de révision',
  'technical_sheet': 'Fiche technique',
  'safety_sheet': 'Fiche sécurité',
  'meeting_report': 'Compte rendu de réunion'
};

// Composant réutilisé de Pedagogy.jsx pour l'affichage des fiches
const PedagogySheetCard = ({ sheet }) => {
  const getIcon = () => {
    switch (sheet.type) {
      case 'video_url': return <Video className="w-8 h-8 text-red-500" />;
      case 'image_file': return <Image className="w-8 h-8 text-blue-500" />;
      case 'document_file':
      case 'document_url': return <FileText className="w-8 h-8 text-green-500" />;
      default: return <LinkIcon className="w-8 h-8 text-gray-500" />;
    }
  };
  
  const getThumbnail = () => {
    if (sheet.thumbnail_url) return sheet.thumbnail_url;
    if (sheet.type === 'image_file') return sheet.url;
    if (sheet.type === 'video_url') {
      const videoId = sheet.url.split('v=')[1]?.split('&')[0] || sheet.url.split('/').pop();
      if (sheet.url.includes('youtube.com') || sheet.url.includes('youtu.be')) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    return null;
  };

  const getSheetTypeIcon = () => {
    switch (sheet.sheet_type) {
      case 'educational_game': return <Gamepad2 className="w-4 h-4" />;
      case 'warm_up_exercise': return <Dumbbell className="w-4 h-4" />;
      case 'strength_exercise': return <BrainCircuit className="w-4 h-4" />;
      case 'review_sheet': return <FileQuestion className="w-4 h-4" />;
      case 'technical_sheet': return <FileText className="w-4 h-4" />;
      case 'safety_sheet': return <BookOpen className="w-4 h-4" />;
      case 'meeting_report': return <FileText className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex gap-4">
            {getThumbnail() ? (
              <a href={sheet.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <img 
                  src={getThumbnail()} 
                  alt={sheet.title} 
                  className="w-24 h-16 object-cover rounded-md hover:opacity-80 transition-opacity" 
                />
              </a>
            ) : (
              <div className="w-24 h-16 flex items-center justify-center bg-muted rounded-md shrink-0">
                {getIcon()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight mb-2">{sheet.title}</CardTitle>
              <div className="flex flex-wrap gap-1">
                {sheet.sheet_type && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    {getSheetTypeIcon()} 
                    {SHEET_TYPES[sheet.sheet_type]}
                  </Badge>
                )}
                {sheet.structure && <Badge variant="secondary" className="text-xs">{sheet.structure}</Badge>}
                {(sheet.categories || []).map(cat => (
                  <Badge key={cat} className="text-xs">{cat}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        {sheet.description && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-3">{sheet.description}</p>
          </CardContent>
        )}
        <CardContent className="pt-2 mt-auto">
          <a 
            href={sheet.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            {getIcon()}
            Consulter la ressource
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Vocabulary = () => {
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [savedSheets, setSavedSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStructure, setSelectedStructure] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Logique de filtrage et recherche
  const filteredSheets = useMemo(() => {
    if (!sheets) return [];
    
    return sheets.filter(sheet => {
      // Filtre par terme de recherche
      const matchesSearch = !searchTerm || 
        sheet.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sheet.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtre par type
      const matchesType = !selectedType || sheet.sheet_type === selectedType;
      
      // Filtre par structure
      const matchesStructure = !selectedStructure || sheet.structure === selectedStructure;
      
      // Filtre par catégorie
      const matchesCategory = !selectedCategory || 
        (sheet.categories && sheet.categories.includes(selectedCategory));
      
      return matchesSearch && matchesType && matchesStructure && matchesCategory;
    });
  }, [sheets, searchTerm, selectedType, selectedStructure, selectedCategory]);

  // Extraire les valeurs uniques pour les filtres
  const uniqueStructures = useMemo(() => {
    const structures = sheets.map(sheet => sheet.structure).filter(Boolean);
    return [...new Set(structures)];
  }, [sheets]);

  const uniqueCategories = useMemo(() => {
    const categories = sheets.flatMap(sheet => sheet.categories || []);
    return [...new Set(categories)];
  }, [sheets]);

  // Fonction pour réinitialiser les filtres
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStructure('');
    setSelectedCategory('');
    setSelectedSheet(null);
  };

  // Fonction pour sélectionner une fiche depuis la modale
  const selectSheetFromModal = async (sheet) => {
    // Vérifier si la fiche n'est pas déjà sauvegardée
    const isAlreadySaved = savedSheets.some(saved => 
      saved.pedagogy_sheet_id === sheet.id
    );
    
    if (isAlreadySaved) {
      toast({ 
        title: "Information", 
        description: "Cette fiche est déjà sauvegardée.", 
        variant: "default" 
      });
      setIsDialogOpen(false);
      return;
    }

    setSelectedSheet(sheet);
    setIsDialogOpen(false);
    
    // Sauvegarder automatiquement en BDD
    await saveSheetToDB(sheet.id);
  };

  const fetchSheets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pedagogy_sheets')
        .select('*')
        .order('title');

      if (error) throw error;
      setSheets(data || []);
    } catch (error) {
      console.error('Error fetching pedagogy sheets:', error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de charger les fiches pédagogiques.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Récupérer les fiches sauvegardées pour la page Vocabulaire
  const fetchSavedSheets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vocabulary_sheets')
        .select(`
          id,
          pedagogy_sheet_id,
          created_at,
          pedagogy_sheets (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          // Table n'existe pas encore
          setSavedSheets([]);
          toast({ 
            title: "Information", 
            description: "Table vocabulary_sheets non trouvée. Veuillez créer la table en base.", 
            variant: "default" 
          });
        } else {
          throw error;
        }
      } else {
        setSavedSheets(data || []);
      }
    } catch (error) {
      console.error('Error fetching saved sheets:', error);
      setSavedSheets([]);
      toast({ 
        title: "Erreur", 
        description: "Impossible de charger les fiches sauvegardées.", 
        variant: "destructive" 
      });
    }
  }, [toast]);

  // Sauvegarder une fiche en BDD
  const saveSheetToDB = async (sheetId) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('vocabulary_sheets')
        .insert([{ pedagogy_sheet_id: sheetId }])
        .select(`
          id,
          pedagogy_sheet_id,
          created_at,
          pedagogy_sheets (*)
        `);

      if (error) {
        if (error.code === 'PGRST205') {
          // Table n'existe pas
          toast({ 
            title: "Table manquante", 
            description: "La table vocabulary_sheets n'existe pas. Veuillez créer la table en base de données.", 
            variant: "destructive" 
          });
        } else {
          throw error;
        }
      } else {
        setSavedSheets(prev => [data[0], ...prev]);
        toast({ 
          title: "Succès", 
          description: "Fiche sauvegardée avec succès !" 
        });
      }
    } catch (error) {
      console.error('Error saving sheet:', error);
      toast({ 
        title: "Erreur", 
        description: `Impossible de sauvegarder la fiche: ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une fiche sauvegardée
  const removeSavedSheet = async (vocabularySheetId) => {
    try {
      const { error } = await supabase
        .from('vocabulary_sheets')
        .delete()
        .eq('id', vocabularySheetId);

      if (error) throw error;
      
      setSavedSheets(prev => prev.filter(item => item.id !== vocabularySheetId));
      toast({ 
        title: "Succès", 
        description: "Fiche supprimée avec succès !" 
      });
    } catch (error) {
      console.error('Error removing sheet:', error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer la fiche.", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    fetchSheets();
    fetchSavedSheets();
  }, [fetchSheets, fetchSavedSheets]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.2 }} 
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold headline flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-primary" /> 
        Vocabulaire & Ressources
      </h2>

      {/* Section Vocabulaire classique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Vocabulaire des Compétitions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Contest</h3>
            <p className="text-muted-foreground">Manifestation avec un règlement souple (idéal pour commencer). Ouvert aux compétiteurs concernés sous certaines réserves (niveau trop élevé notamment). À ne pas confondre avec une compétition en 'mode contest'.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Open</h3>
            <p className="text-muted-foreground">Ouvert aux compétiteurs concernés sous certaines réserves (géographiques, nombre de places,…).</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Coupe</h3>
            <p className="text-muted-foreground">Ensemble de compétitions ouvert aux compétiteurs concernés avec ou sans critère de sélection.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Championnat</h3>
            <p className="text-muted-foreground">Une compétition avec généralement un critère de sélection.</p>
          </div>
        </CardContent>
      </Card>

      {/* Section Ressources Pédagogiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ressources Pédagogiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sheets.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Aucune ressource pédagogique disponible.
            </p>
          ) : (
            <>
              {/* Bouton pour ouvrir la modale de sélection */}
              <div className="flex justify-center">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2" disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Ajouter une fiche
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Sélectionner une fiche pédagogique
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto space-y-4">
                      {/* Barre de recherche et filtres dans la modale */}
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Filter className="w-4 h-4" />
                          <span className="font-medium">Filtres de recherche</span>
                          {(searchTerm || selectedType || selectedStructure || selectedCategory) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={clearFilters}
                              className="ml-auto text-xs"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Effacer
                            </Button>
                          )}
                        </div>

                        {/* Champ de recherche */}
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                          <Input
                            placeholder="Rechercher par titre ou description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        {/* Filtres */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Filtre par type */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Type de fiche</label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Tous les types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Tous les types</SelectItem>
                                {Object.entries(SHEET_TYPES).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Filtre par structure */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Structure</label>
                            <Select value={selectedStructure} onValueChange={setSelectedStructure}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Toutes les structures" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Toutes les structures</SelectItem>
                                {uniqueStructures.map(structure => (
                                  <SelectItem key={structure} value={structure}>{structure}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Filtre par catégorie */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Toutes les catégories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Toutes les catégories</SelectItem>
                                {uniqueCategories.map(category => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Nombre de résultats */}
                        <div className="text-sm text-muted-foreground">
                          {filteredSheets.length} fiche(s) trouvée(s) sur {sheets.length}
                        </div>
                      </div>

                      {/* Grille des fiches filtrées */}
                      {filteredSheets.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                          Aucune fiche ne correspond aux critères de recherche.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredSheets.map((sheet) => (
                            <motion.div
                              key={sheet.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="cursor-pointer"
                              onClick={() => selectSheetFromModal(sheet)}
                            >
                              <Card className="h-full hover:shadow-md transition-shadow border-2 hover:border-primary/20">
                                <CardHeader className="pb-3">
                                  <div className="flex gap-3">
                                    {sheet.thumbnail_url || (sheet.type === 'image_file' && sheet.url) ? (
                                      <img 
                                        src={sheet.thumbnail_url || sheet.url} 
                                        alt={sheet.title} 
                                        className="w-16 h-12 object-cover rounded-md shrink-0" 
                                      />
                                    ) : (
                                      <div className="w-16 h-12 flex items-center justify-center bg-muted rounded-md shrink-0">
                                        <FileText className="w-6 h-6 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-sm leading-tight mb-1 line-clamp-2">{sheet.title}</CardTitle>
                                      <div className="flex flex-wrap gap-1">
                                        {sheet.sheet_type && (
                                          <Badge variant="outline" className="text-xs">
                                            {SHEET_TYPES[sheet.sheet_type]}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                                {sheet.description && (
                                  <CardContent className="pt-0">
                                    <p className="text-xs text-muted-foreground line-clamp-2">{sheet.description}</p>
                                  </CardContent>
                                )}
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Affichage des fiches sauvegardées */}
              {savedSheets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Fiches sauvegardées ({savedSheets.length}) :</h3>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {savedSheets.map((savedItem) => (
                        <motion.div
                          key={savedItem.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                          className="relative"
                        >
                          <div className="relative">
                            <PedagogySheetCard sheet={savedItem.pedagogy_sheets} />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0"
                              onClick={() => removeSavedSheet(savedItem.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              
              {savedSheets.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">
                    Aucune fiche pédagogique sauvegardée.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur "Ajouter une fiche" pour commencer.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default Vocabulary;