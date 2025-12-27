/**
 * Utilitaire pour gérer le stockage des photos de compétitions dans Supabase Storage
 */

import { supabase, supabaseUrl } from '@/lib/customSupabaseClient';

// Configuration
const BUCKET_NAME = 'competition_photos';
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export const validateImageFile = (file) => {
  if (!file) return { valid: false, error: 'Aucun fichier fourni' };
  if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: `Type ${file.type} invalide` };
  return { valid: true };
};

export const generateCompetitionFileName = (competitionName, originalFileName, fileExtension) => {
  const clean = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase();
  return `${clean(competitionName).substring(0, 30)}_${clean(originalFileName.split('.')[0]).substring(0, 30)}_${Date.now()}.${fileExtension}`;
};

export const uploadCompetitionPhoto = async (file, competitionName) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Non authentifié');

    const fileName = generateCompetitionFileName(competitionName, file.name, file.name.split('.').pop().toLowerCase());
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${fileName}`;

    // On utilise XHR pour plus de robustesse sur les gros fichiers et éviter les interceptions fetch
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.timeout = 180000; // 3 min

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, url: fileName, filePath: fileName });
        } else {
          resolve({ success: false, error: `Erreur ${xhr.status}: ${xhr.responseText}` });
        }
      };

      const handleFail = (msg) => {
        resolve({ success: false, error: msg });
      };

      xhr.onerror = () => handleFail('Erreur réseau');
      xhr.ontimeout = () => handleFail('Délai d\'attente dépassé');
      xhr.onabort = () => handleFail('Upload annulé');

      // Un léger délai pour assurer une exécution non-bloquante
      setTimeout(() => {
        try {
          xhr.send(arrayBuffer);
        } catch (e) {
          handleFail(`Exception: ${e.message}`);
        }
      }, 10);
    });

  } catch (error) {
    console.error('Crash upload:', error);
    return { success: false, error: error.message };
  }
};

export const deleteCompetitionPhoto = async (photoUrl) => {
  try {
    const fileName = photoUrl.includes(BUCKET_NAME) ? photoUrl.split(`/${BUCKET_NAME}/`)[1]?.split('?')[0] : photoUrl;
    await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getCompetitionPhotoUrl = async (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data?.publicUrl || null;
};

export default { uploadCompetitionPhoto, deleteCompetitionPhoto, getCompetitionPhotoUrl, BUCKET_NAME };
