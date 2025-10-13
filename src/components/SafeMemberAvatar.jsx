import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getMemberPhotoUrl } from '@/lib/memberStorageUtils';

const SafeMemberAvatar = ({
  member,
  size = "default",
  showFallback = true,
  className = "",
  alt = null
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [hasError, setHasError] = useState(false);

  // Extraire les valeurs primitives pour éviter les re-rendus
  const memberId = member?.id;
  const photoUrl = member?.photo_url;

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

  useEffect(() => {
    if (!photoUrl) {
      setImageUrl(null);
      return;
    }

    let cancelled = false;

    getMemberPhotoUrl(photoUrl).then(url => {
      if (!cancelled && url) {
        setImageUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [memberId, photoUrl]);

  const displayName = alt || `${member?.first_name || ''} ${member?.last_name || ''}`.trim();

  if (imageUrl && !hasError) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <img
          src={imageUrl}
          alt={displayName}
          onError={() => setHasError(true)}
          className="aspect-square h-full w-full object-cover rounded-full"
        />
      </Avatar>
    );
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {showFallback && (
        <AvatarFallback className={size === 'small' ? 'text-xs' : size === 'large' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-sm'}>
          {getInitials(member?.first_name, member?.last_name)}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default SafeMemberAvatar;
