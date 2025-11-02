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
  const { profile, loading: authLoading, user } = useAuth();
  const { config, loadingConfig } = useConfig();
  const location = useLocation();

  const currentPath = pagePath || location.pathname;

  const result = useMemo(() => {
    // Si on est en train de charger, retourner loading = true
    if (authLoading || loadingConfig) {
      return { hasAccess: false, loading: true, userRole: null };
    }

    // Déterminer le rôle de l'utilisateur
    let userRole = 'public'; // Par défaut, utilisateur non connecté = public

    if (user && profile) {
      userRole = profile.role || 'user'; // Utiliser le rôle du profil ou 'user' par défaut
    } else if (user) {
      userRole = 'user'; // Connecté mais pas de profil = user
    }

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
    const pageConfig = findPageConfig(currentPath, navConfig);

    // Vérifier si le rôle de l'utilisateur a accès à cette page
    const hasAccess = pageConfig ? pageConfig.roles.includes(userRole) : false;

    // Debugging pour diagnostiquer les problèmes d'accès
    if (currentPath === '/attendance-recap' || currentPath.startsWith('/attendance-recap')) {
      console.log('[usePageAccess] Diagnostic for /attendance-recap:', {
        userRole,
        profile: profile ? { role: profile.role } : 'no profile',
        user: user ? user.email : 'no user',
        pageConfig,
        allowedRoles: pageConfig?.roles,
        hasAccess,
      });
    }

    return {
      hasAccess,
      loading: false,
      userRole,
      allowedRoles: pageConfig?.roles || []
    };
  }, [authLoading, loadingConfig, user, profile, currentPath, config.nav_config]);

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
  const encadrantPages = ['/passeport-validation', '/attendance-recap'];

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
    { to: '/news', text: 'Actualités', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/schedule', text: 'Planning', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/inscriptions', text: 'Inscription', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/contact', text: 'Contact', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/volunteers', text: 'Adhérent', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/competitions', text: 'Compétitions', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/agenda', text: 'Agenda', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/session-log', text: 'Séances', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/cycles', text: 'Cycles', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/passeport-validation', text: 'Validation Passeports', roles: ['encadrant', 'admin'] },
  ];
};

export default usePageAccess;
