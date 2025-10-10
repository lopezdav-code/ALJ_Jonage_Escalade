import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, User as UserIcon, FileText, Loader2 } from 'lucide-react';
import { formatName } from '@/lib/utils';

const PasseportHistory = ({ memberId }) => {
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberId) {
      fetchValidations();
    }
  }, [memberId]);

  const fetchValidations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('passeport_validations')
        .select('*')
        .eq('member_id', memberId)
        .order('date_validation', { ascending: false });

      if (error) throw error;
      setValidations(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPasseportColor = (type) => {
    const colors = {
      blanc: 'bg-white border-2 border-gray-400 text-gray-800',
      jaune: 'bg-yellow-400 text-gray-900',
      orange: 'bg-orange-500 text-white',
      rouge: 'bg-red-500 text-white',
    };
    return colors[type.toLowerCase()] || 'bg-gray-400 text-white';
  };

  const getPasseportIcon = (type) => {
    const icons = {
      blanc: '⚪',
      jaune: '🟡',
      orange: '🟠',
      rouge: '🔴',
    };
    return icons[type.toLowerCase()] || '⚪';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (validations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucun passeport validé pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Award className="w-5 h-5" />
        Historique des passeports
      </h3>
      
      {validations.map((validation) => {
        const competencesCount = validation.competences 
          ? Object.values(validation.competences).filter(v => v === true).length 
          : 0;
        const totalCompetences = validation.competences 
          ? Object.keys(validation.competences).length 
          : 0;

        return (
          <Card key={validation.id} className="overflow-hidden">
            <CardHeader className={`${getPasseportColor(validation.passeport_type)} py-3`}>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">{getPasseportIcon(validation.passeport_type)}</span>
                <span>Passeport {validation.passeport_type.charAt(0).toUpperCase() + validation.passeport_type.slice(1)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date de validation</p>
                    <p className="font-medium">
                      {new Date(validation.date_validation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Validateur</p>
                    <p className="font-medium">{validation.validateur}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Compétences validées</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(competencesCount / totalCompetences) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">
                      {competencesCount}/{totalCompetences}
                    </span>
                  </div>
                </div>
              </div>

              {validation.observations && (
                <div className="flex items-start gap-2 pt-2 border-t">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Observations</p>
                    <p className="text-sm">{validation.observations}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PasseportHistory;
