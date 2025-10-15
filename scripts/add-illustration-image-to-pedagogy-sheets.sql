-- Ajouter la colonne illustration_image à la table pedagogy_sheets
-- Cette image servira d'illustration pour la fiche pédagogique
-- À exécuter dans SQL Editor de Supabase

ALTER TABLE pedagogy_sheets
ADD COLUMN illustration_image TEXT;

COMMENT ON COLUMN pedagogy_sheets.illustration_image IS 'Nom du fichier image d''illustration stocké dans le bucket pedagogy_files (différent de l''image de l''exercice dans url)';
