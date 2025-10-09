// Protection globale contre les boucles d'erreur d'images
// Ce script doit être chargé au début de l'application

const BROKEN_IMAGE_CACHE = new Set();
const ERROR_COUNTS = new Map();
const MAX_ERRORS_PER_URL = 3;

// Fonction pour bloquer les requêtes d'images cassées
const blockBrokenImageRequests = () => {
  // Intercepter toutes les erreurs d'images
  document.addEventListener('error', (event) => {
    const target = event.target;
    
    if (target.tagName === 'IMG') {
      const imageUrl = target.src;
      
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
  window.Image = function(...args) {
    const img = new originalImageConstructor(...args);
    
    // Surcharger le setter src
    let originalSrc = '';
    Object.defineProperty(img, 'src', {
      get() {
        return originalSrc;
      },
      set(value) {
        // Vérifier si cette URL est dans le cache des images cassées
        if (BROKEN_IMAGE_CACHE.has(value)) {
          console.warn(`Requête d'image bloquée (cache): ${value}`);
          return; // Ne pas faire la requête
        }
        
        originalSrc = value;
        // Utiliser le vrai setter src
        Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set.call(this, value);
      }
    });
    
    return img;
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