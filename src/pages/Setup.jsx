import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BUCKET_NAME = 'pedagogy_files';

const Setup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Initialisation de la configuration...');

  useEffect(() => {
    const setupBucket = async () => {
      try {
        setMessage(`Vérification du bucket de stockage '${BUCKET_NAME}'...`);
        
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          throw new Error(`Erreur lors de la récupération des buckets: ${listError.message}`);
        }

        const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);

        if (!bucketExists) {
          setMessage(`Le bucket '${BUCKET_NAME}' n'existe pas. Création en cours...`);
          const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
          });

          if (createError) {
            throw new Error(`Erreur lors de la création du bucket: ${createError.message}`);
          }
          
          setMessage(`Bucket '${BUCKET_NAME}' créé avec succès.`);
          toast({
            title: 'Configuration terminée',
            description: `Le bucket de stockage '${BUCKET_NAME}' a été créé.`,
          });
        } else {
          setMessage(`Le bucket '${BUCKET_NAME}' existe déjà. Aucune action requise.`);
        }

        setMessage('Configuration terminée. Redirection...');
        setTimeout(() => navigate('/pedagogy'), 2000);

      } catch (error) {
        console.error('Setup error:', error);
        setMessage(`Erreur de configuration: ${error.message}`);
        toast({
          title: 'Erreur de configuration',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    setupBucket();
  }, [toast, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  );
};

export default Setup;