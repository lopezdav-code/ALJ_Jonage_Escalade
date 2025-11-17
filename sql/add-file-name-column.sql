-- Migration: Ajout de la colonne file_name pour tracer les uploads
-- Date: 2025-11-17
-- Description: Ajoute une colonne pour enregistrer le nom du fichier Excel uploadé

-- Étape 1: Ajouter la colonne si elle n'existe pas
ALTER TABLE competition_registrations
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);

-- Étape 2: Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_competition_registrations_file_name
ON competition_registrations(file_name);

-- Étape 3: Vérifier les résultats
-- Décommenter pour voir les fichiers uploadés
/*
SELECT
  file_name,
  COUNT(*) as total,
  MIN(created_at) as first_upload
FROM competition_registrations
WHERE file_name IS NOT NULL
GROUP BY file_name
ORDER BY first_upload DESC;
*/
