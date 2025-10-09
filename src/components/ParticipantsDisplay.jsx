import React from 'react';
import { Trophy, UserCheck, Users, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatName } from '@/lib/utils';

const ParticipantsDisplay = ({ 
  participants = [], 
  showRemoveButton = false, 
  onRemoveParticipant = null, 
  onParticipantClick = null,
  compact = false 
}) => {
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
  const staff = participants.filter(p => p.role !== 'Competiteur');

  // Grouper les compétiteurs par sexe et catégorie
  const groupCompetitorsByGenderAndCategory = (competitors) => {
    const grouped = {
      femmes: {},
      hommes: {}
    };

    competitors.forEach(competitor => {
      if (!competitor.members) return;
      
      const gender = competitor.members.sexe === 'Femme' ? 'femmes' : 'hommes';
      const category = competitor.members.category || 'Non définie';
      
      if (!grouped[gender][category]) {
        grouped[gender][category] = [];
      }
      grouped[gender][category].push(competitor);
    });

    return grouped;
  };

  const groupedCompetitors = groupCompetitorsByGenderAndCategory(competitors);

  const ParticipantCard = ({ participant, showRemove = false }) => {
    if (!participant.members) {
      return (
        <div className="flex items-center justify-between py-1 px-2 text-muted-foreground text-sm">
          <span>Membre non trouvé (ID: {participant.member_id})</span>
        </div>
      );
    }

    const handleClick = () => {
      if (onParticipantClick) {
        onParticipantClick(participant.members.id);
      }
    };

    return (
      <div className={`flex items-center justify-between ${compact ? 'py-1 px-2' : 'py-2 px-3'} hover:bg-muted/30 transition-colors group border-b border-muted/30 last:border-b-0`}>
        <div 
          className={`flex items-center gap-2 flex-1 ${onParticipantClick ? 'cursor-pointer' : ''}`}
          onClick={handleClick}
        >
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
            {participant.members.last_name?.toUpperCase()} {participant.members.first_name}
          </span>
          
          <div className="flex items-center gap-1">
            <Badge 
              variant="outline" 
              className={`${compact ? 'text-xs px-1 py-0' : 'text-xs px-2 py-1'} ${
                participant.members.sexe === 'Femme' 
                  ? 'bg-pink-100 text-pink-700 border-pink-200' 
                  : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}
            >
              {participant.members.category}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Classement */}
          {participant.ranking && (
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-orange-500" />
              <span className="text-sm font-bold text-orange-600">
                {participant.ranking}
              </span>
              {participant.nb_competitor && (
                <span className="text-xs text-muted-foreground">/{participant.nb_competitor}</span>
              )}
            </div>
          )}

          {/* Bouton de suppression */}
          {showRemove && onRemoveParticipant && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveParticipant(participant.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Compétiteurs par genre et catégorie */}
      {competitors.length > 0 && (
        <div>
          <h5 className={`font-medium mb-3 text-primary flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
            <Trophy className="w-4 h-4" />
            Compétiteurs ({competitors.length})
          </h5>
          
          <div className="space-y-3">
            {/* Femmes */}
            {Object.keys(groupedCompetitors.femmes).length > 0 && (
              <div className="border rounded-lg p-3">
                <h6 className="text-sm font-semibold text-pink-700 mb-2 flex items-center gap-1">
                  👩 Femmes
                </h6>
                <div className="space-y-2">
                  {Object.entries(groupedCompetitors.femmes).map(([category, categoryParticipants]) => (
                    <div key={`f-${category}`} className="border-l-2 border-pink-200 pl-2">
                      <div className="text-xs font-medium text-pink-600 mb-1">{category} ({categoryParticipants.length})</div>
                      <div className="space-y-0">
                        {categoryParticipants.map(participant => (
                          <ParticipantCard 
                            key={participant.id} 
                            participant={participant} 
                            showRemove={showRemoveButton}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hommes */}
            {Object.keys(groupedCompetitors.hommes).length > 0 && (
              <div className="border rounded-lg p-3">
                <h6 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
                  👨 Hommes
                </h6>
                <div className="space-y-2">
                  {Object.entries(groupedCompetitors.hommes).map(([category, categoryParticipants]) => (
                    <div key={`h-${category}`} className="border-l-2 border-blue-200 pl-2">
                      <div className="text-xs font-medium text-blue-600 mb-1">{category} ({categoryParticipants.length})</div>
                      <div className="space-y-0">
                        {categoryParticipants.map(participant => (
                          <ParticipantCard 
                            key={participant.id} 
                            participant={participant} 
                            showRemove={showRemoveButton}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff / Encadrement */}
      {staff.length > 0 && (
        <div>
          <h5 className={`font-medium mb-3 text-green-700 flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
            <UserCheck className="w-4 h-4" />
            Encadrement ({staff.length})
          </h5>
          
          <div className="border rounded-lg">
            {staff.map(participant => (
              <ParticipantCard 
                key={participant.id} 
                participant={participant} 
                showRemove={showRemoveButton}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsDisplay;