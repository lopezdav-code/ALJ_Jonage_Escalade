import { useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook custom pour rafraîchir les vues matérialisées
 * À utiliser quand les données sous-jacentes changent
 */
export const useRefreshMaterializedViews = () => {
  const { toast } = useToast();

  /**
   * Rafraîchir TOUTES les vues matérialisées
   * Utiliser après des modifications importantes
   */
  const refreshAllViews = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('refresh_all_materialized_views');

      if (error) {
        console.warn('Rafraîchissement des vues :', error);
        // Ne pas afficher d'erreur car c'est en arrière-plan
      }
    } catch (error) {
      console.error('Erreur rafraîchissement vues :', error);
    }
  }, []);

  /**
   * Rafraîchir une vue spécifique
   * Utiliser si vous ne modifiez qu'une partie des données
   */
  const refreshSpecificView = useCallback(async (viewName) => {
    const validViews = [
      'attendance_summary',
      'member_statistics',
      'pedagogy_sheet_usage'
    ];

    if (!validViews.includes(viewName)) {
      console.warn(`Vue non reconnue : ${viewName}`);
      return;
    }

    try {
      const { error } = await supabase.rpc('refresh_materialized_view', {
        view_name: viewName
      });

      if (error) {
        console.warn(`Rafraîchissement ${viewName} :`, error);
      }
    } catch (error) {
      console.error('Erreur rafraîchissement vue :', error);
    }
  }, []);

  return {
    refreshAllViews,
    refreshSpecificView
  };
};

/**
 * EXEMPLES D'UTILISATION
 */

// Dans un composant React :
/*
import { useRefreshMaterializedViews } from '@/hooks/useRefreshMaterializedViews';

export function MyComponent() {
  const { refreshAllViews, refreshSpecificView } = useRefreshMaterializedViews();

  // Option 1 : Rafraîchir après une modification de session
  const handleSessionUpdate = async (sessionData) => {
    // ... effectuer la mise à jour ...
    await supabase.from('sessions').update(sessionData).eq('id', sessionId);

    // Rafraîchir les vues affectées
    await refreshSpecificView('attendance_summary');
    await refreshSpecificView('member_statistics');
  };

  // Option 2 : Rafraîchir toutes les vues après une modification important
  const handleMemberUpdate = async (memberData) => {
    // ... effectuer la mise à jour ...
    await supabase.from('members').update(memberData).eq('id', memberId);

    // Rafraîchir tout (plus cher mais plus simple)
    await refreshAllViews();
  };

  // Option 3 : Rafraîchir automatiquement après 5 secondes
  const handlePedagogyChange = async (sheetData) => {
    await supabase.from('pedagogy_sheets').update(sheetData).eq('id', sheetId);

    // Attendre un peu puis rafraîchir
    setTimeout(() => refreshSpecificView('pedagogy_sheet_usage'), 5000);
  };
}
*/
