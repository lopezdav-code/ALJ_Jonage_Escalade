import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Trophy, UserCheck, Calendar, MapPin, ExternalLink, Info, Medal, Phone, Mail, CreditCard, Award, Euro, ChevronLeft, ChevronRight, X, ZoomIn, Plus, Edit, Settings } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';
import { formatName } from '@/lib/utils';
import { useMemberDetail } from '@/contexts/MemberDetailContext';
import RankingForm from './components/RankingForm';

const ClubCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [participants, setParticipants] = useState({});
  const [loading, setLoading] = useState(true);
  const [photoGallery, setPhotoGallery] = useState({ isOpen: false, photos: [], currentIndex: 0, competitionName: '' });
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [savingRanking, setSavingRanking] = useState(false);
  const { toast } = useToast();
  const { showMemberDetails } = useMemberDetail();
  const navigate = useNavigate();

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      // Récupérer les compétitions
      const { data: competitionsData, error: competitionsError } = await supabase
        .from('competitions')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (competitionsError) throw competitionsError;
      setCompetitions(competitionsData);

      // Récupérer les participants pour toutes les compétitions
      const { data: rawParticipants, error: participantsError } = await supabase
        .from('competition_participants')
        .select('*')
        .order('role')
        .order('created_at');

      if (participantsError) throw participantsError;

      // Si on a des participants, récupérer les données des membres
      let enrichedParticipants = [];
      if (rawParticipants && rawParticipants.length > 0) {
        const memberIds = [...new Set(rawParticipants.map(p => p.member_id))];
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select(`
            id,
            first_name,
            last_name,
            category,
            sexe,
            licence,
            phone,
            email,
            photo_url,
            brevet_federaux,
            title,
            sub_group
          `)
          .in('id', memberIds);

        if (membersError) throw membersError;

        // Associer les membres aux participants
        enrichedParticipants = rawParticipants.map(participant => ({
          ...participant,
          members: membersData?.find(member => member.id === participant.member_id) || null
        }));
      }

      // Organiser les participants par compétition
      const participantsByCompetition = {};
      enrichedParticipants.forEach(participant => {
        const compId = participant.competition_id;
        if (!participantsByCompetition[compId]) {
          participantsByCompetition[compId] = [];
        }
        participantsByCompetition[compId].push(participant);
      });

      setParticipants(participantsByCompetition);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: "Erreur", description: "Impossible de charger les compétitions.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Fonctions pour gérer l'édition des classements
  const handleEditRanking = (participant) => {
    setEditingParticipant(participant);
  };

  const handleSaveRanking = async (participantId, ranking, nbCompetitor) => {
    setSavingRanking(true);
    try {
      const { error } = await supabase
        .from('competition_participants')
        .update({ 
          ranking: ranking || null, 
          nb_competitor: nbCompetitor || null 
        })
        .eq('id', participantId);

      if (error) throw error;

      // Mettre à jour l'état local
      setParticipants(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(compId => {
          updated[compId] = updated[compId].map(p => 
            p.id === participantId 
              ? { ...p, ranking: ranking || null, nb_competitor: nbCompetitor || null }
              : p
          );
        });
        return updated;
      });

      toast({ 
        title: "Succès", 
        description: "Classement mis à jour avec succès." 
      });
      
      setEditingParticipant(null);
    } catch (error) {
      console.error('Error updating ranking:', error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour le classement.", 
        variant: "destructive" 
      });
    } finally {
      setSavingRanking(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingParticipant(null);
  };

  // Fonction pour trier les compétiteurs par genre puis par âge
  const sortCompetitors = (participants) => {
    return participants.sort((a, b) => {
      // D'abord par genre (F avant H)
      if (a.members.sexe !== b.members.sexe) {
        if (a.members.sexe === 'F') return -1;
        if (b.members.sexe === 'F') return 1;
      }
      
      // Puis par catégorie (âge) - ordre croissant des catégories
      const categoryOrder = {
        'U11': 1, 'U13': 2, 'U15': 3, 'U17': 4, 'U19': 5, 
        'Sénior': 6, 'Vétéran': 7
      };
      
      const aCategory = categoryOrder[a.members.category] || 999;
      const bCategory = categoryOrder[b.members.category] || 999;
      
      if (aCategory !== bCategory) {
        return aCategory - bCategory;
      }
      
      // Enfin par nom de famille
      return a.members.last_name.localeCompare(b.members.last_name);
    });
  };

  // Fonction pour grouper les compétiteurs par genre puis par catégorie
  const groupCompetitorsByGenderAndCategory = (competitors) => {
    const sortedCompetitors = sortCompetitors(competitors);
    const femmes = sortedCompetitors.filter(p => p.members.sexe === 'F');
    const hommes = sortedCompetitors.filter(p => p.members.sexe === 'H');
    const autres = sortedCompetitors.filter(p => !p.members.sexe || (p.members.sexe !== 'F' && p.members.sexe !== 'H'));

    // Fonction pour grouper par catégorie
    const groupByCategory = (participants) => {
      const groups = {};
      participants.forEach(p => {
        const category = p.members.category || 'Sans catégorie';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(p);
      });
      return groups;
    };

    return {
      femmes: groupByCategory(femmes),
      hommes: groupByCategory(hommes),
      autres: groupByCategory(autres)
    };
  };

  // Composant pour la galerie photo avec lightbox
  const PhotoGallery = ({ isOpen, photos, currentIndex, competitionName, onClose, onNext, onPrev }) => {
    useEffect(() => {
      const handleKeyPress = (e) => {
        if (!isOpen) return;
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') onPrev();
        if (e.key === 'ArrowRight') onNext();
      };

      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, onClose, onNext, onPrev]);

    if (!isOpen || !photos.length) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-black/95 border-0">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Header avec titre et compteur */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center text-white">
              <div>
                <h3 className="text-lg font-semibold">{competitionName}</h3>
                <p className="text-sm text-gray-300">
                  Photo {currentIndex + 1} sur {photos.length}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Image principale */}
            <div className="relative w-full h-full flex items-center justify-center p-16">
              <img
                src={photos[currentIndex]}
                alt={`Photo ${currentIndex + 1} de ${competitionName}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* Navigation gauche */}
            {photos.length > 1 && currentIndex > 0 && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* Navigation droite */}
            {photos.length > 1 && currentIndex < photos.length - 1 && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* Miniatures en bas */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <div className="flex gap-2 bg-black/50 p-2 rounded-lg max-w-md overflow-x-auto">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setPhotoGallery(prev => ({ ...prev, currentIndex: index }))}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 transition-all ${
                        index === currentIndex 
                          ? 'border-white scale-110' 
                          : 'border-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Miniature ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Fonction pour ouvrir la galerie photo
  const openPhotoGallery = (photos, competitionName, startIndex = 0) => {
    setPhotoGallery({
      isOpen: true,
      photos,
      currentIndex: startIndex,
      competitionName
    });
  };

  // Fonction pour fermer la galerie
  const closePhotoGallery = () => {
    setPhotoGallery({ isOpen: false, photos: [], currentIndex: 0, competitionName: '' });
  };

  // Navigation dans la galerie
  const nextPhoto = () => {
    setPhotoGallery(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.photos.length
    }));
  };

  const prevPhoto = () => {
    setPhotoGallery(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1
    }));
  };

  // Fonction pour déterminer la prochaine compétition
  // Composant pour l'en-tête compact de compétition (accordéon fermé)
  const CompetitionHeader = ({ comp }) => {
    // Compter le nombre de compétiteurs inscrits
    const competitionParticipants = participants[comp.id] || [];
    const competitorsCount = competitionParticipants.filter(p => p.role === 'Compétiteur').length;
    
    // Fonction pour obtenir la couleur de la pastille selon la discipline
    const getDisciplineColor = (discipline) => {
      const colors = {
        'Bloc': 'bg-purple-100 text-purple-700 border-purple-200',
        'Difficulté': 'bg-red-100 text-red-700 border-red-200',
        'Vitesse': 'bg-blue-100 text-blue-700 border-blue-200',
        'Combiné': 'bg-orange-100 text-orange-700 border-orange-200'
      };
      return colors[discipline] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    // Fonction pour obtenir la couleur de la pastille selon la nature
    const getNatureColor = (nature) => {
      const colors = {
        'Contest': 'bg-green-100 text-green-700 border-green-200',
        'Open': 'bg-blue-100 text-blue-700 border-blue-200',
        'Coupe': 'bg-yellow-100 text-yellow-700 border-yellow-200',
        'Championnat': 'bg-red-100 text-red-700 border-red-200'
      };
      return colors[nature] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    // Fonction pour obtenir la couleur de la pastille selon le niveau
    const getNiveauColor = (niveau) => {
      const colors = {
        'Départemental': 'bg-green-100 text-green-700 border-green-200',
        'Régional': 'bg-blue-100 text-blue-700 border-blue-200',
        'Inter-régional': 'bg-purple-100 text-purple-700 border-purple-200',
        'National': 'bg-red-100 text-red-700 border-red-200',
        'International': 'bg-orange-100 text-orange-700 border-orange-200'
      };
      return colors[niveau] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
      <div className="flex items-start gap-4 w-full">
        {comp.image_url && (
          <img 
            src={comp.image_url} 
            alt={comp.name} 
            className="w-16 h-16 object-cover rounded-md border border-muted flex-shrink-0"
          />
        )}
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-lg font-semibold">{comp.name}</h3>
            {comp.short_title && (
              <p className="text-sm text-primary font-medium">{comp.short_title}</p>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(comp.start_date).toLocaleDateString('fr-FR', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}
                {comp.end_date && comp.end_date !== comp.start_date && (
                  <> au {new Date(comp.end_date).toLocaleDateString('fr-FR', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}</>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{comp.location}</span>
            </div>
          </div>

          {/* Pastilles pour disciplines, nature, niveau et nombre de compétiteurs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Disciplines */}
            {comp.disciplines && comp.disciplines.length > 0 && comp.disciplines.map(discipline => (
              <span key={discipline} className={`text-xs px-2 py-1 rounded-full border font-medium ${getDisciplineColor(discipline)}`}>
                {discipline}
              </span>
            ))}

            {/* Nature */}
            {comp.nature && (
              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getNatureColor(comp.nature)}`}>
                {comp.nature}
              </span>
            )}

            {/* Niveau */}
            {comp.niveau && (
              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getNiveauColor(comp.niveau)}`}>
                {comp.niveau}
              </span>
            )}

            {/* Nombre de compétiteurs */}
            {competitorsCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full border font-medium bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {competitorsCount} inscrit{competitorsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Composant pour afficher une carte de compétiteur compacte
  const CompetitorCard = ({ participant }) => {
    if (!participant.members) {
      return (
        <div className="flex items-center justify-between py-1 px-2 text-muted-foreground text-sm">
          <span>Membre non trouvé (ID: {participant.member_id})</span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/30 transition-colors group border-b border-muted/30 last:border-b-0">
        <div 
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => showMemberDetails(participant.members.id)}
        >
          {/* Nom formaté comme dans CompetitionParticipants */}
          <span className="text-sm font-medium">
            {participant.members.last_name?.toUpperCase()} {participant.members.first_name}
          </span>
          
          {/* Badges pour catégorie avec couleurs distinctes par sexe */}
          <div className="flex items-center gap-1">
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              participant.members.sexe === 'Femme' 
                ? 'bg-pink-100 text-pink-700 border border-pink-200' 
                : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              {participant.members.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Classement avec trophy icon */}
          {participant.ranking && (
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-orange-500" />
              <span className="text-sm font-bold text-orange-600">
                {participant.ranking}
              </span>
              {participant.nb_competitor && (
                <span className="text-xs text-muted-foreground">/{participant.nb_competitor}</span>
              )}
            </div>
          )}
          
          {/* Bouton d'édition du classement - visible en permanence */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditRanking(participant);
            }}
            className="h-7 w-7 p-0 hover:bg-accent hover:text-accent-foreground"
            title="Éditer le classement"
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  // Composant pour afficher une carte de staff compacte (juges, coachs)
  const StaffCard = ({ participant }) => (
    <div 
      className="flex items-center justify-between py-1 px-2 hover:bg-blue-50 transition-colors cursor-pointer group border-b border-blue-100 last:border-b-0"
      onClick={() => showMemberDetails(participant.members.id)}
    >
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm text-blue-900 group-hover:text-blue-700 transition-colors">
          {formatName(participant.members.first_name, participant.members.last_name, false)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
          {participant.role === 'Arbitre' ? 'Juge' : participant.role}
        </span>
      </div>
    </div>
  );

  // Composant principal pour afficher les participants d'une compétition
  const ParticipantsList = ({ competitionId }) => {
    const competitionParticipants = participants[competitionId] || [];
    
    // Séparer les participants par rôle
    const competitors = competitionParticipants.filter(p => p.role === 'Compétiteur');
    const staff = competitionParticipants.filter(p => ['Arbitre', 'Coach', 'Ouvreur'].includes(p.role));
    
    return (
      <div className="space-y-4">
        {/* Section Compétiteurs */}
        {competitors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Compétiteurs ({competitors.length})</h3>
            <div className="border rounded-lg overflow-hidden bg-card">
              {competitors.map((participant) => (
                <CompetitorCard key={participant.id} participant={participant} />
              ))}
            </div>
          </div>
        )}

        {/* Section Staff */}
        {staff.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Encadrement ({staff.length})</h3>
            <div className="border rounded-lg overflow-hidden bg-blue-50">
              {staff.map((participant) => (
                <StaffCard key={participant.id} participant={participant} />
              ))}
            </div>
          </div>
        )}

        {competitionParticipants.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun participant inscrit</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compétitions du Club</h1>
        <Button 
          onClick={() => navigate('/competitions/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Créer une compétition
        </Button>
      </div>
      
      {competitions.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Aucune compétition pour le moment.</p>
      ) : (
        <Accordion 
          type="single" 
          collapsible 
          className="w-full space-y-4"
        >
          {competitions.map((comp) => (
            <AccordionItem key={comp.id} value={comp.id.toString()} className="border rounded-lg group">
              <AccordionTrigger className="hover:no-underline px-4 py-3 [&[data-state=closed]]:hover:bg-muted/50 transition-colors cursor-pointer">
                <CompetitionHeader comp={comp} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6 pt-4">
                  {/* Bouton de modification */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('Bouton modification cliqué pour compétition:', comp.id);
                        navigate(`/competitions/edit/${comp.id}`);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier la compétition
                    </Button>
                  </div>

                  {/* Informations pratiques */}
                  {comp.details_description && (
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-600" />
                        Informations pratiques
                      </h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">{comp.details_description}</p>
                    </div>
                  )}

                  {/* Format de la compétition */}
                  {comp.details_format && (
                    <div className="p-3 bg-green-50 rounded-md border border-green-200">
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-green-600" />
                        Format de la compétition
                      </h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">{comp.details_format}</p>
                    </div>
                  )}

                  {/* Planning */}
                  {comp.details_schedule && (
                    <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        Planning
                      </h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">{comp.details_schedule}</p>
                    </div>
                  )}

                  {/* Informations détaillées - Version compacte */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Prix et Nature sur la même ligne */}
                    <div className="flex items-center gap-4 text-sm">
                      {comp.prix && (
                        <div className="flex items-center gap-2">
                          <Euro className="w-4 h-4 text-primary" />
                          <span className="font-medium">Prix d'entrée:</span>
                          <span className="text-muted-foreground">{comp.prix}€</span>
                        </div>
                      )}
                      {comp.nature && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Nature:</span>
                          <Badge variant="secondary" className="text-xs">{comp.nature}</Badge>
                        </div>
                      )}
                    </div>

                    {/* Disciplines */}
                    {comp.disciplines && comp.disciplines.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Disciplines:</span>
                        <div className="flex flex-wrap gap-1">
                          {comp.disciplines.map(discipline => (
                            <Badge key={discipline} variant="outline" className="text-xs">
                              {discipline}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Catégories */}
                    {comp.categories && comp.categories.length > 0 && (
                      <div className="flex items-center gap-2 text-sm col-span-full">
                        <span className="font-medium">Catégories:</span>
                        <div className="flex flex-wrap gap-1">
                          {comp.categories.map(category => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lien pour plus d'informations */}
                  {comp.more_info_link && (
                    <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
                      <h5 className="font-semibold mb-3 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-orange-600" />
                        Plus d'informations
                      </h5>
                      <Button variant="outline" size="sm" asChild>
                        <a href={comp.more_info_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Consulter le site officiel
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Photos */}
                  {comp.photo_gallery && comp.photo_gallery.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        Photos ({comp.photo_gallery.length})
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openPhotoGallery(comp.photo_gallery, comp.name, 0)}
                          className="ml-auto flex items-center gap-1"
                        >
                          <ZoomIn className="w-3 h-3" />
                          Voir en grand
                        </Button>
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {comp.photo_gallery.map((photo, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer"
                            onClick={() => openPhotoGallery(comp.photo_gallery, comp.name, index)}
                          >
                            <img 
                              src={photo} 
                              alt={`Photo ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md border border-muted transition-all group-hover:brightness-110 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-md flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Section des participants */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Participants
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/competitions/participants/${comp.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter un participant
                      </Button>
                    </div>
                    <ParticipantsList competitionId={comp.id} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Galerie photo modale */}
      <PhotoGallery
        isOpen={photoGallery.isOpen}
        photos={photoGallery.photos}
        currentIndex={photoGallery.currentIndex}
        competitionName={photoGallery.competitionName}
        onClose={closePhotoGallery}
        onNext={nextPhoto}
        onPrev={prevPhoto}
      />

      {/* Formulaire d'édition des classements */}
      {editingParticipant && (
        <RankingForm
          participant={editingParticipant}
          onSave={handleSaveRanking}
          onCancel={handleCancelEdit}
          isSaving={savingRanking}
        />
      )}
    </div>
  );
};

export default ClubCompetitions;