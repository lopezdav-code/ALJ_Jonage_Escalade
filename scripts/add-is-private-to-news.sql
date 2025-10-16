-- Script pour ajouter le champ is_private à la table news
-- Ce champ permettra de gérer la visibilité des actualités

-- Ajouter la colonne is_private (par défaut false = public)
ALTER TABLE news
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN news.is_private IS 'Indique si l''actualité est réservée aux adhérents (true) ou publique (false)';

-- Créer un index pour optimiser les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_news_is_private ON news(is_private);

-- Afficher un résumé
SELECT
  'Colonne is_private ajoutée avec succès' AS message,
  COUNT(*) AS total_news,
  COUNT(*) FILTER (WHERE is_private = true) AS news_privees,
  COUNT(*) FILTER (WHERE is_private = false) AS news_publiques
FROM news;
