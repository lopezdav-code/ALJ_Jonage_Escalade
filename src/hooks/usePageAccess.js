import { useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useLocation } from 'react-router-dom';

/**
 * Hook personnalisé pour vérifier l'accès à une page basé sur la configuration dynamique
 * @param {string} pagePath - Le chemin de la page (optionnel, utilise location.pathname par défaut)
 * @returns {Object} { hasAccess: boolean, loading: boolean, userRole: string }
 */
export const usePageAccess = (pagePath = null) => {
  const { userRole: contextUserRole, loading: authLoading } = useAuth();
  const { config, loadingConfig } = useConfig();
  const location = useLocation();

  const currentPath = pagePath || location.pathname;

  const result = useMemo(() => {
    // Si on est en train de charger, retourner loading = true
    if (authLoading || loadingConfig) {
      return { hasAccess: false, loading: true, userRole: null };
    }

    // Use the computed userRole from auth context
    const userRole = contextUserRole || 'public';

    // Récupérer la configuration des pages depuis la config
    let navConfig = [];

    if (config.nav_config) {
      try {
        navConfig = JSON.parse(config.nav_config);
      } catch (e) {
        console.error('Failed to parse nav_config:', e);
        // En cas d'erreur, utiliser la configuration par défaut
        navConfig = getDefaultNavConfig();
      }
    } else {
      // Pas de configuration sauvegardée, utiliser les valeurs par défaut
      navConfig = getDefaultNavConfig();
    }

    // Trouver la configuration pour la page actuelle
    // On cherche la page qui correspond le mieux au chemin actuel
    let pageConfig = findPageConfig(currentPath, navConfig);

    // Force secure defaults for critical admin pages
    // Even if the database config is wrong, these pages must be admin-only
    const criticalAdminPages = {
      '/site-settings': ['admin'],
      '/admin-dashboard': ['admin'],
      '/database-management': ['admin'],
      '/admin-management': ['admin'],
      '/image-admin': ['admin'],
      '/user-roles': ['admin'],
      '/permissions': ['admin'],
      '/access-logs': ['admin'],
      '/database-schema': ['admin'],
      '/bureau-management': ['bureau', 'admin'],
      '/attendance-recap': ['bureau', 'encadrant', 'admin'],
      '/comments-summary': ['bureau', 'encadrant', 'admin'],
      '/passeport-validation': ['encadrant', 'admin']
    };

    // Override with critical page config if applicable
    if (criticalAdminPages[currentPath]) {
      pageConfig = {
        to: currentPath,
        roles: criticalAdminPages[currentPath]
      };
    }

    // Vérifier si le rôle de l'utilisateur a accès à cette page
    const hasAccess = pageConfig ? pageConfig.roles.includes(userRole) : false;

    return {
      hasAccess,
      loading: false,
      userRole,
      allowedRoles: pageConfig?.roles || []
    };
  }, [authLoading, loadingConfig, contextUserRole, currentPath, config.nav_config]);

  return result;
};

/**
 * Trouve la configuration de page qui correspond au chemin donné
 * @param {string} path - Le chemin à vérifier
 * @param {Array} navConfig - La configuration du menu
 * @returns {Object|null} La configuration de la page ou null
 */
const findPageConfig = (path, navConfig) => {
  // Chercher une correspondance exacte d'abord
  let match = navConfig.find(page => page.to === path);

  if (match) return match;

  // Si pas de correspondance exacte, chercher une correspondance partielle
  // Par exemple, /competitions/detail/123 correspond à /competitions
  const pathSegments = path.split('/').filter(Boolean);

  for (let i = pathSegments.length; i > 0; i--) {
    const partialPath = '/' + pathSegments.slice(0, i).join('/');
    match = navConfig.find(page => page.to === partialPath);
    if (match) return match;
  }

  // Si toujours pas de correspondance, utiliser les valeurs par défaut
  return getDefaultPageConfig(path);
};

/**
 * Retourne la configuration par défaut pour une page
 * @param {string} path - Le chemin de la page
 * @returns {Object} Configuration par défaut
 */
const getDefaultPageConfig = (path) => {
  // Pages publiques par défaut
  const publicPages = ['/news', '/schedule', '/inscriptions', '/contact', '/agenda', '/'];

  if (publicPages.some(p => path.startsWith(p))) {
    return { to: path, roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] };
  }

  // Pages réservées aux encadrants
  const encadrantPages = ['/passeport-validation', '/attendance-recap', '/comments-summary'];

  if (encadrantPages.some(p => path.startsWith(p))) {
    return { to: path, roles: ['bureau', 'encadrant', 'admin'] };
  }

  // Par défaut, réservé aux adhérents et plus
  return { to: path, roles: ['adherent', 'bureau', 'encadrant', 'admin'] };
};

/**
 * Retourne la configuration par défaut du menu
 * @returns {Array} Configuration par défaut
 */
const getDefaultNavConfig = () => {
  return [
    // Pages publiques
    { to: '/news', text: 'Actualités', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/schedule', text: 'Planning', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/inscriptions', text: 'Inscription', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/contact', text: 'Contact', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/agenda', text: 'Agenda', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },

    // Pages pour adhérents et plus
    { to: '/volunteers', text: 'Adhérent', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/competitions', text: 'Compétitions', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/session-log', text: 'Séances', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/cycles', text: 'Cycles', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/pedagogy', text: 'Pédagogie', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/passeport-viewer', text: 'Passeports - Visualisation', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/passeport-guide', text: 'Passeports - Guide', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/annual-summary', text: 'Récapitulatif Annuel', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },

    // Pages réservées aux encadrants et admins
    { to: '/attendance-recap', text: 'Récapitulatif Présence', roles: ['bureau', 'encadrant', 'admin'] },
    { to: '/comments-summary', text: 'Récapitulatif Commentaires', roles: ['bureau', 'encadrant', 'admin'] },
    { to: '/passeport-validation', text: 'Validation Passeports', roles: ['encadrant', 'admin'] },

    // Pages réservées aux ADMINS uniquement
    { to: '/site-settings', text: 'Réglages du site', roles: ['admin'] },
    { to: '/admin-management', text: 'Gestion des Accès', roles: ['admin'] },
    { to: '/user-roles', text: 'Gestion des Rôles', roles: ['admin'] },
    { to: '/permissions', text: 'Gestion des Permissions', roles: ['admin'] },
    { to: '/access-logs', text: 'Logs d\'accès', roles: ['admin'] },
    { to: '/database-schema', text: 'Schéma de la Base de Données', roles: ['admin'] },
    { to: '/image-admin', text: 'Gestion des Images', roles: ['admin'] },

    // Pages Bureau et Admin
    { to: '/bureau-management', text: 'Gestion du Bureau', roles: ['bureau', 'admin'] },
  ];
};

export default usePageAccess;
