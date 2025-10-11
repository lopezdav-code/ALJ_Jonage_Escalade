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
import { Loader2, ArrowLeft, PlusCircle, Trash2, Calendar, Users, MapPin, Clock } from 'lucide-react';
import { formatName } from '@/lib/utils';

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
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [isAddingSessions, setIsAddingSessions] = useState(false);

  const canManageCycles = isAdmin || isEncadrant;

  useEffect(() => {
    if (id) {
      fetchCycleDetails();
      fetchCycleSessions();
      if (canManageCycles) {
        fetchAvailableSessions();
      }
    }
  }, [id, canManageCycles]);

  const fetchCycleDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCycle(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de charger le cycle: ${error.message}`,
        variant: "destructive",
      });
      navigate('/cycles');
    }
  };

  const fetchCycleSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          members!sessions_member_id_fkey(id, first_name, last_name),
          session_participants(
            member_id,
            members(id, first_name, last_name)
          )
        `)
        .eq('cycle_id', id)
        .order('date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les séances: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, date, location, members!sessions_member_id_fkey(first_name, last_name)')
        .is('cycle_id', null)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAvailableSessions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des séances disponibles:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
    <>
      <Helmet>
        <title>{cycle.name} - Cycles - ALJ Escalade</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
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

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {cycle.name}
                </h1>
                {cycle.short_description && (
                  <p className="text-xl text-gray-600 mb-4">
                    {cycle.short_description}
                  </p>
                )}
                {cycle.long_description && (
                  <p className="text-gray-600 max-w-3xl">
                    {cycle.long_description}
                  </p>
                )}
              </div>
              {canManageCycles && (
                <Button onClick={() => setIsAddSessionDialogOpen(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Ajouter une séance
                </Button>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                  Participants total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {sessions.reduce((sum, session) => 
                    sum + (session.session_participants?.length || 0), 0
                  )}
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
                <div className="text-sm">
                  {sessions.length > 0 ? (
                    <>
                      {new Date(sessions[sessions.length - 1]?.date).toLocaleDateString('fr-FR')}
                      {' → '}
                      {new Date(sessions[0]?.date).toLocaleDateString('fr-FR')}
                    </>
                  ) : (
                    'Aucune séance'
                  )}
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
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {formatDate(session.date)}
                            </h3>
                            <Badge variant="secondary">
                              <Users className="w-3 h-3 mr-1" />
                              {session.session_participants?.length || 0} participants
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            {session.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{session.location}</span>
                              </div>
                            )}
                            {session.members && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>
                                  Encadrant: {formatName(session.members.first_name, session.members.last_name)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {canManageCycles && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSessionFromCycle(session.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                      {new Date(session.date).toLocaleDateString('fr-FR')} - {session.location}
                      {session.members && ` (${formatName(session.members.first_name, session.members.last_name)})`}
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
    </>
  );
};

export default CycleDetail;
