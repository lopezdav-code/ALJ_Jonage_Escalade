import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Database, Cloud, Key, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const DatabaseManagement = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute pageTitle="Gestion de la Base de Données" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-6">
        <Helmet>
          <title>Gestion de la Base de Données</title>
        </Helmet>

        {/* Bouton Retour */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <BackButton to="/admin-dashboard" variant="outline" className="mb-4">
            Retour au Tableau de Bord
          </BackButton>
        </motion.div>

        {/* En-tête */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 className="text-4xl font-bold headline flex items-center gap-3">
              <Database className="w-10 h-10 text-indigo-600" />
              Gestion de la Base de Données
            </h1>
            <p className="text-muted-foreground mt-2">Comprendre et gérer l'infrastructure Supabase</p>
          </div>
        </motion.div>

        {/* Contenu Principal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200">
            <CardContent className="pt-6">
              <Tabs defaultValue="explication" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="explication">Comment ça marche</TabsTrigger>
                  <TabsTrigger value="schema">Schéma DB</TabsTrigger>
                </TabsList>

                {/* Onglet Explication Supabase */}
                <TabsContent value="explication" className="space-y-4 mt-4">
                  <div className="bg-white rounded-lg p-4 space-y-4">
                    {/* Architecture Supabase */}
                    <div className="border-l-4 border-indigo-600 pl-4">
                      <h3 className="font-bold text-lg text-indigo-900 mb-2 flex items-center gap-2">
                        <Cloud className="w-5 h-5" />
                        Architecture Supabase
                      </h3>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="bg-indigo-50 p-3 rounded">
                          <p className="font-semibold text-indigo-900">PostgreSQL</p>
                          <p>Base de données relationnelle robuste stockant toutes les données du club (membres, compétitions, séances, etc.)</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="font-semibold text-blue-900">Authentication</p>
                          <p>Gestion sécurisée des comptes utilisateurs avec JWT (JSON Web Tokens). Chaque utilisateur a un ID unique lié aux permissions.</p>
                        </div>
                        <div className="bg-cyan-50 p-3 rounded">
                          <p className="font-semibold text-cyan-900">Row Level Security (RLS)</p>
                          <p>Politiques de sécurité au niveau des lignes. Chaque utilisateur ne voit que les données autorisées selon son rôle.</p>
                        </div>
                        <div className="bg-teal-50 p-3 rounded">
                          <p className="font-semibold text-teal-900">Edge Functions</p>
                          <p>Fonctions serverless exécutées en réponse à des événements. Utilisées pour les tâches administratives sensibles (création de comptes, assignation de rôles).</p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded">
                          <p className="font-semibold text-emerald-900">Storage Buckets</p>
                          <p>Stockage cloud pour les fichiers : photos de membres (privé), images de compétitions (privé), actualités (public).</p>
                        </div>
                      </div>
                    </div>

                    {/* Flux de Sécurité */}
                    <div className="border-l-4 border-green-600 pl-4">
                      <h3 className="font-bold text-lg text-green-900 mb-2 flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Flux de Sécurité
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className="text-green-600 font-bold">1.</span>
                          <p><span className="font-semibold">Connexion</span> → Email/password → Supabase Auth crée une session JWT</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-green-600 font-bold">2.</span>
                          <p><span className="font-semibold">Récupération du profil</span> → Requête à la table `profiles` avec l'ID utilisateur</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-green-600 font-bold">3.</span>
                          <p><span className="font-semibold">Vérification du rôle</span> → Lecture du champ `role` (admin, bureau, encadrant, etc.)</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-green-600 font-bold">4.</span>
                          <p><span className="font-semibold">Contrôle d'accès</span> → RLS policies appliquées automatiquement par PostgreSQL</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-green-600 font-bold">5.</span>
                          <p><span className="font-semibold">Audit</span> → Les logs de connexion sont enregistrés pour la traçabilité</p>
                        </div>
                      </div>
                    </div>

                    {/* Tables Principales */}
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h3 className="font-bold text-lg text-purple-900 mb-2 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Tables Principales
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="font-semibold text-purple-900">profiles</p>
                          <p className="text-xs text-muted-foreground">Rôles utilisateurs (admin, bureau, encadrant)</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="font-semibold text-purple-900">members</p>
                          <p className="text-xs text-muted-foreground">Adhérents du club avec infos personnelles</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="font-semibold text-purple-900">competitions</p>
                          <p className="text-xs text-muted-foreground">Événements sportifs et résultats</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="font-semibold text-purple-900">session_logs</p>
                          <p className="text-xs text-muted-foreground">Historique des séances d'entraînement</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="font-semibold text-purple-900">bureau</p>
                          <p className="text-xs text-muted-foreground">Rôles spécifiques (Président, Trésorier)</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="font-semibold text-purple-900">config</p>
                          <p className="text-xs text-muted-foreground">Configuration dynamique de l'app</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button asChild className="w-full" variant="outline">
                    <Link to="/database-schema">
                      <Database className="w-4 h-4 mr-2" />
                      Voir le Schéma Détaillé
                    </Link>
                  </Button>
                </TabsContent>

                {/* Onglet Schéma Visuel */}
                <TabsContent value="schema" className="space-y-4 mt-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-4">Relations entre les tables principales :</p>
                    <div className="bg-gray-50 rounded-lg p-6 overflow-x-auto">
                      <svg viewBox="0 0 800 400" className="w-full min-w-max">
                        {/* Legend */}
                        <text x="10" y="20" className="text-xs font-bold" fill="#333">Tables Principales</text>

                        {/* Supabase Auth Box */}
                        <rect x="20" y="40" width="120" height="80" fill="#6366f1" stroke="#4f46e5" strokeWidth="2" rx="4"/>
                        <text x="30" y="60" className="text-xs font-bold" fill="white">auth.users</text>
                        <text x="30" y="75" className="text-xs" fill="white">id (UUID)</text>
                        <text x="30" y="90" className="text-xs" fill="white">email</text>
                        <text x="30" y="105" className="text-xs" fill="white">password_hash</text>
                        <text x="30" y="115" className="text-xs" fill="white">(Supabase)</text>

                        {/* Profiles Box */}
                        <rect x="200" y="40" width="130" height="100" fill="#3b82f6" stroke="#2563eb" strokeWidth="2" rx="4"/>
                        <text x="210" y="60" className="text-xs font-bold" fill="white">profiles</text>
                        <text x="210" y="75" className="text-xs" fill="white">id (FK → auth.users)</text>
                        <text x="210" y="90" className="text-xs" fill="white">role (admin, bureau...)</text>
                        <text x="210" y="105" className="text-xs" fill="white">member_id (FK)</text>
                        <text x="210" y="120" className="text-xs" fill="white">created_at</text>

                        {/* Members Box */}
                        <rect x="380" y="40" width="120" height="100" fill="#06b6d4" stroke="#0891b2" strokeWidth="2" rx="4"/>
                        <text x="390" y="60" className="text-xs font-bold" fill="white">members</text>
                        <text x="390" y="75" className="text-xs" fill="white">id (PK)</text>
                        <text x="390" y="90" className="text-xs" fill="white">first_name, last_name</text>
                        <text x="390" y="105" className="text-xs" fill="white">groupe_id (FK)</text>
                        <text x="390" y="120" className="text-xs" fill="white">contact info</text>

                        {/* Bureau Box */}
                        <rect x="550" y="40" width="120" height="100" fill="#f59e0b" stroke="#d97706" strokeWidth="2" rx="4"/>
                        <text x="560" y="60" className="text-xs font-bold" fill="white">bureau</text>
                        <text x="560" y="75" className="text-xs" fill="white">id (PK)</text>
                        <text x="560" y="90" className="text-xs" fill="white">members_id (FK)</text>
                        <text x="560" y="105" className="text-xs" fill="white">role (Président...)</text>
                        <text x="560" y="120" className="text-xs" fill="white">sub_role</text>

                        {/* Groupe Box */}
                        <rect x="20" y="180" width="120" height="80" fill="#10b981" stroke="#059669" strokeWidth="2" rx="4"/>
                        <text x="30" y="200" className="text-xs font-bold" fill="white">groupe</text>
                        <text x="30" y="215" className="text-xs" fill="white">id (PK)</text>
                        <text x="30" y="230" className="text-xs" fill="white">category</text>
                        <text x="30" y="245" className="text-xs" fill="white">sous_category</text>

                        {/* Session Logs Box */}
                        <rect x="200" y="180" width="130" height="100" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2" rx="4"/>
                        <text x="210" y="200" className="text-xs font-bold" fill="white">session_logs</text>
                        <text x="210" y="215" className="text-xs" fill="white">id (PK)</text>
                        <text x="210" y="230" className="text-xs" fill="white">groupe_id (FK)</text>
                        <text x="210" y="245" className="text-xs" fill="white">date, instructor</text>
                        <text x="210" y="260" className="text-xs" fill="white">attendance info</text>

                        {/* Competitions Box */}
                        <rect x="380" y="180" width="130" height="100" fill="#ec4899" stroke="#db2777" strokeWidth="2" rx="4"/>
                        <text x="390" y="200" className="text-xs font-bold" fill="white">competitions</text>
                        <text x="390" y="215" className="text-xs" fill="white">id (PK)</text>
                        <text x="390" y="230" className="text-xs" fill="white">name, date</text>
                        <text x="390" y="245" className="text-xs" fill="white">location</text>
                        <text x="390" y="260" className="text-xs" fill="white">results</text>

                        {/* Config Box */}
                        <rect x="550" y="180" width="120" height="80" fill="#6b7280" stroke="#4b5563" strokeWidth="2" rx="4"/>
                        <text x="560" y="200" className="text-xs font-bold" fill="white">config</text>
                        <text x="560" y="215" className="text-xs" fill="white">key (PK)</text>
                        <text x="560" y="230" className="text-xs" fill="white">value (JSON)</text>
                        <text x="560" y="245" className="text-xs" fill="white">nav_config, etc</text>

                        {/* Arrows */}
                        <line x1="140" y1="80" x2="200" y2="80" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                        <line x1="330" y1="100" x2="380" y2="90" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                        <line x1="500" y1="90" x2="550" y2="90" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                        <line x1="440" y1="140" x2="80" y2="180" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                        <line x1="250" y1="140" x2="260" y2="180" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                        <line x1="440" y1="140" x2="440" y2="180" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                        {/* Arrow marker definition */}
                        <defs>
                          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                            <polygon points="0 0, 10 3, 0 6" fill="#999"/>
                          </marker>
                        </defs>
                      </svg>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">FK = Foreign Key (clé étrangère) | PK = Primary Key (clé primaire)</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default DatabaseManagement;
