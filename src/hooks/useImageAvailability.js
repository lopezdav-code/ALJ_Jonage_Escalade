import { useState, useEffect } from 'react';

const useImageAvailability = (photoUrl) => {
  const [isImageAvailable, setIsImageAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkedUrls] = useState(new Map()); // Cache pour éviter les vérifications répétées

  useEffect(() => {
    if (!photoUrl) {
      setIsImageAvailable(false);
      setIsChecking(false);
      return;
    }

    // Vérifier le cache
    if (checkedUrls.has(photoUrl)) {
      setIsImageAvailable(checkedUrls.get(photoUrl));
      setIsChecking(false);
      return;
    }

    const checkImageAvailability = async () => {
      setIsChecking(true);

      try {
        // Pour les URLs complètes (Supabase ou externes), faire une requête HEAD
        if (photoUrl.startsWith('http')) {
          try {
            const response = await fetch(photoUrl, { 
              method: 'HEAD',
              mode: 'no-cors' // Éviter les problèmes CORS
            });
            const isAvailable = response.ok || response.type === 'opaque';
            checkedUrls.set(photoUrl, isAvailable);
            setIsImageAvailable(isAvailable);
          } catch (error) {
            // Si la requête HEAD échoue, essayer de charger l'image directement
            const img = new Image();
            img.onload = () => {
              checkedUrls.set(photoUrl, true);
              setIsImageAvailable(true);
            };
            img.onerror = () => {
              checkedUrls.set(photoUrl, false);
              setIsImageAvailable(false);
            };
            img.src = photoUrl;
            // Timeout pour éviter d'attendre indéfiniment
            setTimeout(() => {
              if (!checkedUrls.has(photoUrl)) {
                checkedUrls.set(photoUrl, false);
                setIsImageAvailable(false);
                setIsChecking(false);
              }
            }, 5000);
            return;
          }
        } else {
          // Pour les chemins relatifs, supposer qu'ils sont disponibles
          // (l'erreur sera gérée par onError de l'image)
          checkedUrls.set(photoUrl, true);
          setIsImageAvailable(true);
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification de l\'image:', error);
        checkedUrls.set(photoUrl, false);
        setIsImageAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkImageAvailability();
  }, [photoUrl, checkedUrls]);

  return { isImageAvailable, isChecking };
};

export default useImageAvailability;