import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, PlusCircle, Trash2, Calendar, Users, Clock, Pencil, Settings, FileText, Upload } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/input'; // Ensure Input and Textarea are imported
import { Label } from '@/components/ui/label';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const CYCLE_BUCKET_NAME = 'cycle_documents';

const CycleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isEncadrant } = useAuth();
  const { toast } = useToast();

  const [cycle, setCycle] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);
  const [isCreateSessionDialogOpen, setIsCreateSessionDialogOpen] = useState(false);
  const [isFictitiousSessionDialogOpen, setIsFictitiousSessionDialogOpen] = useState(false);
  const [isEditCycleDialogOpen, setIsEditCycleDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [isAddingSessions, setIsAddingSessions] = useState(false);
  const [isSavingCycle, setIsSavingCycle] = useState(false);
  const [cycleEditData, setCycleEditData] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imagePosition, setImagePosition] = useState('center');
  const [newSessionData, setNewSessionData] = useState({
    instructors: [],
    session_objective: '',
    equipment: '',
    comment: '',
  });
  const [fictitiousSessionData, setFictitiousSessionData] = useState({
    session_objective: 'Séance fictive',
    instructors: [],
    equipment: '',
    comment: 'Cette séance est fictive et n\'a pas de date.'
  });

  const canManageCycles = isAdmin || isEncadrant;

  const handleEditSession = (session) => {
    navigate(`/session-log/edit/${session.id}?from=cycle&cycleId=${id}`);
  };

  const handleOpenEditCycle = () => {
    setCycleEditData({
      name: cycle.name || '',
      short_description: cycle.short_description || '',
      long_description: cycle.long_description || '',
    });
    setImagePreview(cycle.image_url || null);
    setImagePosition(cycle.image_position || 'center');
    setIsEditCycleDialogOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(CYCLE_BUCKET_NAME)
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Erreur d'upload: ${uploadError.message || 'Le bucket "cycle_documents" n\'existe peut-être pas dans Supabase Storage'}`);
    }

    const { data } = supabase.storage.from(CYCLE_BUCKET_NAME).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSaveCycleEdits = async () => {
    setIsSavingCycle(true);
    try {
      const updateData = {
        ...cycleEditData,
        image_position: imagePosition,
      };

      // Upload PDF if provided
      if (pdfFile) {
        const pdfUrl = await uploadFile(pdfFile, 'pdfs');
        updateData.pdf_url = pdfUrl;
      }

      // Upload image if provided
      if (imageFile) {
        const imageUrl = await uploadFile(imageFile, 'images');
        updateData.image_url = imageUrl;
      }

      const { error } = await supabase
        .from('cycles')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le cycle a été mis à jour avec succès.",
      });

      setIsEditCycleDialogOpen(false);
      setPdfFile(null);
      setImageFile(null);
      setImagePreview(null);
      setImagePosition('center');
      fetchCycleDetails();
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le cycle: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSavingCycle(false);
    }
  };

  const fetchCycleDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCycle(data);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de charger le cycle: ${error.message}`,
        variant: "destructive",
      });
      navigate('/cycles');
    }
  };

  const fetchAvailableSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, date, start_time, instructors')
        .is('cycle_id', null)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAvailableSessions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des séances disponibles:', error);
    }
  };

  const fetchCycleSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('cycle_id', id)
        .order('date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setSessions(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des séances du cycle:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les séances: ${error.message}`,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleAddSessionToCycle = async () => {
    if (!selectedSessionId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une séance",
        variant: "destructive",
      });
      return;
    }

    setIsAddingSessions(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ cycle_id: id })
        .eq('id', selectedSessionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Séance ajoutée au cycle",
      });

      setIsAddSessionDialogOpen(false);
      setSelectedSessionId('');
      fetchCycleSessions();
      fetchAvailableSessions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter la séance: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsAddingSessions(false);
    }
  };

  const handleRemoveSessionFromCycle = async (sessionId) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ cycle_id: null })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Séance retirée du cycle",
      });

      fetchCycleSessions();
      if (canManageCycles) {
        fetchAvailableSessions();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de retirer la séance: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleCreateSession = async () => {
    setIsAddingSessions(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          ...newSessionData,
          cycle_id: id,
          date: null, // No date for this session
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Séance créée avec succès.",
      });

      setIsCreateSessionDialogOpen(false);
      setNewSessionData({
        instructors: [],
        session_objective: '',
        equipment: '',
        comment: '',
      });
      fetchCycleSessions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de créer la séance: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsAddingSessions(false);
    }
  };

  const handleSaveFictitiousSession = async () => {
    setIsAddingSessions(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          ...fictitiousSessionData,
          cycle_id: id,
          date: null, // No date for fictitious session
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Séance fictive créée avec succès.",
      });

      setIsFictitiousSessionDialogOpen(false);
      setFictitiousSessionData({
        session_objective: 'Séance fictive',
        instructors: [],
        equipment: '',
        comment: 'Cette séance est fictive et n\'a pas de date.'
      });
      fetchCycleSessions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de créer la séance fictive: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsAddingSessions(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (id) {
      fetchCycleDetails();
      fetchCycleSessions();
      if (canManageCycles) {
        fetchAvailableSessions();
      }
    }
  }, [id, canManageCycles]);

  const filteredSessions = sessions; // Affiche toutes les séances, même sans date

  if (loading && !cycle) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cycle) {
    return null;
  }

  return (
    <ProtectedRoute
      requireAdherent={true}
      pageTitle="Détail du cycle"
      message="Les détails des cycles sont réservés aux adhérents du club. Veuillez vous connecter avec un compte adhérent pour y accéder."
    >
      <Helmet>
        <title>{cycle.name} - Cycles - ALJ Escalade</title>
      </Helmet>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/cycles')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux cycles
            </Button>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  {/* Image illustrative en miniature */}
                  {cycle.image_url && (
                    <div className="flex-shrink-0">
                      <a
                        href={cycle.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={cycle.image_url}
                          alt={cycle.name}
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-gray-200"
                        />
                      </a>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                        {cycle.name}
                      </h1>
                      {canManageCycles && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenEditCycle}
                          className="flex-shrink-0"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      )}
                    </div>
                    {cycle.short_description && (
                      <p className="text-lg sm:text-xl text-gray-600 mb-4">
                        {cycle.short_description}
                      </p>
                    )}
                    {cycle.long_description && (
                      <p className="text-gray-600 max-w-3xl">
                        {cycle.long_description}
                      </p>
                    )}

                    {/* Affichage du document PDF */}
                    {cycle.pdf_url && (
                      <div className="mt-4">
                        <a
                          href={cycle.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm font-medium">Document PDF</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {canManageCycles && (
                <Button onClick={() => setIsAddSessionDialogOpen(true)} className="w-full sm:w-auto flex-shrink-0">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Ajouter une séance
                </Button>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Nombre de séances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{sessions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Élèves participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {(() => {
                    const allStudents = new Set();
                    sessions.forEach(session => {
                      session.students?.forEach(student => allStudents.add(student));
                    });
                    const studentsList = Array.from(allStudents).sort();
                    return studentsList.length > 0 ? (
                      <div className="text-sm max-h-32 overflow-y-auto">
                        {studentsList.map((student, index) => (
                          <div key={index} className="py-0.5">• {student}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">Aucun élève</div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Encadrants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {(() => {
                    const allInstructors = new Set();
                    sessions.forEach(session => {
                      session.instructors?.forEach(instructor => allInstructors.add(instructor));
                    });
                    const instructorsList = Array.from(allInstructors).sort();
                    return instructorsList.length > 0 ? (
                      <div className="text-sm">
                        {instructorsList.map((instructor, index) => (
                          <div key={index} className="py-0.5">• {instructor}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">Aucun encadrant</div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Période
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm break-words">
                  {(() => {
                    const sessionsWithDate = sessions.filter(s => s.date);
                    if (sessionsWithDate.length === 0) return 'Aucune date';
                    const lastDate = sessionsWithDate[sessionsWithDate.length - 1]?.date;
                    const firstDate = sessionsWithDate[0]?.date;
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span>{new Date(lastDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="hidden sm:inline">→</span>
                        <span className="sm:hidden">↓</span>
                        <span>{new Date(firstDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des séances */}
          <Card>
            <CardHeader>
              <CardTitle>Séances du cycle</CardTitle>
              <CardDescription>
                Liste de toutes les séances associées à ce cycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Aucune séance dans ce cycle</p>
                  {canManageCycles && (
                    <Button onClick={() => setIsAddSessionDialogOpen(true)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Ajouter une séance
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="font-semibold text-base sm:text-lg">
                              {session.session_objective || 'Séance sans objectif'}
                            </h3>
                            <Badge variant="secondary" className="w-fit">
                              <Users className="w-3 h-3 mr-1" />
                              {session.students?.length || 0} participants
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            {session.date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">{formatDate(session.date)}</span>
                              </div>
                            )}
                            {session.start_time && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>{session.start_time}</span>
                              </div>
                            )}
                            {session.instructors && session.instructors.length > 0 && (
                              <div className="flex items-start gap-2">
                                <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span className="break-words">
                                  Encadrants: {session.instructors.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {canManageCycles && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSession(session)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSessionFromCycle(session.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Button to create a fictitious session */}
          {canManageCycles && (
            <div className="mt-4">
              <Button onClick={() => setIsFictitiousSessionDialogOpen(true)} className="w-full sm:w-auto">
                <PlusCircle className="w-4 h-4 mr-2" /> Créer une séance fictive
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dialog d'ajout de séance */}
      <Dialog open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une séance au cycle</DialogTitle>
            <DialogDescription>
              Sélectionnez une séance existante à ajouter à ce cycle
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une séance" />
              </SelectTrigger>
              <SelectContent>
                {availableSessions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Aucune séance disponible
                  </div>
                ) : (
                  availableSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.date
                        ? new Date(session.date).toLocaleDateString('fr-FR')
                        : 'Sans date'}
                      {session.start_time && ` - ${session.start_time}`}
                      {session.instructors && session.instructors.length > 0 && ` (${session.instructors[0]})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddSessionDialogOpen(false);
                setSelectedSessionId('');
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleAddSessionToCycle} disabled={isAddingSessions || !selectedSessionId}>
              {isAddingSessions && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de création de séance */}
      <Dialog open={isCreateSessionDialogOpen} onOpenChange={setIsCreateSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle séance</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer une nouvelle séance sans date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Objectif de la séance"
              value={newSessionData.session_objective}
              onChange={(e) => setNewSessionData({ ...newSessionData, session_objective: e.target.value })}
            />
            <Input
              placeholder="Équipement"
              value={newSessionData.equipment}
              onChange={(e) => setNewSessionData({ ...newSessionData, equipment: e.target.value })}
            />
            <Textarea
              placeholder="Commentaire"
              value={newSessionData.comment}
              onChange={(e) => setNewSessionData({ ...newSessionData, comment: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateSessionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateSession} disabled={isAddingSessions}>
              {isAddingSessions && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de création de séance fictive */}
      <Dialog open={isFictitiousSessionDialogOpen} onOpenChange={setIsFictitiousSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une séance fictive</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer une séance fictive.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Objectif de la séance"
              value={fictitiousSessionData.session_objective}
              onChange={(e) => setFictitiousSessionData({ ...fictitiousSessionData, session_objective: e.target.value })}
            />
            <Input
              placeholder="Équipement"
              value={fictitiousSessionData.equipment}
              onChange={(e) => setFictitiousSessionData({ ...fictitiousSessionData, equipment: e.target.value })}
            />
            <Textarea
              placeholder="Commentaire"
              value={fictitiousSessionData.comment}
              onChange={(e) => setFictitiousSessionData({ ...fictitiousSessionData, comment: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFictitiousSessionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveFictitiousSession} disabled={isAddingSessions}>
              {isAddingSessions && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition du cycle */}
      <Dialog open={isEditCycleDialogOpen} onOpenChange={setIsEditCycleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le cycle</DialogTitle>
            <DialogDescription>
              Modifiez les informations générales du cycle et ajoutez des documents.
            </DialogDescription>
          </DialogHeader>

          {cycleEditData && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="cycle-name">Nom du cycle</Label>
                <Input
                  id="cycle-name"
                  value={cycleEditData.name}
                  onChange={(e) => setCycleEditData({ ...cycleEditData, name: e.target.value })}
                  placeholder="Nom du cycle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycle-short-desc">Description courte</Label>
                <Input
                  id="cycle-short-desc"
                  value={cycleEditData.short_description}
                  onChange={(e) => setCycleEditData({ ...cycleEditData, short_description: e.target.value })}
                  placeholder="Description courte"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycle-long-desc">Description longue</Label>
                <Textarea
                  id="cycle-long-desc"
                  value={cycleEditData.long_description}
                  onChange={(e) => setCycleEditData({ ...cycleEditData, long_description: e.target.value })}
                  placeholder="Description détaillée du cycle"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycle-pdf">Document PDF</Label>
                {cycle.pdf_url && (
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    <a
                      href={cycle.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Document actuel
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="cycle-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {pdfFile && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Upload className="w-4 h-4" />
                      Prêt
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pdfFile ? 'Un nouveau PDF sera téléchargé' : 'Laisser vide pour conserver le PDF actuel'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycle-image">Image illustrative</Label>

                {/* Aperçu de l'image */}
                {imagePreview && (
                  <div className="space-y-2">
                    <div className="relative w-full h-48 overflow-hidden bg-gray-100 rounded-lg border-2 border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: imagePosition }}
                      />
                    </div>

                    {/* Contrôles de positionnement */}
                    <div className="space-y-2">
                      <Label className="text-sm">Position de l'image</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={imagePosition === 'top' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImagePosition('top')}
                          className="text-xs"
                        >
                          Haut
                        </Button>
                        <Button
                          type="button"
                          variant={imagePosition === 'center' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImagePosition('center')}
                          className="text-xs"
                        >
                          Centre
                        </Button>
                        <Button
                          type="button"
                          variant={imagePosition === 'bottom' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImagePosition('bottom')}
                          className="text-xs"
                        >
                          Bas
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    id="cycle-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  {imageFile && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Upload className="w-4 h-4" />
                      Prêt
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {imageFile ? 'Une nouvelle image sera téléchargée' : cycle.image_url ? 'Laisser vide pour conserver l\'image actuelle' : 'Format recommandé: 16:9 (1200x675px)'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditCycleDialogOpen(false);
                setPdfFile(null);
                setImageFile(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveCycleEdits} disabled={isSavingCycle}>
              {isSavingCycle && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
};

export default CycleDetail;
