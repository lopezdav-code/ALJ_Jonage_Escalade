import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Lock, Users, Shield, Users2, GitBranch, LogIn, Settings, ArrowRight, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const AdminDashboard = () => {
  const { loading: authLoading } = useAuth();

  const adminActions = [
    {
      id: 'user-roles',
      title: '🔐 Gestion des Logins',
      description: 'Créer et gérer les comptes utilisateurs, attribuer les rôles de base',
      route: '/user-roles',
      roles: ['admin'],
      icon: Users,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'admin-management',
      title: '🎯 Gestion des Accès Profils',
      description: 'Gérer les accès aux pages du menu selon les rôles, configuration globale du site',
      route: '/admin-management',
      roles: ['admin'],
      icon: Settings,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      id: 'permissions',
      title: '🔑 Gestion Accès Détaillés',
      description: 'Configurer les permissions fines (créer, éditer) pour chaque type de ressource par rôle',
      route: '/permissions',
      roles: ['admin'],
      icon: Shield,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      id: 'groupe-admin',
      title: '👥 Groupes de Grimpe',
      description: 'Créer et gérer les groupes/classes de grimpe, catégories et calendriers',
      route: '/groupes/admin',
      roles: ['admin'],
      icon: Users2,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      id: 'bureau-management',
      title: '🎖️ Gestion du Bureau',
      description: 'Attribuer les rôles du bureau (Président, Trésorier, Secrétaire, etc.)',
      route: '/bureau-management',
      roles: ['admin', 'bureau'],
      icon: Lock,
      color: 'bg-red-50 border-red-200 hover:bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      id: 'member-group-test',
      title: '🗂️ Attribution Groupes',
      description: 'Assigner les membres aux groupes de grimpe, gérer les bénévoles',
      route: '/member-group-test',
      roles: ['admin'],
      icon: GitBranch,
      color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
      iconColor: 'text-cyan-600',
    },
    {
      id: 'connection-logs',
      title: '📋 Logs Connexion',
      description: 'Consulter l\'historique des connexions et des actions des utilisateurs',
      route: '/connection-logs',
      roles: ['admin'],
      icon: LogIn,
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      id: 'database-management',
      title: '🗄️ Gestion de la Base de Données',
      description: 'Comprendre l\'architecture Supabase, visualiser le schéma et les relations',
      route: '/database-management',
      roles: ['admin'],
      icon: Database,
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
  ];

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute pageTitle="Administration" message="Cette page est réservée aux administrateurs et aux membres du bureau.">
      <div className="space-y-8">
        <Helmet>
          <title>Administration</title>
        </Helmet>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold headline flex items-center gap-3">
              <Lock className="w-10 h-10 text-primary" />
              Tableau de Bord Administration
            </h1>
            <p className="text-muted-foreground mt-2">Accédez aux outils d'administration et de gestion du club</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {adminActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link to={action.route}>
                  <Card className={`cursor-pointer transition-all duration-300 border-2 h-full ${action.color}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                          <CardDescription className="mt-2">{action.description}</CardDescription>
                        </div>
                        <IconComponent className={`w-6 h-6 ${action.iconColor} ml-2 flex-shrink-0`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {action.roles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role === 'admin' ? '👨‍💼 Admin' : role === 'bureau' ? '🎖️ Bureau' : role}
                            </Badge>
                          ))}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Section Informations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-12 pt-8 border-t">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                À Propos de l'Administration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>Rôles d'accès :</strong>
                <ul className="ml-4 mt-2 space-y-1 text-muted-foreground">
                  <li>• <strong>Admin</strong> : Accès complet à tous les outils</li>
                  <li>• <strong>Bureau</strong> : Accès limité à la gestion du bureau et certains outils</li>
                </ul>
              </div>
              <div>
                <strong>Sécurité :</strong>
                <p className="ml-4 mt-1 text-muted-foreground">
                  Tous les accès sont enregistrés. Les pages d'administration ne peuvent être consultées que par les rôles autorisés.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
