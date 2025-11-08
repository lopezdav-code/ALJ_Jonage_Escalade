import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, Upload, Image as ImageIcon } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const ImageSettingCard = ({ title, description, configKey, currentImageUrl }) => {
  const { updateConfig } = useConfig();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!newImageFile) return;
    setIsUploading(true);
    
    try {
      const fileExt = newImageFile.name.split('.').pop();
      const fileName = `${configKey}-${Date.now()}.${fileExt}`;
      const bucket = 'site_assets';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, newImageFile, {
            cacheControl: '3600',
            upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      const newUrl = data.publicUrl;

      const { error: updateError } = await updateConfig(configKey, newUrl);
      if (updateError) throw updateError;
      
      toast({ title: "Succès", description: "L'image a été mise à jour." });
      setNewImageFile(null);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {previewUrl ? (
            <img src={previewUrl} alt={title} className="max-h-32 object-contain border p-2 rounded-md bg-muted/20" />
        ) : (
            <div className="h-24 w-full flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
        )}
        <Input type="file" accept="image/*" onChange={handleFileChange} />
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpload} disabled={isUploading || !newImageFile} className="w-full">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Enregistrer
        </Button>
      </CardFooter>
    </Card>
  );
};

const SiteSettings = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { config, loadingConfig } = useConfig();

  const partnerLogos = [
    { title: "Logo Partenaire: Métropole de Lyon", description: "Logo affiché dans le pied de page.", key: "partner_logo_metropole_lyon" },
    { title: "Logo Partenaire: FFME", description: "Logo affiché dans le pied de page.", key: "partner_logo_ffme" },
    { title: "Logo Partenaire: Région AURA", description: "Logo affiché dans le pied de page.", key: "partner_logo_auvergne_rhone_alpes" },
    { title: "Logo Partenaire: Mairie de Jonage", description: "Logo affiché dans le pied de page.", key: "partner_logo_mairie_jonage" },
  ];

  if (authLoading || loadingConfig) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <ProtectedRoute pageTitle="Réglages du site" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-8">
        <Helmet>
          <title>Réglages du site - Admin</title>
        </Helmet>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <Settings className="w-10 h-10 text-primary" />
            Réglages du site
          </h1>
          <p className="text-muted-foreground mt-2">Modifiez les éléments globaux du site ici.</p>
        </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-2xl font-semibold mb-4">Images principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageSettingCard 
                title="Logo du Site"
                description="Le logo principal affiché dans l'en-tête."
                configKey="site_logo"
                currentImageUrl={config.site_logo}
            />
            <ImageSettingCard 
                title="Bannière des Actualités"
                description="L'image affichée en haut de la page Actualités."
                configKey="news_banner_image"
                currentImageUrl={config.news_banner_image}
            />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-2xl font-semibold mb-4">Logos des partenaires</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {partnerLogos.map(logo => (
            <ImageSettingCard
                key={logo.key}
                title={logo.title}
                description={logo.description}
                configKey={logo.key}
                currentImageUrl={config[logo.key]}
            />
          ))}
        </div>
      </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default SiteSettings;