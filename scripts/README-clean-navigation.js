// Script simple pour vérifier et nettoyer la configuration de navigation dans Supabase
// Exécutez ce SQL directement dans l'éditeur SQL de Supabase

/*
-- Étape 1: Voir la configuration actuelle
SELECT * FROM site_config WHERE key = 'nav_config';

-- Étape 2: Supprimer la configuration (pour utiliser celle par défaut du code)
DELETE FROM site_config WHERE key = 'nav_config';

-- OU si vous voulez juste mettre à NULL
UPDATE site_config SET value = NULL WHERE key = 'nav_config';

-- Étape 3: Vérifier que c'est bien supprimé
SELECT * FROM site_config WHERE key = 'nav_config';
*/

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Instructions pour nettoyer la configuration de navigation    ║
╚════════════════════════════════════════════════════════════════╝

1. Ouvrez Supabase Dashboard
2. Allez dans SQL Editor
3. Exécutez la requête suivante:

   DELETE FROM site_config WHERE key = 'nav_config';

4. Rafraîchissez votre navigateur (Ctrl+F5 pour vider le cache)

Le sous-menu "Fiches Pédagogiques" devrait maintenant avoir disparu !

Alternative: Le useEffect a été commenté dans Navigation.jsx,
donc la config par défaut devrait déjà être utilisée après
un rafraîchissement du navigateur.
`);
