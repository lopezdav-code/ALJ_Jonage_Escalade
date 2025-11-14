import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { getMemberPhotoUrl } from '@/lib/memberStorageUtils';

const TestImages = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('secure_members')
        .select('id, first_name, last_name, photo_url')
        .not('photo_url', 'is', null)
        .limit(5);

      if (error) {
        console.error('Erreur chargement membres:', error);
      } else {
        console.log('Membres avec photos:', data);
        setMembers(data || []);
      }
      setLoading(false);
    };

    fetchMembers();
  }, []);

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test des images membres</h1>

      <div className="space-y-8">
        {members.map((member) => (
          <MemberImageTest key={member.id} member={member} />
        ))}
      </div>

      {members.length === 0 && (
        <p className="text-gray-500">Aucun membre avec photo trouvé</p>
      )}
    </div>
  );
};

const MemberImageTest = ({ member }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loadSuccess, setLoadSuccess] = useState(false);

  useEffect(() => {
    console.log(`[Test] Chargement image pour ${member.first_name} ${member.last_name}`, member.photo_url);

    getMemberPhotoUrl(member.photo_url)
      .then(url => {
        console.log(`[Test] URL reçue:`, url);
        setImageUrl(url);
      })
      .catch(err => {
        console.error(`[Test] Erreur:`, err);
        setError(err.message);
      });
  }, [member.id]);

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="font-bold mb-2">
        {member.first_name} {member.last_name}
      </h2>

      <div className="space-y-2">
        <p className="text-sm">
          <strong>photo_url en BDD:</strong> {member.photo_url}
        </p>

        <p className="text-sm">
          <strong>URL signée générée:</strong>
          <br />
          <span className="text-xs break-all">{imageUrl || 'En attente...'}</span>
        </p>

        {error && (
          <p className="text-red-500 text-sm">
            <strong>Erreur:</strong> {error}
          </p>
        )}

        <div className="mt-4">
          <p className="text-sm font-semibold mb-2">Test d'affichage :</p>

          {imageUrl && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Image simple (img tag):</p>
                <img
                  src={imageUrl}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-32 h-32 object-cover rounded-full border-2"
                  onLoad={() => {
                    console.log(`[Test] Image chargée avec succès pour ${member.first_name}`);
                    setLoadSuccess(true);
                  }}
                  onError={(e) => {
                    console.error(`[Test] Erreur chargement image pour ${member.first_name}`, e);
                    setError('Erreur de chargement de l\'image');
                  }}
                />
                {loadSuccess && (
                  <p className="text-green-500 text-xs mt-1">✓ Image chargée avec succès</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Lien direct:</p>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-xs underline"
                >
                  Ouvrir l'image dans un nouvel onglet
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestImages;
