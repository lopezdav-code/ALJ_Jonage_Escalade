import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Helmet } from '../components/ui/helmet';
import { ExternalLink, FileText, Calendar, Clock, Users, Target, Package, MessageSquare, Edit, Copy, Download, Play } from 'lucide-react';
import html2canvas from 'html2canvas';
import { BackButton } from '../components/ui/back-button';
import { useToast } from '../components/ui/use-toast';
import SessionPosterExport from '../components/session-log/SessionPosterExport';
import SimpleMemberAvatar from '../components/SimpleMemberAvatar';

const BUCKET_NAME = 'pedagogy_files';

// Fonction pour obtenir l'URL signée d'un fichier
const getSignedUrl = async (fileNameOrUrl) => {
  if (!fileNameOrUrl) return null;

  try {
    // Si c'est déjà une URL complète, on l'utilise directement
    if (fileNameOrUrl.startsWith('http://') || fileNameOrUrl.startsWith('https://')) {
      return fileNameOrUrl;
    }

    // Sinon, générer une URL signée depuis le nom du fichier
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileNameOrUrl, 3600); // URL valide 1 heure

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL signée:', error);
    return null;
  }
};

const ExerciseDisplay = ({ exercise, index }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [pedagogyImageUrl, setPedagogyImageUrl] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      if (exercise.image_url) {
        const url = await getSignedUrl(exercise.image_url);
        setImageUrl(url);
      }
    };
    loadImage();
  }, [exercise.image_url]);

  useEffect(() => {
    const loadPedagogyImage = async () => {
      if (exercise.pedagogy_sheet?.illustration_image) {
        const url = await getSignedUrl(exercise.pedagogy_sheet.illustration_image);
        setPedagogyImageUrl(url);
      }
    };
    loadPedagogyImage();
  }, [exercise.pedagogy_sheet?.illustration_image]);

  return (
    <div key={exercise.id} className="border rounded-lg p-4 space-y-3">
      {/* En-tête de l'exercice */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
            <h3 className="text-lg font-semibold">{exercise.operational_objective || 'Sans titre'}</h3>
          </div>
          {exercise.pedagogy_sheet && (
            <div className="flex items-center gap-2 mt-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <a
                href={`/pedagogy?tab=${exercise.pedagogy_sheet.sheet_type}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                Fiche pédagogique: {exercise.pedagogy_sheet.title}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
        {exercise.time && (
          <Badge variant="secondary" className="whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1" />
            {exercise.time}
          </Badge>
        )}
      </div>

      {/* Image d'illustration de la fiche pédagogique */}
      {pedagogyImageUrl && (
        <div className="my-3 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
            Illustration - {exercise.pedagogy_sheet.title}
          </p>
          <img
            src={pedagogyImageUrl}
            alt={exercise.pedagogy_sheet.title}
            className="max-w-full h-auto rounded-lg border shadow-sm max-h-96 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Image de l'exercice avec URL signée */}
      {imageUrl && (
        <div className="my-3">
          <img
            src={imageUrl}
            alt={exercise.operational_objective || 'Image exercice'}
            className="max-w-full h-auto rounded-lg border shadow-sm max-h-96 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Détails de l'exercice */}
      <div className="grid gap-3 text-sm">
        {exercise.situation && (
          <div>
            <p className="font-semibold text-muted-foreground mb-1">Situation</p>
            <p className="text-foreground">{exercise.situation}</p>
          </div>
        )}
        {exercise.organisation && (
          <div>
            <p className="font-semibold text-muted-foreground mb-1">Organisation</p>
            <p className="text-foreground">{exercise.organisation}</p>
          </div>
        )}
        {exercise.consigne && (
          <div>
            <p className="font-semibold text-muted-foreground mb-1">Consigne</p>
            <p className="text-foreground">{exercise.consigne}</p>
          </div>
        )}
        {exercise.success_criteria && (
          <div>
            <p className="font-semibold text-muted-foreground mb-1">Critères de réussite</p>
            <p className="text-foreground">{exercise.success_criteria}</p>
          </div>
        )}
        {exercise.regulation && (
          <div>
            <p className="font-semibold text-muted-foreground mb-1">Régulation</p>
            <p className="text-foreground">{exercise.regulation}</p>
          </div>
        )}
        {exercise.support_link && (
          <div>
            <p className="font-semibold text-muted-foreground mb-1">Lien de support</p>
            <a
              href={exercise.support_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {exercise.support_link}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const SessionLogDetail = () => {
  const { id } = useParams(); // Correctly extract 'id' from URL parameters
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour générer le résumé de séance formaté pour les réseaux sociaux
  const generateSessionSummary = (sessionData) => {
    if (!sessionData) return '';

    const lines = [];

    // En-tête
    lines.push('🧗 RÉSUMÉ DE SÉANCE\n');

    // Date
    if (sessionData.date) {
      const dateObj = new Date(sessionData.date);
      const formattedDate = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      lines.push(`📅 ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}\n`);
    }

    // Participants
    const presentCount = sessionData.studentsData?.length || 0;
    if (presentCount > 0) {
      lines.push(`👥 Participants (${presentCount} présents)`);
      sessionData.studentsData?.forEach(student => {
        lines.push(`• ${student.fullName}`);
      });
      lines.push('');
    }

    // Cycle
    if (sessionData.cycles?.name) {
      lines.push(`🎯 Cycle: ${sessionData.cycles.name}`);
      if (sessionData.cycles.short_description) {
        lines.push(`   ${sessionData.cycles.short_description}`);
      }
      lines.push('');
    }

    // Objectif de séance
    if (sessionData.session_objective) {
      lines.push(`🎪 Objectif: ${sessionData.session_objective}\n`);
    }

    // Exercices
    if (sessionData.exercises && sessionData.exercises.length > 0) {
      lines.push('📋 Exercices réalisés:');
      sessionData.exercises.forEach((exercise, index) => {
        lines.push(`${index + 1}. ${exercise.operational_objective || 'Exercice sans titre'}`);
      });
      lines.push('');
    }

    // Séparateur et signature
    lines.push('---');
    lines.push('Séance du club d\'escalade');

    return lines.join('\n');
  };

  // Fonction pour copier le résumé au presse-papier
  const handleCopyToClipboard = () => {
    const summary = generateSessionSummary(session);

    // Méthode 1: Utiliser l'API Clipboard moderne
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(summary).then(() => {
        toast({
          title: 'Copié !',
          description: 'Résumé de la séance copié dans le presse-papier',
          duration: 2000
        });
      }).catch(() => {
        // Fallback si Clipboard API échoue
        copyWithFallback(summary);
      });
    } else {
      // Fallback: utiliser la méthode textarea
      copyWithFallback(summary);
    }
  };

  // Méthode de fallback pour copier au presse-papier
  const copyWithFallback = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    try {
      textarea.select();
      const success = document.execCommand('copy');

      if (success) {
        toast({
          title: 'Copié !',
          description: 'Résumé de la séance copié dans le presse-papier',
          duration: 2000
        });
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.error('Erreur copie:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le résumé',
        variant: 'destructive',
        duration: 2000
      });
    } finally {
      document.body.removeChild(textarea);
    }
  };

  // Fonction pour télécharger le résumé en image PNG
  const handleDownloadPNG = async () => {
    try {
      // Créer un conteneur temporaire
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px'; // Largeur proche du A4 pour le rendu
      document.body.appendChild(tempDiv);

      // Préparer les images des exercices
      const exerciseImages = {};
      await Promise.all(session.exercises.map(async (ex) => {
        if (ex.pedagogy_sheet?.illustration_image) {
          exerciseImages[ex.id] = await getSignedUrl(ex.pedagogy_sheet.illustration_image);
        } else if (ex.image_url) {
          exerciseImages[ex.id] = await getSignedUrl(ex.image_url);
        }
      }));

      // Calculer le numéro de la séance dans le cycle
      let cycleSessionInfo = null;
      if (session.cycle_id) {
        const { data: cycleSessions, error: cycleError } = await supabase
          .from('sessions')
          .select('id, date')
          .eq('cycle_id', session.cycle_id)
          .not('date', 'is', null) // Filtrer uniquement les sessions avec une date
          .order('date', { ascending: true });

        if (!cycleError && cycleSessions) {
          const total = cycleSessions.length;
          const current = cycleSessions.findIndex(s => s.id === session.id) + 1;
          if (current > 0) {
            cycleSessionInfo = { current, total };
          }
        }
      }

      // Créer un élément React et le rendre
      const root = ReactDOM.createRoot(tempDiv);
      root.render(
        <SessionPosterExport
          session={session}
          exerciseImages={exerciseImages}
          cycleSessionInfo={cycleSessionInfo}
          title="ALJ Escalade"
          subtitle="Séance d'entraînement"
        />
      );

      // Attendre que le rendu soit fait (images, fonts, etc.)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Convertir en image
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Meilleure qualité
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        removeModal: true,
      });

      // Nettoyage
      root.unmount();
      document.body.removeChild(tempDiv);

      // Télécharger l'image
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');

      // Nom du fichier avec date
      const dateStr = session.date ? new Date(session.date).toLocaleDateString('fr-FR').replace(/\//g, '-') : 'seance';
      link.download = `Resume_escalade_${dateStr}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Téléchargé !',
        description: 'Résumé de la séance téléchargé en PNG',
        duration: 2000
      });
    } catch (err) {
      console.error('Erreur téléchargement PNG:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le résumé',
        variant: 'destructive',
        duration: 2000
      });
    }
  };

  useEffect(() => {
    const fetchSessionDetail = async () => {
      try {
        // OPTIMIZED: Fetch session with all related data in a single query
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
              situation,
              organisation,
              consigne,
              time,
              success_criteria,
              regulation,
              support_link,
              image_url,
              pedagogy_sheet_id,
              order
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        // Schedule is now pre-joined in the query above
        const scheduleData = data.schedules || null;

        // Récupérer les informations des membres
        const allMemberIds = [
          ...(data.instructors || []),
          ...(data.students || []),
          ...(data.absent_students || [])
        ];

        let membersMap = {};
        if (allMemberIds.length > 0) {
          const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id, first_name, last_name, sexe, category, photo_url')
            .in('id', allMemberIds);

          if (membersError) {
            throw membersError;
          }

          membersMap = (members || []).reduce((acc, member) => {
            const sex = member.sexe ? `(${member.sexe})` : '';
            const category = member.category ? `[${member.category}]` : '';
            acc[member.id] = {
              id: member.id,
              fullName: `${member.first_name} ${member.last_name} ${sex} ${category}`.trim(),
              firstName: member.first_name,
              lastName: member.last_name,
              sex: member.sexe,
              category: member.category,
              photo_url: member.photo_url
            };
            return acc;
          }, {});
        }

        // Récupérer les commentaires par élève pour cette session
        let studentCommentsMap = {};
        if (data.students && data.students.length > 0) {
          const { data: comments, error: commentsError } = await supabase
            .from('student_session_comments')
            .select('member_id, comment')
            .eq('session_id', id) // Use 'id' here
            .in('member_id', data.students);

          if (commentsError) {
            throw commentsError;
          }

          studentCommentsMap = (comments || []).reduce((acc, comment) => {
            acc[comment.member_id] = comment.comment;
            return acc;
          }, {});
        }

        // Récupérer les infos des fiches pédagogiques
        const pedagogySheetIds = (data.exercises || [])
          .map(ex => ex.pedagogy_sheet_id)
          .filter(Boolean);

        let pedagogySheetsMap = {};
        if (pedagogySheetIds.length > 0) {
          const { data: sheets, error: sheetsError } = await supabase
            .from('pedagogy_sheets')
            .select('id, title, sheet_type, illustration_image')
            .in('id', pedagogySheetIds);

          if (sheetsError) {
            throw sheetsError;
          }

          pedagogySheetsMap = (sheets || []).reduce((acc, sheet) => {
            acc[sheet.id] = sheet;
            return acc;
          }, {});
        }

        // OPTIMIZED: Récupérer les membres du groupe associé au schedule de la session
        // Le groupe_id est maintenant disponible directement dans scheduleData
        let lyceeMembers = [];
        try {
          const groupeId = scheduleData?.Groupe || null;

          // Récupérer les membres filtrés par groupe_id (avec sexe et category)
          let query = supabase
            .from('members')
            .select('id, first_name, last_name, groupe_id, sexe, category')
            .order('last_name')
            .order('first_name');

          if (groupeId) {
            query = query.eq('groupe_id', groupeId);
          } else {
            // Fallback sur 'Loisir lycée' si pas de groupe
            query = query.eq('title', 'Loisir lycée');
          }

          const { data: lyceeData, error: lyceeError } = await query;

          if (lyceeError) {
            // Ne pas bloquer la page si l'appel échoue, on logge seulement
            console.warn('Erreur en récupérant les membres:', lyceeError);
          } else {
            lyceeMembers = lyceeData || [];
          }
        } catch (err) {
          console.warn('Exception en récupérant les membres:', err);
        }

        const lyceeMap = (lyceeMembers || []).reduce((acc, member) => {
          const sex = member.sexe ? `(${member.sexe})` : '';
          const category = member.category ? `[${member.category}]` : '';
          acc[member.id] = {
            id: member.id,
            fullName: `${member.first_name} ${member.last_name} ${sex} ${category}`.trim(),
            firstName: member.first_name,
            lastName: member.last_name,
            sex: member.sexe,
            category: member.category
          };
          return acc;
        }, {});

        // Enrichir la session avec les noms des membres et commentaires
        const enrichedSession = {
          ...data,
          schedule: scheduleData,
          instructorNames: (data.instructors || []).map(memberId => membersMap[memberId]?.fullName || `ID: ${memberId}`),
          studentNames: (data.students || []).map(memberId => membersMap[memberId]?.fullName || `ID: ${memberId}`),
          studentsData: (data.students || []).map(memberId => {
            const member = membersMap[memberId];
            return {
              id: memberId,
              first_name: member?.firstName || '',
              last_name: member?.lastName || '',
              fullName: member?.fullName || `ID: ${memberId}`,
              sex: member?.sex || '',
              category: member?.category || '',
              photo_url: member?.photo_url || null,
              comment: studentCommentsMap[memberId] || ''
            };
          }),
          // Absent students derived from table `members` (Loisir lycée) minus les présents
          absentNames: (() => {
            const presentIds = new Set(data.students || []);
            return (lyceeMembers || [])
              .filter(m => !presentIds.has(m.id))
              .map(m => `${m.first_name} ${m.last_name}`);
          })(),
          absentData: (() => {
            const presentIds = new Set(data.students || []);
            return (lyceeMembers || [])
              .filter(m => !presentIds.has(m.id))
              .map(m => ({ id: m.id, fullName: `${m.first_name} ${m.last_name}`, firstName: m.first_name, lastName: m.last_name }));
          })(),
          exercises: (data.exercises || []).map(ex => ({
            ...ex,
            pedagogy_sheet: ex.pedagogy_sheet_id ? pedagogySheetsMap[ex.pedagogy_sheet_id] : null
          }))
        };
        setSession(enrichedSession);
      } catch (err) {
        console.error('General error in fetchSessionDetail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) { // Use 'id' here
      fetchSessionDetail();
    } else {
      setError('Session ID is missing.');
      setLoading(false);
    }
  }, [id]); // Depend on 'id' here

  if (loading) {
    return <div className="container mx-auto p-4">Chargement des détails de la séance...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Erreur: {error}</div>;
  }

  if (!session) {
    return <div className="container mx-auto p-4">Séance non trouvée.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Helmet title={`Détail de la séance - ${session.date ? new Date(session.date).toLocaleDateString() : 'Sans date'}`} />

      {/* En-tête avec boutons retour et modifier */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <BackButton to="/session-log" variant="outline" />
          <h1 className="text-3xl font-bold">Détail de la séance</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopyToClipboard}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copier le résumé
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPNG}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Télécharger en PNG
          </Button>
          <Button
            variant="default"
            onClick={() => navigate(`/session-log/${id}/live`)}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Lancer la séance
          </Button>
          <Button onClick={() => navigate(`/session-log/edit/${id}`)}> {/* Use 'id' here */}
            Modifier la séance
          </Button>
        </div>
      </div>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date et heure */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {session.date ? new Date(session.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Non spécifiée'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Heure de début</p>
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

          {/* Emploi du temps */}
          {session.schedule && (
            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="font-semibold text-purple-900 dark:text-purple-100">
                Emploi du temps: {session.schedule.type} - {session.schedule.age_category}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                {session.schedule.day} de {session.schedule.start_time} à {session.schedule.end_time}
              </p>
            </div>
          )}

          {/* Objectif de séance */}
          {session.session_objective && (
            <div className="border-l-4 border-primary pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <p className="font-semibold">Objectif de séance</p>
              </div>
              <p className="text-muted-foreground">{session.session_objective}</p>
            </div>
          )}

          {/* Matériel */}
          {session.equipment && (
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-orange-500" />
                <p className="font-semibold">Matériel</p>
              </div>
              <p className="text-muted-foreground">{session.equipment}</p>
            </div>
          )}

          {/* Commentaire */}
          {session.comment && (
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <p className="font-semibold">Commentaire</p>
              </div>
              <p className="text-muted-foreground">{session.comment}</p>
            </div>
          )}

          {/* Encadrants */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <p className="font-semibold">Encadrants ({session.instructorNames?.length || 0})</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.instructorNames?.map((name, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Élèves présents avec commentaires */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <p className="font-semibold">Élèves présents ({session.studentsData?.length || 0})</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/session-log/${id}/comments`)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Gérer les commentaires
              </Button>
            </div>
            {session.studentsData && session.studentsData.length > 0 ? (
              <div className="space-y-3">
                {/* Élèves sans commentaire - Format compact */}
                {session.studentsData.filter(s => !s.comment).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {session.studentsData
                      .filter(student => !student.comment)
                      .map((student, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-sm py-1.5 px-3 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 flex items-center gap-2"
                        >
                          {student.photo_url && (
                            <SimpleMemberAvatar
                              photoUrl={student.photo_url}
                              firstName={student.first_name}
                              lastName={student.last_name}
                              size="small"
                            />
                          )}
                          {student.fullName}
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Élèves avec commentaire - Format détaillé */}
                {session.studentsData
                  .filter(student => student.comment)
                  .map((student, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className="text-sm py-1 px-3 bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100 whitespace-nowrap flex items-center gap-2"
                        >
                          {student.photo_url && (
                            <SimpleMemberAvatar
                              photoUrl={student.photo_url}
                              firstName={student.first_name}
                              lastName={student.last_name}
                              size="small"
                            />
                          )}
                          {student.fullName}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground italic">
                            "{student.comment}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun élève enregistré</p>
            )}
          </div>

          {/* Élèves absents */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <p className="font-semibold">Élèves absents ({session.absentData?.length || 0})</p>
            </div>
            {session.absentData && session.absentData.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {session.absentData.map((student, index) => (
                  <Badge key={index} variant="outline" className="text-sm py-1.5 px-3 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100">
                    {student.fullName}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun élève absent enregistré</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercices */}
      <Card>
        <CardHeader>
          <CardTitle>Déroulé de la séance ({session.exercises?.length || 0} exercices)</CardTitle>
        </CardHeader>
        <CardContent>
          {session.exercises && session.exercises.length > 0 ? (
            <div className="space-y-6">
              {session.exercises.map((exercise, index) => (
                <ExerciseDisplay key={exercise.id} exercise={exercise} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucun exercice enregistré pour cette séance.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionLogDetail;
