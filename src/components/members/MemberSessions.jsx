import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, Clock, Users, Eye, GraduationCap, BookOpen, FileText, MessageSquare, Loader2 } from 'lucide-react';

const MemberSessions = ({
    memberSchedules,
    teachingSchedule,
    sessionHistory,
    sessionHistoryLoading,
    fetchSessionHistory,
    fromTab
}) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Member's Schedules - Courses they attend */}
            {memberSchedules.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Mes séances ({memberSchedules.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {memberSchedules.map((schedule) => (
                                <div key={schedule.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge variant="default" className="font-medium">
                                                {schedule.day}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                <Clock className="w-3 h-3" />
                                                <span>{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            {schedule.type && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-muted-foreground">Type:</span>
                                                    <Badge variant="secondary" className="text-xs">{schedule.type}</Badge>
                                                </div>
                                            )}

                                            {schedule.age_category && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-muted-foreground">Catégorie d'âge:</span>
                                                    <span className="text-sm">{schedule.age_category}</span>
                                                </div>
                                            )}

                                            {schedule.groupe && (
                                                <div className="mt-2 p-2 bg-muted/30 rounded">
                                                    <p className="text-sm font-medium mb-1">Groupe:</p>
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        {schedule.groupe.category && (
                                                            <Badge variant="outline">{schedule.groupe.category}</Badge>
                                                        )}
                                                        {schedule.groupe.sous_category && (
                                                            <Badge variant="outline">{schedule.groupe.sous_category}</Badge>
                                                        )}
                                                        {schedule.groupe.Groupe_schedule && (
                                                            <span className="text-muted-foreground">{schedule.groupe.Groupe_schedule}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {schedule.instructors && schedule.instructors.length > 0 && (
                                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                                            Encadrants ({schedule.instructors.length})
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {schedule.instructors.map((instructor) => (
                                                            <Button
                                                                key={instructor.id}
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/member-view/${instructor.id}`, { state: { fromTab } })}
                                                                className="h-7 text-xs bg-white dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900"
                                                            >
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                {instructor.first_name} {instructor.last_name}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Teaching Schedule - Courses where member is instructor */}
            {teachingSchedule.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            Cours encadrés ({teachingSchedule.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {teachingSchedule.map((schedule) => (
                                <div key={schedule.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge variant="default" className="font-medium">
                                                {schedule.day}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                <Clock className="w-3 h-3" />
                                                <span>{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            {schedule.type && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-muted-foreground">Type:</span>
                                                    <Badge variant="secondary" className="text-xs">{schedule.type}</Badge>
                                                </div>
                                            )}

                                            {schedule.age_category && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-muted-foreground">Catégorie d'âge:</span>
                                                    <span className="text-sm">{schedule.age_category}</span>
                                                </div>
                                            )}

                                            {schedule.groupe && (
                                                <div className="mt-2 p-2 bg-muted/30 rounded">
                                                    <p className="text-sm font-medium mb-1">Groupe:</p>
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        {schedule.groupe.category && (
                                                            <Badge variant="outline">{schedule.groupe.category}</Badge>
                                                        )}
                                                        {schedule.groupe.sous_category && (
                                                            <Badge variant="outline">{schedule.groupe.sous_category}</Badge>
                                                        )}
                                                        {schedule.groupe.Groupe_schedule && (
                                                            <span className="text-muted-foreground">{schedule.groupe.Groupe_schedule}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {schedule.students && schedule.students.length > 0 && (
                                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                            Élèves ({schedule.students.length})
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {schedule.students.map((student) => (
                                                            <Button
                                                                key={student.id}
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/member-view/${student.id}`, { state: { fromTab } })}
                                                                className="h-7 text-xs bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900"
                                                            >
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                {student.first_name} {student.last_name}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Session History - Accordion */}
            <Card>
                <Accordion type="single" collapsible onValueChange={(value) => {
                    if (value === 'session-history') {
                        fetchSessionHistory();
                    }
                }}>
                    <AccordionItem value="session-history" className="border-none">
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Historique des séances {sessionHistory.length > 0 && `(${sessionHistory.length})`}
                            </CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            {sessionHistoryLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : sessionHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {sessionHistory.map((session) => (
                                        <div key={session.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            {/* Session header with date and time */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    <span className="font-semibold">
                                                        {new Date(session.date).toLocaleDateString('fr-FR', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                {session.start_time && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{session.start_time.substring(0, 5)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Cycle and Schedule info */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {session.cycles && (
                                                    <Badge variant="default">
                                                        {session.cycles.name}
                                                    </Badge>
                                                )}
                                                {session.schedules && (
                                                    <>
                                                        {session.schedules.type && (
                                                            <Badge variant="secondary">{session.schedules.type}</Badge>
                                                        )}
                                                        {session.schedules.age_category && (
                                                            <Badge variant="outline">{session.schedules.age_category}</Badge>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* Session objective */}
                                            {session.session_objective && (
                                                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                                    <div className="flex items-start gap-2">
                                                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                                Objectif de la séance
                                                            </p>
                                                            <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                                                {session.session_objective}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Equipment */}
                                            {session.equipment && (
                                                <div className="mb-3 text-sm">
                                                    <span className="font-medium text-muted-foreground">Matériel : </span>
                                                    <span>{session.equipment}</span>
                                                </div>
                                            )}

                                            {/* General session comment */}
                                            {session.comment && (
                                                <div className="mb-3 p-3 bg-muted/50 rounded">
                                                    <div className="flex items-start gap-2">
                                                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-muted-foreground mb-1">
                                                                Commentaire général
                                                            </p>
                                                            <p className="text-sm whitespace-pre-wrap">
                                                                {session.comment}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Member-specific instructor comment */}
                                            {session.memberComment && (
                                                <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                                    <div className="flex items-start gap-2">
                                                        <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                                                Commentaire de l'encadrant pour vous
                                                            </p>
                                                            <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                                                                {session.memberComment}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Instructors */}
                                            {session.instructorsList && session.instructorsList.length > 0 && (
                                                <div className="pt-2 border-t">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium text-muted-foreground">Encadrants :</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {session.instructorsList.map((instructor) => (
                                                                <Button
                                                                    key={instructor.id}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => navigate(`/member-view/${instructor.id}`, { state: { fromTab } })}
                                                                    className="h-7 text-xs px-2"
                                                                >
                                                                    <Eye className="w-3 h-3 mr-1" />
                                                                    {instructor.first_name} {instructor.last_name}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    Aucune séance enregistrée
                                </p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Card>
        </div>
    );
};

export default MemberSessions;
