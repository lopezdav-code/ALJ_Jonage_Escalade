import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Trophy, UserCheck, X } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatName } from '@/lib/utils';

const CompetitionResultsEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [editedResults, setEditedResults] = useState({}); // { participantId: { ranking: value, nb_competitor: value } }

  useEffect(() => {
    const fetchCompetitionAndParticipants = async () => {
      setLoading(true);
      try {
        // Fetch competition details
        const { data: compData, error: compError } = await supabase
          .from('competitions')
          .select('id, name')
          .eq('id', id)
          .single();

        if (compError) throw compError;
        setCompetition(compData);

        // Fetch participants with their current results
        const { data: rawParticipants, error: participantsError } = await supabase
          .from('competition_participants')
          .select(`
            id,
            member_id,
            role,
            ranking,
            nb_competitor,
            members (
              id,
              first_name,
              last_name,
              category,
              sexe
            )
          `)
          .eq('competition_id', id)
          .eq('role', 'Competiteur') // Only show competitors for results
          .order('last_name', { foreignTable: 'members' });

        if (participantsError) throw participantsError;

        setParticipants(rawParticipants || []);

        // Initialize editedResults with current data
        const initialEditedResults = {};
        rawParticipants.forEach(p => {
          initialEditedResults[p.id] = {
            ranking: p.ranking === null || p.ranking === undefined ? null : p.ranking,
            nb_competitor: p.nb_competitor === null || p.nb_competitor === undefined ? null : p.nb_competitor
          };
        });
        setEditedResults(initialEditedResults);

      } catch (error) {
        console.error('Error fetching competition or participants:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de la compétition ou des participants.",
          variant: "destructive"
        });
        navigate(`/competitions/detail/${id}`); // Go back to detail page on error
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompetitionAndParticipants();
    }
  }, [id, navigate, toast]);

  const handleResultChange = (participantId, field, value) => {
    setEditedResults(prev => {
      const parsedValue = value === '' ? null : parseInt(value, 10);
      return {
        ...prev,
        [participantId]: {
          ...prev[participantId],
          [field]: isNaN(parsedValue) ? null : parsedValue // Ensure NaN is converted to null
        }
      };
    });
  };

  const handleSaveResults = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editedResults).map(([participantId, results]) => {
        const participant = participants.find(p => p.id === participantId);
        return {
          id: participantId,
          competition_id: id, // Ensure competition_id is always included
          member_id: participant ? participant.member_id : null, // Ensure member_id is always included
          role: 'Competiteur', // Ensure role is always included
          ranking: results.ranking,
          nb_competitor: results.nb_competitor,
        };
      });

      const { error } = await supabase
        .from('competition_participants')
        .upsert(updates, { onConflict: 'id' }); // Use upsert to update existing records

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Résultats des compétiteurs mis à jour avec succès !",
        variant: "default"
      });
      navigate(`/competitions/detail/${id}`); // Go back to detail page after saving
    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder les résultats: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!competition) {
    return <div className="text-center py-8">Compétition non trouvée.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(`/competitions/detail/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la compétition
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Résultats de la compétition: {competition.name}
          </h1>
          <p className="text-muted-foreground">
            Saisissez ou modifiez les classements des compétiteurs.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Compétiteurs ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Aucun compétiteur trouvé</p>
              <p>Veuillez ajouter des participants avec le rôle "Compétiteur" pour cette compétition.</p>
              <Button onClick={() => navigate(`/competitions/participants/${id}`)} className="mt-4">
                Ajouter des participants
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map(participant => (
                  <Card key={participant.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <p className="font-semibold">
                          {formatName(participant.members?.first_name, participant.members?.last_name)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {participant.members?.category || 'Catégorie inconnue'}
                          </Badge>
                          <span>•</span>
                          <span>{participant.members?.sexe || 'Sexe inconnu'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`ranking-${participant.id}`}>Classement</Label>
                        <Input
                          id={`ranking-${participant.id}`}
                          type="number"
                          min="1"
                          value={editedResults[participant.id]?.ranking || ''}
                          onChange={(e) => handleResultChange(participant.id, 'ranking', e.target.value)}
                          placeholder="Ex: 1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`nb_competitor-${participant.id}`}>Nb Compétiteurs</Label>
                        <Input
                          id={`nb_competitor-${participant.id}`}
                          type="number"
                          min="1"
                          value={editedResults[participant.id]?.nb_competitor || ''}
                          onChange={(e) => handleResultChange(participant.id, 'nb_competitor', e.target.value)}
                          placeholder="Ex: 20"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => navigate(`/competitions/detail/${id}`)}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSaveResults} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder les résultats
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionResultsEditor;
