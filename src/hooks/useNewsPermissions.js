import { useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useConfig } from '@/contexts/ConfigContext';

/**
 * Hook personnalisé pour gérer les permissions liées aux actualités (news)
 *
 * Retourne un objet avec les permissions disponibles pour l'utilisateur actuel :
 * - canCreate: peut créer des news
 * - canEdit: peut éditer des news
 * - canDelete: peut supprimer des news
 * - canArchive: peut archiver des news
 * - canViewUnpublished: peut voir les news non publiées (en cours de rédaction)
 */
export const useNewsPermissions = () => {
  const { profile, isAdmin, isBureau, loading: authLoading } = useAuth();
  const { config, loadingConfig } = useConfig();

  const permissions = useMemo(() => {
    // Admin a tous les droits par défaut
    if (isAdmin) {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canArchive: true,
        canViewUnpublished: true,
      };
    }

    // Si la config n'est pas encore chargée, retourner des permissions vides
    if (loadingConfig || !config.permissions_config) {
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canArchive: false,
        canViewUnpublished: false,
      };
    }

    try {
      const permissionsConfig = JSON.parse(config.permissions_config);
      const userRole = profile?.role || 'member';
      const rolePermissions = permissionsConfig[userRole] || {};

      // Permissions de base (create, edit)
      const newsPermissions = rolePermissions.news || [];
      const canCreate = newsPermissions.includes('create');
      const canEdit = newsPermissions.includes('edit');

      // Permissions avancées (delete, archive, view_unpublished)
      const advancedPermissions = rolePermissions.news_advanced || [];
      const canDelete = advancedPermissions.includes('delete');
      const canArchive = advancedPermissions.includes('archive');
      const canViewUnpublished = advancedPermissions.includes('view_unpublished');

      return {
        canCreate,
        canEdit,
        canDelete,
        canArchive,
        canViewUnpublished,
      };
    } catch (error) {
      console.error('Error parsing permissions config:', error);
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canArchive: false,
        canViewUnpublished: false,
      };
    }
  }, [profile, isAdmin, isBureau, config.permissions_config, loadingConfig]);

  return {
    ...permissions,
    loading: authLoading || loadingConfig,
  };
};
