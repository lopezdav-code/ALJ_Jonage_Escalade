import { supabase } from '@/lib/customSupabaseClient';

// Obtenir l'adresse IP du client
const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Impossible de récupérer l\'IP:', error);
    return 'Unknown';
  }
};

// Hook pour logger les connexions
export const useConnectionLogger = () => {
  
  // Logger une connexion
  const logConnection = async (user, action = 'login') => {
    if (!user) return;

    try {
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;
      const timestamp = new Date().toISOString();

      // Récupérer les informations du profil utilisateur
      const { data: profileData } = await supabase
        .from('profiles')
        .select('member_id, members(first_name, last_name)')
        .eq('id', user.id)
        .single();

      const logData = {
        user_id: user.id,
        user_email: user.email,
        user_name: profileData?.members 
          ? `${profileData.members.first_name} ${profileData.members.last_name}`.trim()
          : user.email,
        action: action, // 'login' ou 'logout'
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: timestamp,
        session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          browser: getBrowserInfo(userAgent),
          platform: navigator.platform,
          language: navigator.language
        }
      };

      // Insérer dans la table access_logs avec type 'connection'
      const { error } = await supabase
        .from('access_logs')
        .insert({
          user_id: logData.user_id,
          user_email: logData.user_email,
          user_name: logData.user_name,
          action: logData.action,
          page: null, // Pas de page spécifique pour une connexion
          ip_address: logData.ip_address,
          user_agent: logData.user_agent,
          session_id: logData.session_id,
          metadata: logData.metadata,
          log_type: 'connection' // Nouveau champ pour différencier les types de logs
        });

      if (error) {
        console.error('Erreur lors du logging de la connexion:', error);
      } else {
        console.log(`Connexion loggée: ${logData.action} pour ${logData.user_name}`);
      }
    } catch (error) {
      console.error('Erreur dans useConnectionLogger:', error);
    }
  };

  // Logger une déconnexion
  const logDisconnection = async (user) => {
    await logConnection(user, 'logout');
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