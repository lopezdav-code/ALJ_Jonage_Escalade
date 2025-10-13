import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getMemberPhotoUrl } from '@/lib/memberStorageUtils';

// Exactement comme TestImages qui fonctionne
const MemberImage = ({ member }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!member?.photo_url) {
      setImageUrl(null);
      return;
    }

    getMemberPhotoUrl(member.photo_url)
      .then(url => {
        setImageUrl(url);
      })
      .catch(err => {
        console.error('Erreur chargement image:', err);
        setError(true);
      });
  }, [member?.id]); // Exactement comme TestImages : dépend de member.id

  const initials = `${member?.first_name?.[0] || ''}${member?.last_name?.[0] || ''}`.toUpperCase();

  if (imageUrl && !error) {
    return (
      <Avatar className="w-16 h-16">
        <img
          src={imageUrl}
          alt={`${member?.first_name} ${member?.last_name}`}
          onError={() => setError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      </Avatar>
    );
  }

  return (
    <Avatar className="w-16 h-16">
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export default MemberImage;
