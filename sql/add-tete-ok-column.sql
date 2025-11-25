-- Migration: Ajout de la colonne tete_OK pour indiquer si une personne sait monter en tête
-- Date: 2025-11-25
-- Description: Ajoute une colonne BOOLEAN pour enregistrer si un membre sait monter en tête

-- Étape 1: Ajouter la colonne si elle n'existe pas
ALTER TABLE members
ADD COLUMN IF NOT EXISTS tete_ok BOOLEAN DEFAULT NULL;

-- Étape 2: Ajouter un commentaire
COMMENT ON COLUMN members.tete_ok IS 'Indique si le membre sait monter en tête (lead climbing)';

-- Étape 3: Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_members_tete_ok
ON members(tete_ok);
