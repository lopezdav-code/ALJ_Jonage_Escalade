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

        // Données simplifiées et sécurisées pour éviter les erreurs 400
        const logData = {
          user_id: user.id,
          user_email: user.email || 'unknown',
          user_name: userName || user.email || 'unknown',
          action: action || 'login',
          ip_address: '127.0.0.1', // IP valide au lieu de "localhost"
          user_agent: navigator.userAgent ? navigator.userAgent.substring(0, 255) : 'unknown',
          session_id: `session_${Date.now()}`,
          log_type: 'connection'
        };

        // Timeout configuré pour l'insertion
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), PERFORMANCE_CONFIG.RATE_LIMITING.LOG_TIMEOUT)
        );
        
        const insertPromise = supabase
          .from('access_logs')
          .insert(logData);

        try {
          const { data, error } = await Promise.race([insertPromise, timeoutPromise]);
          
          if (error) {
            // Si l'erreur est liée à la table qui n'existe pas, on ignore silencieusement
            if (error.code === 'PGRST106' || error.message?.includes('access_logs')) {
              console.warn('Table access_logs non trouvée - logging désactivé');
              return;
            }
            throw error;
          }
          
          console.log(`Connexion loggée: ${logData.action} pour ${logData.user_name}`);
        } catch (error) {
          // Erreur réseau ou timeout - on ignore pour ne pas bloquer l'application
          if (error.message === 'Timeout' || error.name === 'NetworkError') {
            console.warn('Timeout ou erreur réseau lors du logging - ignoré');
            return;
          }
          
          console.error('Erreur lors du logging de la connexion:', error.message);
        }
      } catch (outerError) {
        console.error('Erreur générale dans logRequest:', outerError.message);
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