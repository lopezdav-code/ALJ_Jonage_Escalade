import React from 'react';
import { Trophy, UserCheck, Users, Trash2, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatName, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ParticipantsDisplay = ({
  participants = [],
  showRemoveButton = false,
  onRemoveParticipant = null,
  onParticipantClick = null,
  onEditRanking = null,
  compact = false,
  alwaysShowRemoveButton = false
}) => {
  const { isAdmin } = useAuth();

  if (participants.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucun participant inscrit.</p>
      </div>
    );
  }

  // Séparer par rôle
  const competitors = participants.filter(p => p.role === 'Competiteur');
  const arbitres = participants.filter(p => p.role === 'Arbitre');
  const coaches = participants.filter(p => p.role === 'Coach');
  const autreStaff = participants.filter(p => p.role !== 'Competiteur' && p.role !== 'Arbitre' && p.role !== 'Coach');

  // Grouper les compétiteurs par sexe et catégorie
  const groupCompetitorsByGenderAndCategory = (competitors) => {
    const grouped = {
      femmes: {},
      hommes: {},
      inconnu: {}
    };

    competitors.forEach(competitor => {
      if (!competitor.members) return;

      let gender;
      if (competitor.members.sexe === 'F') {
        gender = 'femmes';
      } else if (competitor.members.sexe === 'H') {
        gender = 'hommes';
      } else {
        gender = 'inconnu';
      }

      const category = competitor.members.category || 'Sans catégorie';

      if (!grouped[gender][category]) {
        grouped[gender][category] = [];
      }

      grouped[gender][category].push(competitor);
    });

    return grouped;
  };

  const groupedCompetitors = groupCompetitorsByGenderAndCategory(competitors);

  // Composant pour afficher une carte de participant
  const ParticipantCard = ({ participant, showRemove, alwaysShowRemove, onClick }) => {
    if (!participant.members) {
      return (
        <div className="text-sm text-muted-foreground py-1">
          Membre introuvable
        </div>
      );
    }

    return (
      <div
        className="flex items-center justify-between py-2 px-3 hover:bg-muted/30 transition-colors group border-b border-muted/30 last:border-b-0"
      >
        <div
          className={cn(
            "flex items-center gap-3 flex-1 min-w-0",
            onClick && "cursor-pointer"
          )}
          onClick={() => onClick && onClick(participant.members.id)}
        >
          <span className="text-sm font-medium truncate">
            {formatName(participant.members.first_name, participant.members.last_name, isAdmin)}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
          {participant.members.licence && (
            <Badge variant="secondary" className="text-xs pointer-events-none">
              Licence: {participant.members.licence}
            </Badge>
          )}

          {participant.ranking && (
            <Badge variant="secondary" className="text-xs pointer-events-none">
              #{participant.ranking}
              {participant.nb_competitor && ` / ${participant.nb_competitor}`}
            </Badge>
          )}


          {showRemove && onRemoveParticipant && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveParticipant(participant.id);
              }}
              className={cn(
                "h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all",
                alwaysShowRemove
                  ? "opacity-100"
                  : "opacity-30 hover:opacity-100"
              )}
              title="Supprimer le participant"
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100 }}
            >
              <Trash2 className="w-5 h-5" style={{ pointerEvents: 'none' }} />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 relative z-[60]">
      {/* Compétiteurs par genre - Affichage en deux colonnes */}
      {competitors.length > 0 && (
        <div>
          <h5 className={`font-medium mb-3 text-primary flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
            <Trophy className="w-4 h-4" />
            Compétiteurs ({competitors.length})
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonne Filles */}
            <div>
              <h6 className="text-sm font-semibold text-pink-700 mb-2 flex items-center gap-1 border-b border-pink-200 pb-1">
                👩 Filles ({Object.values(groupedCompetitors.femmes).flat().length})
              </h6>
              {Object.keys(groupedCompetitors.femmes).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(groupedCompetitors.femmes).map(([category, categoryParticipants]) => (
                    <div key={`f-${category}`} className="border rounded-lg p-2 bg-pink-50">
                      <div className="text-xs font-medium text-pink-600 mb-1">{category} ({categoryParticipants.length})</div>
                      <div className="space-y-0">
                        {categoryParticipants.map(participant => (
                          <ParticipantCard
                            key={participant.id}
                            participant={participant}
                            showRemove={showRemoveButton}
                            alwaysShowRemove={alwaysShowRemoveButton}
                            onClick={onParticipantClick}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">Aucune fille inscrite</div>
              )}
            </div>

            {/* Colonne Garçons */}
            <div>
              <h6 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1 border-b border-blue-200 pb-1">
                👨 Garçons ({Object.values(groupedCompetitors.hommes).flat().length})
              </h6>
              {Object.keys(groupedCompetitors.hommes).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(groupedCompetitors.hommes).map(([category, categoryParticipants]) => (
                    <div key={`h-${category}`} className="border rounded-lg p-2 bg-blue-50">
                      <div className="text-xs font-medium text-blue-600 mb-1">{category} ({categoryParticipants.length})</div>
                      <div className="space-y-0">
                        {categoryParticipants.map(participant => (
                          <ParticipantCard
                            key={participant.id}
                            participant={participant}
                            showRemove={showRemoveButton}
                            alwaysShowRemove={alwaysShowRemoveButton}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">Aucun garçon inscrit</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Encadrement - Coaches et Arbitres en deux colonnes */}
      {(arbitres.length > 0 || coaches.length > 0) && (
        <div>
          <h5 className={`font-medium mb-3 text-green-700 flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
            <UserCheck className="w-4 h-4" />
            Encadrement ({arbitres.length + coaches.length})
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonne Coaches */}
            <div>
              <h6 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-1 border-b border-purple-200 pb-1">
                🏃‍♀️ Coaches ({coaches.length})
              </h6>
              {coaches.length > 0 ? (
                <div className="border rounded-lg bg-purple-50">
                  {coaches.map(participant => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      showRemove={showRemoveButton}
                      alwaysShowRemove={alwaysShowRemoveButton}
                      onClick={onParticipantClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">Aucun coach inscrit</div>
              )}
            </div>

            {/* Colonne Arbitres */}
            <div>
              <h6 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1 border-b border-blue-200 pb-1">
                ⚖️ Arbitres ({arbitres.length})
              </h6>
              {arbitres.length > 0 ? (
                <div className="border rounded-lg bg-blue-50">
                  {arbitres.map(participant => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      showRemove={showRemoveButton}
                      alwaysShowRemove={alwaysShowRemoveButton}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">Aucun arbitre inscrit</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Autre Encadrement */}
      {autreStaff.length > 0 && (
        <div>
          <h5 className={`font-medium mb-3 text-green-700 flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
            <UserCheck className="w-4 h-4" />
            Autre Encadrement ({autreStaff.length})
          </h5>

          <div className="border rounded-lg">
            {autreStaff.map(participant => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                showRemove={showRemoveButton}
                alwaysShowRemove={alwaysShowRemoveButton}
                onClick={onParticipantClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsDisplay;