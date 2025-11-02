import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, LogOut, UserPlus, Settings, ShieldCheck, User, Database, Key, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useConfig } from '@/contexts/ConfigContext';
import { formatName } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const AuthForm = ({ mode, setMode, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (!error) {
      onAuthSuccess();
      toast({ title: mode === 'signIn' ? 'Connexion réussie' : 'Inscription réussie', description: 'Bienvenue !' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{mode === 'signIn' ? 'Connexion' : 'Inscription'}</DialogTitle>
        <DialogDescription>
          {mode === 'signIn' ? 'Connectez-vous pour accéder à votre espace.' : 'Créez un compte pour rejoindre le club.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
      </div>
      <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center">
        <Button type="button" variant="link" onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
          {mode === 'signIn' ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Chargement...' : (mode === 'signIn' ? 'Se connecter' : 'S\'inscrire')}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ChangePasswordDialog = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre mot de passe a été modifié avec succès.",
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer mon mot de passe</DialogTitle>
          <DialogDescription>
            Saisissez votre nouveau mot de passe (minimum 6 caractères).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signIn');
  const { user, signOut, isAdmin, isEncadrant, isAdherent, isBureau, profile } = useAuth();
  const { config, loadingConfig } = useConfig();
  const navigate = useNavigate();

  const navLinksOrder = [
    '/news', '/schedule', '/inscriptions', '/contact', '/volunteers', '/competitions', '/agenda', '/session-log', '/pedagogy'
  ];

  const defaultNavLinks = [
    { to: '/news', text: 'Actualités', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/schedule', text: 'Planning', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/inscriptions', text: 'Inscription', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/contact', text: 'Contact', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/volunteers', text: 'Adhérent', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/competitions', text: 'Compétitions', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
    { to: '/agenda', text: 'Agenda', roles: ['public', 'user', 'adherent', 'bureau', 'encadrant', 'admin'] },
    {
      to: '/session-log',
      text: 'Séances',
      roles: ['adherent', 'bureau', 'encadrant', 'admin'],
      subMenu: [
        { to: '/session-log', text: 'Historique des séances', roles: ['adherent', 'bureau', 'encadrant', 'admin'] },
        { to: '/cycles', text: 'Gestion des cycles', roles: ['bureau', 'encadrant', 'admin'] },
        { to: '/passeport-validation', text: 'Validation Passeports', roles: ['bureau', 'encadrant', 'admin'] },
      ]
    },
    { to: '/pedagogy', text: 'Support Pédagogique', roles: ['adherent', 'encadrant', 'admin'] },
  ];
  
  const [navLinks, setNavLinks] = useState(defaultNavLinks);

  // Chargement de la configuration depuis la base de données
  useEffect(() => {
    if (!loadingConfig && config.nav_config) {
      try {
        const dbNavConfig = JSON.parse(config.nav_config);
        setNavLinks(prevLinks => {
          const newLinks = [...prevLinks];
          dbNavConfig.forEach(dbLink => {
            const linkIndex = newLinks.findIndex(l => l.to === dbLink.to);
            if (linkIndex !== -1) {
              newLinks[linkIndex].roles = dbLink.roles;
            }
          });
          return newLinks;
        });
      } catch (e) {
        console.error("Failed to parse nav_config:", e);
      }
    }
  }, [config.nav_config, loadingConfig]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erreur de déconnexion",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/');
    }
  };

  const closeMenu = () => setIsOpen(false);

  const userRole = isAdmin ? 'admin' : (isEncadrant ? 'encadrant' : (isBureau ? 'bureau' : (isAdherent ? 'adherent' : (user ? 'user' : 'public'))));

  const filteredNavLinks = navLinks
    .filter(link => link.roles.includes(userRole))
    .sort((a, b) => navLinksOrder.indexOf(a.to) - navLinksOrder.indexOf(b.to));

  return (
    <>
      <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
        <nav className="container mx-auto px-4 flex justify-between items-center h-16">
          <NavLink to="/" className="text-2xl font-bold text-primary">
            {!loadingConfig && config.site_logo ? (
              <img alt="Logo ALJ Escalade" className="h-12" src={config.site_logo} />
            ) : (
              <div className="h-12 w-24 bg-muted rounded animate-pulse"></div>
            )}
          </NavLink>

          <div className="hidden md:flex items-center space-x-6">
            {filteredNavLinks.map(link => {
              if (link.subMenu) {
                // Filtrer les sous-menus selon les rôles
                const filteredSubMenu = link.subMenu.filter(subLink => subLink.roles.includes(userRole));
                
                if (filteredSubMenu.length === 0) return null;
                
                return (
                  <DropdownMenu key={link.to}>
                    <DropdownMenuTrigger className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
                      {link.text}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {filteredSubMenu.map(subLink => (
                        <DropdownMenuItem key={subLink.to} onClick={() => navigate(subLink.to)}>
                          {subLink.text}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              
              return (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {link.text}
                </NavLink>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="sm" className="flex items-center gap-2">
                     <User className="h-4 w-4" />
                     <span className="hidden sm:inline">{profile?.members ? formatName(profile.members.first_name, profile.members.last_name, false) : user.email}</span>
                     {profile?.role && <Badge variant="outline" className="hidden sm:inline-flex">{profile.role}</Badge>}
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    <span>Changer mot de passe</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Administration</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate('/site-settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Réglages du site</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin-management')}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Gestion des Rôles</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/connection-logs')}>
                        <Database className="mr-2 h-4 w-4" />
                        <span>Logs Connexion</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/member-group-test')}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Test Groupes Membres</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button onClick={() => { setAuthMode('signIn'); setIsAuthModalOpen(true); }} variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <LogIn className="w-4 h-4 mr-2" /> Connexion
                </Button>
                <Button onClick={() => { setAuthMode('signUp'); setIsAuthModalOpen(true); }} size="sm">
                  <UserPlus className="w-4 h-4 mr-2" /> Inscription
                </Button>
              </>
            )}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {filteredNavLinks.map(link => {
                if (link.subMenu) {
                  const filteredSubMenu = link.subMenu.filter(subLink => subLink.roles.includes(userRole));
                  if (filteredSubMenu.length === 0) return null;
                  
                  return (
                    <div key={link.to} className="space-y-2">
                      <p className="text-lg font-semibold text-primary">{link.text}</p>
                      <div className="pl-4 space-y-2">
                        {filteredSubMenu.map(subLink => (
                          <NavLink 
                            key={subLink.to} 
                            to={subLink.to} 
                            onClick={closeMenu} 
                            className={({ isActive }) => `block text-md font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                          >
                            {subLink.text}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <NavLink key={link.to} to={link.to} onClick={closeMenu} className={({ isActive }) => `text-lg font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {link.text}
                  </NavLink>
                );
              })}
               {!user && <Button onClick={() => { closeMenu(); setAuthMode('signIn'); setIsAuthModalOpen(true); }} variant="outline">Connexion</Button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent>
          <AuthForm mode={authMode} setMode={setAuthMode} onAuthSuccess={() => setIsAuthModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <ChangePasswordDialog 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </>
  );
};

export default Navigation;
