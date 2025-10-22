import { useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useConfig } from '@/contexts/ConfigContext';

/**
 * Hook personnalisé pour gérer les permissions liées à la visualisation des membres
 *
 * Retourne un objet avec les permissions disponibles pour l'utilisateur actuel :
 * - canViewDetail: peut voir le détail complet d'un membre
 */
export const useMemberViewPermissions = () => {
  const { profile, isAdmin, isBureau, loading: authLoading } = useAuth();
  const { config, loadingConfig } = useConfig();

  const permissions = useMemo(() => {
    // Admin et Bureau ont tous les droits par défaut
    if (isAdmin || isBureau) {
      return {
        canViewDetail: true,
      };
    }

    // Si la config n'est pas encore chargée, retourner des permissions vides
    if (loadingConfig || !config.permissions_config) {
      return {
        canViewDetail: false,
      };
    }

    try {
      const permissionsConfig = JSON.parse(config.permissions_config);
      const userRole = profile?.role || 'member';
      const rolePermissions = permissionsConfig[userRole] || {};

      // Permission de visualisation des détails membres
      const memberPermissions = rolePermissions.member_detail || [];
      const canViewDetail = memberPermissions.includes('view');

      return {
        canViewDetail,
      };
    } catch (error) {
      console.error('Error parsing permissions config:', error);
      return {
        canViewDetail: false,
      };
    }
  }, [profile, isAdmin, isBureau, config.permissions_config, loadingConfig]);

  return {
    ...permissions,
    loading: authLoading || loadingConfig,
  };
};
