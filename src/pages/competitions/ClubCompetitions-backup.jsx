import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Users, Trophy, UserCheck, Calendar, MapPin, ExternalLink, Info, Medal, Phone, Mail, CreditCard, Award, Euro, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';
import { formatName } from '@/lib/utils';
import { useMemberDetail } from '@/contexts/MemberDetailContext';

const ClubCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [participants, setParticipants] = useState({});
  const [loading, setLoading] = useState(true);
  const [photoGallery, setPhotoGallery] = useState({ isOpen: false, photos: [], currentIndex: 0, competitionName: '' });
  const { toast } = useToast();
  const { showMemberDetails } = useMemberDetail();

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
      const { data: participantsData, error: participantsError } = await supabase
        .from('competition_participants')
        .select(`
          *,
          members (
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
          )
        `)
        .order('role')
        .order('last_name', { foreignTable: 'members' });

      if (participantsError) throw participantsError;

      // Organiser les participants par compétition
      const participantsByCompetition = {};
      participantsData.forEach(participant => {
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
  const getNextCompetition = () => {
    const now = new Date();
    const futureCompetitions = competitions.filter(comp => new Date(comp.start_date) >= now);
    if (futureCompetitions.length > 0) {
      return futureCompetitions.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];
    }
    return null;
  };

  // Composant pour l'en-tête compact de compétition (accordéon fermé)
  const CompetitionHeader = ({ comp }) => (
    <div className="flex items-center gap-4 w-full">
      {comp.image_url && (
        <img 
          src={comp.image_url} 
          alt={comp.name} 
          className="w-16 h-16 object-cover rounded-md border border-muted"
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

          {comp.niveau && (
            <Badge variant="destructive" className="text-xs">
              {comp.niveau}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  // Composant pour afficher une carte de compétiteur compacte
  const CompetitorCard = ({ participant }) => (
    <div 
      className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors border border-muted cursor-pointer group"
      onClick={() => showMemberDetails(participant.members.id)}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Photo du membre (plus petite) */}
        {participant.members.photo_url && (
          <img 
            src={participant.members.photo_url} 
            alt={formatName(participant.members.first_name, participant.members.last_name)}
            className="w-8 h-8 rounded-full object-cover border border-primary/20"
          />
        )}
        
        <div className="flex items-center gap-2 flex-1">
          {/* Nom et prénom */}
          <span className="font-medium text-sm group-hover:text-primary transition-colors">
            {formatName(participant.members.first_name, participant.members.last_name, false)}
          </span>
        </div>
      </div>

      {/* Classement pour les compétiteurs */}
      {participant.ranking && (
        <div className="flex items-center gap-1">
          <Medal className="w-4 h-4 text-yellow-500" />
          <Badge variant="default" className="text-xs font-bold">
            {participant.ranking}ème
          </Badge>
        </div>
      )}
    </div>
  );

  // Composant pour afficher une carte d'encadrant (coach/juge) compacte
  const StaffCard = ({ participant }) => (
    <div 
      className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors border border-muted cursor-pointer group"
      onClick={() => showMemberDetails(participant.members.id)}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Photo du membre */}
        {participant.members.photo_url && (
          <img 
            src={participant.members.photo_url} 
            alt={formatName(participant.members.first_name, participant.members.last_name)}
            className="w-8 h-8 rounded-full object-cover border border-primary/20"
          />
        )}
        
        <div className="flex items-center gap-2 flex-1">
          {/* Nom et prénom */}
          <span className="font-medium text-sm group-hover:text-primary transition-colors">
            {formatName(participant.members.first_name, participant.members.last_name, false)}
          </span>

          {/* Brevets fédéraux (si disponibles) */}
          {participant.members.brevet_federaux && participant.members.brevet_federaux.length > 0 && (
            <div className="flex gap-1">
              {participant.members.brevet_federaux.map((brevet, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {brevet}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nombre de compétiteurs encadrés */}
      {participant.nb_competitor && (
        <Badge variant="secondary" className="text-xs">
          {participant.nb_competitor} compétiteurs
        </Badge>
      )}
    </div>
  );

  // Composant pour afficher la liste des participants
  const ParticipantsList = ({ competitionId }) => {
    const competitionParticipants = participants[competitionId] || [];
    
    if (competitionParticipants.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-4">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Aucun participant inscrit</p>
        </div>
      );
    }

    // Organiser par rôle
    const roleGroups = {
      Competiteur: [],
      Arbitre: [],
      Coach: []
    };

    competitionParticipants.forEach(participant => {
      if (participant.members && roleGroups[participant.role]) {
        roleGroups[participant.role].push(participant);
      }
    });

    const roleNames = {
      Competiteur: 'Compétiteurs',
      Arbitre: 'Juges/Arbitres', 
      Coach: 'Assureurs/Coachs'
    };

    const roleIcons = {
      Competiteur: Trophy,
      Arbitre: UserCheck,
      Coach: Users
    };

    return (
      <div className="space-y-4">
        {Object.entries(roleGroups).map(([role, group]) => {
          if (group.length === 0) return null;
          
          const Icon = roleIcons[role];
          
          // Pour les compétiteurs, on trie et groupe par genre puis par catégorie
          if (role === 'Competiteur') {
            const groupedCompetitors = groupCompetitorsByGenderAndCategory(group);
            
            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                  <h5 className="font-semibold text-sm">{roleNames[role]} ({group.length})</h5>
                </div>
                
                {/* Femmes */}
                {Object.keys(groupedCompetitors.femmes).length > 0 && (
                  <div className="mb-6">
                    <h6 className="text-sm font-medium text-pink-600 mb-3 flex items-center gap-1">
                      👩 Femmes ({Object.values(groupedCompetitors.femmes).flat().length})
                    </h6>
                    {Object.entries(groupedCompetitors.femmes).map(([category, participants]) => (
                      <div key={`F-${category}`} className="mb-4">
                        <h7 className="text-xs font-medium text-pink-500 mb-2 block pl-4">
                          {category} ({participants.length})
                        </h7>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                          {participants.map(participant => (
                            <CompetitorCard key={participant.id} participant={participant} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Hommes */}
                {Object.keys(groupedCompetitors.hommes).length > 0 && (
                  <div className="mb-6">
                    <h6 className="text-sm font-medium text-blue-600 mb-3 flex items-center gap-1">
                      👨 Hommes ({Object.values(groupedCompetitors.hommes).flat().length})
                    </h6>
                    {Object.entries(groupedCompetitors.hommes).map(([category, participants]) => (
                      <div key={`H-${category}`} className="mb-4">
                        <h7 className="text-xs font-medium text-blue-500 mb-2 block pl-4">
                          {category} ({participants.length})
                        </h7>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                          {participants.map(participant => (
                            <CompetitorCard key={participant.id} participant={participant} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Autres (sexe non défini) */}
                {Object.keys(groupedCompetitors.autres).length > 0 && (
                  <div className="mb-6">
                    <h6 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-1">
                      👤 Autres ({Object.values(groupedCompetitors.autres).flat().length})
                    </h6>
                    {Object.entries(groupedCompetitors.autres).map(([category, participants]) => (
                      <div key={`O-${category}`} className="mb-4">
                        <h7 className="text-xs font-medium text-gray-500 mb-2 block pl-4">
                          {category} ({participants.length})
                        </h7>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                          {participants.map(participant => (
                            <CompetitorCard key={participant.id} participant={participant} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          // Pour les autres rôles (juges, coachs), affichage avec cartes compactes
          return (
            <div key={role}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-primary" />
                <h5 className="font-semibold text-sm">{roleNames[role]} ({group.length})</h5>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {group.map(participant => (
                  <StaffCard key={participant.id} participant={participant} />
                ))}
              </div>
            </div>
          );
        })}
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
      <h1 className="text-3xl font-bold">Compétitions du Club</h1>
      
      {competitions.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Aucune compétition pour le moment.</p>
      ) : (
        <Accordion 
          type="single" 
          collapsible 
          defaultValue={getNextCompetition()?.id?.toString()}
          className="w-full space-y-4"
        >
          {competitions.map((comp) => (
            <AccordionItem key={comp.id} value={comp.id.toString()} className="border rounded-lg">
              <AccordionTrigger className="hover:no-underline px-4 py-3">
                <CompetitionHeader comp={comp} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6 pt-4">{/* Le contenu détaillé viendra ici */} 
                  alt={comp.name} 
                  className="w-32 h-32 object-cover rounded-md border border-muted"
                />
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <CardTitle className="text-2xl mb-1">{comp.name}</CardTitle>
                  {comp.short_title && (
                    <p className="text-md text-primary font-medium">{comp.short_title}</p>
                  )}
                </div>

                {/* Dates et lieu */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
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

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{comp.location}</span>
                  </div>

                  {comp.prix && (
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{comp.prix}€</span>
                    </div>
                  )}
                </div>

                {/* Badges niveau, nature, disciplines */}
                <div className="flex flex-wrap gap-2">
                  {comp.niveau && (
                    <Badge variant="destructive" className="text-xs">
                      {comp.niveau}
                    </Badge>
                  )}
                  {comp.nature && (
                    <Badge variant="secondary" className="text-xs">
                      {comp.nature}
                    </Badge>
                  )}
                  {comp.disciplines && comp.disciplines.map(discipline => (
                    <Badge key={discipline} variant="outline" className="text-xs">
                      {discipline}
                    </Badge>
                  ))}
                </div>

                {/* Catégories */}
                {comp.categories && comp.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Catégories:</span>
                    {comp.categories.map(category => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Lien plus d'infos */}
                {comp.more_info_link && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={comp.more_info_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Plus d'informations
                    </a>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-4 space-y-4">
              {/* Description */}
              {comp.details_description && (
                <div className="p-3 bg-muted/30 rounded-md">
                  <h5 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    Description
                  </h5>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comp.details_description}
                  </p>
                </div>
              )}

              {/* Programme */}
              {comp.details_schedule && comp.details_schedule.length > 0 && (
                <div className="p-3 bg-muted/30 rounded-md">
                  <h5 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Programme
                  </h5>
                  <ul className="space-y-1">
                    {comp.details_schedule.map((item, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Format */}
              {comp.details_format && (
                <div className="p-3 bg-muted/30 rounded-md">
                  <h5 className="font-semibold mb-2">Format</h5>
                  <p className="text-sm text-muted-foreground">{comp.details_format}</p>
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
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Participants
                </h4>
                <ParticipantsList competitionId={comp.id} />
              </div>
            </CardContent>
          </Card>
        ))
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
    </div>
  );
};

export default ClubCompetitions;