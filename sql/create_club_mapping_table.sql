-- Migration: Création de la table de mapping dynamique des clubs
-- Date: 2025-11-17
-- Description: Permet de gérer dynamiquement le mapping des noms de clubs

-- Créer la table club_mapping
CREATE TABLE IF NOT EXISTS club_mapping (
  id SERIAL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL UNIQUE,
  mapped_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur original_name pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_club_mapping_original_name
ON club_mapping(original_name);

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_club_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_club_mapping_updated_at
  BEFORE UPDATE ON club_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_club_mapping_updated_at();

-- Pré-remplir la table avec les mappings existants
INSERT INTO club_mapping (original_name, mapped_name) VALUES
  ('Corb''Alp', 'Corb''Alp'),
  ('Mousteclip', 'Mousteclip'),
  ('CORB''ALP', 'Corb''Alp'),
  ('Corb''alp', 'Corb''Alp'),
  ('CESV', 'CESV ESCALADE'),
  ('ALJ', 'ALJ'),
  ('Alj', 'ALJ'),
  ('AL Jonage', 'ALJ'),
  ('lyon escalade', 'lyon escalade'),
  ('Amicale laïque d''Anse', 'Amicale laïque d''Anse'),
  ('Amicale laïque D''Anse', 'Amicale laïque d''Anse'),
  ('AJJ', 'ALJ'),
  ('Lyon escalade sportive', 'Lyon escalade sportive'),
  ('Jonage', 'ALJ'),
  ('CESV ESCALADE', 'CESV ESCALADE'),
  ('AL Anse', 'Amicale laïque d''Anse'),
  ('al anse', 'Amicale laïque d''Anse'),
  ('espace escalade', 'espace escalade'),
  ('Les 5 mousquetons', 'Les 5 mousquetons'),
  ('LES 5 MOUSQUETONS', 'Les 5 mousquetons'),
  ('Meyzieu', 'Meyzieu Escalade et Montagne'),
  ('Meyzieu Escalade', 'Meyzieu Escalade et Montagne'),
  ('CHASSIEU AVENTURE', 'CHASSIEU AVENTURE'),
  ('Meyzieu Escalade et Montagne', 'Meyzieu Escalade et Montagne'),
  ('Vertige', 'Club vertige'),
  ('Al Escalade Anse', 'Amicale laïque d''Anse'),
  ('Club vertige', 'Club vertige'),
  ('HORS CLUB', 'HORS CLUB')
ON CONFLICT (original_name) DO NOTHING;

-- Commentaires
COMMENT ON TABLE club_mapping IS 'Table pour gérer le mapping dynamique des noms de clubs depuis les fichiers Excel';
COMMENT ON COLUMN club_mapping.original_name IS 'Nom original du club tel qu''il apparaît dans le fichier Excel (unique)';
COMMENT ON COLUMN club_mapping.mapped_name IS 'Nom standardisé du club après mapping';
