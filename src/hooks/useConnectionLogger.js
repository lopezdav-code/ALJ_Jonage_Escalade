import { supabase } from '@/lib/customSupabaseClient';

// Hook pour logger les connexions
export const useConnectionLogger = () => {
  
  // Logger une connexion
  const logConnection = async (user, action = 'login', profileData = null) => {
    if (!user) return;

    try {
      // Optimisation: utiliser les données du profil si déjà disponibles
      let userName = user.email;
      
      if (profileData?.members) {
        userName = `${profileData.members.first_name} ${profileData.members.last_name}`.trim();
      } else if (profileData?.member_id) {
        // Fallback: récupérer seulement si vraiment nécessaire
        try {
          const { data: memberData } = await supabase
            .from('members')
            .select('first_name, last_name')
            .eq('id', profileData.member_id)
            .single();
          
          if (memberData) {
            userName = `${memberData.first_name} ${memberData.last_name}`.trim();
          }
        } catch (error) {
          console.warn('Impossible de récupérer les infos du membre:', error);
        }
      }

      const userAgent = navigator.userAgent;

      const logData = {
        user_id: user.id,
        user_email: user.email,
        user_name: userName,
        action: action, // 'login' ou 'logout'
        ip_address: 'localhost', // Simplifié pour éviter les appels externes
        user_agent: userAgent,
        session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          browser: getBrowserInfo(userAgent),
          platform: navigator.platform,
          language: navigator.language
        },
        log_type: 'connection'
      };

      // Insérer dans la table access_logs - avec retry en cas d'échec
      const maxRetries = 2;
      let retries = 0;
      
      while (retries < maxRetries) {
        try {
          const { error } = await supabase
            .from('access_logs')
            .insert(logData);

          if (error) {
            throw error;
          }
          
          console.log(`Connexion loggée: ${logData.action} pour ${logData.user_name}`);
          break; // Succès, sortir de la boucle
          
        } catch (insertError) {
          retries++;
          if (retries >= maxRetries) {
            console.error('Erreur définitive lors du logging de la connexion:', insertError);
          } else {
            console.warn(`Échec logging (tentative ${retries}), retry...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s avant retry
          }
        }
      }
    } catch (error) {
      console.error('Erreur dans useConnectionLogger:', error);
    }
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