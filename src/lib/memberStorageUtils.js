/**
 * Utilitaire pour gérer le stockage des photos membres dans Supabase Storage
 * Bucket: members_photos (privé avec RLS)
 * 
 * Permissions par rôle :
 * - Adhérent+ : Voir les photos
 * - Bureau+ : Uploader et modifier
 * - Admin : Supprimer
 */

import { supabase } from '@/config/supabaseClient';

// Configuration
const BUCKET_NAME = 'members_photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Valide un fichier image avant upload
 * @param {File} file - Le fichier à valider
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Type de fichier non supporté. Formats acceptés : ${ALLOWED_TYPES.join(', ')}` 
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Fichier trop volumineux. Taille max : ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    };
  }

  return { valid: true };
};

/**
 * Génère un nom de fichier unique et sécurisé
 * @param {string} firstName - Prénom du membre
 * @param {string} lastName - Nom du membre
 * @param {string} fileExtension - Extension du fichier (jpg, png, etc.)
 * @returns {string} Nom de fichier formaté
 */
export const generateMemberFileName = (firstName, lastName, fileExtension) => {
  // Nettoyer les noms (enlever accents, espaces, caractères spéciaux)
  const cleanName = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-zA-Z0-9]/g, '_') // Remplacer caractères spéciaux par _
      .replace(/_+/g, '_') // Réduire multiples _ à un seul
      .toLowerCase();
  };

  const cleanFirstName = cleanName(firstName);
  const cleanLastName = cleanName(lastName);
  const timestamp = Date.now();
  
  return `${cleanLastName}_${cleanFirstName}_${timestamp}.${fileExtension}`;
};

/**
 * Upload une photo de membre dans Supabase Storage
 * @param {File} file - Le fichier image à uploader
 * @param {Object} member - Les données du membre { first_name, last_name }
 * @returns {Promise<Object>} { success: boolean, url?: string, error?: string }
 */
export const uploadMemberPhoto = async (file, member) => {
  try {
    // Validation du fichier
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Validation des données membre
    if (!member?.first_name || !member?.last_name) {
      return { success: false, error: 'Informations membre incomplètes' };
    }

    // Génération du nom de fichier
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileName = generateMemberFileName(member.first_name, member.last_name, fileExtension);
    const filePath = `members_photos/${fileName}`;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Ne pas écraser si existe déjà
      });

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError);
      return { success: false, error: `Erreur d'upload : ${uploadError.message}` };
    }

    // Récupération de l'URL publique (signée automatiquement par RLS)
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { 
      success: true, 
      url: data.publicUrl,
      filePath 
    };

  } catch (error) {
    console.error('Erreur uploadMemberPhoto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Supprime une photo de membre (réservé admin)
 * @param {string} photoUrl - URL ou chemin de la photo à supprimer
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export const deleteMemberPhoto = async (photoUrl) => {
  try {
    if (!photoUrl) {
      return { success: false, error: 'Aucune URL fournie' };
    }

    // Extraire le chemin du fichier depuis l'URL
    let filePath;
    if (photoUrl.includes(BUCKET_NAME)) {
      // Extraire le chemin après le bucket
      const parts = photoUrl.split(`/${BUCKET_NAME}/`);
      filePath = parts[1] || photoUrl;
    } else {
      filePath = photoUrl;
    }

    // Supprimer depuis Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (deleteError) {
      console.error('Erreur suppression Supabase:', deleteError);
      return { success: false, error: `Erreur de suppression : ${deleteError.message}` };
    }

    return { success: true };

  } catch (error) {
    console.error('Erreur deleteMemberPhoto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Récupère l'URL d'une photo membre depuis Supabase Storage
 * @param {string} photoPath - Chemin ou URL de la photo
 * @returns {string|null} URL publique ou null si invalide
 */
export const getMemberPhotoUrl = (photoPath) => {
  try {
    if (!photoPath) return null;

    // Si c'est déjà une URL complète Supabase, la retourner
    if (photoPath.startsWith('http') && photoPath.includes(BUCKET_NAME)) {
      return photoPath;
    }

    // Si c'est un chemin local (/assets/members/), retourner null
    // (photos locales ne sont plus supportées)
    if (photoPath.startsWith('/assets/')) {
      console.warn('Chemin local détecté (non supporté):', photoPath);
      return null;
    }

    // Construire l'URL depuis Supabase
    const cleanPath = photoPath.replace(/^\/+/, ''); // Enlever "/" initial
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(cleanPath);

    return data.publicUrl;

  } catch (error) {
    console.error('Erreur getMemberPhotoUrl:', error);
    return null;
  }
};

/**
 * Vérifie si une photo existe dans Supabase Storage
 * @param {string} photoPath - Chemin de la photo
 * @returns {Promise<boolean>} true si la photo existe
 */
export const memberPhotoExists = async (photoPath) => {
  try {
    if (!photoPath) return false;

    const cleanPath = photoPath.replace(/^\/+/, '');
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('members_photos', {
        search: cleanPath
      });

    if (error) return false;
    return data && data.length > 0;

  } catch (error) {
    console.error('Erreur memberPhotoExists:', error);
    return false;
  }
};

/**
 * Liste toutes les photos du bucket (admin uniquement)
 * @returns {Promise<Array>} Liste des fichiers
 */
export const listAllMemberPhotos = async () => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('members_photos', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Erreur listAllMemberPhotos:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('Erreur listAllMemberPhotos:', error);
    return [];
  }
};

export default {
  validateImageFile,
  generateMemberFileName,
  uploadMemberPhoto,
  deleteMemberPhoto,
  getMemberPhotoUrl,
  memberPhotoExists,
  listAllMemberPhotos,
  BUCKET_NAME,
  MAX_FILE_SIZE,
  ALLOWED_TYPES
};
