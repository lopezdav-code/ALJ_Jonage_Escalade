import { useState, useEffect, memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getMemberPhotoUrl } from '@/lib/memberStorageUtils';

const SimpleMemberAvatar = memo(({
  photoUrl,
  firstName,
  lastName,
  size = "default",
  className = ""
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-16 h-16",
    large: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const getInitials = () => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  useEffect(() => {
    console.log(`[SimpleMemberAvatar useEffect] Début pour ${firstName} ${lastName}, photoUrl:`, photoUrl);

    if (!photoUrl) {
      setImageUrl(null);
      setHasError(false);
      return;
    }

    let cancelled = false;

    getMemberPhotoUrl(photoUrl)
      .then(url => {
        console.log(`[SimpleMemberAvatar useEffect] URL reçue, cancelled=${cancelled}, url=`, url?.substring(0, 50));
        if (!cancelled && url) {
          console.log(`[SimpleMemberAvatar useEffect] Appel setImageUrl pour ${firstName} ${lastName}`);
          setImageUrl(url);
        } else {
          console.log(`[SimpleMemberAvatar useEffect] Ignoré car cancelled=${cancelled} ou url=${url}`);
        }
      })
      .catch(err => {
        console.error(`[SimpleMemberAvatar] Erreur pour ${firstName} ${lastName}:`, err);
        if (!cancelled) {
          setHasError(true);
        }
      });

    return () => {
      console.log(`[SimpleMemberAvatar useEffect] Cleanup pour ${firstName} ${lastName}, setting cancelled=true`);
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl]);

  if (imageUrl && !hasError) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <img
          src={imageUrl}
          alt={`${firstName} ${lastName}`}
          onLoad={() => {
            // Image chargée avec succès
          }}
          onError={() => {
            console.error(`[SimpleMemberAvatar] Erreur chargement img pour ${firstName} ${lastName}`);
            setHasError(true);
          }}
          className="aspect-square h-full w-full object-cover rounded-full"
        />
      </Avatar>
    );
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarFallback className={size === 'small' ? 'text-xs' : size === 'large' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-sm'}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
});

SimpleMemberAvatar.displayName = 'SimpleMemberAvatar';

export default SimpleMemberAvatar;
