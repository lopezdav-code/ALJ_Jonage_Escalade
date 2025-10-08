import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Info, Calendar, Users, CreditCard, AlertTriangle, Gift } from 'lucide-react';

const InfoCard = ({ icon, title, children }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
            {icon}
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const Inscriptions = () => {
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 },
    };

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ duration: 0.5 }}
            className="space-y-12"
        >
            <Helmet>
                <title>Inscriptions 2025-2026 - ALJ Escalade Jonage</title>
                <meta name="description" content="Toutes les informations pour les inscriptions à la saison 2025-2026 du club d'escalade." />
            </Helmet>

            <motion.div className="text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <h1 className="text-4xl md:text-5xl font-bold headline mb-4">Inscriptions 2025-2026</h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Toutes les inscriptions se feront exclusivement en ligne. Soyez prêts !</p>
            </motion.div>

            <motion.div 
                className="max-w-4xl mx-auto p-8 rounded-xl bg-gradient-to-br from-primary/80 to-primary text-primary-foreground shadow-2xl text-center space-y-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <h2 className="text-2xl font-bold">Ouverture des inscriptions</h2>
                <p className="text-4xl font-extrabold">11 juin 2025 à 8h00</p>
                <p>Les places sont limitées : soyez réactifs !</p>
                <Button asChild variant="secondary" size="lg" className="text-lg">
                    <a href="https://www.helloasso.com/associations/amicale-laique-de-jonage/adhesions/adhesion-escalade-2025-2026-amicale-laique-escalade-2" target="_blank" rel="noopener noreferrer">
                        C’est ici !
                    </a>
                </Button>
                <p className="text-sm pt-2">Si votre créneau est complet, inscrivez-vous sur liste d’attente. Nous vous contacterons en cas de désistement.</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <InfoCard icon={<Users className="w-8 h-8 text-primary" />} title="Créneaux Spécifiques">
                    <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                        <li>L’inscription aux créneaux <strong>Perfectionnement Enfants/Jeunes</strong> et <strong>Compétition Enfants/Jeunes</strong> est soumise à test préalable : contactez-nous.</li>
                        <li>Pas de tests pour les cours <strong>Perfectionnement adultes</strong> : Ils sont accessibles aux adhérents inscrits en Adultes autonomes.</li>
                    </ul>
                </InfoCard>

                <InfoCard icon={<Info className="w-8 h-8 text-primary" />} title="Tarifs & Inscription">
                    <p className="text-muted-foreground mb-2">Les tarifs pour la saison prochaine, sous réserve de validation, devraient être de <strong>246 euros</strong> (licence FFME incluse).</p>
                    <p className="font-semibold flex items-center gap-2"><CheckCircle className="text-green-500 w-5 h-5"/> 100% en ligne</p>
                    <p className="text-sm text-muted-foreground mt-2">N’attendez pas le forum des associations de Jonage pour vous inscrire, il est fortement probable qu’il n’y ait plus de place.</p>
                </InfoCard>
                
                <InfoCard icon={<CreditCard className="w-8 h-8 text-primary" />} title="Paiement">
                    <p className="font-semibold mb-2">Paiement par CB en 3 fois sans frais :</p>
                     <ul className="space-y-1 text-muted-foreground list-decimal pl-5">
                        <li>1/3 du montant lors de l’inscription</li>
                        <li>1/3 du montant au 23/09/2025</li>
                        <li>1/3 du montant au 23/10/2025</li>
                    </ul>
                </InfoCard>

                <InfoCard icon={<AlertTriangle className="w-8 h-8 text-destructive" />} title="Gestion des Adhésions">
                     <p className="text-muted-foreground mb-2">
                        Le fait de s’inscrire et de payer ne garantit pas l’inscription.
                        L’ALJ se réserve le droit d’effectuer un remboursement en cas de non-respect des conditions (dossiers multiples, certificat non conforme, etc.).
                    </p>
                    <p className="text-sm text-muted-foreground">Contacter l’ALJ en cas d'erreur de créneau.</p>
                </InfoCard>
                
                <InfoCard icon={<Gift className="w-8 h-8 text-primary" />} title="Remises Familles">
                    <p className="text-muted-foreground">
                        Une réduction est applicable à partir du 3ème inscrit de la même famille (même nom/adresse), lors de l'inscription simultanée de tous les membres.
                    </p>
                    <p className="font-semibold mt-2">-20€ pour 3 inscrits, -40€ pour 4</p>
                </InfoCard>
                
                 <InfoCard icon={<Calendar className="w-8 h-8 text-primary" />} title="Forum des Associations">
                    <p className="text-muted-foreground">
                       Nous profiterons du forum pour vous présenter les activités du club et vous guider vers le formulaire s’il reste des places.
                    </p>
                </InfoCard>
            </div>
        </motion.div>
    );
};

export default Inscriptions;