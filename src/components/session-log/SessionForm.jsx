import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Save, BookMarked, Search } from 'lucide-react';
import ExerciseFormItem from './ExerciseFormItem';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SHEET_TYPES = {
  'all': 'Toutes les fiches',
  'educational_game': 'Jeu éducatif',
  'warm_up_exercise': 'Exercice d\'échauffement',
  'strength_exercise': 'Exercice de renfo',
  'review_sheet': 'Fiche de révision'
};

const MultiSelectCheckbox = ({ title, options, selected, onChange }) => {
  const safeSelected = selected || [];
  const safeOptions = options || [];

  const handleSelectAll = () => {
    if (safeSelected.length === safeOptions.length) {
      onChange([]);
    } else {
      onChange(safeOptions);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{title}</Label>
        <Button type="button" variant="link" size="sm" onClick={handleSelectAll} className="p-0 h-auto">
          {safeSelected.length === safeOptions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
        </Button>
      </div>
      <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-2">
        {safeOptions.map(option => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${title}-${option}`}
              checked={safeSelected.includes(option)}
              onCheckedChange={(checked) => {
                const newSelected = checked
                  ? [...safeSelected, option]
                  : safeSelected.filter(item => item !== option);
                onChange(newSelected);
              }}
            />
            <label
              htmlFor={`${title}-${option}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const MemberMultiSelect = ({ title, members, selectedIds, onChange }) => {
  const safeSelectedIds = selectedIds || [];
  const safeMembers = members || [];

  const handleSelectAll = () => {
    if (safeSelectedIds.length === safeMembers.length) {
      onChange([]);
    } else {
      onChange(safeMembers.map(m => m.id));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{title}</Label>
        <Button type="button" variant="link" size="sm" onClick={handleSelectAll} className="p-0 h-auto">
          {safeSelectedIds.length === safeMembers.length ? 'Tout désélectionner' : 'Tout sélectionner'}
        </Button>
      </div>
      <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-2">
        {safeMembers.map(member => (
          <div key={member.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${title}-${member.id}`}
              checked={safeSelectedIds.includes(member.id)}
              onCheckedChange={(checked) => {
                const newSelected = checked
                  ? [...safeSelectedIds, member.id]
                  : safeSelectedIds.filter(id => id !== member.id);
                onChange(newSelected);
              }}
            />
            <label
              htmlFor={`${title}-${member.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {member.first_name} {member.last_name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const PedagogySheetSelector = ({ onSelect, onCancel }) => {
  const [sheets, setSheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTheme, setFilterTheme] = useState('all');

  useEffect(() => {
    const fetchSheets = async () => {
      const { data } = await supabase.from('pedagogy_sheets').select('*').order('title');
      setSheets(data || []);
    };
    fetchSheets();
  }, []);

  const themes = useMemo(() => {
    const allThemes = sheets
      .filter(sheet => sheet.sheet_type === 'educational_game' && sheet.theme)
      .map(sheet => sheet.theme);
    return ['all', ...Array.from(new Set(allThemes))];
  }, [sheets]);

  const filteredSheets = sheets.filter(sheet => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || sheet.sheet_type === filterType;
    const matchesTheme = filterTheme === 'all' || sheet.theme === filterTheme;
    return matchesSearch && matchesType && matchesTheme;
  });

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Importer depuis une Fiche Pédagogique</DialogTitle>
          <DialogDescription>Sélectionnez une fiche pour remplir automatiquement l'exercice.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une fiche..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SHEET_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTheme} onValueChange={setFilterTheme} disabled={themes.length <= 1}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par thème" />
            </SelectTrigger>
            <SelectContent>
              {themes.map(theme => (
                <SelectItem key={theme} value={theme}>{theme === 'all' ? 'Tous les thèmes' : theme}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-[400px] overflow-y-auto space-y-2 mt-4 pr-2">
          {filteredSheets.map(sheet => (
            <div
              key={sheet.id}
              className="p-3 border rounded-md hover:bg-accent cursor-pointer"
              onClick={() => onSelect(sheet)}
            >
              <p className="font-semibold">{sheet.title}</p>
              <p className="text-sm text-muted-foreground truncate">{sheet.description || sheet.game_goal}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SessionForm = ({ session, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState(
    session ? {
      ...session,
      date: session.date || '',
      start_time: session.start_time || '18:30',
      instructors: session.instructors || [],
      students: session.students || [],
      cycle_id: session.cycle_id || null,
      schedule_id: session.schedule_id || null,
      session_objective: session.session_objective || '',
      equipment: session.equipment || '',
      comment: session.comment || '',
      exercises: session.exercises || [],
    } : {
      date: '',
      start_time: '18:30',
      instructors: [],
      students: [],
      cycle_id: null,
      schedule_id: null,
      session_objective: '',
      equipment: '',
      comment: '',
      exercises: [],
    }
  );
  const [isSheetSelectorOpen, setIsSheetSelectorOpen] = useState(false);
  const [importTargetIndex, setImportTargetIndex] = useState(null);
  const [lyceeStudents, setLyceeStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [allInstructors, setAllInstructors] = useState([]); // Tous les encadrants (non filtrés)
  const [cycles, setCycles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [studentComments, setStudentComments] = useState({}); // Commentaires par élève: { member_id: comment }

  // Récupérer les étudiants du lycée et les cycles depuis Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingMembers(true);

      try {
        // Récupérer les étudiants
        const { data: studentMembers, error: studentsError } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .eq('title', 'Loisir lycée')
          .order('last_name');

        if (studentsError) throw studentsError;
        setLyceeStudents(studentMembers || []);

        // Récupérer les encadrants (membres avec titre Bénévole ou Bureau)
        // Utilise le même filtrage que ScheduleEdit pour avoir les mêmes instructeurs disponibles
        const { data: instructorMembers, error: instructorsError } = await supabase
          .from('members')
          .select('id, first_name, last_name, title')
          .in('title', ['Bénévole', 'Bureau'])
          .order('last_name')
          .order('first_name');

        if (instructorsError) throw instructorsError;

        console.log('Encadrants récupérés:', instructorMembers);
        setAllInstructors(instructorMembers || []); // Stocker tous les encadrants
        setInstructors(instructorMembers || []); // Par défaut, afficher tous

        // Récupérer les créneaux du planning
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('schedule')
          .select(`
            *,
            instructor_1:instructor_1_id(id, first_name, last_name),
            instructor_2:instructor_2_id(id, first_name, last_name),
            instructor_3:instructor_3_id(id, first_name, last_name),
            instructor_4:instructor_4_id(id, first_name, last_name)
          `)
          .order('day')
          .order('start_time');

        if (schedulesError) throw schedulesError;
        setSchedules(schedulesData || []);

        // Récupérer les cycles
        const { data: cyclesData, error: cyclesError } = await supabase
          .from('cycles')
          .select('id, name, short_description')
          .order('name');

        if (cyclesError) throw cyclesError;
        setCycles(cyclesData || []);

        // Convertir les noms en IDs si nécessaire (migration des anciennes données)
        if (session) {
          const convertNamesToIds = (names, members) => {
            if (!names || names.length === 0) return [];

            // Vérifier si le premier élément est un UUID (format ID) ou un nom (string)
            const firstItem = names[0];
            const isUUID = typeof firstItem === 'string' &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstItem);

            if (isUUID) {
              // Déjà des IDs, pas besoin de conversion
              return names;
            }

            // Convertir les noms en IDs
            return names.map(name => {
              const member = members.find(m => `${m.first_name} ${m.last_name}` === name);
              return member ? member.id : null;
            }).filter(id => id !== null);
          };

          const convertedInstructors = convertNamesToIds(session.instructors || [], instructorMembers || []);
          const convertedStudents = convertNamesToIds(session.students || [], studentMembers || []);

          console.log('Session instructors avant conversion:', session.instructors);
          console.log('Instructeurs convertis:', convertedInstructors);
          console.log('Session students avant conversion:', session.students);
          console.log('Étudiants convertis:', convertedStudents);

          // Mettre à jour formData avec les IDs convertis
          setFormData(prev => ({
            ...prev,
            instructors: convertedInstructors,
            students: convertedStudents
          }));

          // Charger les commentaires des élèves si on édite une session
          if (session.id) {
            const { data: commentsData } = await supabase
              .from('student_session_comments')
              .select('member_id, comment')
              .eq('session_id', session.id);

            if (commentsData) {
              const commentsMap = commentsData.reduce((acc, item) => {
                acc[item.member_id] = item.comment;
                return acc;
              }, {});
              setStudentComments(commentsMap);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLyceeStudents([]);
        setInstructors([]);
        setCycles([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchData();
  }, [session?.id]); // Dépendance sur session.id pour éviter les boucles infinies

  // Filtrer les encadrants et auto-remplir l'heure quand un schedule est sélectionné
  useEffect(() => {
    if (formData.schedule_id && schedules.length > 0) {
      const selectedSchedule = schedules.find(s => s.id === formData.schedule_id);
      if (selectedSchedule) {
        // Auto-remplir l'heure de début depuis le schedule
        const startTime = selectedSchedule.start_time.substring(0, 5);
        setFormData(prev => ({
          ...prev,
          start_time: startTime
        }));

        // Récupérer les IDs des encadrants du schedule
        const scheduleInstructorIds = [
          selectedSchedule.instructor_1?.id,
          selectedSchedule.instructor_2?.id,
          selectedSchedule.instructor_3?.id,
          selectedSchedule.instructor_4?.id,
        ].filter(Boolean);

        console.log('Encadrants du schedule sélectionné:', scheduleInstructorIds);
        console.log('Tous les encadrants disponibles:', allInstructors.map(i => i.id));

        // Filtrer allInstructors pour ne garder que ceux du schedule
        const filteredInstructors = allInstructors.filter(instructor =>
          scheduleInstructorIds.includes(instructor.id)
        );

        console.log('Encadrants filtrés:', filteredInstructors);
        setInstructors(filteredInstructors);
      }
    } else {
      // Pas de schedule sélectionné, afficher tous les encadrants
      setInstructors(allInstructors);
    }
  }, [formData.schedule_id, schedules, allInstructors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExerciseChange = (index, updatedExercise) => {
    const newExercises = [...formData.exercises];
    newExercises[index] = updatedExercise;
    setFormData(prev => ({ ...prev, exercises: newExercises }));
  };

  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { id: `new-${Date.now()}`, operational_objective: '', situation: '', organisation: '', consigne: '', time: '', success_criteria: '', regulation: '', support_link: '', image_url: '', newImageFile: null, pedagogy_sheet_id: null },
      ],
    }));
  };

  const removeExercise = (index) => {
    const newExercises = formData.exercises.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, exercises: newExercises }));
  };

  const moveExercise = (index, direction) => {
    const newExercises = [...formData.exercises];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newExercises.length) return;
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setFormData(prev => ({ ...prev, exercises: newExercises }));
  };

  const handleOpenSheetSelector = (index) => {
    setImportTargetIndex(index);
    setIsSheetSelectorOpen(true);
  };

  const handleSheetSelect = (sheet) => {
    const newExercises = [...formData.exercises];
    const targetExercise = newExercises[importTargetIndex];

    targetExercise.pedagogy_sheet_id = sheet.id;

    if (sheet.sheet_type === 'educational_game') {
      targetExercise.operational_objective = `Jeu: ${sheet.title}`;
      targetExercise.situation = sheet.starting_situation;
      targetExercise.consigne = `But: ${sheet.game_goal}. Évolution: ${sheet.evolution}`;
      targetExercise.image_url = sheet.url;
      targetExercise.support_link = '';
    } else {
      targetExercise.operational_objective = sheet.title;
      targetExercise.situation = sheet.description;
      targetExercise.consigne = '';
      if (sheet.type === 'image_file') {
        targetExercise.image_url = sheet.url;
        targetExercise.support_link = '';
      } else {
        targetExercise.support_link = sheet.url;
        targetExercise.image_url = sheet.thumbnail_url || '';
      }
    }
    
    setFormData(prev => ({ ...prev, exercises: newExercises }));
    setIsSheetSelectorOpen(false);
    setImportTargetIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convertir les chaînes vides en null pour éviter les erreurs SQL
    const cleanedData = {
      ...formData,
      date: formData.date || null,
      start_time: formData.start_time || null,
      studentComments, // Ajouter les commentaires des élèves
    };
    onSave(cleanedData);
  };

  const handleStudentCommentChange = (memberId, comment) => {
    setStudentComments(prev => ({
      ...prev,
      [memberId]: comment
    }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>{session ? 'Modifier la séance' : 'Ajouter une nouvelle séance'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sélection du créneau en premier */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule_id">Créneau du planning</Label>
                <Select
                  value={formData.schedule_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, schedule_id: value || null }))}
                >
                  <SelectTrigger id="schedule_id">
                    <SelectValue placeholder="Sélectionner un créneau (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun créneau</SelectItem>
                    {schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        {schedule.day} - {schedule.start_time.substring(0, 5)} - {schedule.age_category} ({schedule.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.schedule_id && (
                  <p className="text-sm text-muted-foreground mt-1">
                    💡 Les encadrants sont filtrés selon ce créneau et l'heure est auto-remplie
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle_id">Cycle associé</Label>
                <Select
                  value={formData.cycle_id ? formData.cycle_id.toString() : ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cycle_id: value ? parseInt(value) : null }))}
                >
                  <SelectTrigger id="cycle_id">
                    <SelectValue placeholder="Sélectionner un cycle (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun cycle</SelectItem>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id.toString()}>
                        {cycle.name}
                        {cycle.short_description && ` - ${cycle.short_description}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.cycle_id && session?.cycles && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Cycle actuel: {session.cycles.name}
                  </p>
                )}
              </div>
            </div>

            {/* Date, heure et membres */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date du cours (optionnel)</Label>
                <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Heure de début</Label>
                <Input id="start_time" name="start_time" type="time" value={formData.start_time} onChange={handleChange} />
              </div>
              <MemberMultiSelect
                title="Encadrants"
                members={instructors}
                selectedIds={formData.instructors}
                onChange={(value) => handleMultiSelectChange('instructors', value)}
              />
              <MemberMultiSelect
                title="Élèves présents"
                members={lyceeStudents}
                selectedIds={formData.students}
                onChange={(value) => handleMultiSelectChange('students', value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_objective">Objectif de séance</Label>
                <Textarea id="session_objective" name="session_objective" value={formData.session_objective} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment">Matériel</Label>
                <Textarea id="equipment" name="equipment" value={formData.equipment} onChange={handleChange} />
              </div>
            </div>
            <div className="grid md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comment">Commentaire</Label>
                <Textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} />
              </div>
            </div>

            {/* Commentaires individuels par élève */}
            {formData.students && formData.students.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Commentaires par élève ({formData.students.length} élève{formData.students.length > 1 ? 's' : ''})</Label>
                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                  {formData.students.map((studentId) => {
                    const student = lyceeStudents.find(s => s.id === studentId);
                    if (!student) return null;
                    return (
                      <div key={studentId} className="space-y-1">
                        <Label htmlFor={`comment-${studentId}`} className="text-sm font-medium">
                          {student.first_name} {student.last_name}
                        </Label>
                        <Textarea
                          id={`comment-${studentId}`}
                          placeholder="Ajouter un commentaire pour cet élève..."
                          value={studentComments[studentId] || ''}
                          onChange={(e) => handleStudentCommentChange(studentId, e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Ces commentaires sont spécifiques à chaque élève pour cette séance
                </p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium mb-2">Déroulé de la séance</h3>
              <div className="space-y-4">
                {formData.exercises.map((ex, index) => (
                  <ExerciseFormItem
                    key={ex.id}
                    exercise={ex}
                    index={index}
                    total={formData.exercises.length}
                    onExerciseChange={handleExerciseChange}
                    onRemove={removeExercise}
                    onMove={moveExercise}
                    onImport={() => handleOpenSheetSelector(index)}
                  />
                ))}
              </div>
              <Button type="button" variant="outline" className="mt-4" onClick={addExercise}>
                <PlusCircle className="w-4 h-4 mr-2" /> Ajouter un exercice
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Sauvegarde...' : <><Save className="w-4 h-4 mr-2" /> Sauvegarder</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
      {isSheetSelectorOpen && (
        <PedagogySheetSelector
          onSelect={handleSheetSelect}
          onCancel={() => setIsSheetSelectorOpen(false)}
        />
      )}
    </motion.div>
  );
};

export default SessionForm;