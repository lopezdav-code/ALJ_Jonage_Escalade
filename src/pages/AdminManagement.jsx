import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ShieldCheck, UserCog, Settings, Save, PlusCircle, Link as LinkIcon, X, UserPlus, Search, Trash2, MailCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useConfig } from '@/contexts/ConfigContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const NAV_PAGES = [
    { to: '/user-roles', text: 'Gestion des Rôles' },
    { to: '/news', text: 'Actualités' },
    { to: '/schedule', text: 'Planning' },
    { to: '/inscriptions', text: 'Inscription' },
    { to: '/contact', text: 'Contact' },
    { to: '/volunteers', text: 'Adhérents' },
    { to: '/competitions', text: 'Compétitions' },
    { to: '/agenda', text: 'Agenda' },
    { to: '/session-log', text: 'Séances' },
    { to: '/cycles', text: 'Cycles' },
    { to: '/pedagogy', text: 'Pédagogie' },
    { to: '/passeport-viewer', text: 'Passeports - Visualisation' },
    { to: '/passeport-guide', text: 'Passeports - Guide' },
    { to: '/passeport-validation', text: 'Passeports - Validation' },
    { to: '/annual-summary', text: 'Récapitulatif Annuel' },
];

const AdminManagement = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { config, updateConfig, loadingConfig } = useConfig();
  
  // Configuration par défaut basée sur les permissions standards
  const getDefaultRolesForPage = (pagePath) => {
    switch (pagePath) {
      case '/news':
      case '/schedule':
      case '/inscriptions':
      case '/contact':
      case '/agenda':
        return ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'];
      case '/volunteers':
      case '/competitions':
      case '/session-log':
      case '/cycles':
      case '/pedagogy':
      case '/passeport-viewer':
      case '/annual-summary':
        return ['adherent', 'bureau', 'encadrant', 'admin'];
      case '/passeport-validation':
        return ['encadrant', 'admin'];
      default:
        return ['adherent', 'bureau', 'encadrant', 'admin'];
    }
  };
  
  const [navConfig, setNavConfig] = useState(
    NAV_PAGES.map(p => ({ to: p.to, text: p.text, roles: getDefaultRolesForPage(p.to) }))
  );
  const [isSavingNav, setIsSavingNav] = useState(false);

  useEffect(() => {
    if (!loadingConfig && config.nav_config) {
      try {
        const dbNavConfig = JSON.parse(config.nav_config);
        setNavConfig(prevConfig => {
          const newConfig = [...prevConfig];
          dbNavConfig.forEach(dbLink => {
            const linkIndex = newConfig.findIndex(l => l.to === dbLink.to);
            if (linkIndex !== -1) {
              newConfig[linkIndex].roles = dbLink.roles;
            }
          });
          return newConfig;
        });
      } catch (e) {
        console.error("Failed to parse nav_config:", e);
      }
    }
  }, [config.nav_config, loadingConfig]);

  const handleNavRoleChange = (pageIndex, role, checked) => {
    setNavConfig(prev => {
      const newConfig = [...prev];
      const roles = newConfig[pageIndex].roles;
      if (checked) {
        if (!roles.includes(role)) roles.push(role);
      } else {
        newConfig[pageIndex].roles = roles.filter(r => r !== role);
      }
      return newConfig;
    });
  };
  
  const handleSaveNavConfig = async () => {
    setIsSavingNav(true);
    const { error } = await updateConfig('nav_config', JSON.stringify(navConfig));
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder la configuration du menu.", variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Configuration du menu sauvegardée." });
    }
    setIsSavingNav(false);
  };
  
  if (authLoading || loadingConfig) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <ProtectedRoute pageTitle="Gestion des Accès" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-8">
      <Helmet><title>Gestion des Rôles et Accès</title></Helmet>
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <UserCog className="w-10 h-10 text-primary" />
            Gestion des Accès
            </h1>
            <p className="text-muted-foreground mt-2">Gérez les accès aux différentes pages du site.</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Rôles Utilisateurs</CardTitle>
            <CardDescription>
              La gestion des rôles a été déplacée vers une page dédiée pour plus de clarté.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/user-roles">
              <Button variant="outline">
                <UserCog className="mr-2 h-4 w-4" />
                Aller à la Gestion des Rôles
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Accès aux Pages du Menu</CardTitle>
            <CardDescription>Définissez quels rôles peuvent voir chaque page dans le menu principal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-center">Public</TableHead>
                  <TableHead className="text-center">Utilisateur</TableHead>
                  <TableHead className="text-center">Adhérent</TableHead>
                  <TableHead className="text-center">Bureau</TableHead>
                  <TableHead className="text-center">Encadrant</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {navConfig.map((page, pageIndex) => (
                  <TableRow key={page.to}>
                    <TableCell className="font-medium">{page.text}</TableCell>
                    {['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'].map(role => (
                      <TableCell key={role} className="text-center">
                        <Checkbox checked={page.roles.includes(role)} onCheckedChange={(checked) => handleNavRoleChange(pageIndex, role, checked)} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveNavConfig} disabled={isSavingNav}>
              {isSavingNav ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Sauvegarder les Accès du Menu
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Permissions Détaillées</CardTitle>
            <CardDescription>
              Gérez finement les droits de création et de modification pour chaque rôle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/permissions">
              <Button variant="outline">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Aller à la Gestion des Permissions
              </Button>
            </Link>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              <strong>Protection des données :</strong> Pour protéger les données personnelles, le nom de famille des adhérents est masqué pour tous les rôles sauf 'Admin' et 'Bureau'. Cette logique est appliquée directement par la base de données via une vue sécurisée (`secure_members`).
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Images et de la Sécurité</CardTitle>
            <CardDescription>
              Récapitulatif des buckets de stockage et de leur configuration de sécurité.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div>
              <h4 className="font-semibold">Photos des Membres</h4>
              <div className="text-muted-foreground">
                - <strong>Bucket :</strong> `members_photos` <Badge variant="destructive">Privé</Badge><br/>
                - <strong>Sécurité :</strong> L'accès aux photos est protégé. Le code génère des URLs sécurisées et temporaires (`signed URLs`) pour chaque image. C'est la configuration correcte et la plus sécurisée pour les données personnelles.
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Images des Actualités (News)</h4>
              <div className="text-muted-foreground">
                - <strong>Bucket :</strong> `news` <Badge variant="secondary">Public</Badge><br/>
                - <strong>Sécurité :</strong> Le bucket est public. Le code utilise des URLs publiques directes, ce qui est optimal pour des images non sensibles.
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Images des Compétitions</h4>
              <div className="text-muted-foreground">
                - <strong>Bucket :</strong> `competition_photos` <Badge variant="destructive">Privé</Badge><br/>
                - <strong>Sécurité :</strong> L'accès est restreint aux utilisateurs authentifiés via des URLs signées.
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Autres Images (Pédagogie, Cycles, etc.)</h4>
              <div className="text-muted-foreground">
                - <strong>Buckets :</strong> `pedagogy_files`, `cycles`, etc. <Badge variant="secondary">Publics</Badge><br/>
                - <strong>Sécurité :</strong> Ces buckets sont publics. Le code utilise des URLs publiques directes.
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminManagement;
