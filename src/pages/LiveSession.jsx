import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Helmet } from '../components/ui/helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { BackButton } from '../components/ui/back-button';
import { useToast } from '../components/ui/use-toast';
import {
    Calendar,
    Clock,
    Users,
    Target,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Loader2,
    Trophy
} from 'lucide-react';

const LiveSession = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [members, setMembers] = useState([]);
    const [presentIds, setPresentIds] = useState(new Set());
    const [comments, setComments] = useState({});
    const [teteOkStatus, setTeteOkStatus] = useState({});
    const [saving, setSaving] = useState(false);

    // Debounce timer for auto-save
    const [saveTimer, setSaveTimer] = useState(null);

    // Fetch session details
    useEffect(() => {
        const fetchSessionDetail = async () => {
            try {
                const { data, error } = await supabase
                    .from('sessions')
                    .select(`
            *,
            cycles (
              name,
              short_description
            ),
            schedules:schedule_id (
              id,
              type,
              age_category,
              day,
              start_time,
              end_time,
              Groupe
            ),
            exercises (
              id,
              operational_objective,
              time,
              order
            )
          `)
                    .eq('id', id)
                    .single();

                if (error) throw error;

                setSession(data);

                // Initialize present students
                if (data.students && data.students.length > 0) {
                    setPresentIds(new Set(data.students));
                }

                // Fetch members from the group
                const groupeId = data.schedules?.Groupe || null;

                let query = supabase
                    .from('members')
                    .select('id, first_name, last_name, sexe, category, tete_ok')
                    .order('last_name')
                    .order('first_name');

                if (groupeId) {
                    query = query.eq('groupe_id', groupeId);
                }

                const { data: membersData, error: membersError } = await query;

                if (membersError) throw membersError;

                setMembers(membersData || []);

                // Initialize tete_ok status
                const teteStatus = {};
                (membersData || []).forEach(member => {
                    teteStatus[member.id] = member.tete_ok || false;
                });
                setTeteOkStatus(teteStatus);

                // Fetch existing comments
                if (data.students && data.students.length > 0) {
                    const { data: commentsData, error: commentsError } = await supabase
                        .from('student_session_comments')
                        .select('member_id, comment, max_moulinette, max_tete')
                        .eq('session_id', id)
                        .in('member_id', data.students);

                    if (commentsError) throw commentsError;

                    const commentsMap = {};
                    (commentsData || []).forEach(c => {
                        commentsMap[c.member_id] = {
                            comment: c.comment,
                            max_moulinette: c.max_moulinette,
                            max_tete: c.max_tete
                        };
                    });
                    setComments(commentsMap);
                }

            } catch (err) {
                console.error('Error fetching session:', err);
                setError(err.message);
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger la séance',
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSessionDetail();
        }
    }, [id, toast]);

    // Toggle attendance
    const toggleAttendance = async (memberId) => {
        const newPresentIds = new Set(presentIds);

        if (newPresentIds.has(memberId)) {
            newPresentIds.delete(memberId);
        } else {
            newPresentIds.add(memberId);
        }

        setPresentIds(newPresentIds);

        // Save to database
        try {
            setSaving(true);
            const { error } = await supabase
                .from('sessions')
                .update({ students: Array.from(newPresentIds) })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Sauvegardé',
                description: 'Présence mise à jour',
                duration: 1500
            });
        } catch (err) {
            console.error('Error saving attendance:', err);
            toast({
                title: 'Erreur',
                description: 'Impossible de sauvegarder la présence',
                variant: 'destructive'
            });
            // Revert on error
            setPresentIds(presentIds);
        } finally {
            setSaving(false);
        }
    };

    // Use a Ref to keep track of the latest comments state for saving
    const commentsRef = React.useRef(comments);
    useEffect(() => {
        commentsRef.current = comments;
    }, [comments]);

    const saveComment = useCallback(async (memberId) => {
        const data = commentsRef.current[memberId];
        if (!data) return;

        try {
            setSaving(true);

            const isEmpty = !data.comment?.trim() && !data.max_moulinette && !data.max_tete;

            if (isEmpty) {
                // Delete comment if empty
                const { error } = await supabase
                    .from('student_session_comments')
                    .delete()
                    .eq('session_id', id)
                    .eq('member_id', memberId);

                if (error) throw error;
            } else {
                // Upsert comment
                const { error } = await supabase
                    .from('student_session_comments')
                    .upsert({
                        session_id: id,
                        member_id: memberId,
                        comment: data.comment,
                        max_moulinette: data.max_moulinette,
                        max_tete: data.max_tete
                    }, {
                        onConflict: 'session_id,member_id'
                    });

                if (error) throw error;
            }

            toast({
                title: 'Sauvegardé',
                description: 'Données enregistrées',
                duration: 1500
            });
        } catch (err) {
            console.error('Error saving comment:', err);
            toast({
                title: 'Erreur',
                description: 'Impossible de sauvegarder',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    }, [id, toast]);

    const updateComment = useCallback((memberId, comment, maxMoulinette, maxTete) => {
        setComments(prev => {
            const current = prev[memberId] || {};
            return {
                ...prev,
                [memberId]: {
                    ...current,
                    comment: comment !== undefined ? comment : current.comment,
                    max_moulinette: maxMoulinette !== undefined ? maxMoulinette : current.max_moulinette,
                    max_tete: maxTete !== undefined ? maxTete : current.max_tete
                }
            };
        });

        if (saveTimer) clearTimeout(saveTimer);
        const timer = setTimeout(() => saveComment(memberId), 1000);
        setSaveTimer(timer);
    }, [saveTimer, saveComment]);

    // Toggle tete_ok status
    const toggleTeteOk = async (memberId) => {
        const newStatus = !teteOkStatus[memberId];
        setTeteOkStatus(prev => ({ ...prev, [memberId]: newStatus }));

        try {
            setSaving(true);
            const { error } = await supabase
                .from('members')
                .update({ tete_ok: newStatus })
                .eq('id', memberId);

            if (error) throw error;

            toast({
                title: 'Sauvegardé',
                description: `Monte en tête ${newStatus ? 'validé' : 'retiré'}`,
                duration: 1500
            });
        } catch (err) {
            console.error('Error updating tete_ok:', err);
            toast({
                title: 'Erreur',
                description: 'Impossible de mettre à jour le statut',
                variant: 'destructive'
            });
            // Revert on error
            setTeteOkStatus(prev => ({ ...prev, [memberId]: !newStatus }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="container mx-auto p-4">
                <div className="text-red-500">Erreur: {error || 'Séance non trouvée'}</div>
            </div>
        );
    }

    const presentMembers = members.filter(m => presentIds.has(m.id));
    const absentMembers = members.filter(m => !presentIds.has(m.id));

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <Helmet title={`Séance en direct - ${session.date ? new Date(session.date).toLocaleDateString() : 'Sans date'}`} />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <BackButton to={`/session-log/${id}`} variant="outline" />
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold">Séance en direct</h1>
                    <p className="text-sm text-muted-foreground">
                        {session.date ? new Date(session.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        }) : 'Sans date'}
                    </p>
                </div>
                {saving && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sauvegarde...
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="overview" className="text-xs md:text-sm">
                        Rappel
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="text-xs md:text-sm">
                        Présences
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="text-xs md:text-sm">
                        Commentaires
                    </TabsTrigger>
                    <TabsTrigger value="tete" className="text-xs md:text-sm">
                        Monte en tête
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Course Overview */}
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations de la séance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Date and Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-medium">
                                            {session.date ? new Date(session.date).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Heure</p>
                                        <p className="font-medium">{session.start_time || 'Non spécifiée'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cycle */}
                            {session.cycles && (
                                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                                        Cycle: {session.cycles.name}
                                    </p>
                                    {session.cycles.short_description && (
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                            {session.cycles.short_description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Session Objective */}
                            {session.session_objective && (
                                <div className="border-l-4 border-primary pl-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-5 h-5 text-primary" />
                                        <p className="font-semibold">Objectif de séance</p>
                                    </div>
                                    <p className="text-muted-foreground">{session.session_objective}</p>
                                </div>
                            )}

                            {/* Exercises */}
                            {session.exercises && session.exercises.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">Exercices prévus ({session.exercises.length})</h3>
                                    <div className="space-y-2">
                                        {session.exercises
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((exercise, index) => (
                                                <div key={exercise.id} className="border rounded-lg p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                                                            <p className="font-medium">{exercise.operational_objective || 'Sans titre'}</p>
                                                        </div>
                                                        {exercise.time && (
                                                            <Badge variant="secondary" className="whitespace-nowrap">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {exercise.time}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Attendance */}
                <TabsContent value="attendance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Gestion des présences</span>
                                <div className="flex gap-4 text-sm font-normal">
                                    <span className="text-green-600 dark:text-green-400">
                                        ✓ {presentMembers.length}
                                    </span>
                                    <span className="text-red-600 dark:text-red-400">
                                        ✗ {absentMembers.length}
                                    </span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {members.map(member => {
                                    const isPresent = presentIds.has(member.id);
                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => toggleAttendance(member.id)}
                                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isPresent
                                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                                : 'border-red-300 bg-red-50 dark:bg-red-950'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {isPresent ? (
                                                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                                    ) : (
                                                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">
                                                            {member.first_name} {member.last_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {member.sexe && `${member.sexe} • `}
                                                            {member.category}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={isPresent ? 'default' : 'secondary'}>
                                                    {isPresent ? 'Présent' : 'Absent'}
                                                </Badge>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Comments */}
                <TabsContent value="comments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Commentaires sur les élèves
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {presentMembers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Aucun élève présent. Marquez des présences dans l'onglet "Présences".
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {presentMembers.map(member => (
                                        <div key={member.id} className="border rounded-lg p-4">
                                            <div className="mb-2">
                                                <p className="font-medium">
                                                    {member.first_name} {member.last_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {member.sexe && `${member.sexe} • `}
                                                    {member.category}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Max Moulinette</label>
                                                    <select
                                                        className="w-full text-sm border rounded p-1 bg-background"
                                                        value={comments[member.id]?.max_moulinette || ''}
                                                        onChange={(e) => updateComment(member.id, undefined, e.target.value, undefined)}
                                                    >
                                                        <option value="">-</option>
                                                        {['4a', '4a+', '4b', '4b+', '4c', '4c+', '5a', '5a+', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+'].map(grade => (
                                                            <option key={grade} value={grade}>{grade}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Max En tête</label>
                                                    <select
                                                        className="w-full text-sm border rounded p-1 bg-background"
                                                        value={comments[member.id]?.max_tete || ''}
                                                        onChange={(e) => updateComment(member.id, undefined, undefined, e.target.value)}
                                                    >
                                                        <option value="">-</option>
                                                        {['4a', '4a+', '4b', '4b+', '4c', '4c+', '5a', '5a+', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+'].map(grade => (
                                                            <option key={grade} value={grade}>{grade}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <Textarea
                                                placeholder="Ajouter un commentaire..."
                                                value={comments[member.id]?.comment || ''}
                                                onChange={(e) => updateComment(member.id, e.target.value)}
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 4: Monte en Tête */}
                <TabsContent value="tete" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5" />
                                Monte en tête
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {presentMembers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Aucun élève présent. Marquez des présences dans l'onglet "Présences".
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {presentMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className="border rounded-lg p-4 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {member.first_name} {member.last_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {member.sexe && `${member.sexe} • `}
                                                    {member.category}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox
                                                        checked={teteOkStatus[member.id] || false}
                                                        onCheckedChange={() => toggleTeteOk(member.id)}
                                                        className="w-6 h-6"
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {teteOkStatus[member.id] ? 'Validé' : 'Non validé'}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default LiveSession;
