import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import InstructorAutocomplete from '@/components/schedule/InstructorAutocomplete';
import { days } from '@/data/schedule';

const TYPES = ['Compétition', 'Loisir', 'Perf', 'Autonomes'];

const AGE_CATEGORIES = [
  'U9',
  'U11',
  'U13',
  'U15',
  'U17',
  'U19',
  'U11-U13',
  'U13-U15',
  'U15-U17',
  'U11-U13-U15(1)',
  'U11-U13-U15',
  'U13(2)-U15-U17-U19',
  'U15(2)-U17-U19',
  'Enfants 2015-2017 Groupe A',
  'Enfants 2015-2017 Groupe B',
  'Enfants 2018-2019',
  'Collégiens',
  'Lycéens',
  'Adulte débutant',
  'Adultes',
];

const ScheduleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);

  const [formData, setFormData] = useState({
    type: '',
    age_category: '',
    day: '',
    start_time: '',
    end_time: '',
    instructor_1_id: null,
    instructor_2_id: null,
    instructor_3_id: null,
    instructor_4_id: null,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/schedule');
      return;
    }
    if (isAdmin) {
      fetchMembers();
      if (id) {
        fetchScheduleItem();
      }
    }
  }, [isAdmin, authLoading, id, navigate]);

  const fetchMembers = async () => {
    try {
      // Récupérer uniquement les membres Bénévole ou Bureau
      // (pour éviter une liste trop longue de 280 membres)
      const { data: filteredMembers, error: membersError } = await supabase
        .from('members')
        .select('id, first_name, last_name, title')
        .in('title', ['Bénévole', 'Bureau'])
        .order('last_name')
        .order('first_name');

      if (membersError) throw membersError;

      console.log(`${(filteredMembers || []).length} membres chargés (Bénévole + Bureau)`);
      setMembers(filteredMembers || []);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const fetchScheduleItem = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        type: data.type || '',
        age_category: data.age_category || '',
        day: data.day || '',
        start_time: data.start_time ? data.start_time.substring(0, 5) : '',
        end_time: data.end_time ? data.end_time.substring(0, 5) : '',
        instructor_1_id: data.instructor_1_id,
        instructor_2_id: data.instructor_2_id,
        instructor_3_id: data.instructor_3_id,
        instructor_4_id: data.instructor_4_id,
      });
    } catch (error) {
      console.error('Erreur lors du chargement du créneau:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le créneau.',
        variant: 'destructive',
      });
      navigate('/schedule/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validation
      if (!formData.type || !formData.age_category || !formData.day || !formData.start_time || !formData.end_time) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir tous les champs obligatoires.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      const dataToSave = {
        type: formData.type,
        age_category: formData.age_category,
        day: formData.day,
        start_time: formData.start_time,
        end_time: formData.end_time,
        instructor_1_id: formData.instructor_1_id || null,
        instructor_2_id: formData.instructor_2_id || null,
        instructor_3_id: formData.instructor_3_id || null,
        instructor_4_id: formData.instructor_4_id || null,
      };

      if (id) {
        // Mise à jour
        const { error } = await supabase
          .from('schedules')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Créneau modifié',
          description: 'Le créneau a été modifié avec succès.',
        });
      } else {
        // Création
        const { error } = await supabase
          .from('schedules')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: 'Créneau créé',
          description: 'Le créneau a été créé avec succès.',
        });
      }

      navigate('/schedule/admin');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder le créneau.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Helmet>
        <title>{id ? 'Modifier' : 'Nouveau'} créneau - Admin</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/schedule/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <Calendar className="w-10 h-10 text-primary" />
            {id ? 'Modifier le créneau' : 'Nouveau créneau'}
          </h1>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informations du créneau</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type et Catégorie d'âge */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Type de cours <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age_category">
                    Catégorie d'âge <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.age_category}
                    onValueChange={(value) => setFormData({ ...formData, age_category: value })}
                  >
                    <SelectTrigger id="age_category">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Jour */}
              <div className="space-y-2">
                <Label htmlFor="day">
                  Jour <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.day}
                  onValueChange={(value) => setFormData({ ...formData, day: value })}
                >
                  <SelectTrigger id="day">
                    <SelectValue placeholder="Sélectionner un jour" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horaires */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">
                    Heure de début <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">
                    Heure de fin <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Encadrants */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Encadrants</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <InstructorAutocomplete
                    label="Encadrant 1"
                    value={formData.instructor_1_id}
                    onChange={(value) => setFormData({ ...formData, instructor_1_id: value })}
                    members={members}
                  />

                  <InstructorAutocomplete
                    label="Encadrant 2"
                    value={formData.instructor_2_id}
                    onChange={(value) => setFormData({ ...formData, instructor_2_id: value })}
                    members={members}
                  />

                  <InstructorAutocomplete
                    label="Encadrant 3"
                    value={formData.instructor_3_id}
                    onChange={(value) => setFormData({ ...formData, instructor_3_id: value })}
                    members={members}
                  />

                  <InstructorAutocomplete
                    label="Encadrant 4"
                    value={formData.instructor_4_id}
                    onChange={(value) => setFormData({ ...formData, instructor_4_id: value })}
                    members={members}
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/schedule/admin')}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </motion.div>
    </div>
  );
};

export default ScheduleEdit;
