-- Migration: Ajout de la colonne SEXE pour le sexe du participant
-- Date: 2025-11-17
-- Description: Ajoute une colonne pour enregistrer le sexe du participant (Homme/Femme)

-- Étape 1: Ajouter la colonne si elle n'existe pas
ALTER TABLE competition_registrations
ADD COLUMN IF NOT EXISTS sexe VARCHAR(1);

-- Étape 2: Ajouter un commentaire
COMMENT ON COLUMN competition_registrations.sexe IS 'Sexe du participant: H (Homme) ou F (Femme)';

-- Étape 3: Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_competition_registrations_sexe
ON competition_registrations(sexe);
