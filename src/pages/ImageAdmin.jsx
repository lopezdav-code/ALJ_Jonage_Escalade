import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Image as ImageIcon, Link as LinkIcon, Search } from 'lucide-react';
import { formatName } from '@/lib/utils';
import ImageErrorReporting from '@/components/ImageErrorReporting';

const Autocomplete = ({ members, onSelect, onClear }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 1) {
      const filtered = members.filter(member =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (member) => {
    setQuery(formatName(member.first_name, member.last_name, true));
    setSuggestions([]);
    onSelect(member);
  };

  useEffect(() => {
    if (query === '') {
      onClear();
    }
  }, [query, onClear]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Rechercher un membre..."
          className="pl-10"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-background border rounded-md mt-1 max-h-60 overflow-y-auto">
          {suggestions.map(member => (
            <li
              key={member.id}
              onClick={() => handleSelect(member)}
              className="px-3 py-2 hover:bg-accent cursor-pointer"
            >
              {formatName(member.first_name, member.last_name, true)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ImageCard = ({ image, members, onLink, linkingState }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const { isLinking, linkedMemberId } = linkingState;

  const handleLink = () => {
    if (selectedMember) {
      onLink(image, selectedMember);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <img src={image.publicUrl} alt={image.name} className="w-full h-48 object-cover" />
      </CardContent>
      <CardFooter className="p-4 flex flex-col gap-4">
        <Autocomplete
          members={members}
          onSelect={setSelectedMember}
          onClear={() => setSelectedMember(null)}
        />
        <Button onClick={handleLink} disabled={!selectedMember || isLinking} className="w-full">
          {isLinking && linkedMemberId === selectedMember?.id ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LinkIcon className="w-4 h-4 mr-2" />
          )}
          Lier au membre
        </Button>
      </CardFooter>
    </Card>
  );
};

const ImageAdmin = () => {
  const [images, setImages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkingState, setLinkingState] = useState({ isLinking: false, linkedMemberId: null });
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const fetchImagesAndMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) throw bucketsError;

      const imagePromises = buckets.map(async (bucket) => {
        const { data: files, error: filesError } = await supabase.storage.from(bucket.name).list(undefined, {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });
        if (filesError) {
          console.warn(`Could not list files from bucket ${bucket.name}:`, filesError.message);
          return [];
        }
        return files
          .filter(file => file.name !== '.emptyFolderPlaceholder')
          .map(file => ({
            ...file,
            bucketName: bucket.name,
            publicUrl: supabase.storage.from(bucket.name).getPublicUrl(file.name).data.publicUrl,
          }));
      });

      const imagesByBucket = await Promise.all(imagePromises);
      const allImages = imagesByBucket.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const { data: memberData, error: memberError } = await supabase.from('members').select('*');
      if (memberError) throw memberError;

      setImages(allImages);
      setMembers(memberData);

    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchImagesAndMembers();
  }, [fetchImagesAndMembers]);

  const handleLinkImageToMember = async (image, member) => {
    setLinkingState({ isLinking: true, linkedMemberId: member.id });
    try {
      const { error } = await supabase
        .from('members')
        .update({ photo_url: image.publicUrl })
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Image liée à ${formatName(member.first_name, member.last_name, true)}.`,
      });
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLinkingState({ isLinking: false, linkedMemberId: null });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Accès non autorisé</h1>
        <p className="text-muted-foreground">Cette page est réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Gestion des Images - Admin</title>
        <meta name="description" content="Gérer et lier les images du site." />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold headline flex items-center gap-3">
          <ImageIcon className="w-10 h-10 text-primary" />
          Gestion des Images
        </h1>
      </motion.div>

      {/* Composant de rapport des erreurs d'images */}
      <ImageErrorReporting />

      {images.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Aucune image trouvée dans les buckets de stockage.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              members={members}
              onLink={handleLinkImageToMember}
              linkingState={linkingState}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageAdmin;