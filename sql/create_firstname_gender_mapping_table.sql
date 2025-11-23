-- Migration: Création de la table de mapping prénom - sexe
-- Date: 2025-11-23
-- Description: Permet de deviner le sexe d'une personne à partir de son prénom

-- Créer la table firstname_gender_mapping
CREATE TABLE IF NOT EXISTS firstname_gender_mapping (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL UNIQUE,
  gender VARCHAR(50) NOT NULL CHECK (gender IN ('Masculin', 'Féminin', 'Mixte')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur first_name pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_firstname_gender_mapping_first_name
ON firstname_gender_mapping(first_name);

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_firstname_gender_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_firstname_gender_mapping_updated_at
  BEFORE UPDATE ON firstname_gender_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_firstname_gender_mapping_updated_at();

-- Pré-remplir la table avec les données initiales
INSERT INTO firstname_gender_mapping (first_name, gender) VALUES
  ('Matthieu', 'Masculin'),
  ('Gaelle', 'Féminin'),
  ('Elsa', 'Féminin'),
  ('Paul', 'Masculin'),
  ('Antonin', 'Masculin'),
  ('Timéo', 'Masculin'),
  ('Chloé', 'Féminin'),
  ('Arthur', 'Masculin'),
  ('Emile', 'Masculin'),
  ('Léna', 'Féminin'),
  ('Eloane', 'Féminin'),
  ('Alexandre', 'Masculin'),
  ('Jassem', 'Masculin'),
  ('Mathilde', 'Féminin'),
  ('Tiago', 'Masculin'),
  ('Capucine', 'Féminin'),
  ('Charlie', 'Féminin'),
  ('Milan', 'Masculin'),
  ('Lucas', 'Masculin'),
  ('Emma', 'Féminin'),
  ('albane', 'Féminin'),
  ('Dam', 'Masculin'),
  ('Clemence', 'Féminin'),
  ('Aristide', 'Masculin'),
  ('Adem', 'Masculin'),
  ('Ismayl', 'Masculin'),
  ('Hélios', 'Masculin'),
  ('Sacha', 'Masculin'),
  ('Asma', 'Féminin'),
  ('Pierre-henri', 'Masculin'),
  ('Margaux', 'Féminin'),
  ('Victor', 'Masculin'),
  ('Louis', 'Masculin'),
  ('Charline', 'Féminin'),
  ('Aline', 'Féminin'),
  ('Margot', 'Féminin'),
  ('Nadège', 'Féminin'),
  ('Benoit', 'Masculin'),
  ('Cassie', 'Féminin'),
  ('Soline', 'Féminin'),
  ('ALICE', 'Féminin'),
  ('Beryl', 'Féminin'),
  ('Aurelie', 'Féminin'),
  ('Adrien', 'Masculin'),
  ('Isabelle', 'Féminin'),
  ('Mathis', 'Masculin'),
  ('Annah', 'Féminin'),
  ('Adèle', 'Féminin'),
  ('Maud', 'Féminin'),
  ('Maxime', 'Masculin'),
  ('Emilie', 'Féminin'),
  ('selma', 'Féminin'),
  ('Charlotte', 'Féminin'),
  ('Swann', 'Masculin'),
  ('Selena', 'Féminin'),
  ('Clément', 'Masculin'),
  ('lisa', 'Féminin'),
  ('Antoine', 'Masculin'),
  ('Tuân', 'Masculin'),
  ('Colyne', 'Féminin'),
  ('Vivien', 'Masculin'),
  ('Nina', 'Féminin'),
  ('Julie', 'Féminin'),
  ('Noé', 'Masculin'),
  ('Hugo', 'Masculin'),
  ('Joseph', 'Masculin'),
  ('Amandine', 'Féminin'),
  ('Romane', 'Féminin'),
  ('Noemie', 'Féminin'),
  ('Luis', 'Masculin'),
  ('Lola', 'Féminin'),
  ('Roméo', 'Masculin'),
  ('Caroline', 'Féminin'),
  ('Aglaé', 'Féminin'),
  ('Lucie', 'Féminin'),
  ('antoine', 'Masculin'),
  ('Ines', 'Féminin'),
  ('Quentin', 'Masculin'),
  ('Zoé', 'Féminin'),
  ('Louise', 'Féminin'),
  ('Samuel', 'Masculin'),
  ('Jean', 'Masculin'),
  ('Auguste', 'Masculin'),
  ('Élie', 'Mixte'),
  ('Linnea', 'Féminin'),
  ('Alix', 'Mixte'),
  ('Méline', 'Féminin'),
  ('Nolan', 'Masculin'),
  ('Eliott', 'Masculin'),
  ('Miyah', 'Masculin'),
  ('Marion', 'Féminin'),
  ('Pierre-Yves', 'Masculin'),
  ('Frédéric', 'Masculin')
ON CONFLICT (first_name) DO NOTHING;

-- Commentaires
COMMENT ON TABLE firstname_gender_mapping IS 'Table pour gérer le mapping entre prénoms et sexe pour deviner le sexe depuis le prénom';
COMMENT ON COLUMN firstname_gender_mapping.first_name IS 'Prénom (unique, sensible à la casse)';
COMMENT ON COLUMN firstname_gender_mapping.gender IS 'Sexe: Masculin, Féminin, ou Mixte';
