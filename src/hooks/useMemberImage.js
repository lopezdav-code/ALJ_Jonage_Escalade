// Hook React pour gérer les images de membres avec fallback automatique
import { useState, useEffect } from 'react';
import { getMemberImageUrl, checkImageExists } from '@/lib/memberImageUtils';

export const useMemberImage = (photoFileName, fallbackUrl = null) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);

      if (!photoFileName) {
        setImageUrl(fallbackUrl);
        setIsLoading(false);
        return;
      }

      const constructedUrl = getMemberImageUrl(photoFileName, fallbackUrl);
      
      try {
        const exists = await checkImageExists(constructedUrl);
        if (exists) {
          setImageUrl(constructedUrl);
        } else {
          setImageUrl(fallbackUrl);
          setHasError(true);
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification de l\'image:', error);
        setImageUrl(fallbackUrl);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [photoFileName, fallbackUrl]);

  return { imageUrl, isLoading, hasError };
};