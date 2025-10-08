import React from 'react';
import { Instagram, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/contexts/ConfigContext';

const partnersData = [
  {
    key: "partner_logo_metropole_lyon",
    name: "Métropole de Lyon",
    alt: "Logo Métropole de Lyon",
    url: "https://www.grandlyon.com/",
    className: "h-16"
  },
  {
    key: "partner_logo_ffme",
    name: "FFME",
    alt: "Logo FFME",
    url: "https://www.ffme.fr/",
    className: "h-12"
  },
  {
    key: "partner_logo_auvergne_rhone_alpes",
    name: "Région Auvergne-Rhône-Alpes",
    alt: "Logo Région Auvergne-Rhône-Alpes",
    url: "https://www.auvergnerhonealpes.fr/",
    className: "h-14"
  },
  {
    key: "partner_logo_mairie_jonage",
    name: "Mairie de Jonage",
    alt: "Logo Mairie de Jonage",
    url: "https://www.mairiedejonage.com/",
    className: "h-16"
  }
];

const Footer = () => {
  const { config, loadingConfig } = useConfig();

  const PartnerLogo = ({ p_key, p_url, p_alt, p_className }) => {
    if (loadingConfig || !config[p_key]) {
      return <div className={`${p_className} w-24 bg-muted/50 rounded animate-pulse`}></div>;
    }
    return (
      <a href={p_url} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
        <img alt={p_alt} className={`${p_className} object-contain`} src={config[p_key]} />
      </a>
    );
  };

  return (
    <footer className="bg-secondary/50 border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="font-semibold text-lg">ALJ Escalade Jonage</p>
            <p className="text-sm text-muted-foreground">Espace Agora, 23 Rue du Lavoir, 69330 Jonage</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <a href="https://www.instagram.com/aljescalade/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-6 w-6" />
              </a>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <a href="https://www.facebook.com/amicalelaiquedejonage" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-6 w-6" />
              </a>
            </Button>
          </div>
        </div>

        <div className="border-t my-8"></div>

        <div className="text-center">
            <p className="text-md font-semibold mb-4">Nos partenaires</p>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
              {partnersData.map(partner => (
                <PartnerLogo 
                  key={partner.key}
                  p_key={partner.key}
                  p_url={partner.url}
                  p_alt={partner.alt}
                  p_className={partner.className}
                />
              ))}
            </div>
        </div>
        
        <div className="border-t my-8"></div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ALJ Escalade Jonage. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;