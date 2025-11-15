import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Loader2, ShieldCheck, UserCog, Users, Save, PlusCircle, X, Search,
  Trash2, MailCheck, Link as LinkIcon, Settings, Info
} from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { formatName } from '@/lib/utils.js';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Link } from 'react-router-dom';

// Constants
const USER_ROLES = ['admin', 'bureau', 'encadrant', 'adherent', 'user'];
const BUREAU_ROLES = [
  'Présidente',
  'Présidente Adjointe',
  'Trésorier',
  'Trésorier Adjoint',
  'Secrétaire',
  'Secrétaire Adjoint',
  'Bénévole' // Encadrants
];

const NAV_PAGES = [
  { to: '/news', text: 'Actualités' },
  { to: '/schedule', text: 'Planning' },
  { to: '/inscriptions', text: 'Inscription' },
  { to: '/contact', text: 'Contact' },
  { to: '/agenda', text: 'Agenda' },
  { to: '/volunteers', text: 'Adhérents' },
  { to: '/competitions', text: 'Compétitions' },
  { to: '/session-log', text: 'Séances' },
  { to: '/cycles', text: 'Cycles' },
  { to: '/pedagogy', text: 'Pédagogie' },
  { to: '/passeport-viewer', text: 'Passeports - Visualisation' },
  { to: '/passeport-guide', text: 'Passeports - Guide' },
  { to: '/passeport-validation', text: 'Passeports - Validation' },
  { to: '/annual-summary', text: 'Récapitulatif Annuel' },
  { to: '/attendance-recap', text: 'Récapitulatif Présence' },
];

const PERMISSIONS = [
  { id: 'member', label: 'Membre' },
  { id: 'schedule', label: 'Planning (Schedule)' },
  { id: 'exercise', label: 'Exercice' },
  { id: 'competition', label: 'Compétition' },
  { id: 'competition_participants', label: 'Participants à une compétition' },
  { id: 'cycle', label: 'Cycle' },
  { id: 'news', label: 'Actualité (News)' },
  { id: 'news_advanced', label: 'Actualité (Actions avancées)' },
  { id: 'passeport', label: 'Passeport' },
  { id: 'profile', label: 'Profil utilisateur' },
  { id: 'role', label: 'Rôle utilisateur' },
  { id: 'session', label: 'Session' },
  { id: 'student_session_comment', label: 'Commentaire de session élève' },
];

const ACTIONS = ['create', 'edit'];
const ADVANCED_NEWS_ACTIONS = ['delete', 'archive', 'view_unpublished'];

