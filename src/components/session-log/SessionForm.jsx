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

const MultiSelectCheckbox = ({ title, options, selected, onChange, onToggleFilter, isFiltered, canFilter }) => {
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
      <div className="flex justify-between items-center gap-2">
        <Label>{title}</Label>
        <div className="flex items-center gap-2">
          {canFilter && (
            <Button
              type="button"
              variant={isFiltered ? "default" : "outline"}
              size="sm"
              onClick={onToggleFilter}
              className="text-xs h-7 px-2"
            >
              {isFiltered ? 'Tous' : 'Filtrer pour ce cours'}
            </Button>
          )}
          <Button type="button" variant="link" size="sm" onClick={handleSelectAll} className="p-0 h-auto text-xs">
            {safeSelected.length === safeOptions.length ? 'Désél.' : 'Tout'}
          </Button>
        </div>
      </div>
      <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-2">
        {safeOptions.map((option, index) => (
          <div key={`${title}-${option}-${index}`} className="flex items-center space-x-2">
            <Checkbox
              id={`${title}-${option}-${index}`}
              checked={safeSelected.includes(option)}
              onCheckedChange={(checked) => {
                const newSelected = checked
                  ? [...safeSelected, option]
                  : safeSelected.filter(item => item !== option);
                onChange(newSelected);
              }}
            />
            <label
              htmlFor={`${title}-${option}-${index}`}
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
  const [allMembers, setAllMembers] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [schedules, setSchedules] = useState([]); // New state for schedules
  const [isSheetSelectorOpen, setIsSheetSelectorOpen] = useState(false);
  const [importTargetIndex, setImportTargetIndex] = useState(null);
  const [filterInstructorsBySchedule, setFilterInstructorsBySchedule] = useState(false);
  const previousScheduleIdRef = React.useRef(null);

  // Fetch all necessary data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all members
        const { data: membersData, error: membersError } = await supabase
          .from('secure_members')
          .select('id, first_name, last_name, title')
          .order('last_name')
          .order('first_name');

        if (membersError) throw membersError;
        setAllMembers(membersData || []);

        // Fetch cycles
        const { data: cyclesData, error: cyclesError } = await supabase
          .from('cycles')
          .select('id, name, short_description')
          .order('name');

        if (cyclesError) throw cyclesError;
        setCycles(cyclesData || []);

        // Fetch schedules with instructors
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('schedules')
          .select(`
            id,
            type,
            age_category,
            day,
            start_time,
            end_time,
            instructor_1:instructor_1_id(id, first_name, last_name),
            instructor_2:instructor_2_id(id, first_name, last_name),
            instructor_3:instructor_3_id(id, first_name, last_name),
            instructor_4:instructor_4_id(id, first_name, last_name)
          `)
          .order('day, start_time');

        if (schedulesError) {
          // Try fetching without instructors as fallback
          const { data: schedulesSimple, error: schedulesSimpleError } = await supabase
            .from('schedules')
            .select('id, type, age_category, day, start_time, end_time')
            .order('day, start_time');

          if (!schedulesSimpleError) {
            setSchedules(schedulesSimple || []);
          }
        } else {
          setSchedules(schedulesData || []);
        }

      } catch (error) {
        console.error('Error fetching data for SessionForm:', error);
        // Handle errors appropriately, e.g., show a toast
      }
    };

    fetchData();
  }, []);

  const membersMap = useMemo(() => {
    return allMembers.reduce((acc, member) => {
      acc[member.id] = {
        fullName: `${member.first_name} ${member.last_name}`,
        firstName: member.first_name,
        lastName: member.last_name,
        title: member.title
      };
      return acc;
    }, {});
  }, [allMembers]);

  // This will be computed after formData is initialized
  const instructorsOptions = allMembers.map(m => `${m.first_name} ${m.last_name}`);

  const lyceeStudentsOptions = useMemo(() => {
    const names = allMembers
      .filter(member => member.title === 'Loisir lycée')
      .map(m => `${m.first_name} ${m.last_name}`);
    // Use Set to remove duplicates
    return Array.from(new Set(names));
  }, [allMembers]);

  // Initialize formData - instructors/students will be set by useEffect when members are loaded
  const [formData, setFormData] = useState(() => {
    return session ? {
      ...session,
      date: session.date || '',
      start_time: session.start_time || '18:30',
      instructors: [], // Will be populated by useEffect
      students: [], // Will be populated by useEffect
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
    };
  });

  // Populate instructors/students names when members are loaded
  useEffect(() => {
    if (session && allMembers.length > 0 && formData.instructors.length === 0) {
      const instructorNames = (session.instructors || [])
        .map(id => {
          const member = allMembers.find(m => m.id === id);
          return member ? `${member.first_name} ${member.last_name}` : null;
        })
        .filter(Boolean);

      const studentNames = (session.students || [])
        .map(id => {
          const member = allMembers.find(m => m.id === id);
          return member ? `${member.first_name} ${member.last_name}` : null;
        })
        .filter(Boolean);

      setFormData(prev => ({
        ...prev,
        instructors: instructorNames,
        students: studentNames
      }));
    }
  }, [session, allMembers, formData.instructors.length]);

  // Instructors from selected schedule
  const scheduleInstructors = useMemo(() => {
    if (!formData.schedule_id || schedules.length === 0) return [];
    const selectedSchedule = schedules.find(s => s.id === formData.schedule_id);
    if (!selectedSchedule) return [];

    const instructorNames = [
      selectedSchedule.instructor_1,
      selectedSchedule.instructor_2,
      selectedSchedule.instructor_3,
      selectedSchedule.instructor_4
    ]
      .filter(Boolean)
      .map(instructor => `${instructor.first_name} ${instructor.last_name}`);

    // Use Set to remove duplicates
    return Array.from(new Set(instructorNames));
  }, [formData.schedule_id, schedules]);

  // Filter instructors based on toggle state
  const filteredInstructorsOptions = useMemo(() => {
    if (filterInstructorsBySchedule && formData.schedule_id && scheduleInstructors.length > 0) {
      // Show only schedule instructors + already selected ones
      const combined = [...scheduleInstructors, ...(formData.instructors || [])];
      return Array.from(new Set(combined));
    }
    // Show all instructors
    return Array.from(new Set(instructorsOptions));
  }, [instructorsOptions, filterInstructorsBySchedule, formData.schedule_id, scheduleInstructors, formData.instructors]);

  // Initial load: just set the previousScheduleIdRef without changing instructors
  // The instructors are already set from the session data in useState initialization
  useEffect(() => {
    if (session?.schedule_id && previousScheduleIdRef.current === null) {
      previousScheduleIdRef.current = session.schedule_id;
    }
  }, [session]);

  // Auto-populate instructors and start_time when schedule is selected (only on schedule change)
  useEffect(() => {
    if (formData.schedule_id !== previousScheduleIdRef.current) {
      previousScheduleIdRef.current = formData.schedule_id;

      if (formData.schedule_id) {
        const selectedSchedule = schedules.find(s => s.id === formData.schedule_id);

        if (selectedSchedule) {
          // Update instructors and start_time
          setFormData(prev => ({
            ...prev,
            instructors: scheduleInstructors.length > 0 ? scheduleInstructors : prev.instructors,
            start_time: selectedSchedule.start_time || prev.start_time
          }));
        }
      } else {
        // Clear instructors when no schedule is selected
        setFormData(prev => ({
          ...prev,
          instructors: []
        }));
      }
    }
  }, [formData.schedule_id, scheduleInstructors, schedules]);

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
    // Convertir les noms complets des encadrants/élèves en leurs IDs respectifs
    const instructorsIds = formData.instructors.map(name => allMembers.find(m => `${m.first_name} ${m.last_name}` === name)?.id).filter(Boolean);
    const studentsIds = formData.students.map(name => allMembers.find(m => `${m.first_name} ${m.last_name}` === name)?.id).filter(Boolean);

    // Convertir les chaînes vides en null pour éviter les erreurs SQL
    const cleanedData = {
      ...formData,
      date: formData.date || null,
      start_time: formData.start_time || null,
      instructors: instructorsIds,
      students: studentsIds,
    };
    onSave(cleanedData);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>{session ? 'Modifier la séance' : 'Ajouter une nouvelle séance'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Emploi du temps en premier */}
            <div className="space-y-2">
              <Label htmlFor="schedule_id">Emploi du temps associé</Label>
              <Select
                value={formData.schedule_id ? formData.schedule_id.toString() : ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, schedule_id: value ? parseInt(value) : null }))}
              >
                <SelectTrigger id="schedule_id">
                  <SelectValue placeholder="Sélectionner un emploi du temps (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun emploi du temps</SelectItem>
                  {schedules.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun emploi du temps disponible</SelectItem>
                  ) : (
                    schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id.toString()}>
                        {schedule.type} / {schedule.age_category} / {schedule.day} / {schedule.start_time}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {formData.schedule_id && session?.schedule && (
                <p className="text-sm text-muted-foreground mt-1">
                  Emploi du temps actuel: {session.schedule.type} / {session.schedule.age_category} / {session.schedule.day} / {session.schedule.start_time}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date du cours (optionnel)</Label>
                <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Heure de début</Label>
                <Input id="start_time" name="start_time" type="time" value={formData.start_time} onChange={handleChange} />
              </div>
              <MultiSelectCheckbox
                title="Encadrants"
                options={filteredInstructorsOptions}
                selected={formData.instructors}
                onChange={(value) => handleMultiSelectChange('instructors', value)}
                onToggleFilter={() => setFilterInstructorsBySchedule(!filterInstructorsBySchedule)}
                isFiltered={filterInstructorsBySchedule}
                canFilter={formData.schedule_id && scheduleInstructors.length > 0}
              />
              <MultiSelectCheckbox
                title="Élèves présents"
                options={lyceeStudentsOptions}
                selected={formData.students}
                onChange={(value) => handleMultiSelectChange('students', value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="session_objective">Objectif de séance</Label>
              <Textarea id="session_objective" name="session_objective" value={formData.session_objective} onChange={handleChange} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment">Matériel</Label>
                <Textarea id="equipment" name="equipment" value={formData.equipment} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Commentaire</Label>
                <Textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} />
              </div>
            </div>

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
