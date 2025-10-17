import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Clock, RotateCcw, Users, Eye, EyeOff, Loader2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { timeSlots, days, ageCategories } from '@/data/schedule';
import { formatParticipantName } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

const Schedule = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState({
    group: '',
    instructor: ''
  });
  const [showInstructors, setShowInstructors] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les données du planning depuis la BDD
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const { data: scheduleRows, error } = await supabase
          .from('schedules')
          .select(`
            *,
            instructor_1:instructor_1_id(id, first_name, last_name),
            instructor_2:instructor_2_id(id, first_name, last_name),
            instructor_3:instructor_3_id(id, first_name, last_name),
            instructor_4:instructor_4_id(id, first_name, last_name)
          `)
          .order('day')
          .order('start_time');

        if (error) throw error;

        // Transformer les données pour le format attendu par le composant
        const transformedData = (scheduleRows || []).map((row, index) => {
          const startTime = row.start_time.substring(0, 5); // HH:MM
          const endTime = row.end_time.substring(0, 5);

          // Calculer l'index de début et le nombre de slots
          const toMinutes = (hhmm) => {
            const [h, m] = hhmm.split(':').map(Number);
            return h * 60 + m;
          };

          const BASE_START_MINUTES = 10 * 60;
          const SLOT_LENGTH_MIN = 30;

          const startMin = toMinutes(startTime);
          const endMin = toMinutes(endTime);

          let spanSlots = Math.round((endMin - startMin) / SLOT_LENGTH_MIN);
          if (spanSlots < 1) spanSlots = 1;

          const startIndex = Math.floor((startMin - BASE_START_MINUTES) / SLOT_LENGTH_MIN);

          // Construire la liste des encadrants
          const instructors = [
            row.instructor_1,
            row.instructor_2,
            row.instructor_3,
            row.instructor_4
          ]
            .filter(Boolean)
            .map(instructor => ({
              id: instructor.id,
              name: `${instructor.first_name} ${instructor.last_name}`
            }));

          // Déterminer la couleur selon le type
          const getColorForGroup = (group) => {
            switch (group) {
              case 'Compétition':
                return 'bg-red-200 text-red-800 border-red-300';
              case 'Loisir':
                return 'bg-blue-200 text-blue-800 border-blue-300';
              case 'Perf':
                return 'bg-green-200 text-green-800 border-green-300';
              case 'Autonomes':
                return 'bg-yellow-200 text-yellow-800 border-yellow-300';
              default:
                return 'bg-gray-200 text-gray-800 border-gray-300';
            }
          };

          return {
            id: row.id,
            title: row.age_category,
            day: row.day,
            startTime,
            endTime,
            spanSlots,
            startIndex,
            instructors,
            instructorNames: instructors.map(i => i.name),
            group: row.type,
            color: getColorForGroup(row.type),
          };
        }).filter(item => item.startIndex >= 0);

        setScheduleData(transformedData);
      } catch (error) {
        console.error('Erreur lors du chargement du planning:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const filteredSchedule = scheduleData.filter(course => {
    if (!course) return false;
    return (
      (!filters.group || course.group === filters.group) &&
      (!filters.instructor || course.instructorNames?.includes(filters.instructor))
    );
  });

  const resetFilters = () => {
    setFilters({ group: '', instructor: '' });
    setShowInstructors(false);
  };

  const getUniqueValues = (key) => {
    if (key === 'instructor') {
      const allInstructors = scheduleData.filter(Boolean).flatMap(course => course.instructorNames || []);
      return [...new Set(allInstructors)].sort();
    }
    return [...new Set(scheduleData.filter(Boolean).map(course => course[key]))].sort();
  };

  const colorLegend = [
    { color: 'bg-red-200 text-red-800', label: 'Compétition' },
    { color: 'bg-blue-200 text-blue-800', label: 'Loisir' },
    { color: 'bg-green-200 text-green-800', label: 'Perf' },
    { color: 'bg-yellow-200 text-yellow-800', label: 'Autonomes' },
  ];

  const dayNameToIndex = days.reduce((acc, day, index) => {
    acc[day] = index + 2;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Planning - Club d'Escalade</title>
        <meta name="description" content="Consultez le planning hebdomadaire des cours d'escalade du club" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold headline">Planning des cours</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Voici le planning hebdomadaire des cours d'escalade.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate('/schedule/admin')} className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Gérer le planning
            </Button>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Filtres et options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 items-center">
              <Select value={filters.group} onValueChange={(value) => setFilters({...filters, group: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Groupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  {getUniqueValues('group').map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.instructor} onValueChange={(value) => setFilters({...filters, instructor: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Encadrant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les encadrants</SelectItem>
                  {getUniqueValues('instructor').map(instructor => (
                    <SelectItem key={instructor} value={instructor}>{formatParticipantName(instructor)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </Button>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <Checkbox id="show-instructors" checked={showInstructors} onCheckedChange={setShowInstructors} />
              <label
                htmlFor="show-instructors"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                {showInstructors ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Afficher les encadrants
              </label>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Grille horaire</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Chargement du planning...</span>
              </div>
            ) : (
            <div className="relative grid gap-0" style={{
              gridTemplateColumns: `minmax(4rem, auto) repeat(${days.length}, 1fr)`,
              gridTemplateRows: `auto repeat(${timeSlots.length}, 3rem)`,
            }}>
              <div className="sticky top-0 z-20 bg-card font-semibold p-2 text-center border-b">Heure</div>
              {days.map((day) => (
                <div key={day} className="sticky top-0 z-20 bg-card font-semibold p-2 text-center border-b">{day}</div>
              ))}

              {timeSlots.map((time, index) => (
                <React.Fragment key={time}>
                  <div style={{ gridRow: index + 2 }} className="font-medium text-sm text-muted-foreground p-2 text-right border-r">{time}</div>
                  <div style={{ gridRow: index + 2, gridColumn: `2 / span ${days.length}` }} className="border-b border-dashed"></div>
                </React.Fragment>
              ))}

              {filteredSchedule.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`${course.color} p-2 rounded-lg text-xs border z-10 m-0.5 flex flex-col justify-between`}
                  style={{
                    gridColumnStart: dayNameToIndex[course.day],
                    gridRowStart: course.startIndex + 2,
                    gridRowEnd: `span ${course.spanSlots}`,
                  }}
                >
                  <div>
                    <div className="font-semibold truncate">{course.title}</div>
                    <div className="text-xs opacity-80">
                      {course.startTime} - {course.endTime}
                    </div>
                  </div>
                  {showInstructors && course.instructorNames && course.instructorNames.length > 0 && (
                    <div className="text-xs opacity-80 mt-1">
                      <div className="flex items-start gap-1">
                        <Users className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <div>
                          {course.instructorNames.map((instructorName, idx) => (
                            <div key={idx} className="truncate">
                              {formatParticipantName(instructorName)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Légende des couleurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {colorLegend.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${item.color.split(' ')[0]}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Composition des catégories d'âge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ageCategories.map((cat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <Badge variant="outline">{cat.category}</Badge>
                    <span className="text-sm text-muted-foreground">{cat.school}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Info panel for Adulte autonome rules */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Accès au cours « Adulte autonome »</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p>
                Le cours « Adulte autonome » est réservé aux adultes ayant validé le badge <strong>Orange</strong>.
                La validation des passeports est réalisée par les encadrants lors de séances dédiées. Sans ce passeport,
                il faut d'abord commencer par le cours « Adulte » qui est dédié aux adultes sans passeport. Ce cours est
                encadré par une personne diplômée qui assure la sécurité.
              </p>

              <p>
                Pour plus d'informations sur le passeport, consultez le guide&nbsp;:
                <a className="text-primary hover:underline ml-1" href="/passeport-guide?passport=orange">Guide Passeport (Orange)</a>
              </p>

              <p>
                Vous pouvez, à titre occasionnel, inviter un ami sous votre responsabilité à un cours adulte autonome. Cette personne doit
                avoir passé le passeport Orange (fiche FFME à jour) et s'inscrire via HelloAsso :
                <a className="text-primary hover:underline ml-1" href="https://www.helloasso.com/associations/amicale-laique-de-jonage/evenements/seance-decouverte-saison-2025-2026?utm_source=app_ha&utm_campaign=share_campaign_button&utm_medium=android" target="_blank" rel="noopener noreferrer">Inscription HelloAsso</a>
              </p>

              <p>
                Pour une personne déjà licenciée FFME (détenteur d'un badge rouge ou du passeport orange), la participation est limitée
                à <strong>10 séances par an</strong>. L'assurance n'est pas comprise.
              </p>

              <p>
                Séance d'essai : pour un essai, une personne peut venir accompagnée d'un adulte autonome du club et sous l'autorisation
                de l'encadrant. Assurage et grimpe en tête non autorisés pendant l'essai. Assurance non comprise.
              </p>

              <p>
                Un adolescent en cours « Lycéen » ayant validé le badge Orange peut être autorisé à venir grimper sur un créneau autonome.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Schedule;