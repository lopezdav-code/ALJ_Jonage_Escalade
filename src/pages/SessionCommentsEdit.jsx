import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Save, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BackButton } from '../components/ui/back-button';
import SimpleMemberAvatar from '../components/SimpleMemberAvatar';

const SessionCommentsEdit = () => {
  const { id } = useParams(); // session ID
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState(null);
  const [presentStudents, setPresentStudents] = useState([]);
  const [comments, setComments] = useState({}); // { memberId: comment }
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [currentComment, setCurrentComment] = useState('');

  useEffect(() => {
    fetchSessionAndComments();
  }, [id]);

  // Charger le commentaire quand on sélectionne un étudiant
  useEffect(() => {
    if (selectedStudentId) {
      const commentData = comments[selectedStudentId];
      setCurrentComment(commentData?.comment || '');
    } else {
      setCurrentComment('');
    }
  }, [selectedStudentId]);

  const fetchSessionAndComments = async () => {
    try {
      setLoading(true);

      // Récupérer la session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, date, students, schedule_id')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Récupérer les infos des étudiants présents
      if (sessionData.students && sessionData.students.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
          .from('members')
          .select('id, first_name, last_name, sexe, category, photo_url')
          .in('id', sessionData.students)
          .order('last_name')
          .order('first_name');

        if (studentsError) throw studentsError;
        setPresentStudents(studentsData || []);
      }

      // Récupérer les commentaires existants (avec les notes pour les préserver)
      const { data: commentsData, error: commentsError } = await supabase
        .from('student_session_comments')
        .select('member_id, comment, max_moulinette, max_tete')
        .eq('session_id', id);

      if (commentsError) throw commentsError;

      const commentsMap = (commentsData || []).reduce((acc, item) => {
        acc[item.member_id] = {
          comment: item.comment,
          max_moulinette: item.max_moulinette,
          max_tete: item.max_tete
        };
        return acc;
      }, {});
      setComments(commentsMap);

    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      alert('Erreur lors du chargement des données: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdateComment = () => {
    if (!selectedStudentId || !currentComment.trim()) return;

    setComments(prev => ({
      ...prev,
      [selectedStudentId]: {
        ...(prev[selectedStudentId] || {}), // Préserver max_moulinette et max_tete
        comment: currentComment.trim()
      }
    }));

    // Réinitialiser
    setSelectedStudentId('');
    setCurrentComment('');
  };

  const handleEditComment = (studentId) => {
    setSelectedStudentId(studentId);
    const commentData = comments[studentId];
    setCurrentComment(commentData?.comment || '');
  };

  const handleDeleteComment = (studentId) => {
    const existingData = comments[studentId];

    // Si des notes existent, on garde l'entrée mais on vide le commentaire
    if (existingData?.max_moulinette || existingData?.max_tete) {
      setComments(prev => ({
        ...prev,
        [studentId]: {
          max_moulinette: existingData.max_moulinette,
          max_tete: existingData.max_tete,
          comment: null
        }
      }));
    } else {
      // Sinon on supprime complètement l'entrée
      const { [studentId]: _, ...rest } = comments;
      setComments(rest);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Utiliser upsert pour préserver max_moulinette et max_tete
      const commentsToUpsert = Object.entries(comments)
        .filter(([_, data]) => data?.comment && data.comment.trim() !== '')
        .map(([memberId, data]) => ({
          session_id: id,
          member_id: memberId,
          comment: data.comment.trim(),
          // Préserver les notes si elles existent
          max_moulinette: data.max_moulinette || null,
          max_tete: data.max_tete || null
        }));

      if (commentsToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('student_session_comments')
          .upsert(commentsToUpsert, {
            onConflict: 'session_id,member_id'
          });

        if (upsertError) throw upsertError;
      }

      // Supprimer les commentaires qui ont été vidés
      const studentIdsWithComments = new Set(Object.keys(comments).filter(id => comments[id]?.comment?.trim()));
      const allStudentIds = presentStudents.map(s => s.id);
      const studentIdsToDelete = allStudentIds.filter(id => !studentIdsWithComments.has(id));

      if (studentIdsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('student_session_comments')
          .delete()
          .eq('session_id', id)
          .in('member_id', studentIdsToDelete)
          .is('max_moulinette', null)
          .is('max_tete', null);

        if (deleteError) throw deleteError;
      }

      // Retourner à la page de détail de la session
      navigate(`/session-log/${id}`);

    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatStudentLabel = (student) => {
    const sex = student.sexe ? `(${student.sexe})` : '';
    const category = student.category ? `[${student.category}]` : '';
    return `${student.first_name} ${student.last_name} ${sex} ${category}`.trim();
  };

  const commentsArray = Object.entries(comments)
    .filter(([_, data]) => data?.comment)
    .map(([studentId, data]) => ({
      studentId,
      comment: data.comment
    }));

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500">Session introuvable</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 max-w-4xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <BackButton onClick={() => navigate(`/session-log/${id}`)}>
          Retour à la séance
        </BackButton>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commentaires élèves - Séance du {session.date}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section d'ajout/modification */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="student-select">Sélectionner un élève présent</Label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger id="student-select">
                  <SelectValue placeholder="Choisir un élève..." />
                </SelectTrigger>
                <SelectContent>
                  {presentStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        {student.photo_url && (
                          <SimpleMemberAvatar
                            photoUrl={student.photo_url}
                            firstName={student.first_name}
                            lastName={student.last_name}
                            size="small"
                          />
                        )}
                        <span>{formatStudentLabel(student)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment-text">Commentaire</Label>
              <Textarea
                id="comment-text"
                placeholder="Entrer un commentaire pour cet élève..."
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              type="button"
              onClick={handleAddOrUpdateComment}
              disabled={!selectedStudentId || !currentComment.trim()}
              className="w-full"
            >
              {selectedStudentId && comments[selectedStudentId]?.comment
                ? 'Modifier le commentaire'
                : 'Ajouter le commentaire'}
            </Button>
          </div>

          {/* Liste des commentaires existants */}
          {commentsArray.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Commentaires enregistrés ({commentsArray.length})
              </Label>
              <div className="space-y-3">
                {commentsArray.map(({ studentId, comment }) => {
                  const student = presentStudents.find(s => s.id === studentId);
                  if (!student) return null;

                  return (
                    <div
                      key={studentId}
                      className="flex items-start gap-3 p-4 rounded-lg bg-background border hover:border-primary/50 transition-colors"
                    >
                      {student.photo_url && (
                        <SimpleMemberAvatar
                          photoUrl={student.photo_url}
                          firstName={student.first_name}
                          lastName={student.last_name}
                          size="default"
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold">
                          {formatStudentLabel(student)}
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                          {comment}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditComment(studentId)}
                          className="h-9 px-3"
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteComment(studentId)}
                          className="h-9 px-3 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              Aucun commentaire enregistré pour le moment
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SessionCommentsEdit;
