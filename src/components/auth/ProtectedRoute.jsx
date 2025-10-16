import React from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { usePageAccess } from '@/hooks/usePageAccess';

/**
 * Composant pour protéger les routes basé sur la configuration dynamique des permissions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu à afficher si l'utilisateur est autorisé
 * @param {string} props.pagePath - Chemin de la page (optionnel, utilise location.pathname par défaut)
 * @param {string} props.pageTitle - Titre de la page pour l'écran de blocage
 * @param {string} props.message - Message personnalisé pour l'écran de blocage
 * @param {string} props.fallbackMessage - Message par défaut si aucun message n'est fourni
 */
const ProtectedRoute = ({
  children,
  pagePath = null,
  pageTitle = "Page protégée",
  message = null,
  fallbackMessage = "Cette page est réservée aux membres autorisés du club. Veuillez vous connecter avec un compte disposant des permissions nécessaires."
}) => {
  const { hasAccess, loading, userRole, allowedRoles } = usePageAccess(pagePath);

  // Attendre que la vérification des permissions soit terminée
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si l'utilisateur n'a pas accès, afficher l'écran de blocage
  if (!hasAccess) {
    // Construire un message personnalisé basé sur les rôles autorisés
    const displayMessage = message || fallbackMessage;

    let roleMessage = "Cette page est réservée aux membres autorisés du club.";
    if (allowedRoles.length > 0) {
      const roleNames = {
        'public': 'visiteurs',
        'user': 'utilisateurs connectés',
        'adherent': 'adhérents',
        'bureau': 'membres du bureau',
        'encadrant': 'encadrants',
        'admin': 'administrateurs'
      };

      const allowedRoleNames = allowedRoles
        .filter(role => role !== 'public')
        .map(role => roleNames[role] || role);

      if (allowedRoleNames.length > 0) {
        roleMessage = `Cette page est réservée aux ${allowedRoleNames.join(', ')}.`;
      }
    }
    return (
      <div className="text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <Helmet>
            <title>{pageTitle} - Accès restreint</title>
          </Helmet>
          <div className="mb-6 flex justify-center">
            <div className="bg-amber-100 dark:bg-amber-900 p-6 rounded-full">
              <Lock className="w-16 h-16 text-amber-600 dark:text-amber-300" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Accès restreint
          </h1>
          <p className="text-muted-foreground mb-2">
            {message || roleMessage}
          </p>
          {userRole && userRole !== 'public' && (
            <p className="text-sm text-muted-foreground mb-6">
              Votre rôle actuel : <strong>{userRole}</strong>
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Si l'utilisateur a accès, afficher le contenu
  return <>{children}</>;
};

export default ProtectedRoute;
