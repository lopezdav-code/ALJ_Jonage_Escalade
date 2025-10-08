import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Send, Instagram, Facebook, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Contact = () => {
  const { toast } = useToast();
  const form = useRef();
  const [isSending, setIsSending] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sendEmail = (e) => {
    e.preventDefault();
    setIsSending(true);

    toast({
      title: "🚧 Fonctionnalité en cours de développement",
      description: "L'envoi d'e-mails n'est pas encore implémenté. Vous pouvez demander cette fonctionnalité dans votre prochain prompt ! 🚀",
      variant: "default",
    });

    setTimeout(() => {
      setIsSending(false);
      e.target.reset();
    }, 1000);
  };
  
  const position = [45.8113, 5.002];

  return (
    <div className="space-y-12">
      <Helmet>
        <title>Contact - ALJ Escalade Jonage</title>
        <meta name="description" content="Contactez le club d'escalade ALJ Escalade Jonage. Trouvez notre adresse et suivez-nous sur les réseaux sociaux." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold headline flex items-center justify-center gap-3">
          <Mail className="w-10 h-10 text-primary" />
          Nous Contacter
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Une question ? Une suggestion ? N'hésitez pas à nous envoyer un message ou à nous suivre sur nos réseaux.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Envoyer un message</CardTitle>
            </CardHeader>
            <CardContent>
              <form ref={form} onSubmit={sendEmail} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from_name">Votre Nom</Label>
                    <Input id="from_name" name="from_name" required placeholder="Jean Dupont" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from_email">Votre Email</Label>
                    <Input id="from_email" name="from_email" type="email" required placeholder="jean.dupont@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input id="subject" name="subject" required placeholder="Question sur les inscriptions" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Votre Message</Label>
                  <Textarea id="message" name="message" required placeholder="Bonjour, je voudrais savoir..." rows={5} />
                </div>
                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isSending ? 'Envoi en cours...' : 'Envoyer le message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="text-primary" />
                Nous Trouver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Espace Agora, 23 Rue du Lavoir, 69330 Jonage</p>
              {isClient && (
                 <MapContainer center={position} zoom={16} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={position}>
                    <Popup>
                      ALJ Escalade Jonage <br /> Espace Agora
                    </Popup>
                  </Marker>
                </MapContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nous Suivre</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Button asChild variant="outline" className="w-full">
                <a href="https://www.instagram.com/aljescalade/" target="_blank" rel="noopener noreferrer">
                  <Instagram className="mr-2 h-5 w-5 text-pink-500" /> Instagram
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="https://www.facebook.com/amicalelaiquedejonage" target="_blank" rel="noopener noreferrer">
                  <Facebook className="mr-2 h-5 w-5 text-blue-600" /> Facebook
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;