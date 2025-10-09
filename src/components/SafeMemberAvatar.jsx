import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberImageUrl } from '@/lib/memberImageUtils';
import { useImageErrorHandler } from '@/hooks/useImageErrorHandler';

const SafeMemberAvatar = ({ 
  member, 
  size = "default", 
  showFallback = true,
  className = "",
  alt = null
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const { handleImageError, isImageBroken } = useImageErrorHandler();

  // Tailles prédéfinies
  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-16 h-16", 
    large: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const getImageUrl = () => {
    if (!member?.photo_url || hasImageError) {
      return null;
    }

    // Si c'est déjà une URL complète, la retourner
    if (member.photo_url.startsWith('http')) {
      return member.photo_url;
    }

    // Si c'est déjà un chemin relatif complet (commence par /), le retourner tel quel
    if (member.photo_url.startsWith('/')) {
      return member.photo_url;
    }

    // Sinon, construire l'URL avec encodage sécurisé
    return getMemberImageUrl(member.photo_url);
  };

  // Vérifier si l'image est déjà connue comme cassée
  const imageUrl = getImageUrl();
  const isKnownBroken = isImageBroken(imageUrl);

  const handleLocalImageError = () => {
    setHasImageError(true);
    if (imageUrl) {
      handleImageError(imageUrl);
    }
  };

  const displayName = alt || `${member?.first_name || ''} ${member?.last_name || ''}`.trim();

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {imageUrl && !hasImageError && !isKnownBroken && (
        <AvatarImage 
          src={imageUrl}
          alt={displayName}
          onError={handleLocalImageError}
          onLoad={() => setHasImageError(false)}
        />
      )}
      {showFallback && (
        <AvatarFallback className={size === 'small' ? 'text-xs' : size === 'large' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-sm'}>
          {getInitials(member?.first_name, member?.last_name)}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default SafeMemberAvatar;