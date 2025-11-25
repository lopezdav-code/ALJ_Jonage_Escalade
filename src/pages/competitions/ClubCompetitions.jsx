import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Eye, Calendar, Users, Printer } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import CompetitionFilters from '@/components/competitions/CompetitionFilters';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePageAccess } from '@/hooks/usePageAccess';
import { getCompetitionPhotoUrl } from '@/lib/competitionStorageUtils';
import { exportCompetitionToPNG } from '@/lib/competitionExportUtils';

const ClubCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [participants, setParticipants] = useState({});
  const [signedImageUrls, setSignedImageUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    niveau: '',
    nature: '',
    discipline: ''
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isBureau, isEncadrant } = useAuth();
  const { hasAccess, loading: pageAccessLoading } = usePageAccess();
  const canCreate = isAdmin || isBureau || isEncadrant;

  // Récupérer les compétitions et les participants
  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      // Récupérer les compétitions
      const { data: competitionsData, error: competitionsError } = await supabase
        .from('competitions')
        .select('*')
        .order('start_date', { ascending: false });

      if (competitionsError) throw competitionsError;
      setCompetitions(competitionsData);

      // Generate signed URLs for competition images
      const urls = {};
      for (const comp of competitionsData) {
        if (comp.image_url) {
          urls[comp.id] = await getCompetitionPhotoUrl(comp.image_url);
        }
      }
      setSignedImageUrls(urls);

      // Récupérer le nombre de participants par compétition
      const { data: participantsData, error: participantsError } = await supabase
        .from('competition_participants')
        .select('competition_id, role');

      if (participantsError) throw participantsError;

      console.log('Données participants récupérées:', participantsData);

      // Compter les compétiteurs par compétition
      const counts = {};
      participantsData?.forEach(p => {
        console.log('Participant role:', p.role, 'Competition ID:', p.competition_id);
        // Normaliser la comparaison pour gérer différentes orthographes
        const role = p.role?.toLowerCase().trim();
        if (role === 'compétiteur' || role === 'competiteur') {
          counts[p.competition_id] = (counts[p.competition_id] || 0) + 1;
        }
      });

      console.log('Comptage final des compétiteurs:', counts);
      setParticipants(counts);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les compétitions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fonction pour exporter une compétition en PNG
  const handleExportCompetitionPNG = async (competition) => {
    await exportCompetitionToPNG(competition, toast);
  };

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Fonction pour filtrer les compétitions
  const getFilteredCompetitions = () => {
    let filtered = [...competitions];

    // Filtre textuel
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(comp =>
        comp.name?.toLowerCase().includes(searchLower) ||
        comp.location?.toLowerCase().includes(searchLower) ||
        comp.short_title?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par statut
    if (filters.status) {
      filtered = filtered.filter(comp => comp.status === filters.status);
    }

    // Filtre par niveau
    if (filters.niveau) {
      filtered = filtered.filter(comp => comp.niveau === filters.niveau);
    }

    // Filtre par nature
    if (filters.nature) {
      filtered = filtered.filter(comp => comp.nature === filters.nature);
    }

    // Filtre par discipline
    if (filters.discipline) {
      filtered = filtered.filter(comp =>
        comp.disciplines && comp.disciplines.includes(filters.discipline)
      );
    }

    return filtered;
  };

  const filteredCompetitions = getFilteredCompetitions();

  // Fonctions utilitaires pour les couleurs des badges
  const getDisciplineColor = (discipline) => {
    const colors = {
      'Bloc': 'bg-purple-100 text-purple-700 border-purple-200',
      'Difficulté': 'bg-red-100 text-red-700 border-red-200',
      'Vitesse': 'bg-blue-100 text-blue-700 border-blue-200',
      'Combiné': 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[discipline] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getNatureColor = (nature) => {
    const colors = {
      'Contest': 'bg-green-100 text-green-700 border-green-200',
      'Open': 'bg-blue-100 text-blue-700 border-blue-200',
      'Coupe': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Championnat': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[nature] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getNiveauColor = (niveau) => {
    const colors = {
      'Départemental': 'bg-green-100 text-green-700 border-green-200',
      'Régional': 'bg-blue-100 text-blue-700 border-blue-200',
      'Inter-régional': 'bg-purple-100 text-purple-700 border-purple-200',
      'National': 'bg-red-100 text-red-700 border-red-200',
      'International': 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[niveau] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'À venir': 'bg-blue-100 text-blue-700 border-blue-200',
      'En cours': 'bg-green-100 text-green-700 border-green-200',
      'Clos': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Compétitions du Club</h2>
          <p className="text-muted-foreground">
            {filteredCompetitions.length} compétition{filteredCompetitions.length > 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate('/competitions/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Créer une compétition
          </Button>
        )}
      </div>

      {/* Filtres */}
      <CompetitionFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={() => setFilters({ search: '', status: '', niveau: '', nature: '', discipline: '' })}
      />

      {/* Tableau */}
      {filteredCompetitions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {filters.search || filters.status || filters.niveau || filters.nature || filters.discipline
            ? 'Aucune compétition ne correspond aux filtres.'
            : 'Aucune compétition pour le moment.'}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Titre court</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Info</TableHead>
                <TableHead>Compétiteurs</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompetitions.map((comp) => (
                <TableRow key={comp.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    {signedImageUrls[comp.id] ? (
                      <img
                        src={signedImageUrls[comp.id]}
                        alt={comp.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{comp.name}</div>
                  </TableCell>

                  <TableCell>
                    {comp.short_title ? (
                      <div className="text-sm text-primary">{comp.short_title}</div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {new Date(comp.start_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {comp.end_date && comp.end_date !== comp.start_date && (
                        <>
                          <br />
                          au {new Date(comp.end_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {comp.status && (
                      <Badge variant="outline" className={`text-xs ${getStatusColor(comp.status)}`}>
                        {comp.status}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {/* Niveau */}
                      {comp.niveau && (
                        <Badge variant="outline" className={`text-xs ${getNiveauColor(comp.niveau)}`}>
                          {comp.niveau}
                        </Badge>
                      )}
                      {/* Nature */}
                      {comp.nature && (
                        <Badge variant="outline" className={`text-xs ${getNatureColor(comp.nature)}`}>
                          {comp.nature}
                        </Badge>
                      )}
                      {/* Disciplines */}
                      {comp.disciplines && comp.disciplines.slice(0, 2).map(discipline => (
                        <Badge key={discipline} variant="outline" className={`text-xs ${getDisciplineColor(discipline)}`}>
                          {discipline}
                        </Badge>
                      ))}
                      {comp.disciplines && comp.disciplines.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{comp.disciplines.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    {participants[comp.id] > 0 ? (
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium">{participants[comp.id]}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/competitions/detail/${comp.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportCompetitionPNG(comp);
                        }}
                        className="flex items-center gap-1"
                        title="Exporter en PNG"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ClubCompetitions;
