import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, MapPin, Euro, Eye } from 'lucide-react';

const MemberCompetitions = ({ competitionInscriptions }) => {
    const navigate = useNavigate();

    if (!competitionInscriptions || competitionInscriptions.length === 0) {
        return (
            <Card className="animate-in fade-in duration-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Inscriptions aux compétitions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-4">
                        Aucune inscription à une compétition
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Inscriptions aux compétitions ({competitionInscriptions.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {competitionInscriptions.map((inscription) => (
                        <div key={inscription.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{inscription.competitions.short_title || inscription.competitions.name}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                    {inscription.competitions.start_date && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(inscription.competitions.start_date).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    )}
                                    {inscription.competitions.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{inscription.competitions.location}</span>
                                        </div>
                                    )}
                                    {inscription.competitions.prix !== null && inscription.competitions.prix !== undefined && (
                                        <div className="flex items-center gap-1 font-medium">
                                            <Euro className="w-3 h-3" />
                                            <span>{inscription.competitions.prix} €</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/competitions/detail/${inscription.competitions.id}`)}
                                className="shrink-0"
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                Détails
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default MemberCompetitions;
