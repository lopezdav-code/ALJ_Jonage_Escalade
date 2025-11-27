import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Calendar, User, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MemberComments = ({ memberId }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchComments = async () => {
            if (!memberId) return;

            setLoading(true);
            try {
                // Fetch comments with session details
                const { data, error } = await supabase
                    .from('student_session_comments')
                    .select(`
            id,
            comment,
            created_at,
            session:sessions (
              id,
              date,
              start_time,
              session_objective,
              instructors
            )
          `)
                    .eq('member_id', memberId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Fetch instructor details for all comments
                const instructorIds = new Set();
                data?.forEach(item => {
                    if (item.session?.instructors) {
                        item.session.instructors.forEach(id => instructorIds.add(id));
                    }
                });

                let instructorsMap = {};
                if (instructorIds.size > 0) {
                    const { data: instructors } = await supabase
                        .from('members')
                        .select('id, first_name, last_name')
                        .in('id', Array.from(instructorIds));

                    if (instructors) {
                        instructorsMap = instructors.reduce((acc, curr) => {
                            acc[curr.id] = curr;
                            return acc;
                        }, {});
                    }
                }

                const commentsWithDetails = data?.map(item => ({
                    ...item,
                    session: {
                        ...item.session,
                        instructorsList: item.session?.instructors?.map(id => instructorsMap[id]).filter(Boolean) || []
                    }
                })) || [];

                // Sort by session date if available, otherwise created_at
                commentsWithDetails.sort((a, b) => {
                    const dateA = a.session?.date || a.created_at;
                    const dateB = b.session?.date || b.created_at;
                    return new Date(dateB) - new Date(dateA);
                });

                setComments(commentsWithDetails);
            } catch (error) {
                console.error('Error fetching comments:', error);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les commentaires",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [memberId, toast]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <Card className="animate-in fade-in duration-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Commentaires
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-4">
                        Aucun commentaire enregistré pour ce membre
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Commentaires ({comments.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {comments.map((item) => (
                        <div key={item.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <span className="font-semibold">
                                        {item.session?.date ? new Date(item.session.date).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : new Date(item.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                    {item.session?.start_time && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground ml-2">
                                            <Clock className="w-3 h-3" />
                                            <span>{item.session.start_time.substring(0, 5)}</span>
                                        </div>
                                    )}
                                </div>
                                {item.session && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/session-log/${item.session.id}`)}
                                        className="h-8"
                                    >
                                        Voir la séance
                                    </Button>
                                )}
                            </div>

                            {item.session?.session_objective && (
                                <div className="mb-3 text-sm text-muted-foreground">
                                    <span className="font-medium">Objectif : </span>
                                    {item.session.session_objective}
                                </div>
                            )}

                            <div className="bg-muted/30 p-3 rounded-md border-l-4 border-primary">
                                <p className="whitespace-pre-wrap">{item.comment}</p>
                            </div>

                            {item.session?.instructorsList?.length > 0 && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    <span>Encadrants : {item.session.instructorsList.map(i => `${i.first_name} ${i.last_name}`).join(', ')}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default MemberComments;
