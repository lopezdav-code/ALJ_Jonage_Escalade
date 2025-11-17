-- Migration: Ajout de la colonne categorie_age (calculée automatiquement)
-- Date: 2025-11-17
-- Description: Ajoute une colonne pour stocker la catégorie d'âge calculée à partir de la date de naissance

-- Étape 1: Ajouter la colonne si elle n'existe pas
ALTER TABLE competition_registrations
ADD COLUMN IF NOT EXISTS categorie_age VARCHAR(50);

-- Étape 2: Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_competition_registrations_categorie_age
ON competition_registrations(categorie_age);

-- Étape 3: Créer la fonction pour calculer la catégorie d'âge
CREATE OR REPLACE FUNCTION calculate_age_category(birth_date DATE)
RETURNS VARCHAR AS $$
DECLARE
  birth_year INTEGER;
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;

  birth_year := EXTRACT(YEAR FROM birth_date);

  -- Règles de catégorisation par année de naissance (identiques au frontend)
  IF birth_year >= 2016 THEN
    RETURN 'U11';
  ELSIF birth_year >= 2014 THEN
    RETURN 'U13';
  ELSIF birth_year >= 2012 THEN
    RETURN 'U15';
  ELSIF birth_year >= 2010 THEN
    RETURN 'U17';
  ELSIF birth_year >= 2008 THEN
    RETURN 'U19';
  ELSIF birth_year >= 1987 THEN
    RETURN 'Sénior';
  ELSIF birth_year >= 1977 THEN
    RETURN 'Vétéran 1';
  ELSE
    RETURN 'Vétéran 2';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Étape 4: Mettre à jour les catégories existantes
UPDATE competition_registrations
SET categorie_age = calculate_age_category(date_naissance)
WHERE categorie_age IS NULL AND date_naissance IS NOT NULL;

-- Étape 5: Créer un trigger pour mettre à jour automatiquement la catégorie à chaque modification
CREATE OR REPLACE FUNCTION update_age_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour la catégorie d'âge si la date de naissance change
  IF NEW.date_naissance IS DISTINCT FROM OLD.date_naissance THEN
    NEW.categorie_age := calculate_age_category(NEW.date_naissance);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_age_category ON competition_registrations;
CREATE TRIGGER trigger_update_age_category
  BEFORE INSERT OR UPDATE ON competition_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_age_category();

-- Étape 6: Commentaires
COMMENT ON COLUMN competition_registrations.categorie_age IS 'Catégorie d''âge calculée automatiquement à partir de la date de naissance (U11, U13, U15, U17, U19, Sénior, Vétéran 1, Vétéran 2)';
COMMENT ON FUNCTION calculate_age_category(DATE) IS 'Fonction pour calculer la catégorie d''âge basée sur l''année de naissance';
COMMENT ON FUNCTION update_age_category() IS 'Trigger pour mettre à jour automatiquement la catégorie d''âge lors d''une modification de date de naissance';
