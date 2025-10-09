-- Script SQL pour créer la table vocabulary_sheets
-- Cette table fait le lien entre la page Vocabulaire et les fiches pédagogiques

CREATE TABLE IF NOT EXISTS vocabulary_sheets (
  id SERIAL PRIMARY KEY,
  pedagogy_sheet_id INTEGER REFERENCES pedagogy_sheets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Contrainte pour éviter les doublons
  UNIQUE(pedagogy_sheet_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_vocabulary_sheets_pedagogy_sheet_id 
ON vocabulary_sheets(pedagogy_sheet_id);

CREATE INDEX IF NOT EXISTS idx_vocabulary_sheets_created_at 
ON vocabulary_sheets(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vocabulary_sheets_updated_at 
    BEFORE UPDATE ON vocabulary_sheets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE vocabulary_sheets IS 'Table de liaison entre la page Vocabulaire et les fiches pédagogiques';
COMMENT ON COLUMN vocabulary_sheets.pedagogy_sheet_id IS 'Référence vers la fiche pédagogique';
COMMENT ON COLUMN vocabulary_sheets.created_at IS 'Date de création de l''association';
COMMENT ON COLUMN vocabulary_sheets.updated_at IS 'Date de dernière modification';