import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useFFMECompetitionScraper } from '@/hooks/useFFMECompetitionScraper';

const FFMECompetitionScraper = () => {
  const { toast } = useToast();
  const [startId, setStartId] = useState('13150');
  const [endId, setEndId] = useState('13160');
  const { loading, progress, results, scrapeCompetitions, reset } = useFFMECompetitionScraper();

  const handleScrape = async () => {
    await scrapeCompetitions(startId, endId);
  };

  const handleReset = () => {
    reset();
    setStartId('13150');
    setEndId('13160');
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Scraper Compétitions FFME
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Scannez les pages de résultats FFME (mycompet.ffme.fr) pour indexer les compétitions par ID.
          Le scraper s'arrête à la première page en erreur.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-id" className="text-sm">ID Début</Label>
            <Input
              id="start-id"
              type="number"
              value={startId}
              onChange={(e) => setStartId(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end-id" className="text-sm">ID Fin</Label>
            <Input
              id="end-id"
              type="number"
              value={endId}
              onChange={(e) => setEndId(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>
        </div>

        {progress && (
          <div className="bg-white p-3 rounded border border-blue-200">
            <p className="text-sm font-semibold">
              Progression: {progress.current}/{progress.total}
            </p>
            <p className="text-xs text-gray-600">
              En cours: resultat_{progress.currentId}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {results && (
          <div className={`p-3 rounded border ${
            results.completed ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {results.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              )}
              <p className="font-semibold">
                {results.completed ? 'Scraping Terminé' : 'Scraping Arrêté'}
              </p>
            </div>
            <div className="text-sm space-y-1">
              <p>✅ Sauvegardées: {results.success}</p>
              <p>❌ Erreurs: {results.errors}</p>
              {results.stoppedAt && (
                <>
                  <p>⛔ Arrêt à: ID {results.stoppedAt}</p>
                  <p className="text-xs text-gray-600">Raison: {results.reason}</p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleScrape}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping en cours...
              </>
            ) : (
              'Démarrer le scraping'
            )}
          </Button>
          {results && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              Réinitialiser
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500">
          💡 Conseil: Commencez avec un petit intervalle (ex: 13150-13160) pour tester.
          Les résultats sont stockés dans la table <code className="bg-white px-1 py-0.5 rounded">ffme_competitions_index</code>.
        </p>
      </CardContent>
    </Card>
  );
};

export default FFMECompetitionScraper;
