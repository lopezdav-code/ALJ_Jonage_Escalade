import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ShieldCheck, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useConfig } from '@/contexts/ConfigContext';

const ROLES = ['admin', 'bureau', 'encadrant', 'adherent'];
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

const Permissions = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { config, updateConfig, loadingConfig } = useConfig();
  const [permissions, setPermissions] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    const { error } = await updateConfig('permissions_config', JSON.stringify(permissions));
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les permissions.", variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Permissions sauvegardées." });
    }
    setIsSaving(false);
  };

  if (authLoading || loadingConfig) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <ProtectedRoute pageTitle="Gestion des Permissions">
      <div className="space-y-8">
        <Helmet><title>Gestion des Permissions</title></Helmet>
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-primary" />
            Gestion des Permissions Détaillées
          </h1>
          <p className="text-muted-foreground mt-2">Définissez qui peut créer ou modifier chaque type de contenu.</p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Tableau des Permissions</CardTitle>
            <CardDescription>Cochez les cases pour accorder les droits de création ou de modification à un rôle pour une ressource donnée.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ressource</TableHead>
                  {ROLES.map(role => (
                    <TableHead key={role} colSpan={2} className="text-center capitalize">{role}</TableHead>
                  ))}
                </TableRow>
                <TableRow>
                  <TableHead></TableHead>
                  {ROLES.map(role => (
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
                            Supprimer, Archiver, Voir news non publiées
                          </div>
                        )}
                      </TableCell>
                      {ROLES.map(role => (
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
                                  <Checkbox
                                    checked={permissions[role]?.[permission.id]?.includes(action) || false}
                                    onCheckedChange={(checked) => handlePermissionChange(role, permission.id, action, checked)}
                                    disabled={role === 'admin'}
                                  />
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
            <Button onClick={handleSavePermissions} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Sauvegarder les Permissions
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default Permissions;
