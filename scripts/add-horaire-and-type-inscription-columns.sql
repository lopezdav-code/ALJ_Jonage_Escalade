-- Migration: Ajout des colonnes horaire et type_inscription
-- Date: 2025-11-17
-- Description: Ajoute les colonnes pour gérer le type d'inscription et l'horaire

-- Étape 1: Ajouter les colonnes si elles n'existent pas
ALTER TABLE competition_registrations
ADD COLUMN IF NOT EXISTS horaire VARCHAR(50),
ADD COLUMN IF NOT EXISTS type_inscription VARCHAR(50);

-- Étape 2: Mettre à jour les valeurs basées sur la colonne "tarif"
-- Cette mise à jour s'applique uniquement si les colonnes sont vides
UPDATE competition_registrations
SET
  type_inscription = CASE
    WHEN tarif ILIKE '%Précommande Buvette%' THEN 'Buvette'
    WHEN tarif ILIKE '%Dimanche Matin Enfants%' THEN 'Compétition'
    WHEN tarif ILIKE '%Après-midi%' THEN 'Compétition'
    ELSE 'Compétition'
  END,
  horaire = CASE
    WHEN tarif ILIKE '%Dimanche Matin Enfants%' THEN 'matin'
    WHEN tarif ILIKE '%Après-midi%' THEN 'après-midi'
    ELSE NULL
  END
WHERE type_inscription IS NULL
  AND horaire IS NULL;

-- Étape 3 (OPTIONNEL): Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_competition_registrations_horaire
ON competition_registrations(horaire);

CREATE INDEX IF NOT EXISTS idx_competition_registrations_type_inscription
ON competition_registrations(type_inscription);

-- Étape 4: Vérifier les résultats
-- Décommenter pour voir la distribution
/*
SELECT
  horaire,
  type_inscription,
  COUNT(*) as total
FROM competition_registrations
GROUP BY horaire, type_inscription
ORDER BY horaire, type_inscription;
*/
