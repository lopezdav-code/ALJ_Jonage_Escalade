/**
 * Service pour appeler les webhooks n8n
 */

import { N8N_CONFIG } from '@/config/n8n';
import { supabase } from '@/lib/customSupabaseClient';

// URL par défaut du webhook n8n (peut être surchargée par la configuration)
const DEFAULT_N8N_URL = N8N_CONFIG.webhookUrl;
const DEFAULT_INSTAGRAM_URL = N8N_CONFIG.instagramWebhookUrl;

/**
 * Envoie une demande de génération d'affiche à n8n
 * @param {Object} payload - Les données à envoyer
 * @param {string} payload.posterType - Type d'affiche ('solo' ou 'grouped')
 * @param {string} payload.competitionName - Nom de la compétition
 * @param {string} payload.competitionDate - Date courte de la compétition
 * @param {Array} payload.athletes - Liste des athlètes sélectionnés
 * @param {string} payload.photoUrl - URL de la photo de la compétition
 * @param {string} [n8nUrl] - URL personnalisée du webhook n8n
 * @returns {Promise<Object>} Réponse du serveur n8n
 */
export const generatePosterViaAI = async (payload, n8nUrl = DEFAULT_N8N_URL) => {
  try {
    const requestBody = {
      posterType: payload.posterType,
      competitionName: payload.competitionName,
      competitionDate: payload.competitionDate,
      athletes: payload.athletes.map(athlete => ({
        name: athlete.name,
        rank: athlete.rank || null,
        category: athlete.category || null
      })),
      photoUrl: payload.photoUrl,
      competitionCity: payload.competitionCity || null,
      competitionType: payload.competitionType || null, // Now expects 'disciplines' or other type from payload
      competitionLevel: payload.competitionLevel || null, // Added to payload
      competitionNature: payload.competitionNature || null // Added to payload
    };

    // Si on appelle n8n.cloud directement depuis le navigateur, on risque un problème CORS
    // On utilise alors notre fonction Edge Supabase comme proxy
    const isDirectN8nCall = n8nUrl.includes('n8n.cloud') || n8nUrl.includes('n8n.app');
    const useProxy = isDirectN8nCall && !n8nUrl.includes('/functions/v1/proxy-n8n');

    if (useProxy) {
      console.log('Using Supabase proxy for n8n call targeting:', n8nUrl);

      // Utiliser le client Supabase pour l'invocation (gère l'authentification automatiquement)
      const { data, error: functionError } = await supabase.functions.invoke('proxy-n8n', {
        body: requestBody,
        headers: {
          'x-target-url': n8nUrl
        }
      });

      if (functionError) {
        console.error('Erreur lors de l\'invocation de la fonction proxy:', functionError);
        throw new Error(`Erreur proxy n8n: ${functionError.message}`);
      }

      return data;
    }

    // Appel direct si pas de proxy (ex: n8n auto-hébergé avec CORS configuré)
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur n8n: ${response.status} - ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'appel à n8n:', error);
    throw error;
  }
};

/**
 * Récupère l'URL du webhook n8n depuis les paramètres de site (si configurés)
 * @returns {Promise<string>} URL du webhook n8n
 */
export const getN8nWebhookUrl = async () => {
  try {
    // Rechercher une URL de proxy personnalisée dans la table site_config
    const { data, error } = await supabase
      .from('site_config')
      .select('config_value')
      .eq('config_key', 'n8n_proxy_url')
      .limit(1)
      .single();

    if (!error && data && data.config_value) {
      return data.config_value;
    }

    // Sinon retourner la valeur par défaut
    return DEFAULT_N8N_URL;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL n8n:', error);
    return DEFAULT_N8N_URL;
  }
};

/**
 * Valide le payload avant l'envoi à n8n
 * @param {Object} payload - Le payload à valider
 * @returns {Object} Objet {valid: boolean, errors: Array<string>}
 */
export const validatePosterPayload = (payload) => {
  const errors = [];

  if (!payload.posterType || !['solo', 'grouped'].includes(payload.posterType)) {
    errors.push('Type d\'affiche invalide');
  }

  if (!payload.competitionName || payload.competitionName.trim() === '') {
    errors.push('Nom de la compétition requis');
  }

  if (!payload.competitionDate || payload.competitionDate.trim() === '') {
    errors.push('Date de la compétition requise');
  }

  if (!Array.isArray(payload.athletes) || payload.athletes.length === 0) {
    errors.push('Au moins un athlète doit être sélectionné');
  }

  if (payload.posterType === 'solo' && payload.athletes.length > 1) {
    errors.push('Une affiche solo doit avoir exactement un athlète');
  }

  if (payload.posterType === 'grouped' && payload.athletes.length < 2) {
    errors.push('Une affiche groupée doit avoir au moins 2 athlètes');
  }

  if (!payload.photoUrl || payload.photoUrl.trim() === '') {
    errors.push('Une photo de la compétition est requise');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Publie une image sur Instagram via n8n
 * @param {Object} payload - Les données de publication
 * @param {string} payload.imageUrl - URL de l'image à publier
 * @param {string} payload.caption - Légende de la photo
 * @param {string} payload.account - Compte Instagram cible
 * @param {string} [webhookUrl] - URL personnalisée du webhook
 * @returns {Promise<Object>} Réponse du serveur n8n
 */
export const publishToInstagram = async (payload, webhookUrl = DEFAULT_INSTAGRAM_URL) => {
  try {
    const isDirectCall = webhookUrl.includes('n8n.cloud') || webhookUrl.includes('n8n.app');
    const useProxy = isDirectCall;

    if (useProxy) {
      const { data, error: functionError } = await supabase.functions.invoke('proxy-n8n', {
        body: payload,
        headers: {
          'x-target-url': webhookUrl
        }
      });

      if (functionError) throw new Error(`Erreur proxy Instagram: ${functionError.message}`);
      return data;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Instagram: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la publication Instagram:', error);
    throw error;
  }
};

export default {
  generatePosterViaAI,
  publishToInstagram,
  getN8nWebhookUrl,
  validatePosterPayload
};
