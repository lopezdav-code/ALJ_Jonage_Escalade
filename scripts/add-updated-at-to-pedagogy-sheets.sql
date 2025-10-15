-- Ajouter la colonne updated_at à la table pedagogy_sheets
-- À exécuter dans SQL Editor de Supabase

ALTER TABLE pedagogy_sheets
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Optionnel : mettre à jour les enregistrements existants avec la date actuelle
UPDATE pedagogy_sheets
SET updated_at = NOW()
WHERE updated_at IS NULL;