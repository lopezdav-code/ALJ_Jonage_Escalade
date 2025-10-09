import { supabase } from '@/lib/customSupabaseClient';
import { PERFORMANCE_CONFIG, performanceUtils } from '@/config/performance';

// Variables globales pour limiter les requêtes
let activeLogRequests = 0;
const { MAX_CONCURRENT_LOGS } = PERFORMANCE_CONFIG.RATE_LIMITING;
const logQueue = [];

// Fonction pour traiter la queue des logs
const processLogQueue = async () => {
  while (logQueue.length > 0 && activeLogRequests < MAX_CONCURRENT_LOGS) {
    const logRequest = logQueue.shift();
    activeLogRequests++;
    
    try {
      await logRequest();
    } catch (error) {
      console.error('Erreur dans la queue de logs:', error);
    } finally {
      activeLogRequests--;
      // Traiter le prochain élément si il y en a
      if (logQueue.length > 0) {
        setTimeout(processLogQueue, 100);
      }
    }
  }
};

// Hook pour logger les connexions
export const useConnectionLogger = () => {
  
  // Logger une connexion
  const logConnection = async (user, action = 'login', profileData = null) => {
    if (!user) return;

    // Si trop de requêtes actives, ajouter à la queue
    if (activeLogRequests >= MAX_CONCURRENT_LOGS) {
      logQueue.push(() => logConnection(user, action, profileData));
      return;
    }

    const logRequest = async () => {
      try {
        // Optimisation: utiliser les données du profil si déjà disponibles
        let userName = user.email;
        
        if (profileData?.members) {
          userName = `${profileData.members.first_name} ${profileData.members.last_name}`.trim();
        }

        // Données simplifiées pour réduire la charge
        const logData = {
          user_id: user.id,
          user_email: user.email,
          user_name: userName,
          action: action,
          ip_address: 'localhost',
          user_agent: navigator.userAgent.substring(0, 255), // Limiter la taille
          session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // Plus court
          metadata: {
            browser: getBrowserInfo(navigator.userAgent),
            platform: navigator.platform
          },
          log_type: 'connection'
        };

        // Timeout configuré pour l'insertion
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), PERFORMANCE_CONFIG.RATE_LIMITING.LOG_TIMEOUT)
        );
        
        const insertPromise = supabase
          .from('access_logs')
          .insert(logData);

        await Promise.race([insertPromise, timeoutPromise]);
        
        console.log(`Connexion loggée: ${logData.action} pour ${logData.user_name}`);
        
      } catch (error) {
        console.error('Erreur lors du logging de la connexion:', error.message);
      }
    };

    // Ajouter à la queue et traiter
    logQueue.push(logRequest);
    processLogQueue();
  };

  // Logger une déconnexion
  const logDisconnection = async (user, profileData = null) => {
    await logConnection(user, 'logout', profileData);
  };

  return {
    logConnection,
    logDisconnection
  };
};

// Fonction utilitaire pour extraire les infos du navigateur
const getBrowserInfo = (userAgent) => {
  const browsers = {
    'Chrome': /Chrome\/[\d.]+/,
    'Firefox': /Firefox\/[\d.]+/,
    'Safari': /Safari\/[\d.]+/,
    'Edge': /Edge\/[\d.]+/,
    'Opera': /Opera\/[\d.]+/
  };

  for (const [name, regex] of Object.entries(browsers)) {
    if (regex.test(userAgent)) {
      const match = userAgent.match(regex);
      return match ? match[0] : name;
    }
  }
  return 'Unknown Browser';
};

export default useConnectionLogger;