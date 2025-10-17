-- Script pour ajouter le champ status à la table news
-- Ce champ permettra de gérer le cycle de vie des actualités

-- Créer un type ENUM pour les statuts possibles
DO $$ BEGIN
    CREATE TYPE news_status AS ENUM ('en_cours_redaction', 'publie', 'archive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajouter la colonne status avec la valeur par défaut 'publie'
-- pour les news existantes
ALTER TABLE news
ADD COLUMN IF NOT EXISTS status news_status DEFAULT 'publie';

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN news.status IS 'Statut de l''actualité : en_cours_redaction, publie, archive';

-- Créer un index pour optimiser les requêtes de filtrage par statut
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);

-- Afficher un résumé des statuts
SELECT
  'Colonne status ajoutée avec succès' AS message,
  COUNT(*) AS total_news,
  COUNT(*) FILTER (WHERE status = 'en_cours_redaction') AS news_en_cours,
  COUNT(*) FILTER (WHERE status = 'publie') AS news_publiees,
  COUNT(*) FILTER (WHERE status = 'archive') AS news_archivees
FROM news;
