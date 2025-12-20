import React, { useState, useMemo } from 'react';
import { X, Loader2, Zap, CheckCircle2, Copy, Download, ExternalLink, Code, Instagram, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { generatePosterViaAI, validatePosterPayload, getN8nWebhookUrl, publishToInstagram } from '@/services/n8nService';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatName } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';

const GeneratePosterDialog = ({
  isOpen,
  onClose,
  competition,
  participants = [],
  competitionPhotoUrl = null,
  competitionPhotoGallery = [],
  onPosterGenerated = () => { }
}) => {
  const { toast } = useToast();

  // État du formulaire
  const [posterType, setPosterType] = useState('solo');
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [selectedAthletes, setSelectedAthletes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [n8nUrl, setN8nUrl] = useState('');
  const [generatedPosterUrl, setGeneratedPosterUrl] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [editablePayload, setEditablePayload] = useState('');

  // États Instagram
  const [isPublishingToInsta, setIsPublishingToInsta] = useState(false);
  const [instaAccount, setInstaAccount] = useState('club_officiel');
  const [instaCaption, setInstaCaption] = useState('');
  const [showInstaForm, setShowInstaForm] = useState(false);
  const [instaPublished, setInstaPublished] = useState(false);

  // Initialiser avec la première photo de la galerie
  React.useEffect(() => {
    if (isOpen && !selectedPhoto && competitionPhotoGallery && competitionPhotoGallery.length > 0) {
      setSelectedPhoto(competitionPhotoGallery[0]);
    }
    if (!isOpen) {
      setShowResult(false);
      setGeneratedPosterUrl(null);
      setShowInstaForm(false);
      setInstaPublished(false);
      setInstaCaption('');
    }
  }, [isOpen, competitionPhotoGallery]);

  // Charger l'URL n8n par défaut
  React.useEffect(() => {
    let mounted = true;
    getN8nWebhookUrl().then(url => {
      if (mounted && url) setN8nUrl(url);
    }).catch(() => { });
    return () => { mounted = false; };
  }, []);

  // Formater la date courte
  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Limiter le nombre d'athlètes en fonction du type
  const maxAthletes = posterType === 'solo' ? 1 : 999;

  // Athlètes groupés par sexe et catégorie
  const athletesByGenderAndCategory = useMemo(() => {
    const competitors = participants
      .filter(p => p.role === 'Competiteur')
      .filter(p => p.members); // Seulement ceux avec données membres

    const grouped = {
      femmes: {},
      hommes: {},
      inconnu: {}
    };

    competitors.forEach(competitor => {
      // Déterminer le sexe
      let gender;
      if (competitor.members.sexe === 'F') {
        gender = 'femmes';
      } else if (competitor.members.sexe === 'H') {
        gender = 'hommes';
      } else {
        gender = 'inconnu';
      }

      // Déterminer la catégorie
      const category = competitor.members.category || 'Sans catégorie';

      if (!grouped[gender][category]) {
        grouped[gender][category] = [];
      }

      const member = competitor.members || {};
      const displayName = formatName(member.first_name, member.last_name) || member.email || '';

      grouped[gender][category].push({
        id: competitor.id,
        name: displayName,
        rank: competitor.ranking || null,
        category,
        gender
      });
    });

    // Trier par rang dans chaque catégorie
    Object.keys(grouped).forEach(gender => {
      Object.keys(grouped[gender]).forEach(category => {
        grouped[gender][category].sort((a, b) => {
          if (a.rank && b.rank) return a.rank - b.rank;
          if (a.rank) return -1;
          if (b.rank) return 1;
          return 0;
        });
      });
    });

    return grouped;
  }, [participants]);

  // Gérer la sélection des athlètes
  const toggleAthlete = (participantId) => {
    setSelectedAthletes(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      } else {
        if (posterType === 'solo') {
          return [participantId]; // Solo: remplacer la sélection
        } else {
          return [...prev, participantId]; // Groupé: ajouter
        }
      }
    });
  };

  // Gérer la sélection par catégorie
  const toggleCategory = (categoryAthletes, isChecked) => {
    const athleteIds = categoryAthletes.map(a => a.id);
    setSelectedAthletes(prev => {
      if (!isChecked) {
        // Décocher tout le monde dans cette catégorie
        return prev.filter(id => !athleteIds.includes(id));
      } else {
        // Cocher tout le monde (en évitant les doublons)
        const others = prev.filter(id => !athleteIds.includes(id));
        return [...others, ...athleteIds];
      }
    });
  };

  // Aperçu du payload envoyé à n8n
  const payloadPreview = useMemo(() => {
    const athletes = selectedAthletes
      .map(id => participants.find(p => p.id === id))
      .filter(Boolean)
      .map(p => {
        const member = p.members || {};
        const name = formatName(member.first_name, member.last_name) || member.email || p.name || 'N/A';
        return {
          id: p.id,
          name,
          rank: p.ranking || null,
          category: member.category || 'N/A'
        };
      });

    return {
      posterType,
      competitionName: competition?.name || '',
      competitionDate: competition ? formatShortDate(competition.start_date) : '',
      competitionCity: competition?.city || competition?.location || '',
      competitionType: competition?.disciplines || competition?.type || competition?.discipline || '',
      competitionLevel: competition?.level || competition?.niveau || '',
      competitionNature: competition?.nature || '',
      photoUrl: selectedPhoto,
      athletes
    };
  }, [posterType, competition, selectedPhoto, selectedAthletes, participants]);

  // Générer une légende par défaut quand l'affiche est prête
  React.useEffect(() => {
    if (showResult && competition) {
      const athleteNames = payloadPreview.athletes.map(a => a.name).join(', ');
      setInstaCaption(`Félicitations à nos grimpeurs ! 🧗‍♂️✨\n\nBravo à ${athleteNames} pour leurs performances lors de la compétition "${competition.name}" à ${competition.location || 'Jonage'}.\n\n#escalade #competition #alj #jonage #climbing #sport`);
    }
  }, [showResult, competition]);

  // Synchroniser le payload éditable quand les paramètres changent
  React.useEffect(() => {
    setEditablePayload(JSON.stringify(payloadPreview, null, 2));
  }, [payloadPreview]);

  // Valider et générer l'affiche
  const handleGeneratePoster = async () => {
    // Préparer le payload (utilise la version éditable si disponible)
    let payload;
    try {
      payload = JSON.parse(editablePayload);
    } catch (e) {
      toast({
        title: 'Erreur JSON',
        description: 'Le format JSON est invalide.',
        variant: 'destructive'
      });
      return;
    }

    // Valider
    const validation = validatePosterPayload(payload);
    if (!validation.valid) {
      toast({
        title: 'Erreur de validation',
        description: validation.errors.join('\n'),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Valider l'URL n8n basique
      if (n8nUrl && !/^https?:\/\/.+/.test(n8nUrl)) {
        throw new Error('URL n8n invalide. Elle doit commencer par http:// ou https://');
      }

      const result = await generatePosterViaAI(payload, n8nUrl || undefined);
      console.log('n8n response raw:', result);

      // Extraire l'URL de la réponse n8n (Cloudinary)
      let posterUrl = null;
      let parsedResult = result;

      // Si c'est une chaîne de caractères, on essaie de la parser
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {
          console.error("Erreur de parsing du résultat n8n", e);
        }
      }

      if (Array.isArray(parsedResult) && parsedResult.length > 0) {
        posterUrl = parsedResult[0].secure_url || parsedResult[0].url;
      } else if (parsedResult && typeof parsedResult === 'object') {
        posterUrl = parsedResult.secure_url || parsedResult.url;
      }

      if (posterUrl) {
        console.log('Affiche générée trouvée :', posterUrl);
        setGeneratedPosterUrl(posterUrl);

        // Sauvegarder en BDD
        const { error: updateError } = await supabase
          .from('competitions')
          .update({ ai_poster_url: posterUrl })
          .eq('id', competition.id);

        if (updateError) {
          console.error('Erreur lors de la sauvegarde de l\'URL:', updateError);
        }

        setShowResult(true);

        toast({
          title: 'Succès !',
          description: 'L\'affiche a été générée et sauvegardée avec succès.',
          variant: 'default'
        });
      } else {
        throw new Error('Impossible d\'extraire l\'URL de l\'image dans la réponse n8n');
      }

      // Appeler le callback avec le résultat
      onPosterGenerated(result);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de générer l\'affiche',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToInstagram = async () => {
    setIsPublishingToInsta(true);
    try {
      await publishToInstagram({
        imageUrl: generatedPosterUrl,
        caption: instaCaption,
        account: instaAccount
      });

      setInstaPublished(true);
      setShowInstaForm(false);
      toast({
        title: 'Publié !',
        description: 'L\'affiche a été publiée sur Instagram.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erreur publication Insta:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de publier sur Instagram',
        variant: 'destructive'
      });
    } finally {
      setIsPublishingToInsta(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 gap-0 border-none bg-slate-50/95 backdrop-blur-sm">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header Premium */}
          <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  <Zap className="w-6 h-6 text-blue-600" />
                  Générer une affiche par IA
                </DialogTitle>
                <DialogDescription className="text-base font-medium text-slate-500">
                  {competition.name} • <span className="text-slate-400 font-normal">{formatShortDate(competition.start_date)}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {showResult && generatedPosterUrl ? (
              <div className="flex flex-col items-center justify-center space-y-8 py-10 animate-in fade-in zoom-in duration-500">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white p-2 rounded-2xl shadow-2xl max-w-sm mx-auto overflow-hidden">
                    <img
                      src={generatedPosterUrl}
                      alt="Affiche IA"
                      className="w-full h-auto rounded-xl shadow-inner cursor-zoom-in"
                      onClick={() => window.open(generatedPosterUrl, '_blank')}
                    />
                  </div>
                  <div className="absolute -top-4 -right-4 bg-green-500 text-white p-2 rounded-full shadow-lg border-4 border-white">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="text-center space-y-4 max-w-md mx-auto">
                  <h2 className="text-2xl font-bold text-slate-800">Votre affiche est prête !</h2>
                  <p className="text-slate-500">
                    L'IA a terminé la composition. L'image a été automatiquement sauvegardée pour cette compétition.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="gap-2 border-slate-200"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPosterUrl);
                        toast({ title: "Copié !", description: "L'URL a été copiée dans le presse-papier." });
                      }}
                    >
                      <Copy className="w-4 h-4" /> Copier le lien
                    </Button>
                    <Button
                      className="gap-2 bg-slate-900"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedPosterUrl;
                        link.download = `affiche-${competition.name}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="w-4 h-4" /> Télécharger
                    </Button>
                    <Button
                      variant="link"
                      className="gap-1 text-blue-600"
                      onClick={() => window.open(generatedPosterUrl, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" /> Ouvrir en plein écran
                    </Button>

                    {!instaPublished && !showInstaForm && (
                      <Button
                        variant="outline"
                        className="gap-2 border-pink-200 text-pink-600 hover:bg-pink-50"
                        onClick={() => setShowInstaForm(true)}
                      >
                        <Instagram className="w-4 h-4" /> Publier sur Instagram
                      </Button>
                    )}
                  </div>

                  {showInstaForm && (
                    <div className="mt-8 p-6 bg-white border-2 border-pink-100 rounded-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-2 text-pink-600 font-bold uppercase text-xs tracking-wider">
                        <Instagram className="w-4 h-4" /> Configuration Instagram
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1 text-left">
                          <Label className="text-[10px] uppercase font-bold text-slate-400">Compte cible</Label>
                          <Select value={instaAccount} onValueChange={setInstaAccount}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="club_officiel">Club Officiel (@alj_escalade)</SelectItem>
                              <SelectItem value="equipe_competition">Équipe Compétition (@alj_compet)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1 text-left">
                          <Label className="text-[10px] uppercase font-bold text-slate-400">Légende</Label>
                          <Textarea
                            value={instaCaption}
                            onChange={(e) => setInstaCaption(e.target.value)}
                            className="text-sm min-h-[120px] bg-slate-50 border-slate-200"
                            placeholder="Écrivez une légende..."
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="ghost"
                            className="flex-1 text-slate-500"
                            onClick={() => setShowInstaForm(false)}
                            disabled={isPublishingToInsta}
                          >
                            Annuler
                          </Button>
                          <Button
                            className="flex-[2] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2 font-bold text-white border-none shadow-md shadow-pink-100"
                            onClick={handlePublishToInstagram}
                            disabled={isPublishingToInsta || !instaCaption.trim()}
                          >
                            {isPublishingToInsta ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <><Send className="w-4 h-4" /> Publier maintenant</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {instaPublished && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium border border-green-100 animate-in fade-in duration-500">
                      <CheckCircle2 className="w-4 h-4" /> Publié avec succès sur Instagram !
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100">
                    <Button
                      onClick={onClose}
                      className="w-full h-12 gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-100 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Sauvegarder et terminer
                    </Button>
                  </div>
                </div>

                <div className="pt-8">
                  <Button
                    variant="ghost"
                    className="text-slate-400 hover:text-slate-600"
                    onClick={() => setShowResult(false)}
                  >
                    Revenir à l'édition
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12 space-y-8">
                  {/* Type & Photo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        1. Type de composition
                      </Label>
                      <RadioGroup
                        value={posterType}
                        onValueChange={setPosterType}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div
                          className={`flex items-center space-x-2 p-4 border-2 rounded-xl transition-all cursor-pointer ${posterType === 'solo'
                            ? 'border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-500'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          onClick={() => setPosterType('solo')}
                        >
                          <RadioGroupItem value="solo" id="type-solo" className="border-blue-500 text-blue-500" />
                          <div className="flex flex-col flex-1 pl-1">
                            <Label htmlFor="type-solo" className="font-bold cursor-pointer text-slate-700">Solo</Label>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">1 athlète</span>
                          </div>
                        </div>
                        <div
                          className={`flex items-center space-x-2 p-4 border-2 rounded-xl transition-all cursor-pointer ${posterType === 'grouped'
                            ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          onClick={() => setPosterType('grouped')}
                        >
                          <RadioGroupItem value="grouped" id="type-grouped" className="border-indigo-500 text-indigo-500" />
                          <div className="flex flex-col flex-1 pl-1">
                            <Label htmlFor="type-grouped" className="font-bold cursor-pointer text-slate-700">Groupée</Label>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Multi-athlètes</span>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-bold uppercase tracking-wider text-slate-400">
                        2. Photo de fond
                      </Label>
                      <div className="relative group overflow-hidden rounded-xl border-2 border-slate-200 aspect-video bg-slate-100 flex items-center justify-center">
                        {selectedPhoto ? (
                          <img
                            src={selectedPhoto}
                            alt="Background"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="text-slate-400 text-sm italic font-medium">Veuillez choisir une photo ci-dessous</div>
                        )}
                        {selectedPhoto && (
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Galerie */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold uppercase tracking-wider text-slate-400">Galerie photos</Label>
                      <span className="text-xs text-slate-400 font-medium">{competitionPhotoGallery?.length || 0} photos</span>
                    </div>
                    {competitionPhotoGallery && competitionPhotoGallery.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {competitionPhotoGallery.map((photo, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPhoto(photo)}
                            className={`flex-none w-28 h-20 cursor-pointer relative rounded-lg overflow-hidden border-2 transition-all ${selectedPhoto === photo ? 'border-blue-500 ring-2 ring-blue-500 scale-95' : 'border-white hover:border-slate-300'}`}
                          >
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center bg-white/50">
                        <p className="text-sm text-slate-400">Aucune photo disponible</p>
                      </div>
                    )}
                  </div>

                  {/* Athlètes */}
                  <div className="space-y-4">
                    <Label className="text-sm font-bold uppercase tracking-wider text-slate-400">3. Sélection des Athlètes</Label>
                    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
                        {/* Filles */}
                        <div className="p-4 bg-pink-50/10">
                          <h3 className="font-bold text-pink-600 text-xs uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span>👩 Filles</span>
                            <span className="text-[10px] bg-pink-100 px-2 py-0.5 rounded-full">
                              {Object.values(athletesByGenderAndCategory.femmes).reduce((sum, cat) => sum + cat.length, 0)}
                            </span>
                          </h3>
                          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(athletesByGenderAndCategory.femmes).map(([category, athletes]) => {
                              const categoryAthleteIds = athletes.map(a => a.id);
                              const isAllSelected = categoryAthleteIds.every(id => selectedAthletes.includes(id));
                              const isSomeSelected = categoryAthleteIds.some(id => selectedAthletes.includes(id)) && !isAllSelected;
                              return (
                                <div key={category} className="space-y-2">
                                  <div className="text-[10px] font-bold text-pink-500 uppercase flex items-center gap-2 mb-1">
                                    <div className="h-px flex-1 bg-pink-100" />
                                    {posterType === 'grouped' ? (
                                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleCategory(athletes, !isAllSelected)}>
                                        <Checkbox checked={isAllSelected || isSomeSelected} className="h-3 w-3 border-pink-300" />
                                        <span>{category}</span>
                                      </div>
                                    ) : (<span>{category}</span>)}
                                    <div className="h-px flex-1 bg-pink-100" />
                                  </div>
                                  <div className="grid gap-1">
                                    {athletes.map(athlete => (
                                      <div key={athlete.id} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${selectedAthletes.includes(athlete.id) ? 'bg-pink-100/50' : 'hover:bg-slate-50'}`} onClick={() => toggleAthlete(athlete.id)}>
                                        {posterType === 'solo' && <Checkbox checked={selectedAthletes.includes(athlete.id)} className="border-pink-300" />}
                                        <div className="flex-1 overflow-hidden">
                                          <p className="text-xs font-bold text-slate-700 truncate">{athlete.name}</p>
                                          <p className="text-[10px] text-slate-400">{athlete.rank ? `Rang: ${athlete.rank}` : 'Non classé'}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Hommes */}
                        <div className="p-4 bg-blue-50/10">
                          <h3 className="font-bold text-blue-600 text-xs uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span>👨 Garçons</span>
                            <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded-full">
                              {Object.values(athletesByGenderAndCategory.hommes).reduce((sum, cat) => sum + cat.length, 0)}
                            </span>
                          </h3>
                          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(athletesByGenderAndCategory.hommes).map(([category, athletes]) => {
                              const categoryAthleteIds = athletes.map(a => a.id);
                              const isAllSelected = categoryAthleteIds.every(id => selectedAthletes.includes(id));
                              const isSomeSelected = categoryAthleteIds.some(id => selectedAthletes.includes(id)) && !isAllSelected;
                              return (
                                <div key={category} className="space-y-2">
                                  <div className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-2 mb-1">
                                    <div className="h-px flex-1 bg-blue-100" />
                                    {posterType === 'grouped' ? (
                                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleCategory(athletes, !isAllSelected)}>
                                        <Checkbox checked={isAllSelected || isSomeSelected} className="h-3 w-3 border-blue-300" />
                                        <span>{category}</span>
                                      </div>
                                    ) : (<span>{category}</span>)}
                                    <div className="h-px flex-1 bg-blue-100" />
                                  </div>
                                  <div className="grid gap-1">
                                    {athletes.map(athlete => (
                                      <div key={athlete.id} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${selectedAthletes.includes(athlete.id) ? 'bg-blue-100/50' : 'hover:bg-slate-50'}`} onClick={() => toggleAthlete(athlete.id)}>
                                        {posterType === 'solo' && <Checkbox checked={selectedAthletes.includes(athlete.id)} className="border-blue-300" />}
                                        <div className="flex-1 overflow-hidden">
                                          <p className="text-xs font-bold text-slate-700 truncate">{athlete.name}</p>
                                          <p className="text-[10px] text-slate-400">{athlete.rank ? `Rang: ${athlete.rank}` : 'Non classé'}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Recup */}
                        <div className="p-4 bg-slate-50 border-t md:border-t-0">
                          <h3 className="font-bold text-slate-600 text-xs uppercase tracking-widest mb-4">Récapitulatif</h3>
                          <div className="space-y-4">
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                              <p className="text-[11px] font-medium flex justify-between"><span className="text-slate-500">Mode:</span> <span className="font-bold capitalize">{posterType}</span></p>
                              <p className="text-[11px] font-medium flex justify-between"><span className="text-slate-500">Date:</span> <span className="font-bold">{formatShortDate(competition.start_date)}</span></p>
                              <p className="text-[11px] font-medium flex justify-between"><span className="text-slate-500">Athlètes:</span> <span className="font-bold">{selectedAthletes.length}</span></p>
                            </div>
                            <div className="text-center pt-2">
                              <button onClick={(e) => e.currentTarget.nextElementSibling.classList.toggle('hidden')} className="text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-1 mx-auto">
                                <Code className="w-3 h-3" /> Éditeur JSON (Avancé)
                              </button>
                              <div className="hidden mt-3 space-y-3 text-left animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1">
                                  <Label className="text-[10px] uppercase font-bold text-slate-500">Webhook n8n</Label>
                                  <Input value={n8nUrl} onChange={(e) => setN8nUrl(e.target.value)} className="h-8 text-[11px]" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] uppercase font-bold text-slate-500">Payload JSON</Label>
                                  <Textarea
                                    value={editablePayload}
                                    onChange={(e) => setEditablePayload(e.target.value)}
                                    className="min-h-[300px] font-mono text-[11px] bg-slate-900 text-green-400 border-slate-700 focus:border-blue-500 transition-colors"
                                  />
                                  <p className="text-[9px] text-slate-400 italic">Vous pouvez modifier manuellement les données avant l'envoi.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-10 rounded-b-2xl">
            <div className="flex items-center gap-2">
              {isLoading && <p className="text-xs font-bold text-blue-600 animate-pulse flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> IA en cours...</p>}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} disabled={isLoading} className="h-11 px-6 font-bold">Annuler</Button>
              {!showResult && (
                <Button
                  onClick={handleGeneratePoster}
                  disabled={isLoading || !selectedPhoto || selectedAthletes.length === 0}
                  className="h-11 px-8 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none font-bold shadow-lg"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5 fill-current" /> Générer l'affiche</>}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratePosterDialog;
