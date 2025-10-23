/**
 * Utilitaire pour gérer le stockage des images de news dans Supabase Storage
 * Bucket: exercise_images (public)
 *
 * Les images sont stockées dans les dossiers :
 * - news/ : Images principales des actualités
 * - news_gallery/{id}/ : Galerie de photos pour chaque actualité
 *
 * Permissions :
 * - Le bucket est public, les URLs sont directes.
 */

import { supabase } from '@/lib/customSupabaseClient';

// Configuration
const BUCKET_NAME = 'news';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];
const SIGNED_URL_EXPIRY = 3600; // 1 heure en secondes

/**
 * Valide un fichier image avant upload
 * @param {File} file - Le fichier à valider
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non supporté. Formats acceptés : JPEG, JPG, PNG, WebP`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Taille max : ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  return { valid: true };
};

/**
 * Valide un fichier document avant upload
 * @param {File} file - Le fichier à valider
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateDocumentFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non supporté. Formats acceptés : PDF, Word, Excel, TXT`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Taille max : ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  return { valid: true };
};

/**
 * Upload une image principale pour une actualité
 * @param {File} file - Le fichier image à uploader
 * @returns {Promise<Object>} { success: boolean, path?: string, error?: string }
 */
export const uploadNewsImage = async (file) => {
  try {
    // Validation du fichier
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Génération du nom de fichier
    const fileExt = file.name.split('.').pop();
    const fileName = `news/${Date.now()}.${fileExt}`;

    // Upload vers Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError);
      return { success: false, error: `Erreur d'upload : ${uploadError.message}` };
    }

    return {
      success: true,
      path: fileName
    };

  } catch (error) {
    console.error('Erreur uploadNewsImage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload un document pour une actualité
 * @param {File} file - Le fichier document à uploader
 * @returns {Promise<Object>} { success: boolean, path?: string, error?: string }
 */
export const uploadNewsDocument = async (file) => {
  try {
    // Validation du fichier
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Génération du nom de fichier
    const fileExt = file.name.split('.').pop();
    const fileName = `news/documents/${Date.now()}.${fileExt}`;

    // Upload vers Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError);
      return { success: false, error: `Erreur d'upload : ${uploadError.message}` };
    }

    return {
      success: true,
      path: fileName
    };

  } catch (error) {
    console.error('Erreur uploadNewsDocument:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload une image pour la galerie d'une actualité
 * @param {File} file - Le fichier image à uploader
 * @param {string} newsId - ID de l'actualité
 * @returns {Promise<Object>} { success: boolean, path?: string, error?: string }
 */
export const uploadNewsGalleryImage = async (file, newsId) => {
  try {
    // Validation du fichier
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (!newsId) {
      return { success: false, error: "ID de l'actualité requis" };
    }

    // Génération du nom de fichier
    const fileExt = file.name.split('.').pop();
    const fileName = `news_gallery/${newsId}/${Date.now()}-${Math.random()}.${fileExt}`;

    // Upload vers Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError);
      return { success: false, error: `Erreur d'upload : ${uploadError.message}` };
    }

    return {
      success: true,
      path: fileName
    };

  } catch (error) {
    console.error('Erreur uploadNewsGalleryImage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Génère une URL publique pour une image.
 * @param {string} path - Chemin du fichier dans le bucket
 * @returns {string|null} URL publique ou null en cas d'erreur
 */
export const getSignedUrl = (path) => {
  try {
    if (!path) return null;

    // Si c'est déjà une URL complète, la retourner directement
    if (path.startsWith('http')) {
      return path;
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error('Erreur getPublicUrl:', error);
    return null;
  }
};

/**
 * Génère des URLs publiques pour un tableau de chemins
 * @param {string[]} paths - Tableau de chemins de fichiers
 * @returns {string[]} Tableau d'URLs publiques
 */
export const getSignedUrls = (paths) => {
  if (!paths || !Array.isArray(paths)) return [];

  try {
    return paths.map(path => getSignedUrl(path)).filter(url => url !== null);
  } catch (error) {
    console.error('Erreur getSignedUrls:', error);
    return [];
  }
};

/**
 * Convertit une URL publique en chemin de fichier
 * @param {string} url - URL publique ou chemin
 * @returns {string} Chemin du fichier
 */
export const extractFilePath = (url) => {
  if (!url) return '';

  // Si c'est déjà juste un chemin (sans URL complète)
  if (!url.includes('http')) return url;

  // Extraire le chemin depuis l'URL
  if (url.includes('/storage/v1/object/')) {
    const parts = url.split(`/${BUCKET_NAME}/`);
    return parts[1]?.split('?')[0] || url;
  }

  return url;
};

/**
 * Supprime une image de news
 * @param {string} pathOrUrl - Chemin ou URL de l'image à supprimer
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export const deleteNewsImage = async (pathOrUrl) => {
  try {
    if (!pathOrUrl) {
      return { success: false, error: 'Aucun chemin fourni' };
    }

    const filePath = extractFilePath(pathOrUrl);

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
    console.error('Erreur deleteNewsImage:', error);
    return { success: false, error: error.message };
  }
};

export default {
  validateImageFile,
  validateDocumentFile,
  uploadNewsImage,
  uploadNewsDocument,
  uploadNewsGalleryImage,
  getSignedUrl,
  getSignedUrls,
  extractFilePath,
  deleteNewsImage,
  BUCKET_NAME,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  SIGNED_URL_EXPIRY
};
