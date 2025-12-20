/**
 * Configuration pour les services externes (n8n, etc.)
 */

// URL du webhook n8n pour la génération d'affiche
// À configurer dans les variables d'environnement ou site settings de Supabase
export const N8N_CONFIG = {
  // URL par défaut du webhook
  webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://lopez-dav.app.n8n.cloud/webhook/81ca48c4-0a51-466e-878d-d38f5225a339',
  instagramWebhookUrl: import.meta.env.VITE_INSTAGRAM_WEBHOOK_URL || 'https://lopez-dav.app.n8n.cloud/webhook/f4b16c1a-7b3b-4c4b-8b9a-7b3b4c4b8b9a', // Placeholder URL

  // Timeout pour les requêtes (en millisecondes)
  timeout: 30000,

  // Retry configuration
  maxRetries: 1,
  retryDelay: 1000
};

/**
 * Récupère la configuration n8n (peut être étendu pour récupérer depuis Supabase)
 */
export const getN8nConfig = async () => {
  return N8N_CONFIG;
};

export default {
  N8N_CONFIG,
  getN8nConfig
};
