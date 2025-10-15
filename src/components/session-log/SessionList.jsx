import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Link as LinkIcon, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const SessionList = ({ sessions, onEdit, onDelete, isAdmin }) => {
  const navigate = useNavigate();

  const calculateSchedule = (startTime, exercises) => {
    let currentTime = new Date(`1970-01-01T${startTime}:00`);
    return exercises.map(ex => {
      const duration = parseInt(ex.time?.match(/\d+/)?.[0] || '0', 10);
      const endTime = new Date(currentTime.getTime() + duration * 60000);
      const formattedEndTime = endTime.toTimeString().substring(0, 5);
      currentTime = endTime;
      return { ...ex, endTime: formattedEndTime };
    });
  };

  const handleGoToSheet = (sheetId) => {
    if (sheetId) {
      navigate(`/pedagogy#sheet-${sheetId}`);
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {sessions.map(session => {
        const scheduledExercises = calculateSchedule(session.start_time, session.exercises);
        return (
          <AccordionItem value={`session-${session.id}`} key={session.id}>
            <AccordionTrigger onClick={(e) => {
                // Prevent accordion from toggling when clicking on the trigger itself,
                // but allow navigation to detail page.
                // This might need adjustment if the accordion should still toggle.
                // For now, clicking the trigger will navigate to detail.
                e.stopPropagation();
                navigate(`/session-log/${session.id}`);
              }}>
              <div className="flex justify-between w-full pr-4 items-center">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold">
                    {session.date
                      ? `${new Date(session.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })} - ${session.start_time}`
                      : 'Séance sans date'}
                  </span>
                  {session.cycles && (
                    <Badge variant="outline" className="text-xs px-2 py-1 border-blue-500 text-blue-700">
                      Cycle: {session.cycles.name}
                    </Badge>
                  )}
                  {session.schedule && (
                    <Badge variant="outline" className="text-xs px-2 py-1 border-purple-500 text-purple-700">
                      {session.schedule.type} - {session.schedule.age_category}
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground truncate max-w-xs">{session.session_objective}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {isAdmin && (
                <div className="flex justify-end gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={() => onEdit(session)}><Edit className="w-4 h-4 mr-2" /> Modifier</Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(session.id)}><Trash2 className="w-4 h-4 mr-2" /> Supprimer</Button>
                </div>
              )}
              {session.cycles && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="font-semibold text-blue-900">Cycle: {session.cycles.name}</p>
                  {session.cycles.short_description && (
                    <p className="text-sm text-blue-700 mt-1">{session.cycles.short_description}</p>
                  )}
                </div>
              )}
              {session.schedule && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <p className="font-semibold text-purple-900">
                    Emploi du temps: {session.schedule.type} - {session.schedule.age_category}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    {session.schedule.day} de {session.schedule.start_time} à {session.schedule.end_time}
                  </p>
                </div>
              )}
              <p><strong>Objectif de séance:</strong> {session.session_objective}</p>
              <p><strong>Encadrants:</strong> {session.instructorNames?.join(', ')}</p>
              <p><strong>Élèves présents:</strong> {session.studentNames?.join(', ')}</p>
              <p><strong>Matériel:</strong> {session.equipment}</p>
              {session.comment && <p><strong>Commentaire:</strong> {session.comment}</p>}
              <h4 className="font-semibold mt-4">Déroulé :</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fin</TableHead>
                      <TableHead>Temps</TableHead>
                      <TableHead>Objectif Op.</TableHead>
                      <TableHead>Situation</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Consigne</TableHead>
                      <TableHead>Critère réussite</TableHead>
                      <TableHead>Régulation</TableHead>
                      <TableHead>Support</TableHead>
                      <TableHead>Image</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledExercises.map(ex => (
                      <TableRow key={ex.id}>
                        <TableCell className="font-mono">{ex.endTime}</TableCell>
                        <TableCell>{ex.time}</TableCell>
                        <TableCell className="relative">
                          {ex.pedagogy_sheet_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -left-8 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => handleGoToSheet(ex.pedagogy_sheet_id)}
                              title="Voir la fiche pédagogique"
                            >
                              <Library className="w-4 h-4 text-primary" />
                            </Button>
                          )}
                          {ex.operational_objective}
                        </TableCell>
                        <TableCell>{ex.situation}</TableCell>
                        <TableCell>{ex.organisation}</TableCell>
                        <TableCell>{ex.consigne}</TableCell>
                        <TableCell>{ex.success_criteria}</TableCell>
                        <TableCell>{ex.regulation}</TableCell>
                        <TableCell>
                          {ex.support_link && (
                            <a href={ex.support_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              <LinkIcon className="w-4 h-4" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          {ex.image_url && (
                            <a href={ex.image_url} target="_blank" rel="noopener noreferrer">
                              <img src={ex.image_url} className="h-16 w-16 object-cover rounded-md" alt={`Image pour ${ex.situation || 'exercice'}`} />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  );
};

export default SessionList;
