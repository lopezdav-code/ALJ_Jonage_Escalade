import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Clock, RotateCcw, Users, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { scheduleData, timeSlots, days, ageCategories } from '@/data/schedule';
import { formatParticipantName } from '@/lib/utils';

const Schedule = () => {
  const [filters, setFilters] = useState({
    group: '',
    instructor: ''
  });
  const [showInstructors, setShowInstructors] = useState(false);

  const filteredSchedule = scheduleData.filter(course => {
    if (!course) return false;
    return (
      (!filters.group || course.group === filters.group) &&
      (!filters.instructor || course.instructors.includes(filters.instructor))
    );
  });

  const resetFilters = () => {
    setFilters({ group: '', instructor: '' });
    setShowInstructors(false);
  };

  const getUniqueValues = (key) => {
    if (key === 'instructor') {
      const allInstructors = scheduleData.filter(Boolean).flatMap(course => course.instructors);
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
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold headline">Planning des cours</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Voici le planning hebdomadaire des cours d'escalade.
        </p>
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
                  {showInstructors && (
                    <div className="text-xs opacity-80 mt-1">
                      <div className="flex items-start gap-1">
                        <Users className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <div>
                          {course.instructors.map(instructor => (
                            <div key={instructor} className="truncate">
                              {formatParticipantName(instructor)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
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
    </div>
  );
};

export default Schedule;