/**
 * Hook custom pour le scraping de compétitions FFME
 */

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook pour scraper les compétitions FFME
 * @returns {Object} État et fonctions de contrôle du scraper
 */
export const useFFMECompetitionScraper = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);

  /**
   * Scraper une plage de compétitions FFME
   * @param {number} startId - ID de début
   * @param {number} endId - ID de fin
   * @param {Function} onProgress - Callback de progression optionnel
   */
  const scrapeCompetitions = async (startId, endId, onProgress = null) => {
    const start = parseInt(startId, 10);
    const end = parseInt(endId, 10);

    if (isNaN(start) || isNaN(end)) {
      toast({
        title: 'Erreur',
        description: 'Les IDs doivent être des nombres valides',
        variant: 'destructive'
      });
      return;
    }

    if (start > end) {
      toast({
        title: 'Erreur',
        description: 'L\'ID de début doit être inférieur à celui de fin',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: end - start + 1 });
    setResults(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let ffmeId = start; ffmeId <= end; ffmeId++) {
        const progressData = { 
          current: ffmeId - start + 1, 
          total: end - start + 1,
          currentId: ffmeId 
        };
        
        setProgress(progressData);
        
        if (onProgress) {
          onProgress(progressData);
        }

        try {
          // Use Supabase Edge Function to avoid CORS issues
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          
          if (!supabaseUrl) {
            throw new Error('VITE_SUPABASE_URL not configured');
          }
          
          const edgeFunctionUrl = `${supabaseUrl}/functions/v1/scrape-ffme-competition?id=${ffmeId}`;
          
          // Get the JWT token from Supabase Auth session
          const { data: { session } } = await supabase.auth.getSession();
          const authHeaders = {
            'Content-Type': 'application/json'
          };
          
          if (session?.access_token) {
            authHeaders['Authorization'] = `Bearer ${session.access_token}`;
          }
          
          const response = await fetch(edgeFunctionUrl, {
            headers: authHeaders
          });
          const data = await response.json();

          if (!response.ok) {
            const errorMsg = data.error || `HTTP ${response.status}`;
            console.warn(`⚠️ Erreur ID ${ffmeId}: ${errorMsg}`);
            
            // Stop scraping if we get a 404 (page not found)
            if (response.status === 404) {
              console.log(`🛑 Arrêt du scraping: Page 404 trouvée à l'ID ${ffmeId}`);
              setResults({
                success: successCount,
                errors: errorCount + 1,
                completed: true,
                stoppedAt: ffmeId,
                reason: 'HTTP 404 Not Found - scraping stopped'
              });
              break;
            }
            
            errorCount++;
            // Continue to next ID for other HTTP errors
            await new Promise(resolve => setTimeout(resolve, 800));
            continue;
          }

          if (!data.success || !data.title) {
            console.warn(`⚠️ Erreur ID ${ffmeId}: No title found (invalid page)`);
            errorCount++;
            // Continue to next ID instead of breaking
            await new Promise(resolve => setTimeout(resolve, 800));
            continue;
          }

          // Save to database
          const { error } = await supabase
            .from('ffme_competitions_index')
            .upsert(
              {
                ffme_id: data.ffme_id,
                title: data.title,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'ffme_id' }
            );

          if (error) {
            console.error(`❌ Database error for ID ${ffmeId}: ${error.message}`);
            errorCount++;
          } else {
            console.log(`✅ ID ${ffmeId}: ${data.title}`);
            successCount++;
          }

          // Respectful delay between requests
          await new Promise(resolve => setTimeout(resolve, 800));

        } catch (error) {
          console.error(`❌ Error processing ID ${ffmeId}:`, error.message);
          errorCount++;
          // Continue to next ID instead of breaking
          await new Promise(resolve => setTimeout(resolve, 800));
          continue;
        }
      }

      // All completed - set final results
      setResults({
        success: successCount,
        errors: errorCount,
        completed: true
      });

      if (successCount > 0) {
        toast({
          title: 'Succès',
          description: `${successCount} compétition${successCount > 1 ? 's' : ''} sauvegardée${successCount > 1 ? 's' : ''}`
        });
      }

      if (errorCount > 0) {
        toast({
          title: 'Avertissement',
          description: `${errorCount} erreur${errorCount > 1 ? 's' : ''} rencontrée${errorCount > 1 ? 's' : ''}, mais le scraping a continué`,
          variant: 'default'
        });
      }

    } catch (error) {
      console.error('💥 Scraping error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du scraping: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const reset = () => {
    setLoading(false);
    setProgress(null);
    setResults(null);
  };

  return {
    loading,
    progress,
    results,
    scrapeCompetitions,
    reset
  };
};