// Helper Components
const MemberSearchPopover = ({ onSelect, children, existingLinks }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    const fetchAllMembers = async () => {
      const { data } = await supabase.from('secure_members').select('id, first_name, last_name');
      if (data) setAllMembers(data);
    };
    fetchAllMembers();
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const filtered = allMembers.filter(m =>
      !existingLinks.includes(m.id) &&
      (search === "" || `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 10);
    setMembers(filtered);
    setLoading(false);
  }, [search, open, existingLinks, allMembers]);

  const handleSelect = (member) => {
    onSelect(member);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : members.length > 0 ? (
            members.map(member => (
              <div key={member.id} onClick={() => handleSelect(member)} className="p-2 hover:bg-accent cursor-pointer text-sm">
                {formatName(member.first_name, member.last_name, true)}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">Aucun membre trouvé.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const CreateUserForm = ({ isOpen, onClose, onUserCreated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linkedMember, setLinkedMember] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email,
          password,
          role: null, // Role will be determined automatically
          member_id: linkedMember?.id || null,
        },
      });

      if (error || !data || !data.user) throw new Error("La création de l'utilisateur a échoué.");

      toast({ title: "Succès", description: "Utilisateur créé avec succès." });
      onUserCreated();
      onClose();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créez un compte et liez-le à un profil de membre existant. Le rôle sera déterminé automatiquement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <Label>Lier à un membre</Label>
            {linkedMember ? (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <span>{formatName(linkedMember.first_name, linkedMember.last_name, true)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLinkedMember(null)}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <MemberSearchPopover onSelect={setLinkedMember} existingLinks={[]}>
                <Button variant="outline" className="w-full justify-start font-normal">
                  <Search className="mr-2 h-4 w-4" /> Rechercher un membre...
                </Button>
              </MemberSearchPopover>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
const AuthorizationManagement = () => {
  const { isAdmin, loading: authLoading, user: currentUser } = useAuth();
  const { toast } = useToast();
  const { config, updateConfig, loadingConfig } = useConfig();

  // Tab 1: User Management
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [isCreateUserFormOpen, setCreateUserFormOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(null);

  // Tab 2: Bureau Roles
  const [members, setMembers] = useState([]);
  const [bureauLoading, setBureauLoading] = useState(true);
  const [savingRole, setSavingRole] = useState({});
  const [searchTextByRole, setSearchTextByRole] = useState({});
  const [suggestionsByRole, setSuggestionsByRole] = useState({});
  const [assignments, setAssignments] = useState({});

  // Tab 3: Page Access
  const [navConfig, setNavConfig] = useState(NAV_PAGES.map(p => ({
    to: p.to,
    text: p.text,
    roles: ['adherent', 'bureau', 'encadrant', 'admin']
  })));
  const [isSavingNav, setIsSavingNav] = useState(false);

  // Tab 4: Feature Permissions
  const [permissions, setPermissions] = useState({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Fetch Users (Tab 1)
  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    setLoadingUsers(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*, members(id, first_name, last_name, groupe_id)');
      if (profilesError) throw profilesError;

      const { data: functionData, error: functionError } = await supabase.functions.invoke('get-users', {
        body: { userId: currentUser.id },
      });

      if (functionError) throw functionError;
      if (functionData.error) throw new Error(functionData.error);

      const authUsers = functionData.users;

      const combinedUsers = profiles.map(profile => {
        const authUser = authUsers.find(u => u.id === profile.id);
        return {
          ...profile,
          email: authUser?.email,
          email_confirmed_at: authUser?.email_confirmed_at,
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      toast({ title: "Erreur", description: `Impossible de charger les utilisateurs: ${error.message}`, variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUser?.id, toast]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchUsers();
    }
  }, [currentUser?.id, fetchUsers]);

  const existingMemberLinks = useMemo(() => users.map(u => u.member_id).filter(Boolean), [users]);

  const handleLinkMember = async (profileId, member) => {
    setIsLinking(profileId);
    const { error } = await supabase.from('profiles').update({ member_id: member.id }).eq('id', profileId);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de lier le membre.", variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Membre lié au profil. Le rôle sera mis à jour automatiquement." });
      fetchUsers();
    }
    setIsLinking(null);
  };

  const handleUnlinkMember = async (profileId) => {
    setIsLinking(profileId);
    const { error } = await supabase.from('profiles').update({ member_id: null }).eq('id', profileId);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de délier le membre.", variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Membre délié du profil." });
      fetchUsers();
    }
    setIsLinking(null);
  };

  const handleSetAdminRole = async (userId) => {
    setIsSubmitting(userId);
    try {
      const { data, error } = await supabase.functions.invoke('set-user-role', {
        body: { userId, role: 'admin' }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast({ title: "Succès", description: "Rôle admin attribué." });
      fetchUsers();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleRemoveAdminRole = async (userId) => {
    setIsSubmitting(userId);
    try {
      const { data, error } = await supabase.functions.invoke('set-user-role', {
        body: { userId, role: null }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast({ title: "Succès", description: "Rôle admin retiré. Le rôle sera déterminé automatiquement." });
      fetchUsers();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleConfirmUser = async (userId, userEmail) => {
    setIsSubmitting(userId);
    try {
      const { error } = await supabase.functions.invoke('confirm-user', {
        body: { userId },
      });
      if (error) throw error;
      toast({ title: "Succès", description: `L'email de ${userEmail} a été confirmé.` });
      fetchUsers();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    setIsSubmitting(userToDelete.id);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id },
      });
      if (error) throw new Error(`Function error: ${error.message}`);
      if (data.error) throw new Error(`Function returned error: ${data.error}`);
      toast({ title: "Succès", description: `L'utilisateur ${userToDelete.email} a été supprimé.` });
      fetchUsers();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(null);
    }
  };

  // Fetch Bureau Assignments (Tab 2)
  useEffect(() => {
    const fetchBureauData = async () => {
      setBureauLoading(true);
      try {
        const { data: membersData, error: mErr } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .order('last_name')
          .order('first_name');
        if (mErr) throw mErr;
        setMembers(membersData || []);

        const { data: bureauData, error: bErr } = await supabase
          .from('bureau')
          .select('id, members_id, role, sub_role');
        if (bErr) throw bErr;

        const map = {};
        (bureauData || []).forEach((b) => {
          const fullRole = b.sub_role ? `${b.role} ${b.sub_role}` : b.role;
          const member = (membersData || []).find(m => m.id === b.members_id);
          map[fullRole] = member ? { ...member, bureau_id: b.id } : null;
        });
        setAssignments(map);
      } catch (err) {
        console.error('Erreur Bureau fetch:', err);
        toast({ title: 'Erreur', description: 'Impossible de charger les données du bureau.', variant: 'destructive' });
      } finally {
        setBureauLoading(false);
      }
    };
    fetchBureauData();
  }, [toast]);

  const handleBureauSearch = useCallback((role, text) => {
    setSearchTextByRole(prev => ({ ...prev, [role]: text }));
    if (!text) {
      setSuggestionsByRole(prev => ({ ...prev, [role]: [] }));
      return;
    }
    const q = text.toLowerCase();
    const results = members
      .filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) || `${m.last_name} ${m.first_name}`.toLowerCase().includes(q))
      .slice(0, 10);
    setSuggestionsByRole(prev => ({ ...prev, [role]: results }));
  }, [members]);

  const handleSelectBureauSuggestion = (role, member) => {
    setAssignments(prev => ({ ...prev, [role]: { ...member, bureau_id: prev?.[role]?.bureau_id || null } }));
    setSearchTextByRole(prev => ({ ...prev, [role]: '' }));
    setSuggestionsByRole(prev => ({ ...prev, [role]: [] }));
  };

  const handleClearBureauRole = async (role) => {
    const assigned = assignments[role];
    if (!assigned || !assigned.bureau_id) {
      setAssignments(prev => ({ ...prev, [role]: null }));
      return;
    }
    setSavingRole(prev => ({ ...prev, [role]: true }));
    try {
      const { error } = await supabase.from('bureau').delete().eq('id', assigned.bureau_id);
      if (error) throw error;
      toast({ title: 'Supprimé', description: `Rôle ${role} libéré.` });
      setAssignments(prev => ({ ...prev, [role]: null }));
    } catch (err) {
      console.error('Erreur suppression rôle:', err);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le rôle.', variant: 'destructive' });
    } finally {
      setSavingRole(prev => ({ ...prev, [role]: false }));
    }
  };

  const handleSaveBureauRole = async (role) => {
    const member = assignments[role];
    if (!member) {
      toast({ title: 'Aucune sélection', description: `Sélectionnez un membre pour ${role}.`, variant: 'destructive' });
      return;
    }
    setSavingRole(prev => ({ ...prev, [role]: true }));
    try {
      let baseRole = role;
      let subRole = null;
      const parts = role.split(' ');
      const last = parts[parts.length - 1];
      if (last === 'Adjoint' || last === 'Adjointe') {
        subRole = last;
        baseRole = parts.slice(0, parts.length - 1).join(' ');
      }

      if (member.bureau_id) {
        const updates = { members_id: member.id, role: baseRole, sub_role: subRole };
        const { error } = await supabase.from('bureau').update(updates).eq('id', member.bureau_id);
        if (error) throw error;
      } else {
        const toInsert = { members_id: member.id, role: baseRole };
        if (subRole) toInsert.sub_role = subRole;
        const { error } = await supabase.from('bureau').insert([toInsert]);
        if (error) throw error;
      }

      toast({ title: 'Enregistré', description: `Le rôle ${role} a été attribué à ${member.first_name} ${member.last_name}.` });

      // Refresh assignments
      const { data: refreshed } = await supabase.from('bureau').select('id, members_id, role, sub_role');
      const map = {};
      (refreshed || []).forEach((b) => {
        const fullRole = b.sub_role ? `${b.role} ${b.sub_role}` : b.role;
        const mem = members.find(m => m.id === b.members_id);
        map[fullRole] = mem ? { ...mem, bureau_id: b.id } : null;
      });
      setAssignments(map);
    } catch (err) {
      console.error('Erreur save rôle:', err);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder le rôle.', variant: 'destructive' });
    } finally {
      setSavingRole(prev => ({ ...prev, [role]: false }));
    }
  };

  // Load Page Access Config (Tab 3)
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

  // Load Feature Permissions (Tab 4)
  useEffect(() => {
    if (!loadingConfig && config.permissions_config) {
      try {
        setPermissions(JSON.parse(config.permissions_config));
      } catch (e) {
        console.error("Failed to parse permissions_config:", e);
      }
    }
  }, [config.permissions_config, loadingConfig]);

  const handlePermissionChange = (role, permission, action, checked) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      if (!newPermissions[role]) {
        newPermissions[role] = {};
      }
      if (!newPermissions[role][permission]) {
        newPermissions[role][permission] = [];
      }
      if (checked) {
        if (!newPermissions[role][permission].includes(action)) {
          newPermissions[role][permission].push(action);
        }
      } else {
        newPermissions[role][permission] = newPermissions[role][permission].filter(a => a !== action);
      }
      return newPermissions;
    });
  };

  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    const { error } = await updateConfig('permissions_config', JSON.stringify(permissions));
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les permissions.", variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Permissions sauvegardées." });
    }
    setIsSavingPermissions(false);
  };

  if (authLoading || loadingConfig) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <ProtectedRoute pageTitle="Gestion des Autorisations" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-6">
        <Helmet><title>Gestion des Autorisations</title></Helmet>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold headline flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-primary" />
              Gestion des Autorisations
            </h1>
            <p className="text-muted-foreground mt-2">Gérez les utilisateurs, rôles, accès aux pages et permissions.</p>
          </div>
          <BackButton to="/admin-dashboard" variant="outline" size="sm" />
        </motion.div>

        {/* Role Logic Info Banner */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-semibold text-blue-900 dark:text-blue-100">Logique de détermination des rôles :</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li><strong>Admin</strong> : Rôle explicite dans la table "profiles"</li>
                  <li><strong>Bureau</strong> : Membre dans la table "bureau" avec rôle ≠ "Bénévole"</li>
                  <li><strong>Encadrant</strong> : Membre dans la table "bureau" avec rôle = "Bénévole"</li>
                  <li><strong>Adhérent</strong> : Membre dans la table "membres" avec groupe_id non vide</li>
                  <li><strong>User</strong> : Utilisateur authentifié (aucun des critères ci-dessus)</li>
                  <li><strong>Public</strong> : Utilisateur non authentifié</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <UserCog className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="bureau">
              <Users className="w-4 h-4 mr-2" />
              Bureau
            </TabsTrigger>
            <TabsTrigger value="pages">
              <Settings className="w-4 h-4 mr-2" />
              Accès Pages
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Permissions
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: User Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Gestion des Utilisateurs</CardTitle>
                    <CardDescription>Créez des comptes, liez-les aux membres et gérez les admins.</CardDescription>
                  </div>
                  <Button onClick={() => setCreateUserFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Créer un utilisateur
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Membre Lié</TableHead>
                        <TableHead>Rôle Admin</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.email}
                            {user.email_confirmed_at ? (
                              <Badge variant="outline" className="ml-2 border-green-500 text-green-500">Confirmé</Badge>
                            ) : (
                              <Badge variant="destructive" className="ml-2">Non confirmé</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isLinking === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                              user.members ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{formatName(user.members.first_name, user.members.last_name, true)}</Badge>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUnlinkMember(user.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <MemberSearchPopover onSelect={(member) => handleLinkMember(user.id, member)} existingLinks={existingMemberLinks}>
                                  <Button variant="outline" size="sm">
                                    <LinkIcon className="mr-2 h-4 w-4" /> Lier
                                  </Button>
                                </MemberSearchPopover>
                              )
                            )}
                          </TableCell>
                          <TableCell>
                            {user.id === currentUser.id ? (
                              <Badge>Vous (Admin)</Badge>
                            ) : isSubmitting === user.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : user.role === 'admin' ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive">Admin</Badge>
                                <Button variant="outline" size="sm" onClick={() => handleRemoveAdminRole(user.id)}>
                                  Retirer Admin
                                </Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleSetAdminRole(user.id)}>
                                Promouvoir Admin
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {user.id !== currentUser.id && !user.email_confirmed_at && (
                                <Button variant="outline" size="sm" onClick={() => handleConfirmUser(user.id, user.email)} disabled={isSubmitting === user.id}>
                                  <MailCheck className="h-4 w-4 mr-1" /> Confirmer
                                </Button>
                              )}
                              {user.id !== currentUser.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" disabled={isSubmitting === user.id}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Cette action est irréversible. Elle supprimera définitivement le compte de <strong>{user.email}</strong>.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteUser(user)}>Supprimer</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Bureau Management */}
          <TabsContent value="bureau" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion du Bureau</CardTitle>
                <CardDescription>
                  Attribuez les rôles du bureau. Les rôles "Bureau" donnent accès admin aux membres.
                  Le rôle "Bénévole" donne le statut d'encadrant.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bureauLoading ? (
                  <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="grid gap-4">
                    {BUREAU_ROLES.map((role) => (
                      <div key={role} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-semibold text-lg flex items-center gap-2">
                            {role}
                            {role === 'Bénévole' && (
                              <Badge variant="secondary" className="text-xs">= Encadrant</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleClearBureauRole(role)} disabled={savingRole[role]}>
                              <X className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleSaveBureauRole(role)} disabled={savingRole[role]}>
                              {savingRole[role] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Sauvegarder
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Actuellement :</Label>
                            {assignments[role] ? (
                              <div className="flex items-center justify-between p-2 bg-muted rounded mt-1">
                                <div>{assignments[role].first_name} {assignments[role].last_name}</div>
                                <div className="text-xs text-muted-foreground">ID: {assignments[role].id}</div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground mt-1">Aucun membre assigné</div>
                            )}
                          </div>
                          <div>
                            <Label>Rechercher un membre</Label>
                            <div className="relative mt-1">
                              <Input
                                placeholder="Tapez nom ou prénom..."
                                value={searchTextByRole[role] || ''}
                                onChange={(e) => handleBureauSearch(role, e.target.value)}
                              />
                              <div className="absolute right-3 top-3 text-muted-foreground"><Search className="w-4 h-4" /></div>
                              {(suggestionsByRole[role] || []).length > 0 && (
                                <div className="absolute left-0 right-0 bg-background border mt-1 max-h-60 overflow-auto z-20 rounded shadow-lg">
                                  {(suggestionsByRole[role] || []).map(s => (
                                    <div key={s.id} className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center" onClick={() => handleSelectBureauSuggestion(role, s)}>
                                      <div>{s.first_name} {s.last_name}</div>
                                      <div className="text-xs text-muted-foreground">ID: {s.id}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Page Access */}
          <TabsContent value="pages" className="space-y-4">
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
                      <TableHead className="text-center">User</TableHead>
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
                            <div className="flex justify-center">
                              <Checkbox
                                checked={page.roles.includes(role)}
                                onCheckedChange={(checked) => handleNavRoleChange(pageIndex, role, checked)}
                              />
                            </div>
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
                  Sauvegarder la Configuration
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Tab 4: Feature Permissions */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permissions des Fonctionnalités</CardTitle>
                <CardDescription>Définissez qui peut créer ou modifier chaque type de contenu.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ressource</TableHead>
                      {['admin', 'bureau', 'encadrant', 'adherent'].map(role => (
                        <TableHead key={role} colSpan={2} className="text-center capitalize">{role}</TableHead>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableHead></TableHead>
                      {['admin', 'bureau', 'encadrant', 'adherent'].map(role => (
                        <React.Fragment key={role}>
                          <TableHead className="text-center">Créer</TableHead>
                          <TableHead className="text-center">Modifier</TableHead>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSIONS.map(permission => {
                      const actions = permission.id === 'news_advanced' ? ADVANCED_NEWS_ACTIONS : ACTIONS;
                      const isAdvancedNews = permission.id === 'news_advanced';

                      return (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium">
                            {permission.label}
                            {isAdvancedNews && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Supprimer, Archiver, Voir non publiées
                              </div>
                            )}
                          </TableCell>
                          {['admin', 'bureau', 'encadrant', 'adherent'].map(role => (
                            <React.Fragment key={`${permission.id}-${role}`}>
                              {isAdvancedNews ? (
                                <TableCell colSpan={2} className="text-center">
                                  <div className="flex flex-col gap-1 items-center">
                                    {ADVANCED_NEWS_ACTIONS.map(action => (
                                      <label key={action} className="flex items-center gap-2 text-xs">
                                        <Checkbox
                                          checked={permissions[role]?.[permission.id]?.includes(action) || false}
                                          onCheckedChange={(checked) => handlePermissionChange(role, permission.id, action, checked)}
                                          disabled={role === 'admin'}
                                        />
                                        <span className="capitalize">
                                          {action === 'delete' ? 'Supprimer' : action === 'archive' ? 'Archiver' : 'Voir non publiées'}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </TableCell>
                              ) : (
                                <>
                                  {ACTIONS.map(action => (
                                    <TableCell key={`${permission.id}-${role}-${action}`} className="text-center">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={permissions[role]?.[permission.id]?.includes(action) || false}
                                          onCheckedChange={(checked) => handlePermissionChange(role, permission.id, action, checked)}
                                          disabled={role === 'admin'}
                                        />
                                      </div>
                                    </TableCell>
                                  ))}
                                </>
                              )}
                            </React.Fragment>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSavePermissions} disabled={isSavingPermissions}>
                  {isSavingPermissions ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Sauvegarder les Permissions
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <AnimatePresence>
          {isCreateUserFormOpen && (
            <CreateUserForm
              isOpen={isCreateUserFormOpen}
              onClose={() => setCreateUserFormOpen(false)}
              onUserCreated={fetchUsers}
            />
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
};

export default AuthorizationManagement;
