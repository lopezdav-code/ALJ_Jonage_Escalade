import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from 'react-router-dom';

// Générer un ID de session unique
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Récupérer ou créer un ID de session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('app_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('app_session_id', sessionId);
  }
  return sessionId;
};

// Obtenir l'adresse IP du client (approximative via des services tiers)
const getClientIP = async () => {
  try {
    // Utiliser un service gratuit pour obtenir l'IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Impossible de récupérer l\'IP:', error);
    return null;
  }
};

// Hook pour le logging automatique
export const useAccessLogger = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const lastPageRef = useRef(null);
  const sessionIdRef = useRef(getSessionId());

  // Fonction pour enregistrer un log
  const logAccess = async (action, page = null, metadata = {}) => {
    if (!user) return;

    try {
      const sessionId = sessionIdRef.current;
      const userAgent = navigator.userAgent;
      const ipAddress = await getClientIP();

      const logData = {
        user_id: user.id,
        action,
        page,
        ip_address: ipAddress,
        user_agent: userAgent,
        session_id: sessionId,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          referrer: document.referrer || null,
          screen_resolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const { error } = await supabase
        .from('access_logs')
        .insert([logData]);

      if (error) {
        console.error('Erreur lors de l\'enregistrement du log:', error);
      }
    } catch (error) {
      console.error('Erreur lors du logging:', error);
    }
  };

  // Logger la connexion
  const logLogin = () => {
    logAccess('login', window.location.pathname, {
      login_method: 'supabase_auth'
    });
  };

  // Logger la déconnexion
  const logLogout = () => {
    logAccess('logout', window.location.pathname);
  };

  // Logger une visite de page
  const logPageView = (pagePath) => {
    logAccess('page_view', pagePath, {
      previous_page: lastPageRef.current
    });
    lastPageRef.current = pagePath;
  };

  // Logger une erreur
  const logError = (error, context = {}) => {
    logAccess('error', window.location.pathname, {
      error_message: error.message,
      error_stack: error.stack,
      context
    });
  };

  // Effet pour logger les changements de page
  useEffect(() => {
    if (isAuthenticated && user) {
      const currentPage = location.pathname + location.search;
      logPageView(currentPage);
    }
  }, [location, isAuthenticated, user]);

  // Effet pour logger les erreurs globales
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (isAuthenticated && user) {
        logError(event.error || new Error('Global error'), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
    };

    const handlePromiseRejection = (event) => {
      if (isAuthenticated && user) {
        logError(new Error('Unhandled promise rejection: ' + event.reason), {
          type: 'unhandled_promise_rejection'
        });
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, [isAuthenticated, user]);

  return {
    logLogin,
    logLogout,
    logPageView,
    logError,
    logAccess
  };
};

// Hook simplifié pour les composants qui veulent juste logger
export const usePageLogger = (pageName) => {
  const { logPageView } = useAccessLogger();
  const location = useLocation();

  useEffect(() => {
    if (pageName) {
      logPageView(pageName);
    }
  }, [pageName, location, logPageView]);
};

export default useAccessLogger;