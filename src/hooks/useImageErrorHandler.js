import { useState, useEffect } from 'react';

// Cache global pour éviter les requêtes répétées d'images manquantes
const brokenImageCache = new Set();
const imageStatusCache = new Map();
const errorCounts = new Map(); // Compter les erreurs pour éviter les boucles

export const useImageErrorHandler = () => {
  const [errors, setErrors] = useState(new Set());

  const handleImageError = (imageUrl) => {
    if (!imageUrl) return;

    // Compter les erreurs pour cette URL
    const currentCount = errorCounts.get(imageUrl) || 0;
    errorCounts.set(imageUrl, currentCount + 1);

    // Si on a déjà plus de 3 erreurs pour cette URL, l'ignorer complètement
    if (currentCount >= 3) {
      return;
    }

    if (!brokenImageCache.has(imageUrl)) {
      brokenImageCache.add(imageUrl);
      console.warn(`Image manquante mise en cache (tentative ${currentCount + 1}): ${imageUrl}`);
      
      setErrors(prev => new Set([...prev, imageUrl]));
    }
  };

  const isImageBroken = (imageUrl) => {
    return brokenImageCache.has(imageUrl);
  };

  const clearCache = () => {
    brokenImageCache.clear();
    imageStatusCache.clear();
    errorCounts.clear();
    setErrors(new Set());
  };

  return {
    handleImageError,
    isImageBroken,
    clearCache,
    brokenImages: Array.from(errors)
  };
};

// Hook pour surveiller les erreurs d'images et les reporter
export const useImageErrorReporting = () => {
  const [reportedErrors, setReportedErrors] = useState([]);

  useEffect(() => {
    const handleError = (event) => {
      if (event.target.tagName === 'IMG') {
        const imageUrl = event.target.src;
        if (imageUrl.includes('/assets/members/')) {
          setReportedErrors(prev => {
            if (!prev.some(err => err.url === imageUrl)) {
              const newError = {
                url: imageUrl,
                timestamp: new Date().toISOString(),
                alt: event.target.alt || 'Image sans alt'
              };
              console.warn('Image de membre manquante:', newError);
              return [...prev, newError];
            }
            return prev;
          });
        }
      }
    };

    // Écouter les erreurs d'images au niveau du document
    document.addEventListener('error', handleError, true);

    return () => {
      document.removeEventListener('error', handleError, true);
    };
  }, []);

  return { reportedErrors };
};