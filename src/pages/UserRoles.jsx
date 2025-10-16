import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserCog, PlusCircle, Link as LinkIcon, X, UserPlus, Search, Trash2, MailCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatName } from '@/lib/utils.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const USER_ROLES = ['admin', 'bureau', 'encadrant', 'adherent', 'user'];

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
    const [role, setRole] = useState('user');
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
          role,
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
                        Créez un compte et liez-le à un profil de membre existant. Le compte sera validé automatiquement.
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
                        <Label>Rôle</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{USER_ROLES.map(r => <SelectItem key={r} value={r}><span className="capitalize">{r}</span></SelectItem>)}</SelectContent>
                        </Select>
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
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            Créer l'utilisateur
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const UserRoles = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isCreateUserFormOpen, setCreateUserFormOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
        const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*, members(id, first_name, last_name)');
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
        setLoading(false);
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
    if(error){
        toast({ title: "Erreur", description: "Impossible de lier le membre.", variant: "destructive" });
    } else {
        toast({ title: "Succès", description: "Membre lié au profil." });
        fetchUsers();
    }
    setIsLinking(null);
  }

  const handleUnlinkMember = async (profileId) => {
    setIsLinking(profileId);
    const { error } = await supabase.from('profiles').update({ member_id: null }).eq('id', profileId);
     if(error){
        toast({ title: "Erreur", description: "Impossible de délier le membre.", variant: "destructive" });
    } else {
        toast({ title: "Succès", description: "Membre délié du profil." });
        fetchUsers();
    }
    setIsLinking(null);
  }

  const handleRoleChange = async (userId, newRole) => {
    setIsSubmitting(userId);
    try {
      const { data, error } = await supabase.functions.invoke('set-user-role', { body: { userId, role: newRole } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast({ title: "Succès", description: "Le rôle a été mis à jour." });
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

  return (
    <ProtectedRoute pageTitle="Gestion des Rôles">
      <div className="space-y-8">
        <Helmet><title>Gestion des Rôles</title></Helmet>
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
          <div>
              <h1 className="text-4xl font-bold headline flex items-center gap-3">
              <UserCog className="w-10 h-10 text-primary" />
              Gestion des Rôles Utilisateurs
              </h1>
              <p className="text-muted-foreground mt-2">Gérez les rôles des utilisateurs et leurs comptes.</p>
          </div>
          <Button onClick={() => setCreateUserFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Créer un utilisateur
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Rôles des Utilisateurs</CardTitle>
              <CardDescription>Liste de tous les utilisateurs inscrits.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Adhérent Lié</TableHead><TableHead>Rôle</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                          <TableCell className="font-medium truncate max-w-[200px]">
                              {user.email}
                              {!user.email_confirmed_at && <Badge variant="outline" className="ml-2">Non confirmé</Badge>}
                          </TableCell>
                          <TableCell>
                              {isLinking === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : (
                                  user.members ? (
                                      <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="truncate">{formatName(user.members.first_name, user.members.last_name, true)}</Badge>
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUnlinkMember(user.id)}><X className="h-4 w-4"/></Button>
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
                              {user.id === currentUser.id ? (<Badge>Vous (Admin)</Badge>) : isSubmitting === user.id ? (<div className="flex justify-start"><Loader2 className="w-5 h-5 animate-spin" /></div>) : (
                              <Select value={user.role || 'user'} onValueChange={(newRole) => handleRoleChange(user.id, newRole)}>
                                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="Rôle" /></SelectTrigger>
                                  <SelectContent>{USER_ROLES.map(role => (<SelectItem key={role} value={role}><span className="capitalize">{role}</span></SelectItem>))}</SelectContent>
                              </Select>
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
        </motion.div>
      </div>
      <AnimatePresence>
          {isCreateUserFormOpen && (
              <CreateUserForm 
                  isOpen={isCreateUserFormOpen} 
                  onClose={() => setCreateUserFormOpen(false)}
                  onUserCreated={fetchUsers}
              />
          )}
      </AnimatePresence>
    </ProtectedRoute>
  );
};

export default UserRoles;
