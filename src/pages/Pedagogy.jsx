import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, PlusCircle, Loader2, Edit, Trash2, FileText, Video, Image, Link as LinkIcon, UploadCloud, Puzzle, Gamepad2, Dumbbell, BrainCircuit, FileQuestion, Award } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

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
  'technical_sheet': {
    icon: FileQuestion,
    label: 'Fiches Techniques',
    description: 'Techniques et méthodes d\'escalade'
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

const SheetForm = ({ sheet, onSave, onCancel, isSaving, existingThemes }) => {
  const [formData, setFormData] = useState(sheet || { title: '', description: '', type: 'video_url', url: '', structure: 'SAE', categories: [], sheet_type: 'warm_up_exercise' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (sheet) {
      setFormData({
        ...sheet,
        categories: sheet.categories || [],
        sheet_type: sheet.sheet_type || 'warm_up_exercise',
      });
    }
  }, [sheet]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value) => {
    setFormData(prev => ({ ...prev, type: value, url: '' }));
    setFile(null);
  };
  
  const handleStructureChange = (value) => {
    setFormData(prev => ({ ...prev, structure: value }));
  };

  const handleSheetTypeChange = (value) => {
    setFormData(prev => ({ ...prev, sheet_type: value }));
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => {
      const currentCategories = prev.categories || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, file);
  };

  const isUrlType = formData.type === 'video_url' || formData.type === 'document_url';
  const isFileType = formData.type === 'image_file' || formData.type === 'document_file';
  const isGameType = formData.sheet_type === 'educational_game';

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{sheet ? 'Modifier la fiche' : 'Ajouter une fiche pédagogique'}</DialogTitle>
            <DialogDescription>Remplissez les informations ci-dessous.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet_type">Type de Fiche</Label>
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
              <Label htmlFor="type">Type de Média</Label>
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
                  <Label htmlFor="starting_situation">Situation de départ</Label>
                  <Textarea id="starting_situation" name="starting_situation" value={formData.starting_situation || ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="game_goal">But du jeu</Label>
                  <Textarea id="game_goal" name="game_goal" value={formData.game_goal || ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evolution">Évolution</Label>
                  <Textarea id="evolution" name="evolution" value={formData.evolution || ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill_to_develop">Capacité à développer</Label>
                  <Textarea id="skill_to_develop" name="skill_to_develop" value={formData.skill_to_develop || ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="success_criteria">Critères de réussite</Label>
                  <Textarea id="success_criteria" name="success_criteria" value={formData.success_criteria || ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarques</Label>
                  <Textarea id="remarks" name="remarks" value={formData.remarks || ''} onChange={handleChange} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="url">URL du média</Label>
                <Input id="url" name="url" value={formData.url} onChange={handleChange} placeholder="https://example.com/..." required />
              </div>
            ) : isFileType ? (
              <div className="space-y-2">
                <Label htmlFor="file-upload">Fichier</Label>
                <div className="flex items-center justify-center w-full">
                    <Label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Cliquez pour téléverser</span> ou glissez-déposez</p>
                            <p className="text-xs text-muted-foreground">{file ? file.name : 'Image, PDF, PPT...'}</p>
                        </div>
                        <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                    </Label>
                </div>
                {sheet && !file && sheet.url && <p className="text-xs text-muted-foreground mt-1">Fichier actuel : {sheet.url.split('/').pop()}</p>}
              </div>
            ) : null}
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const GameSheetDetails = ({ sheet, onEdit, onDelete, isAdmin }) => (
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
      <CardContent className="flex-grow grid md:grid-cols-2 gap-6">
        {sheet.url && (
          <div className="w-full h-48 bg-muted rounded-md overflow-hidden">
            <img src={sheet.url} alt={sheet.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className={`space-y-4 ${sheet.url ? '' : 'md:col-span-2'}`}>
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

const SheetCard = ({ sheet, onEdit, onDelete, isAdmin }) => {
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
            {getThumbnail() ? (
              <a href={sheet.url} target="_blank" rel="noopener noreferrer">
                <img src={getThumbnail()} alt={sheet.title} className="w-32 h-20 object-cover rounded-md" />
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

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

  const handleSave = async (formData, file) => {
    setIsSaving(true);
    let sheetData = { ...formData };

    try {
      if (file && (sheetData.type === 'image_file' || sheetData.type === 'document_file')) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, { upsert: true });
        
        if (uploadError) {
            if (uploadError.message.includes('Bucket not found')) {
                 toast({ title: "Erreur de configuration", description: "Le bucket de stockage n'a pas été trouvé. Tentative de réparation...", variant: "destructive" });
                 navigate('/setup');
                 return;
            } else {
                throw uploadError;
            }
        }
        
        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        sheetData.url = publicUrlData.publicUrl;
      }

      if (editingSheet) {
          const { error } = await supabase.from('pedagogy_sheets').update(sheetData).eq('id', editingSheet.id);
          if (error) throw error;
          toast({ title: "Fiche modifiée", description: "La fiche a été mise à jour." });
      } else {
          const { error } = await supabase.from('pedagogy_sheets').insert(sheetData);
          if (error) throw error;
          toast({ title: "Fiche ajoutée", description: "La nouvelle fiche a été enregistrée." });
      }

      setIsFormOpen(false);
      setEditingSheet(null);
      fetchSheets();
    } catch (error) {
      toast({ title: "Erreur d'enregistrement", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (sheet) => {
    setEditingSheet(sheet);
    setIsFormOpen(true);
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
            <Button onClick={() => { setEditingSheet(null); setIsFormOpen(true); }}>
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
          {/* Carte Passeports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-blue-50 to-orange-50"
              onClick={() => navigate('/passeport-guide')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Award className="w-8 h-8 text-primary" />
                  Passeports
                </CardTitle>
                <CardDescription className="text-base">
                  Consultez les compétences à valider pour chaque niveau de passeport
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white border-2 border-gray-400 text-gray-800 text-lg px-3 py-1">
                    ⚪ Blanc
                  </Badge>
                  <Badge className="bg-yellow-400 text-gray-900 text-lg px-3 py-1">
                    🟡 Jaune
                  </Badge>
                  <Badge className="bg-orange-500 text-white text-lg px-3 py-1">
                    🟠 Orange
                  </Badge>
                  <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                    🔴 Rouge
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        <Tabs defaultValue="educational_game" className="w-full">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full h-auto p-1">
            {Object.entries(TAB_CONFIG).map(([type, config]) => {
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
                    <Tabs defaultValue={Object.keys(typeSheets)[0]} className="w-full">
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

      <AnimatePresence>
        {isFormOpen && isAdmin && (
          <SheetForm
            sheet={editingSheet}
            onSave={handleSave}
            onCancel={() => { setIsFormOpen(false); setEditingSheet(null); }}
            isSaving={isSaving}
            existingThemes={existingThemes}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pedagogy;