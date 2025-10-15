/**
 * Utilitaire pour gérer le stockage des photos de compétitions dans Supabase Storage
 * Bucket: competition_photos (public)
 *
 * Permissions par rôle :
 * - Tous : Voir les photos (public)
 * - Bureau+ : Uploader et modifier
 * - Admin : Supprimer
 */

import { supabase } from '@/lib/customSupabaseClient';

// Configuration
const BUCKET_NAME = 'competition_photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
 * Génère un nom de fichier unique et sécurisé pour une compétition
 * @param {string} competitionName - Nom de la compétition
 * @param {string} fileExtension - Extension du fichier (jpg, png, etc.)
 * @returns {string} Nom de fichier formaté
 */
export const generateCompetitionFileName = (competitionName, fileExtension) => {
  // Nettoyer le nom (enlever accents, espaces, caractères spéciaux)
  const cleanName = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-zA-Z0-9]/g, '_') // Remplacer caractères spéciaux par _
      .replace(/_+/g, '_') // Réduire multiples _ à un seul
      .toLowerCase()
      .substring(0, 50); // Limiter la longueur
  };

  const cleanCompName = cleanName(competitionName);
  const timestamp = Date.now();

  return `${cleanCompName}_${timestamp}.${fileExtension}`;
};

/**
 * Upload une photo de compétition dans Supabase Storage
 * @param {File} file - Le fichier image à uploader
 * @param {string} competitionName - Nom de la compétition
 * @returns {Promise<Object>} { success: boolean, url?: string, error?: string }
 */
export const uploadCompetitionPhoto = async (file, competitionName) => {
  try {
    console.log('uploadCompetitionPhoto appelé avec:', { fileName: file.name, competitionName });

    // Validation du fichier
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.error('Validation échouée:', validation.error);
      return { success: false, error: validation.error };
    }

    // Validation du nom de compétition
    if (!competitionName || competitionName.trim() === '') {
      return { success: false, error: 'Nom de compétition requis' };
    }

    // Génération du nom de fichier
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileName = generateCompetitionFileName(competitionName, fileExtension);
    console.log('Nom de fichier généré:', fileName);

    // Upload vers Supabase Storage
    console.log('Début upload vers Supabase Storage...');
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false // Ne pas écraser si existe déjà
      });

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError);
      return { success: false, error: `Erreur d'upload : ${uploadError.message}` };
    }

    console.log('Upload réussi, données:', data);

    // Récupérer l'URL publique du fichier
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('URL publique:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      filePath: fileName
    };

  } catch (error) {
    console.error('Erreur uploadCompetitionPhoto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Supprime une photo de compétition (réservé admin)
 * @param {string} photoUrl - URL de la photo à supprimer
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export const deleteCompetitionPhoto = async (photoUrl) => {
  try {
    if (!photoUrl) {
      return { success: false, error: 'Aucune URL fournie' };
    }

    // Extraire le nom de fichier depuis l'URL
    let fileName;
    if (photoUrl.includes(BUCKET_NAME)) {
      const parts = photoUrl.split(`/${BUCKET_NAME}/`);
      fileName = parts[1]?.split('?')[0] || photoUrl;
    } else {
      fileName = photoUrl;
    }

    console.log('Suppression du fichier:', fileName);

    // Supprimer depuis Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (deleteError) {
      console.error('Erreur suppression Supabase:', deleteError);
      return { success: false, error: `Erreur de suppression : ${deleteError.message}` };
    }

    return { success: true };

  } catch (error) {
    console.error('Erreur deleteCompetitionPhoto:', error);
    return { success: false, error: error.message };
  }
};

export default {
  validateImageFile,
  generateCompetitionFileName,
  uploadCompetitionPhoto,
  deleteCompetitionPhoto,
  BUCKET_NAME,
  MAX_FILE_SIZE,
  ALLOWED_TYPES
};
