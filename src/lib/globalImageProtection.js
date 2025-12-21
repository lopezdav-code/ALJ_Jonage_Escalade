// Protection globale contre les boucles d'erreur d'images
// Ce script doit être chargé au début de l'application

const BROKEN_IMAGE_CACHE = new Set();
const ERROR_COUNTS = new Map();
const MAX_ERRORS_PER_URL = 1; // Réduit à 1 pour stopper immédiatement les boucles

// URLs problématiques à bloquer immédiatement
const BLOCKED_IMAGES_LIST = [
  'Thibault_N.png',
  'Clément_LIMA_FERREIRA.png',
  'Cl%C3%A9ment_LIMA_FERREIRA.png'
];

const BLOCKED_IMAGES = new Set(BLOCKED_IMAGES_LIST);
window.BLOCKED_IMAGES = BLOCKED_IMAGES;

// Fonction pour bloquer les requêtes d'images cassées
const blockBrokenImageRequests = () => {
  // Intercepter toutes les erreurs d'images
  document.addEventListener('error', (event) => {
    const target = event.target;

    if (target.tagName === 'IMG') {
      const imageUrl = target.src;
      if (!imageUrl) return;

      const imageName = imageUrl.split('/').pop();
      const blocked = window.BLOCKED_IMAGES || BLOCKED_IMAGES;

      // Blocage immédiat pour les images problématiques connues
      if (blocked.has(imageName) || imageUrl.includes('Thibault_N') || imageUrl.includes('Cl%C3%A9ment_LIMA_FERREIRA')) {
        BROKEN_IMAGE_CACHE.add(imageUrl);
        target.style.display = 'none';
        target.remove();
        console.warn(`🚫 Image bloquée immédiatement: ${imageName}`);
        return;
      }

      // Compter les erreurs pour cette URL
      const currentCount = ERROR_COUNTS.get(imageUrl) || 0;
      ERROR_COUNTS.set(imageUrl, currentCount + 1);

      // Si on a trop d'erreurs, bloquer cette image
      if (currentCount >= MAX_ERRORS_PER_URL) {
        BROKEN_IMAGE_CACHE.add(imageUrl);

        // Remplacer l'image par un placeholder transparent
        target.style.display = 'none';
        target.remove();

        console.warn(`Image bloquée après ${currentCount + 1} erreurs: ${imageUrl}`);
        return;
      }

      console.warn(`Erreur d'image (${currentCount + 1}/${MAX_ERRORS_PER_URL}): ${imageUrl}`);
    }
  }, true);

  // Intercepter les requêtes d'images avant qu'elles ne soient faites
  const originalImageConstructor = window.Image;
  window.Image = function (...args) {
    const img = new originalImageConstructor(...args);

    // Surcharger le setter src
    let originalSrc = '';
    Object.defineProperty(img, 'src', {
      get() {
        return originalSrc;
      },
      set(value) {
        if (!value) return;
        const imageName = value.split('/').pop();
        const blocked = window.BLOCKED_IMAGES || BLOCKED_IMAGES;

        // Vérifier si cette URL est dans la liste des images bloquées
        if (blocked.has(imageName) || value.includes('Thibault_N') || value.includes('Cl%C3%A9ment_LIMA_FERREIRA')) {
          console.warn(`🚫 Requête d'image bloquée (image interdite): ${imageName}`);
          return; // Ne pas faire la requête
        }

        // Vérifier si cette URL est dans le cache des images cassées
        if (BROKEN_IMAGE_CACHE.has(value)) {
          console.warn(`🚫 Requête d'image bloquée (cache): ${value}`);
          return; // Ne pas faire la requête
        }

        originalSrc = value;
        // Utiliser le vrai setter src
        const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
        if (descriptor && descriptor.set) {
          descriptor.set.call(this, value);
        } else {
          this.setAttribute('src', value);
        }
      },
      configurable: true
    });

    return img;
  };

  // Bloquer aussi les requêtes fetch pour les images
  const originalFetch = window.fetch;
  window.fetch = async function (url, options) {
    try {
      if (typeof url === 'string') {
        // Détecter si c'est une image
        const isImageUrl = url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') ||
          url.includes('.gif') || url.includes('.webp') || url.includes('.svg') ||
          url.includes('storage/v1/object');

        if (isImageUrl) {
          const imageName = url.split('/').pop();
          const blocked = window.BLOCKED_IMAGES || BLOCKED_IMAGES;

          if (blocked && blocked.has && blocked.has(imageName)) {
            console.warn(`🚫 Requête fetch bloquée pour image interdite: ${imageName}`);
            throw new Error('Image bloquée par la protection globale');
          }

          if (url.includes('Thibault_N') || url.includes('Cl%C3%A9ment_LIMA_FERREIRA')) {
            console.warn(`🚫 Requête fetch bloquée pour URL interdite: ${url}`);
            throw new Error('URL d\'image bloquée par la protection globale');
          }
        }
      }
    } catch (err) {
      if (err.message.includes('bloquée')) {
        return Promise.reject(err);
      }
      console.error('Erreur dans l\'intercepteur fetch d\'images:', err);
    }

    return originalFetch.call(this, url, options);
  };
};

// Initialiser la protection dès que possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', blockBrokenImageRequests);
} else {
  blockBrokenImageRequests();
}

// Exporter pour utilisation dans les hooks
window.BROKEN_IMAGE_CACHE = BROKEN_IMAGE_CACHE;
window.ERROR_COUNTS = ERROR_COUNTS;

export { blockBrokenImageRequests, BROKEN_IMAGE_CACHE, ERROR_COUNTS };