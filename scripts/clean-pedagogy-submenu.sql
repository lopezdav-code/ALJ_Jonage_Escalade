-- Script pour nettoyer la configuration de navigation des sous-menus de Fiches Pédagogiques
-- Ce script met à jour la table site_config pour supprimer le sous-menu de "Fiches Pédagogiques"

-- Option 1: Supprimer complètement la config de navigation pour utiliser la config par défaut du code
UPDATE site_config 
SET nav_config = NULL 
WHERE key = 'nav_config';

-- Option 2: Si vous avez besoin de garder une config custom, utilisez cette requête pour nettoyer seulement le sous-menu
-- UPDATE site_config 
-- SET nav_config = jsonb_set(
--   nav_config::jsonb,
--   '{pedagogy}',
--   '{"to": "/pedagogy", "text": "Fiches Pédagogiques", "roles": ["adherent", "admin"]}'::jsonb
-- )
-- WHERE key = 'nav_config';

-- Vérification de la configuration actuelle
SELECT key, nav_config FROM site_config WHERE key = 'nav_config';
