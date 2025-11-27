import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Calendar, MapPin, Eye } from 'lucide-react';

const MemberAwards = ({ competitionResults }) => {
    const navigate = useNavigate();

    if (!competitionResults || competitionResults.length === 0) {
        return (
            <Card className="animate-in fade-in duration-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Palmarès
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-4">
                        Aucun résultat de compétition enregistré
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
                    Palmarès
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {competitionResults.map((result) => (
                        <div key={result.id} className="flex items-start justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Medal className={`w-4 h-4 ${result.ranking === 1 ? 'text-yellow-500' : result.ranking === 2 ? 'text-gray-400' : result.ranking === 3 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                                    <span className="font-semibold text-lg">
                                        {result.ranking}{result.ranking === 1 ? 'er' : 'e'}
                                        {result.nb_competitor && <span className="text-sm text-muted-foreground ml-1">/ {result.nb_competitor}</span>}
                                    </span>
                                </div>
                                <p className="font-medium">{result.competitions.name}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                    {result.competitions.start_date && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(result.competitions.start_date).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    )}
                                    {result.competitions.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{result.competitions.location}</span>
                                        </div>
                                    )}
                                    {result.competitions.disciplines && result.competitions.disciplines.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Discipline:</span>
                                            <span>{result.competitions.disciplines.join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                                {(result.competitions.nature || result.competitions.niveau) && (
                                    <div className="flex gap-2 mt-2">
                                        {result.competitions.nature && (
                                            <Badge variant="secondary" className="text-xs">
                                                {result.competitions.nature}
                                            </Badge>
                                        )}
                                        {result.competitions.niveau && (
                                            <Badge variant="outline" className="text-xs">
                                                {result.competitions.niveau}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/competitions/detail/${result.competitions.id}`)}
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default MemberAwards;
