import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Lock, Users, Shield, Users2, GitBranch, LogIn, Settings, ArrowRight, Database, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const AdminDashboard = () => {
  const { loading: authLoading } = useAuth();

  const adminActions = [
    {
      id: 'authorization',
      title: '🔐 Gestion des Autorisations',
      description: 'Gérer les utilisateurs, rôles bureau, accès aux pages et permissions détaillées',
      route: '/authorization',
      roles: ['admin'],
      icon: Shield,
      color: 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300 hover:from-blue-100 hover:to-purple-100',
      iconColor: 'text-blue-600',
      badge: 'Nouvelle Interface',
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
    {
      id: 'specifications',
      title: '📄 Spécifications Techniques',
      description: 'Documentation complète des pages, architecture et flux utilisateur',
      route: '/specifications',
      roles: ['admin'],
      icon: FileText,
      color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      id: 'competition-management',
      title: '🏆 Gestion de Compétition',
      description: 'Importer les inscriptions Excel, gérer les dossards et imprimer les feuilles de score',
      route: '/competition-management',
      roles: ['admin'],
      icon: FileSpreadsheet,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600',
      badge: 'Nouveau',
    },
    {
      id: 'helloasso',
      title: '🎫 HelloAsso',
      description: 'Connexion API V5, récupération des commandes et sauvegarde',
      route: '/helloasso',
      roles: ['admin'],
      icon: LogIn, // Using LogIn as a placeholder, could be Ticket or similar if available
      color: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
      iconColor: 'text-pink-600',
      badge: 'API V5',
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

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <BackButton to="/" />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold headline flex items-center gap-3">
                <Lock className="w-10 h-10 text-primary" />
                Tableau de Bord Administration
              </h1>
              <p className="text-muted-foreground mt-2">Accédez aux outils d'administration et de gestion du club</p>
            </div>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg">{action.title}</CardTitle>
                            {action.badge && (
                              <Badge variant="default" className="text-xs bg-blue-600">
                                {action.badge}
                              </Badge>
                            )}
                          </div>
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
