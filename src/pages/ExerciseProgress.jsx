import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePageAccess } from '@/hooks/usePageAccess';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Circle, Filter, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const ExerciseProgress = () => {
  const { loading: authLoading, isAdmin, isEncadrant } = useAuth();
  const { hasAccess, loading: pageAccessLoading } = usePageAccess();
  const { toast } = useToast();

  const [groups, setGroups] = useState([]);
  const [pedagogySheets, setPedagogySheets] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, percentage: 0 });

  // Redirection si pas d'accès
  useEffect(() => {
    if (!authLoading && !pageAccessLoading && !hasAccess) {
      window.location.href = '/session-log';
      return;
    }
  }, [hasAccess, authLoading, pageAccessLoading]);

  // Charger les groupes
  const fetchGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, Groupe, type, age_category, day, start_time')
        .order('type')
        .order('age_category');

      if (error) throw error;

      // Grouper par Groupe ID unique
      const uniqueGroups = {};
      data?.forEach(schedule => {
        if (schedule.Groupe && !uniqueGroups[schedule.Groupe]) {
          uniqueGroups[schedule.Groupe] = {
            id: schedule.Groupe,
            name: `${schedule.type} - ${schedule.age_category}`,
            type: schedule.type,
            ageCategory: schedule.age_category,
          };
        }
      });

      const groupsArray = Object.values(uniqueGroups);
      setGroups(groupsArray);

      // Sélectionner le premier groupe par défaut
      if (groupsArray.length > 0) {
        setSelectedGroupId(groupsArray[0].id);
        setSelectedGroupName(groupsArray[0].name);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les groupes',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Charger tous les exercices pédagogiques
  const fetchPedagogySheets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pedagogy_sheets')
        .select('id, title, sheet_type, categories')
        .order('sheet_type')
        .order('title');

      if (error) throw error;
      setPedagogySheets(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des exercices pédagogiques:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les exercices pédagogiques',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Charger les exercices réalisés par le groupe
  const fetchCompletedExercises = useCallback(async (groupId) => {
    if (!groupId) return;

    try {
      setLoading(true);

      // 1. Récupérer tous les schedules du groupe
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select('id')
        .eq('Groupe', groupId);

      if (scheduleError) throw scheduleError;
      const scheduleIds = scheduleData?.map(s => s.id) || [];

      if (scheduleIds.length === 0) {
        setCompletedExercises(new Set());
        setStats({ total: pedagogySheets.length, completed: 0, percentage: 0 });
        setLoading(false);
        return;
      }

      // 2. Récupérer toutes les sessions de ces schedules
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .in('schedule_id', scheduleIds);

      if (sessionError) throw sessionError;
      const sessionIds = sessionData?.map(s => s.id) || [];

      if (sessionIds.length === 0) {
        setCompletedExercises(new Set());
        setStats({ total: pedagogySheets.length, completed: 0, percentage: 0 });
        setLoading(false);
        return;
      }

      // 3. Récupérer tous les exercices de ces sessions
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('pedagogy_sheet_id')
        .in('session_id', sessionIds)
        .not('pedagogy_sheet_id', 'is', null);

      if (exerciseError) throw exerciseError;

      // Créer un Set des pedagogy_sheet_id réalisés
      const completed = new Set();
      exerciseData?.forEach(exercise => {
        if (exercise.pedagogy_sheet_id) {
          completed.add(exercise.pedagogy_sheet_id);
        }
      });

      setCompletedExercises(completed);

      // Calculer les statistiques
      const completedCount = completed.size;
      const totalCount = pedagogySheets.length;
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      setStats({ total: totalCount, completed: completedCount, percentage });
    } catch (error) {
      console.error('Erreur lors du chargement des exercices réalisés:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la progression',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [pedagogySheets.length, toast]);

  // Initial load
  useEffect(() => {
    fetchGroups();
    fetchPedagogySheets();
  }, [fetchGroups, fetchPedagogySheets]);

  // Load completed exercises when group changes
  useEffect(() => {
    fetchCompletedExercises(selectedGroupId);
  }, [selectedGroupId, fetchCompletedExercises]);

  // Handle group change
  const handleGroupChange = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    setSelectedGroupId(groupId);
    if (group) {
      setSelectedGroupName(group.name);
    }
  };

  // Grouper les exercices par type
  const groupedExercises = pedagogySheets.reduce((acc, exercise) => {
    const type = exercise.sheet_type || 'Autres';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(exercise);
    return acc;
  }, {});

  if (!hasAccess && !authLoading && !pageAccessLoading) {
    return null;
  }

  return (
    <ProtectedRoute
      requireEncadrant={true}
      pageTitle="Progression des exercices"
      message="Cette page est réservée aux encadrants. Veuillez vous connecter avec un compte encadrant."
    >
      <Helmet>
        <title>Progression des exercices - ALJ Escalade</title>
      </Helmet>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Progression des exercices pédagogiques
            </h1>
            <p className="text-gray-600">
              Suivez les exercices pédagogiques réalisés par chaque groupe
            </p>
          </div>

          {/* Sélecteur de groupe */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Sélectionner un groupe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Choisissez un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Statistiques */}
          {selectedGroupId && !loading && (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">{stats.completed}</div>
                    <p className="text-sm text-gray-600">Réalisés</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600">{stats.total}</div>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.percentage}%</div>
                    <p className="text-sm text-gray-600">Progression</p>
                  </div>
                </div>
                {/* Barre de progression */}
                <div className="mt-6">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exercices par type */}
          {loading ? (
            <div className="flex justify-center items-center min-h-[40vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : Object.keys(groupedExercises).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                Aucun exercice pédagogique trouvé
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedExercises).map(([type, exercises]) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {type}
                        <Badge className="ml-3" variant="outline">
                          {exercises.filter(e => completedExercises.has(e.id)).length}/{exercises.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exercises.map(exercise => {
                          const isCompleted = completedExercises.has(exercise.id);
                          return (
                            <motion.div
                              key={exercise.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                isCompleted
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className={`font-medium text-sm break-words ${
                                    isCompleted ? 'text-green-900' : 'text-gray-900'
                                  }`}>
                                    {exercise.title}
                                  </h3>
                                  {exercise.categories && exercise.categories.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {exercise.categories.slice(0, 2).map(cat => (
                                        <Badge
                                          key={cat}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {cat}
                                        </Badge>
                                      ))}
                                      {exercise.categories.length > 2 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{exercise.categories.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  {isCompleted && (
                                    <p className="text-xs text-green-600 mt-2">✓ Réalisé</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default ExerciseProgress;
