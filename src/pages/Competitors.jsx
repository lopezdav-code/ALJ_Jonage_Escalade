// Fichier supprimé
// This file has been removed as part of the update.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trophy, Loader2, Edit, TrendingUp, Mountain, ListChecks, User, UserIcon, Users, UserCheck, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { formatName, ProfileIndicator } from '@/lib/utils.jsx';
import { Button } from '@/components/ui/button';
import SafeMemberAvatar from '@/components/SafeMemberAvatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useMemberDetail } from '@/contexts/MemberDetailContext';

// Composant pour afficher les statistiques de participation
const ParticipationStats = ({ title, stats, color, loading }) => {
  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="text-lg font-semibold">...</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>
    );
  }

  const genderData = [
    { label: 'H', value: stats.byGender.H, color: '#3b82f6' },
    { label: 'F', value: stats.byGender.F, color: '#ec4899' },
    ...(stats.byGender.unknown > 0 ? [{ label: '?', value: stats.byGender.unknown, color: '#6b7280' }] : [])
  ];

  const maxAgeValue = Math.max(...Object.values(stats.byAge));

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-2xl font-bold" style={{ color }}>{stats.total}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>

      {/* Mini camembert pour le sexe */}
      {stats.total > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-2 text-center">Par sexe</h4>
          <div className="flex justify-center">
            <PieChart data={genderData} size={80} />
          </div>
        </div>
      )}

      {/* Mini barres pour l'âge */}
      {Object.keys(stats.byAge).length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-2">Par âge</h4>
          <div className="space-y-1">
            {Object.entries(stats.byAge).map(([age, count]) => (
              <div key={age} className="flex items-center gap-2 text-xs">
                <span className="w-12 truncate">{age}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(count / maxAgeValue) * 100}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
                <span className="w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour le camembert
const PieChart = ({ data, size = 120 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  let cumulativePercentage = 0;
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${percentage * 2.51} 251`; // 251 approximativement 2π * 40 (rayon du cercle)
          const strokeDashoffset = -cumulativePercentage * 2.51;
          
          cumulativePercentage += percentage;
          
          return (
            <circle
              key={index}
              cx={centerX}
              cy={centerY}
              r="40"
              fill="transparent"
              stroke={item.color}
              strokeWidth="20"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          );
        })}
        {/* Texte au centre */}
        <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-semibold text-sm transform rotate-90">
          {total}
        </text>
      </svg>
      
      {/* Légende */}
      <div className="mt-3 space-y-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant pour le graphique en barres horizontales
const HorizontalBarChart = ({ data, maxValue }) => {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium truncate">{item.label}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const CompetitionStats = ({ members }) => {
  const [competitionsStats, setCompetitionsStats] = useState({
    bloc: 0,
    difficulte: 0,
    total: 0,
    participantsStats: {
      bloc: { total: 0, byGender: { H: 0, F: 0, unknown: 0 }, byAge: {} },
      difficulte: { total: 0, byGender: { H: 0, F: 0, unknown: 0 }, byAge: {} }
    },
    loading: true
  });

  useEffect(() => {
    const fetchCompetitionsStats = async () => {
      try {
        // Récupérer les compétitions avec leurs disciplines
        const { data: competitions, error: competitionsError } = await supabase
          .from('competitions')
          .select('id, disciplines');

        if (competitionsError) throw competitionsError;

        // Récupérer tous les participants avec les données des membres
        const { data: participants, error: participantsError } = await supabase
          .from('competition_participants')
          .select(`
            competition_id,
            member_id,
            role,
            members (
              sexe,
              category,
              first_name,
              last_name
            )
          `)
          .eq('role', 'Competiteur');

        if (participantsError) throw participantsError;

        let blocCount = 0;
        let difficulteCount = 0;

        // Statistiques des participants par discipline
        const blocParticipants = new Set();
        const difficulteParticipants = new Set();
        const blocStats = { total: 0, byGender: { H: 0, F: 0, unknown: 0 }, byAge: {} };
        const difficulteStats = { total: 0, byGender: { H: 0, F: 0, unknown: 0 }, byAge: {} };

        // Créer un map des compétitions par discipline
        const competitionsByDiscipline = { bloc: [], difficulte: [] };
        
        competitions.forEach(comp => {
          if (comp.disciplines) {
            const disciplines = Array.isArray(comp.disciplines) ? comp.disciplines : [comp.disciplines];
            if (disciplines.includes('Bloc')) {
              blocCount++;
              competitionsByDiscipline.bloc.push(comp.id);
            }
            if (disciplines.includes('Difficulté')) {
              difficulteCount++;
              competitionsByDiscipline.difficulte.push(comp.id);
            }
          }
        });

        // Analyser les participants
        participants.forEach(participant => {
          if (!participant.members) return;

          const member = participant.members;
          const competitionId = participant.competition_id;

          // Déterminer l'âge basé sur la catégorie
          let ageGroup = 'Autre';
          if (member.category) {
            if (member.category.includes('U11') || member.category.includes('U13')) {
              ageGroup = 'U11-U13';
            } else if (member.category.includes('U15')) {
              ageGroup = 'U15';
            } else if (member.category.includes('U17') || member.category.includes('U19')) {
              ageGroup = 'U17-U19';
            }
          }

          // Participant à une compétition de bloc
          if (competitionsByDiscipline.bloc.includes(competitionId)) {
            const participantKey = `${participant.member_id}`;
            if (!blocParticipants.has(participantKey)) {
              blocParticipants.add(participantKey);
              blocStats.total++;

              // Par sexe
              if (member.sexe === 'H') blocStats.byGender.H++;
              else if (member.sexe === 'F') blocStats.byGender.F++;
              else blocStats.byGender.unknown++;

              // Par âge
              blocStats.byAge[ageGroup] = (blocStats.byAge[ageGroup] || 0) + 1;
            }
          }

          // Participant à une compétition de difficulté
          if (competitionsByDiscipline.difficulte.includes(competitionId)) {
            const participantKey = `${participant.member_id}`;
            if (!difficulteParticipants.has(participantKey)) {
              difficulteParticipants.add(participantKey);
              difficulteStats.total++;

              // Par sexe
              if (member.sexe === 'H') difficulteStats.byGender.H++;
              else if (member.sexe === 'F') difficulteStats.byGender.F++;
              else difficulteStats.byGender.unknown++;

              // Par âge
              difficulteStats.byAge[ageGroup] = (difficulteStats.byAge[ageGroup] || 0) + 1;
            }
          }
        });

        setCompetitionsStats({
          bloc: blocCount,
          difficulte: difficulteCount,
          total: competitions.length,
          participantsStats: {
            bloc: blocStats,
            difficulte: difficulteStats
          },
          loading: false
        });

      } catch (error) {
        console.error('Erreur lors du chargement des statistiques de compétitions:', error);
        setCompetitionsStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchCompetitionsStats();
  }, []);

  // Calculer les statistiques des membres
  const memberStats = useMemo(() => {
    const categoryStats = {};
    const sexStats = { H: 0, F: 0, unknown: 0 };

    members.forEach(member => {
      // Compter par catégorie
      const category = member.category || 'Non définie';
      categoryStats[category] = (categoryStats[category] || 0) + 1;

      // Compter par sexe
      if (member.sexe === 'H') {
        sexStats.H++;
      } else if (member.sexe === 'F') {
        sexStats.F++;
      } else {
        sexStats.unknown++;
      }
    });

    // Fonction pour trier les catégories dans l'ordre souhaité
    const sortCategories = (categories) => {
      const order = ['U11', 'U13', 'U15', 'U17', 'U19'];
      
      return categories.sort((a, b) => {
        // Extraire les numéros U des catégories
        const getUNumber = (category) => {
          const match = category.match(/U(\d+)/);
          return match ? parseInt(match[1]) : 999; // 999 pour les catégories sans U
        };
        
        const aU = getUNumber(a[0]);
        const bU = getUNumber(b[0]);
        
        // Si les deux ont des numéros U, trier par numéro
        if (aU !== 999 && bU !== 999) {
          return aU - bU;
        }
        
        // Si seul a a un numéro U, a vient en premier
        if (aU !== 999 && bU === 999) {
          return -1;
        }
        
        // Si seul b a un numéro U, b vient en premier
        if (aU === 999 && bU !== 999) {
          return 1;
        }
        
        // Si aucun n'a de numéro U, tri alphabétique
        return a[0].localeCompare(b[0]);
      });
    };

    const sortedCategoryStats = {};
    const sortedEntries = sortCategories(Object.entries(categoryStats));
    sortedEntries.forEach(([category, count]) => {
      sortedCategoryStats[category] = count;
    });

    return { categoryStats: sortedCategoryStats, sexStats };
  }, [members]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Statistiques Compétiteurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Répartition par catégorie - Graphique en barres horizontales */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Par catégorie
            </h3>
            <HorizontalBarChart 
              data={Object.entries(memberStats.categoryStats).map(([category, count]) => ({
                label: category,
                value: count
              }))}
              maxValue={Math.max(...Object.values(memberStats.categoryStats))}
            />
          </div>

          {/* Répartition par sexe - Camembert */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Par sexe
            </h3>
            <div className="flex justify-center">
              <PieChart 
                data={[
                  { 
                    label: 'Hommes', 
                    value: memberStats.sexStats.H, 
                    color: '#3b82f6' // blue-500
                  },
                  { 
                    label: 'Femmes', 
                    value: memberStats.sexStats.F, 
                    color: '#ec4899' // pink-500
                  },
                  ...(memberStats.sexStats.unknown > 0 ? [{
                    label: 'Non renseigné', 
                    value: memberStats.sexStats.unknown, 
                    color: '#6b7280' // gray-500
                  }] : [])
                ]}
                size={140}
              />
            </div>
          </div>

          {/* Compétitions et participants par discipline */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Participation aux compétitions
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Participants Bloc */}
              <div className="border rounded-lg p-3 bg-blue-50/50">
                <ParticipationStats
                  title="Participants Bloc"
                  stats={competitionsStats.participantsStats.bloc}
                  color="#3b82f6"
                  loading={competitionsStats.loading}
                />
              </div>

              {/* Participants Difficulté */}
              <div className="border rounded-lg p-3 bg-green-50/50">
                <ParticipationStats
                  title="Participants Difficulté"
                  stats={competitionsStats.participantsStats.difficulte}
                  color="#10b981"
                  loading={competitionsStats.loading}
                />
              </div>
            </div>

            {/* Nombre total de compétitions */}
            <div className="mt-3 pt-3 border-t space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span>Compétitions Bloc</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {competitionsStats.loading ? '...' : competitionsStats.bloc}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Compétitions Difficulté</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {competitionsStats.loading ? '...' : competitionsStats.difficulte}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CompetitionListModal = ({ competitions, discipline, onClose }) => {
    const navigate = useNavigate();

    const handleCompetitionClick = (competitionId) => {
        onClose();
        navigate(`/competitions?id=${competitionId}`);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Compétitions de {discipline}</DialogTitle>
                    <DialogDescription>
                        Liste des compétitions auxquelles le membre a participé en 2025
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-60 overflow-y-auto space-y-2 py-4">
                    {competitions.length > 0 ? (
                        competitions.map((comp) => (
                            <div
                                key={comp.id}
                                className="p-2 rounded-md hover:bg-accent cursor-pointer"
                                onClick={() => handleCompetitionClick(comp.id)}
                            >
                                <p className="font-medium">{comp.name}</p>
                                <p className="text-sm text-muted-foreground">{new Date(comp.start_date).toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground">Aucune compétition dans cette discipline.</p>
                    )}
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const CompetitorCard = ({ member, onEdit, isAdmin, stats, onStatClick }) => {
    const { showMemberDetails } = useMemberDetail();
    const showBlocStat = stats && stats.bloc > 0;
    const showDifficulteStat = stats && stats.difficulte > 0;

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md relative group cursor-pointer" onClick={() => showMemberDetails(member.id)}>
            <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <SafeMemberAvatar 
                      member={member} 
                      size="small"
                      className="w-8 h-8"
                    />
                    <div className="flex-grow">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold">{formatName(member.first_name, member.last_name, isAdmin)}</p>
                            {/* Pictogramme pour le sexe */}
                            {member.sexe && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    member.sexe === 'F' 
                                        ? 'bg-pink-100 text-pink-600' 
                                        : member.sexe === 'H'
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {member.sexe === 'F' ? '♀' : member.sexe === 'H' ? '♂' : '?'}
                                </span>
                            )}
                            <ProfileIndicator profile={member.profiles} />
                        </div>
                        {member.category && <p className="text-sm text-primary font-medium">{member.category}</p>}
                    </div>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity self-start"
                            onClick={(e) => { e.stopPropagation(); onEdit(member); }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {(showBlocStat || showDifficulteStat) && (
                    <div className="flex items-center justify-start gap-4 text-xs text-muted-foreground pt-1">
                        {showBlocStat && (
                            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-500" onClick={(e) => { e.stopPropagation(); onStatClick('Bloc'); }}>
                                <TrendingUp className="w-3 h-3 text-blue-500" />
                                <span>Bloc: <span className="font-bold text-foreground">{stats.bloc}</span></span>
                            </div>
                        )}
                        {showDifficulteStat && (
                            <div className="flex items-center gap-1 cursor-pointer hover:text-green-500" onClick={(e) => { e.stopPropagation(); onStatClick('Difficulté'); }}>
                                <Mountain className="w-3 h-3 text-green-500" />
                                <span>Diff: <span className="font-bold text-foreground">{stats.difficulte}</span></span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const CompetitorGroup = ({ title, competitors, onEdit, isAdmin, participationStats, onStatClick }) => {
  const groupedByCategory = useMemo(() => {
    const groups = competitors.reduce((acc, member) => {
      const category = member.category || 'Non classé';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(member);
      return acc;
    }, {});
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Non classé') return 1;
      if (b === 'Non classé') return -1;
      return a.localeCompare(b);
    });
  }, [competitors]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold headline flex items-center gap-3">
        <Trophy className="w-8 h-8 text-primary" />
        {title} ({competitors.length})
      </h2>
      <div className="space-y-6">
        {groupedByCategory.map(([category, members]) => (
          <div key={category}>
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">{category} ({members.length})</h3>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="visible"
            >
              {members.map((member) => {
                const stats = participationStats[member.id] || { bloc: { count: 0, list: [] }, difficulte: { count: 0, list: [] } };
                const formattedStats = { bloc: stats.bloc.count, difficulte: stats.difficulte.count };
                return (
                  <motion.div key={member.id} variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                    <CompetitorCard member={member} onEdit={onEdit} isAdmin={isAdmin} stats={formattedStats} onStatClick={(discipline) => onStatClick(member, discipline)} />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

const Competitors = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [participationStats, setParticipationStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalInfo, setModalInfo] = useState({ isOpen: false, competitions: [], discipline: '' });
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { openEditFormForMember } = useMemberDetail();
  const navigate = useNavigate();

  const fetchCompetitorData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*, profiles(role)')
        .in('title', ['Compétition U11-U15', 'Compétition U15-U19'])
        .order('last_name')
        .order('first_name');
        
      if (membersError) throw membersError;

      const formattedMembers = membersData.map(m => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      }));
      setAllMembers(formattedMembers);

      const { data: participations, error: participationsError } = await supabase
        .from('competition_participants')
        .select(`
          member_id,
          competitions ( id, name, start_date, disciplines )
        `)
        .eq('role', 'Competiteur');

      if (participationsError) throw participationsError;
      
      const stats = participations.reduce((acc, p) => {
        if (!p.member_id || !p.competitions) return acc;
        
        if (!acc[p.member_id]) {
            acc[p.member_id] = { bloc: { count: 0, list: [] }, difficulte: { count: 0, list: [] } };
        }

        const competitionDetails = {
            id: p.competitions.id,
            name: p.competitions.name,
            start_date: p.competitions.start_date
        };

        const disciplines = p.competitions?.disciplines || [];
        if (disciplines.includes('Bloc')) {
            acc[p.member_id].bloc.count++;
            acc[p.member_id].bloc.list.push(competitionDetails);
        }
        if (disciplines.includes('Difficulté')) {
            acc[p.member_id].difficulte.count++;
            acc[p.member_id].difficulte.list.push(competitionDetails);
        }

        return acc;
      }, {});

      setParticipationStats(stats);

    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les données des compétiteurs.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompetitorData();
  }, [fetchCompetitorData]);

  const handleStatClick = (member, discipline) => {
    const memberStats = participationStats[member.id];
    if (!memberStats) return;

    if (discipline === 'Bloc') {
        setModalInfo({ isOpen: true, competitions: memberStats.bloc.list, discipline: 'Bloc' });
    } else if (discipline === 'Difficulté') {
        setModalInfo({ isOpen: true, competitions: memberStats.difficulte.list, discipline: 'Difficulté' });
    }
  };

  const closeModal = () => {
    setModalInfo({ isOpen: false, competitions: [], discipline: '' });
  };

  const competitorsU11U15 = allMembers.filter(
    (member) => member.title === 'Compétition U11-U15'
  );
  const competitorsU15U19 = allMembers.filter(
    (member) => member.title === 'Compétition U15-U19'
  );

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <Helmet>
        <title>Compétiteurs - ALJ Escalade Jonage</title>
        <meta name="description" content="Liste des compétiteurs du club d'escalade, répartis par catégories." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center items-center gap-4 flex-wrap">
            <h1 className="text-4xl font-bold headline">Nos Compétiteurs</h1>
            <Button onClick={() => navigate('/annual-summary?tab=participation')} variant="outline">
                <ListChecks className="w-4 h-4 mr-2" /> Récap Annuel
            </Button>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          La fierté du club, nos athlètes qui nous représentent sur les murs de la région et au-delà.
        </p>
      </motion.div>

      {/* Cadre statistique */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <CompetitionStats members={allMembers} />
      </motion.div>

      <CompetitorGroup
        title="Compétition U11-U15"
        competitors={competitorsU11U15}
        onEdit={(member) => openEditFormForMember(member)}
        isAdmin={isAdmin}
        participationStats={participationStats}
        onStatClick={handleStatClick}
      />
      <CompetitorGroup
        title="Compétition U15-U19"
        competitors={competitorsU15U19}
        onEdit={(member) => openEditFormForMember(member)}
        isAdmin={isAdmin}
        participationStats={participationStats}
        onStatClick={handleStatClick}
      />
      
      {modalInfo.isOpen && (
        <CompetitionListModal
            competitions={modalInfo.competitions}
            discipline={modalInfo.discipline}
            onClose={ closeModal }
        />
      )}
    </div>
  );
};

export default Competitors;
