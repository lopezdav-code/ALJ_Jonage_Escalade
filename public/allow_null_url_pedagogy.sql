-- Étape 1: Modifier la contrainte NOT NULL sur la colonne url
-- pour permettre les valeurs NULL

ALTER TABLE pedagogy_sheets 
ALTER COLUMN url DROP NOT NULL;
