import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const ClubCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      setCompetitions(data);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les compétitions.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Compétitions du Club</h1>
      
      {competitions.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Aucune compétition pour le moment.</p>
      ) : (
        competitions.map((comp) => (
          <Card key={comp.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 p-4">
              {comp.image_url && <img src={comp.image_url} alt={comp.name} className="w-24 h-24 object-cover rounded-md" />}
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">{comp.name}</CardTitle>
                <p className="text-md text-muted-foreground">
                  {new Date(comp.start_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p><strong>Lieu :</strong> {comp.location}</p>
              {comp.details_description && <p className="mt-2 text-sm text-muted-foreground">{comp.details_description}</p>}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ClubCompetitions;
