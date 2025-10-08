import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PlusCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

import CompetitionForm from './components/CompetitionForm';
import AddParticipantForm from './components/AddParticipantForm';
import RankingForm from './components/RankingForm';
import PhotoUploadForm from './components/PhotoUploadForm';
import CompetitionCard from './components/CompetitionCard';

const ClubCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [participants, setParticipants] = useState({});
  const [members, setMembers] = useState([]);
  const [isAddParticipantFormVisible, setIsAddParticipantFormVisible] = useState(false);
  const [competitionForParticipant, setCompetitionForParticipant] = useState(null);
  const [isRankingFormVisible, setIsRankingFormVisible] = useState(false);
  const [participantForRanking, setParticipantForRanking] = useState(null);
  const [isPhotoUploadFormVisible, setIsPhotoUploadFormVisible] = useState(false);
  const [competitionForPhotos, setCompetitionForPhotos] = useState(null);
  const [viewingImage, setViewingImage] = useState({ url: null, index: -1, gallery: [] });

  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const fetchAllParticipants = useCallback(async (competitionIds) => {
    if (!competitionIds || competitionIds.length === 0) return;
    try {
      const { data: participantsData, error: participantsError } = await supabase
        .from('competition_participants')
        .select('*, members(id, first_name, last_name, sexe, category)')
        .in('competition_id', competitionIds);

      if (participantsError) throw participantsError;
      
      const participantsByCompetition = participantsData.reduce((acc, p) => {
        if (!acc[p.competition_id]) acc[p.competition_id] = [];
        acc[p.competition_id].push(p);
        return acc;
      }, {});
      setParticipants(prev => ({ ...prev, ...participantsByCompetition }));
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de charger les participants.", variant: "destructive" });
    }
  }, [toast]);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('competitions').select('*').order('start_date', { ascending: false });
      if (error) throw error;
      setCompetitions(data);
      if (data.length > 0) {
        fetchAllParticipants(data.map(c => c.id));
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les compétitions.", variant: "destructive" });
    }
    setLoading(false);
  }, [toast, fetchAllParticipants]);

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('members').select('id, first_name, last_name, title, sub_group, category').order('last_name');
      if (error) throw error;
      setMembers(data);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les membres.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchCompetitions();
    fetchMembers();
  }, [fetchCompetitions, fetchMembers]);

  const uploadFile = async (file, bucket) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `competitions/${Date.now()}-${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      const { imageFile, ...compData } = formData;
      if (imageFile) {
        const imageUrl = await uploadFile(imageFile, 'exercise_images');
        if (imageUrl) compData.image_url = imageUrl;
      }
      if (editingCompetition && editingCompetition.id) {
        const { error } = await supabase.from('competitions').update(compData).eq('id', editingCompetition.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('competitions').insert(compData).select().single();
        if (error) throw error;
      }
      toast({ title: "Succès", description: "Compétition sauvegardée." });
      setIsFormVisible(false);
      setEditingCompetition(null);
      await fetchCompetitions();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (competitionId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette compétition ?")) return;
    try {
      await supabase.from('competition_participants').delete().eq('competition_id', competitionId);
      const { error } = await supabase.from('competitions').delete().eq('id', competitionId);
      if (error) throw error;
      toast({ title: "Succès", description: "Compétition supprimée." });
      fetchCompetitions();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleAddParticipant = async (participantData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('competition_participants').insert(participantData);
      if (error) throw error;
      toast({ title: "Succès", description: "Participant ajouté." });
      fetchAllParticipants([participantData.competition_id]);
      setIsAddParticipantFormVisible(false);
      setCompetitionForParticipant(null);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteParticipant = async (participantId, competitionId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir retirer ce participant ?")) return;
    try {
      const { error } = await supabase.from('competition_participants').delete().eq('id', participantId);
      if (error) throw error;
      toast({ title: "Succès", description: "Participant retiré." });
      fetchAllParticipants([competitionId]);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveRanking = async (participantId, ranking, nbCompetitor) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('competition_participants').update({ ranking: ranking || null, nb_competitor: nbCompetitor || null }).eq('id', participantId);
      if (error) throw error;
      toast({ title: "Succès", description: "Classement sauvegardé." });
      fetchAllParticipants([participantForRanking.competition_id]);
      setIsRankingFormVisible(false);
      setParticipantForRanking(null);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhotos = async (competitionId, files) => {
    setIsSaving(true);
    try {
      const uploadPromises = files.map(file => uploadFile(file, 'exercise_images'));
      const photoUrls = await Promise.all(uploadPromises);
      const { data: currentCompetition, error: fetchError } = await supabase.from('competitions').select('photo_gallery').eq('id', competitionId).single();
      if (fetchError) throw fetchError;
      const existingPhotos = currentCompetition.photo_gallery || [];
      const updatedPhotos = [...existingPhotos, ...photoUrls.filter(url => url)];
      const { error: updateError } = await supabase.from('competitions').update({ photo_gallery: updatedPhotos }).eq('id', competitionId);
      if (updateError) throw updateError;
      toast({ title: "Succès", description: "Photos ajoutées." });
      setIsPhotoUploadFormVisible(false);
      setCompetitionForPhotos(null);
      await fetchCompetitions();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePhoto = async (competitionId, photoUrl) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) return;
    try {
      const { data: currentCompetition, error: fetchError } = await supabase.from('competitions').select('photo_gallery').eq('id', competitionId).single();
      if (fetchError) throw fetchError;
      const updatedPhotos = (currentCompetition.photo_gallery || []).filter(p => p !== photoUrl);
      const { error: updateError } = await supabase.from('competitions').update({ photo_gallery: updatedPhotos }).eq('id', competitionId);
      if (updateError) throw updateError;
      toast({ title: "Succès", description: "Photo supprimée." });
      await fetchCompetitions();
      const path = photoUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('exercise_images').remove([path]);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer la photo.", variant: "destructive" });
    }
  };

  const showAdminFeatures = !authLoading && isAdmin;

  const handleImageView = (url, gallery) => {
    const index = gallery.indexOf(url);
    setViewingImage({ url, index, gallery });
  };

  const showNextImage = () => {
    setViewingImage(prev => {
      const nextIndex = (prev.index + 1) % prev.gallery.length;
      return { ...prev, url: prev.gallery[nextIndex], index: nextIndex };
    });
  };

  const showPrevImage = () => {
    setViewingImage(prev => {
      const prevIndex = (prev.index - 1 + prev.gallery.length) % prev.gallery.length;
      return { ...prev, url: prev.gallery[prevIndex], index: prevIndex };
    });
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-end">
            {showAdminFeatures && (
                <Button onClick={() => { setEditingCompetition(null); setIsFormVisible(true); }}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Ajouter une compétition
                </Button>
            )}
        </div>
        
        {competitions.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Aucune compétition pour le moment.</p>
        ) : (
          competitions.map((comp) => (
            <CompetitionCard
              key={comp.id}
              comp={comp}
              participants={participants[comp.id] || []}
              showAdminFeatures={showAdminFeatures}
              onEdit={() => { setEditingCompetition(comp); setIsFormVisible(true); }}
              onDelete={handleDelete}
              onAddParticipant={() => { setCompetitionForParticipant(comp); setIsAddParticipantFormVisible(true); }}
              onRanking={(p) => { setParticipantForRanking(p); setIsRankingFormVisible(true); }}
              onDeleteParticipant={handleDeleteParticipant}
              onAddPhotos={() => { setCompetitionForPhotos(comp); setIsPhotoUploadFormVisible(true); }}
              onDeletePhoto={handleDeletePhoto}
              onImageView={handleImageView}
            />
          ))
        )}
      </div>

      <AnimatePresence>
        {isFormVisible && showAdminFeatures && (
          <CompetitionForm key={editingCompetition?.id || 'new'} competition={editingCompetition} onSave={handleSave} onCancel={() => { setIsFormVisible(false); setEditingCompetition(null); }} isSaving={isSaving} />
        )}
        {isAddParticipantFormVisible && showAdminFeatures && (
          <AddParticipantForm onSave={handleAddParticipant} onCancel={() => { setIsAddParticipantFormVisible(false); setCompetitionForParticipant(null); }} isSaving={isSaving} members={members} competition={competitionForParticipant} />
        )}
        {isRankingFormVisible && showAdminFeatures && (
          <RankingForm participant={participantForRanking} onSave={handleSaveRanking} onCancel={() => { setIsRankingFormVisible(false); setParticipantForRanking(null); }} isSaving={isSaving} />
        )}
        {isPhotoUploadFormVisible && showAdminFeatures && (
          <PhotoUploadForm competition={competitionForPhotos} onSave={handleSavePhotos} onCancel={() => { setIsPhotoUploadFormVisible(false); setCompetitionForPhotos(null); }} isSaving={isSaving} />
        )}
      </AnimatePresence>

      <Dialog open={!!viewingImage.url} onOpenChange={() => setViewingImage({ url: null, index: -1, gallery: [] })}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
          <div className="relative">
            <img src={viewingImage.url} alt="Aperçu de la photo" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
            {viewingImage.gallery.length > 1 && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white" onClick={showPrevImage}>
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white" onClick={showNextImage}>
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClubCompetitions;
                <span className="font-medium">{formatName(p.members.first_name, p.members.last_name, true)}</span>
                {showAdminFeatures && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteParticipant(p.id, competitionId)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  const handleImageView = (url, gallery) => {
    const index = gallery.indexOf(url);
    setViewingImage({ url, index, gallery });
  };

  const showNextImage = () => {
    setViewingImage(prev => {
      const nextIndex = (prev.index + 1) % prev.gallery.length;
      return { ...prev, url: prev.gallery[nextIndex], index: nextIndex };
    });
  };

  const showPrevImage = () => {
    setViewingImage(prev => {
      const prevIndex = (prev.index - 1 + prev.gallery.length) % prev.gallery.length;
      return { ...prev, url: prev.gallery[prevIndex], index: prevIndex };
    });
  };

  const renderContent = () => {
    if (loading || authLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    if (competitions.length === 0) {
      return <p className="text-center text-muted-foreground py-16">Aucune compétition pour le moment.</p>;
    }

    return (
      <div className="space-y-8">
        <div className="flex justify-end">
            {showAdminFeatures && (
                <Button onClick={() => { setEditingCompetition(null); setIsFormVisible(true); }}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Ajouter une compétition
                </Button>
            )}
        </div>
        {competitions.map((comp) => (
          <Card key={comp.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 p-4">
              {comp.image_url && <img src={comp.image_url} alt={comp.name} className="w-24 h-24 object-cover rounded-md" />}
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">{comp.name}</CardTitle>
                <p className="text-md text-muted-foreground">{new Date(comp.start_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Separator className="my-4" />
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-xl mb-2">Informations</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> <strong>Date:</strong> {new Date(comp.start_date).toLocaleDateString('fr-FR')} {comp.end_date && ` - ${new Date(comp.end_date).toLocaleDateString('fr-FR')}`}</li>
                    <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> <strong>Lieu:</strong> {comp.location}</li>
                    <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> <strong>Niveau:</strong> {comp.niveau}</li>
                    <li className="flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> <strong>Nature:</strong> {comp.nature}</li>
                    {comp.categories?.length > 0 && <li className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> <strong>Catégories:</strong> {comp.categories.join(', ')}</li>}
                    {comp.disciplines?.length > 0 && <li className="flex items-center gap-2"><ChevronsUpDown className="w-4 h-4 text-primary" /> <strong>Disciplines:</strong> <div className="flex flex-wrap gap-1">{comp.disciplines.map(d => <DisciplineBadge key={d} discipline={d} />)}</div></li>}
                    {comp.prix > 0 && <li className="flex items-center gap-2"><span className="text-primary font-bold">€</span> <strong>Prix:</strong> {comp.prix} €</li>}
                  </ul>
                </div>
                <div>
                  {comp.details_description && <p className="mb-4">{comp.details_description}</p>}
                  {comp.details_schedule?.length > 0 && (
                    <>
                      <h5 className="font-semibold mb-2">Programme</h5>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {comp.details_schedule.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold text-xl mb-2">Participants</h4>
                {renderParticipantList(comp.id)}
              </div>
              {comp.photo_gallery && comp.photo_gallery.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-xl mb-2">Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {comp.photo_gallery.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <img src={photoUrl} alt={`Photo de la compétition ${index + 1}`} className="w-full h-32 object-cover rounded-md cursor-pointer" onClick={() => handleImageView(photoUrl, comp.photo_gallery)} />
                        {showAdminFeatures && (
                          <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeletePhoto(comp.id, photoUrl)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  {comp.more_info_link && <Button asChild variant="outline"><a href={comp.more_info_link} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Plus d'infos</a></Button>}
                  {showAdminFeatures && (
                    <Button variant="outline" onClick={() => { setCompetitionForPhotos(comp); setIsPhotoUploadFormVisible(true); }}>
                      <ImagePlus className="w-4 h-4 mr-2" /> Ajouter des photos
                    </Button>
                  )}
                </div>
                {showAdminFeatures && (
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => { setCompetitionForParticipant(comp); setIsAddParticipantFormVisible(true); }}><UserPlus className="w-4 h-4 mr-2" />Ajouter un participant</Button>
                    <Button variant="secondary" onClick={() => { setEditingCompetition(comp); setIsFormVisible(true); }}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
                    <Button variant="destructive" onClick={() => handleDelete(comp.id)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <AnimatePresence>
        {isFormVisible && showAdminFeatures && (
          <CompetitionForm 
            key={editingCompetition?.id || 'new'} 
            competition={editingCompetition} 
            onSave={handleSave} 
            onCancel={() => { setIsFormVisible(false); setEditingCompetition(null); }} 
            isSaving={isSaving} 
          />
        )}
        {isAddParticipantFormVisible && showAdminFeatures && (
          <AddParticipantForm 
            onSave={handleAddParticipant} 
            onCancel={() => { setIsAddParticipantFormVisible(false); setCompetitionForParticipant(null); }} 
            isSaving={isSaving} 
            members={members} 
            competition={competitionForParticipant} 
          />
        )}
        {isRankingFormVisible && showAdminFeatures && (
          <RankingForm 
            participant={participantForRanking} 
            onSave={handleSaveRanking} 
            onCancel={() => { setIsRankingFormVisible(false); setParticipantForRanking(null); }} 
            isSaving={isSaving} 
          />
        )}
        {isPhotoUploadFormVisible && showAdminFeatures && (
          <PhotoUploadForm 
            competition={competitionForPhotos} 
            onSave={handleSavePhotos} 
            onCancel={() => { setIsPhotoUploadFormVisible(false); setCompetitionForPhotos(null); }} 
            isSaving={isSaving} 
          />
        )}
      </AnimatePresence>
      <Dialog open={!!viewingImage.url} onOpenChange={() => setViewingImage({ url: null, index: -1, gallery: [] })}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
          <div className="relative">
            <img src={viewingImage.url} alt="Aperçu de la photo" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
            {viewingImage.gallery.length > 1 && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white" onClick={showPrevImage}>
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white" onClick={showNextImage}>
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClubCompetitions;
      setIsSaving(false);
    }
  };

  const handleSavePhotos = async (competitionId, files) => {
    setIsSaving(true);
    try {
      const uploadPromises = files.map(file => uploadFile(file, 'exercise_images'));
      const photoUrls = await Promise.all(uploadPromises);
      const { data: currentCompetition, error: fetchError } = await supabase.from('competitions').select('photo_gallery').eq('id', competitionId).single();
      if (fetchError) throw fetchError;
      const existingPhotos = currentCompetition.photo_gallery || [];
      const updatedPhotos = [...existingPhotos, ...photoUrls.filter(url => url)];
      const { error: updateError } = await supabase.from('competitions').update({ photo_gallery: updatedPhotos }).eq('id', competitionId);
      if (updateError) throw updateError;
      toast({ title: "Succès", description: "Photos ajoutées." });
      setIsPhotoUploadFormVisible(false);
      setCompetitionForPhotos(null);
      await fetchCompetitions();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePhoto = async (competitionId, photoUrl) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) return;
    try {
      const { data: currentCompetition, error: fetchError } = await supabase.from('competitions').select('photo_gallery').eq('id', competitionId).single();
      if (fetchError) throw fetchError;
      const updatedPhotos = (currentCompetition.photo_gallery || []).filter(p => p !== photoUrl);
      const { error: updateError } = await supabase.from('competitions').update({ photo_gallery: updatedPhotos }).eq('id', competitionId);
      if (updateError) throw updateError;
      toast({ title: "Succès", description: "Photo supprimée." });
      await fetchCompetitions();
      const path = photoUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('exercise_images').remove([path]);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer la photo.", variant: "destructive" });
    }
  };

  const showAdminFeatures = !authLoading && isAdmin;

  const renderParticipantList = (competitionId) => {
    const currentParticipants = participants[competitionId] || [];
    if (currentParticipants.length === 0) return null;

    const roleOrder = { 'belayer': 1, 'judge': 2, 'competitor': 3 };
    const sortedParticipants = [...currentParticipants].sort((a, b) => {
      const roleDiff = (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4);
      if (roleDiff !== 0) return roleDiff;
      if (a.role === 'competitor') {
        const categoryA = a.members?.category || '';
        const categoryB = b.members?.category || '';
        const categoryDiff = categoryA.localeCompare(categoryB);
        if (categoryDiff !== 0) return categoryDiff;
        const sexeA = a.members?.sexe || '';
        const sexeB = b.members?.sexe || '';
        return sexeA.localeCompare(sexeB);
      }
      return (a.members?.last_name || '').localeCompare(b.members?.last_name || '');
    });

    const groupedByRole = sortedParticipants.reduce((acc, p) => {
      if (!p.members) return acc;
      const role = p.role;
      if (!acc[role]) acc[role] = [];
      acc[role].push(p);
      return acc;
    }, {});
    
    const roleNames = { belayer: 'Coaches', judge: 'Arbitres', competitor: 'Compétiteurs' };

    return ['belayer', 'judge', 'competitor'].map(role => {
      const group = groupedByRole[role];
      if (!group || group.length === 0) return null;

      if (role === 'competitor') {
        const groupedCompetitors = group.reduce((acc, p) => {
          const key = `${p.members.category || 'N/A'} ${p.members.sexe || 'N/A'}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(p);
          return acc;
        }, {});

        return (
          <div key={role} className="mt-4">
            <h4 className="font-semibold text-lg mb-2">{roleNames[role]}</h4>
            {Object.entries(groupedCompetitors).map(([groupKey, competitors]) => (
              <div key={groupKey} className="mb-3">
                <p className="font-medium text-md text-muted-foreground">{groupKey}</p>
                <ul className="space-y-1 pl-4">
                  {competitors.map(p => (
                    <li key={p.id} className="flex items-center justify-between p-1 rounded-md">
                      <div className="flex items-center gap-2">
                        <span>{formatName(p.members.first_name, p.members.last_name, false)}</span>
                        {p.ranking && (
                          <span className="text-sm font-bold text-primary">
                            – {p.ranking}ème{p.nb_competitor ? ` / ${p.nb_competitor}` : ''}
                          </span>
                        )}
                      </div>
                      {showAdminFeatures && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setParticipantForRanking(p); setIsRankingFormVisible(true); }}><Award className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteParticipant(p.id, competitionId)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div key={role} className="mt-4">
          <h4 className="font-semibold text-lg mb-2">{roleNames[role]}</h4>
          <ul className="space-y-2">
            {group.map(p => (
              <li key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span className="font-medium">{formatName(p.members.first_name, p.members.last_name, true)}</span>
                {showAdminFeatures && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteParticipant(p.id, competitionId)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  const handleImageView = (url, gallery) => {
    const index = gallery.indexOf(url);
    setViewingImage({ url, index, gallery });
  };

  const showNextImage = () => {
    setViewingImage(prev => {
      const nextIndex = (prev.index + 1) % prev.gallery.length;
      return { ...prev, url: prev.gallery[nextIndex], index: nextIndex };
    });
  };

  const showPrevImage = () => {
    setViewingImage(prev => {
      const prevIndex = (prev.index - 1 + prev.gallery.length) % prev.gallery.length;
      return { ...prev, url: prev.gallery[prevIndex], index: prevIndex };
    });
  };

  const renderContent = () => {
    if (loading || authLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    if (competitions.length === 0) {
      return <p className="text-center text-muted-foreground py-16">Aucune compétition pour le moment.</p>;
    }

    return (
      <div className="space-y-8">
        <div className="flex justify-end">
            {showAdminFeatures && (
                <Button onClick={() => { setEditingCompetition(null); setIsFormVisible(true); }}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Ajouter une compétition
                </Button>
            )}
        </div>
        {competitions.map((comp) => (
          <Card key={comp.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 p-4">
              {comp.image_url && <img src={comp.image_url} alt={comp.name} className="w-24 h-24 object-cover rounded-md" />}
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">{comp.name}</CardTitle>
                <p className="text-md text-muted-foreground">{new Date(comp.start_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Separator className="my-4" />
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-xl mb-2">Informations</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> <strong>Date:</strong> {new Date(comp.start_date).toLocaleDateString('fr-FR')} {comp.end_date && ` - ${new Date(comp.end_date).toLocaleDateString('fr-FR')}`}</li>
                    <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> <strong>Lieu:</strong> {comp.location}</li>
                    <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> <strong>Niveau:</strong> {comp.niveau}</li>
                    <li className="flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> <strong>Nature:</strong> {comp.nature}</li>
                    {comp.categories?.length > 0 && <li className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> <strong>Catégories:</strong> {comp.categories.join(', ')}</li>}
                    {comp.disciplines?.length > 0 && <li className="flex items-center gap-2"><ChevronsUpDown className="w-4 h-4 text-primary" /> <strong>Disciplines:</strong> <div className="flex flex-wrap gap-1">{comp.disciplines.map(d => <DisciplineBadge key={d} discipline={d} />)}</div></li>}
                    {comp.prix > 0 && <li className="flex items-center gap-2"><span className="text-primary font-bold">€</span> <strong>Prix:</strong> {comp.prix} €</li>}
                  </ul>
                </div>
                <div>
                  {comp.details_description && <p className="mb-4">{comp.details_description}</p>}
                  {comp.details_schedule?.length > 0 && (
                    <>
                      <h5 className="font-semibold mb-2">Programme</h5>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {comp.details_schedule.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold text-xl mb-2">Participants</h4>
                {renderParticipantList(comp.id)}
              </div>
              {comp.photo_gallery && comp.photo_gallery.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-xl mb-2">Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {comp.photo_gallery.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <img src={photoUrl} alt={`Photo de la compétition ${index + 1}`} className="w-full h-32 object-cover rounded-md cursor-pointer" onClick={() => handleImageView(photoUrl, comp.photo_gallery)} />
                        {showAdminFeatures && (
                          <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeletePhoto(comp.id, photoUrl)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  {comp.more_info_link && <Button asChild variant="outline"><a href={comp.more_info_link} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Plus d'infos</a></Button>}
                  {showAdminFeatures && (
                    <Button variant="outline" onClick={() => { setCompetitionForPhotos(comp); setIsPhotoUploadFormVisible(true); }}>
                      <ImagePlus className="w-4 h-4 mr-2" /> Ajouter des photos
                    </Button>
                  )}
                </div>
                {showAdminFeatures && (
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => { setCompetitionForParticipant(comp); setIsAddParticipantFormVisible(true); }}><UserPlus className="w-4 h-4 mr-2" />Ajouter un participant</Button>
                    <Button variant="secondary" onClick={() => { setEditingCompetition(comp); setIsFormVisible(true); }}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
                    <Button variant="destructive" onClick={() => handleDelete(comp.id)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <AnimatePresence>
        {isFormVisible && showAdminFeatures && (
          <CompetitionForm key={editingCompetition?.id || 'new'} competition={editingCompetition} onSave={handleSave} onCancel={() => { setIsFormVisible(false); setEditingCompetition(null); }} isSaving={isSaving} />
        )}
        {isAddParticipantFormVisible && showAdminFeatures && (
          <AddParticipantForm onSave={handleAddParticipant} onCancel={() => { setIsAddParticipantFormVisible(false); setCompetitionForParticipant(null); }} isSaving={isSaving} members={members} competition={competitionForParticipant} />
        )}
        {isRankingFormVisible && showAdminFeatures && (
          <RankingForm participant={participantForRanking} onSave={handleSaveRanking} onCancel={() => { setIsRankingFormVisible(false); setParticipantForRanking(null); }} isSaving={isSaving} />
        )}
        {isPhotoUploadFormVisible && showAdminFeatures && (
          <PhotoUploadForm competition={competitionForPhotos} onSave={handleSavePhotos} onCancel={() => { setIsPhotoUploadFormVisible(false); setCompetitionForPhotos(null); }} isSaving={isSaving} />
        )}
      </AnimatePresence>
      <Dialog open={!!viewingImage.url} onOpenChange={() => setViewingImage({ url: null, index: -1, gallery: [] })}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
          <div className="relative">
            <img src={viewingImage.url} alt="Aperçu de la photo" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
            {viewingImage.gallery.length > 1 && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white" onClick={showPrevImage}>
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white" onClick={showNextImage}>
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClubCompetitions;
