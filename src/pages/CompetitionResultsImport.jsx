import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useConfig } from '@/contexts/ConfigContext';
import { supabase } from '@/lib/customSupabaseClient';
import { formatName } from '@/lib/utils';

const CompetitionResultsImport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { config } = useConfig();

  const [url, setUrl] = useState('https://mycompet.ffme.fr/resultat/resultat_13156');
  const [clubName, setClubName] = useState(config?.clubName || config?.club_name || 'AMICALE LAIQUE DE JONAGE');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [missingCompetitors, setMissingCompetitors] = useState([]);

  // Charger les participants et la compétition au chargement
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger la compétition pour obtenir l'ID FFME
        const { data: compData, error: compError } = await supabase
          .from('competitions')
          .select('ffme_results_id')
          .eq('id', id)
          .single();

        if (compError) throw compError;

        // Pré-remplir l'URL si l'ID FFME existe
        if (compData?.ffme_results_id) {
          setUrl(`https://mycompet.ffme.fr/resultat/resultat_${compData.ffme_results_id}`);
        }

        // Charger les participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('competition_participants')
          .select(`
            id,
            member_id,
            members (
              id,
              first_name,
              last_name,
              category,
              sexe
            )
          `)
          .eq('competition_id', id)
          .eq('role', 'Competiteur');

        if (participantsError) throw participantsError;
        setParticipants(participantsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Helper function to normalize text (remove accents)
  function normalizeText(text) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // Helper function to decode HTML entities
  function decodeHtml(html) {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  // Helper to strip tags
  function stripTags(html) {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  function parseIdentite(identite) {
    const words = identite.split(/\s+/).filter(word => word.length > 0);
    const nom = [];
    const prenom = [];

    for (const word of words) {
      if (word === word.toUpperCase() && word !== word.toLowerCase()) {
        nom.push(word);
      } else {
        prenom.push(word);
      }
    }

    return { nom: nom.join(' '), prenom: prenom.join(' ') };
  }

  function parseHtml(html, clubNameToMatch) {
    const results = [];
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(html)) !== null) {
      const tableContent = tableMatch[0];
      const theadRegex = /<thead[^>]*>([\s\S]*?)<\/thead>/i;
      const theadMatch = theadRegex.exec(tableContent);
      if (!theadMatch) continue;
      const theadContent = theadMatch[1];

      const headerRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const headerRows = [];
      let headerRowMatch;
      while ((headerRowMatch = headerRowRegex.exec(theadContent)) !== null) {
        headerRows.push(headerRowMatch[1]);
      }
      if (headerRows.length === 0) continue;

      const lastHeaderRow = headerRows[headerRows.length - 1];
      const headerCellRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      const headers = [];
      let rangIndex = -1;
      let identiteIndex = -1;
      let cellIndex = 0;
      let headerCellMatch;

      while ((headerCellMatch = headerCellRegex.exec(lastHeaderRow)) !== null) {
        const cellContent = headerCellMatch[1];
        const headerText = decodeHtml(stripTags(cellContent)).toLowerCase();
        headers.push(headerText);
        if (headerText === 'rang') rangIndex = cellIndex;
        if (headerText === 'identité' || headerText === 'identite') identiteIndex = cellIndex;
        cellIndex++;
      }

      if (rangIndex !== -1 && identiteIndex !== -1) {
        const tbodyRegex = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i;
        const tbodyMatch = tbodyRegex.exec(tableContent);
        if (!tbodyMatch) continue;
        const tbodyContent = tbodyMatch[1];

        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        const allRowMatches = [];
        let rowMatch;
        while ((rowMatch = rowRegex.exec(tbodyContent)) !== null) {
          allRowMatches.push(rowMatch[1]);
        }

        const tableRowCount = allRowMatches.length;

        for (const rowContent of allRowMatches) {
          const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
          const cells = [];
          let cellMatch;
          while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
            const cellContent = cellMatch[1];
            cells.push(decodeHtml(stripTags(cellContent)));
          }

          if (cells.length <= Math.max(rangIndex, identiteIndex)) continue;

          const identiteText = cells[identiteIndex];
          if (identiteText && identiteText.toUpperCase().includes((clubNameToMatch || '').toUpperCase())) {
            const rangText = cells[rangIndex];
            const cleanedIdentite = identiteText.replace(new RegExp(clubNameToMatch, 'gi'), '').trim();
            const { nom, prenom } = parseIdentite(cleanedIdentite);
            results.push({ rang: rangText, nom, prenom, nb_competitor: tableRowCount });
          }
        }
      }
    }

    // Unique
    const uniqueResults = [];
    const seen = new Set();
    for (const r of results) {
      const key = `${r.nom}|${r.prenom}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(r);
      }
    }
    return uniqueResults;
  }

  const handleImport = async () => {
    if (!url) return toast({ title: 'Erreur', description: 'URL manquante', variant: 'destructive' });
    setLoading(true);
    setResults([]);
    setMissingCompetitors([]);
    try {
      // Use Supabase Edge Function to fetch HTML (no CORS issues)
      const { data: json, error: functionError } = await supabase.functions.invoke('fetch-html', {
        method: 'POST',
        body: { url }
      });

      if (functionError) throw functionError;
      if (!json || !json.data) throw new Error('Pas de données HTML reçues');

      const text = json.data;
      const parsed = parseHtml(text, clubName || '');
      setResults(parsed);

      // Compare with participants to find missing ones
      if (parsed.length > 0 && participants.length > 0) {
        const missing = participants.filter(p => {
          if (!p.members) return true;
          const pFirst = normalizeText(p.members.first_name || '');
          const pLast = normalizeText(p.members.last_name || '');

          return !parsed.some(r => {
            const rFirst = normalizeText(r.prenom || '');
            const rLast = normalizeText(r.nom || '');
            return pFirst === rFirst && pLast === rLast;
          });
        });
        setMissingCompetitors(missing);
      }

      if (parsed.length === 0) {
        toast({ title: 'Aucun résultat trouvé', description: 'Aucun résultat correspondant au club fourni.', variant: 'default' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur', description: String(err.message || err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillEditor = () => {
    if (!results || results.length === 0) return;
    // Save parsed results in sessionStorage for editor to pick up
    try {
      sessionStorage.setItem(`imported_results_${id}`, JSON.stringify(results));
      navigate(`/competitions/results/${id}`);
    } catch (err) {
      console.error('Error saving imported results to sessionStorage', err);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder les résultats pour préremplissage.', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to={`/competitions/results/${id}`} variant="outline">Retour résultats</BackButton>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Importer résultats FFME</h1>
          <p className="text-muted-foreground">Récupère et filtre les résultats pour le club, affiche rang, prénom, nom.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres d'import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>URL du résultat (FFME)</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div>
              <Label>Nom du club (filtre)</Label>
              <Input value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Nom du club à chercher dans la colonne identité" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => navigate(`/competitions/results/${id}`)}>Annuler</Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Importer
              </Button>
              <Button onClick={handlePrefillEditor} disabled={results.length === 0}>
                Préremplir dans l'éditeur
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résultats importés ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun résultat importé pour le moment.</p>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Nombre de participants trouvés: {results.length}</p>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="text-sm text-muted-foreground">
                      <th className="px-3 py-2 text-left">Rang</th>
                      <th className="px-3 py-2 text-left">Prénom</th>
                      <th className="px-3 py-2 text-left">Nom</th>
                      <th className="px-3 py-2 text-left">Nb compétiteurs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr key={idx} className="odd:bg-muted/10">
                        <td className="px-3 py-2 align-top">{r.rang}</td>
                        <td className="px-3 py-2 align-top">{r.prenom}</td>
                        <td className="px-3 py-2 align-top">{r.nom}</td>
                        <td className="px-3 py-2 align-top">{r.nb_competitor ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {missingCompetitors.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-5 h-5" />
              Compétiteurs sans résultat ({missingCompetitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800 mb-3">Les compétiteurs suivants ne sont pas présents dans les résultats importés :</p>
            <div className="space-y-2">
              {missingCompetitors.map(p => (
                <div key={p.id} className="p-2 bg-white border border-amber-200 rounded text-sm">
                  <p className="font-medium">{formatName(p.members?.first_name, p.members?.last_name)}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.members?.category || 'Catégorie inconnue'} • {p.members?.sexe === 'F' ? 'Fille' : p.members?.sexe === 'H' ? 'Garçon' : 'Sexe inconnu'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompetitionResultsImport;
