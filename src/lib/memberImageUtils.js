// Utilitaire pour gérer les images de membres avec fallbacks et encodage correct

// Fonction pour nettoyer et normaliser les URLs d'images
const cleanImageUrl = (photoFileName) => {
  if (!photoFileName) return null;
  
  // Décoder l'URL si elle est déjà encodée
  let cleanedUrl = photoFileName;
  try {
    // Décoder récursivement jusqu'à obtenir une URL propre
    while (cleanedUrl !== decodeURIComponent(cleanedUrl)) {
      cleanedUrl = decodeURIComponent(cleanedUrl);
    }
  } catch (error) {
    // En cas d'erreur de décodage, utiliser l'URL originale
    cleanedUrl = photoFileName;
  }
  
  return cleanedUrl;
};

export const getMemberImageUrl = (photoFileName, fallbackUrl = null) => {
  if (!photoFileName) {
    return fallbackUrl;
  }

  try {
    // Nettoyer l'URL d'abord
    const cleanedFileName = cleanImageUrl(photoFileName);
    
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (cleanedFileName.startsWith('http')) {
      return cleanedFileName;
    }

    // Si le chemin commence déjà par /assets/members/, le retourner tel quel
    if (cleanedFileName.startsWith('/assets/members/')) {
      return cleanedFileName;
    }

    // Si c'est juste un nom de fichier, construire le chemin complet
    const encodedFileName = encodeURIComponent(cleanedFileName);
    return `/assets/members/${encodedFileName}`;
  } catch (error) {
    console.warn('Erreur lors de la construction de l\'URL d\'image:', error);
    return fallbackUrl;
  }
};

// Fonction pour vérifier si une image existe (avec cache pour éviter les requêtes répétées)
const imageCheckCache = new Map();
const pendingChecks = new Map();

export const checkImageExists = async (imageUrl) => {
  if (!imageUrl) return false;
  
  // Vérifier le cache
  if (imageCheckCache.has(imageUrl)) {
    return imageCheckCache.get(imageUrl);
  }

  // Vérifier si une vérification est déjà en cours
  if (pendingChecks.has(imageUrl)) {
    return pendingChecks.get(imageUrl);
  }

  // Créer une nouvelle promesse de vérification
  const checkPromise = new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      imageCheckCache.set(imageUrl, true);
      pendingChecks.delete(imageUrl);
      resolve(true);
    };
    
    img.onerror = () => {
      imageCheckCache.set(imageUrl, false);
      pendingChecks.delete(imageUrl);
      resolve(false);
    };
    
    // Timeout après 5 secondes
    setTimeout(() => {
      imageCheckCache.set(imageUrl, false);
      pendingChecks.delete(imageUrl);
      resolve(false);
    }, 5000);
    
    img.src = imageUrl;
  });

  pendingChecks.set(imageUrl, checkPromise);
  return checkPromise;
};

// Fonction utilitaire pour nettoyer le cache
export const clearImageCache = () => {
  imageCheckCache.clear();
  pendingChecks.clear();
};