-- Création de la table vocabulary_sheets pour Supabase
-- À exécuter dans le SQL Editor de Supabase

-- 1. Créer la table
CREATE TABLE vocabulary_sheets (
  id bigserial PRIMARY KEY,
  pedagogy_sheet_id uuid REFERENCES pedagogy_sheets(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Contrainte pour éviter les doublons
  UNIQUE(pedagogy_sheet_id)
);

-- 2. Activer RLS (Row Level Security)
ALTER TABLE vocabulary_sheets ENABLE ROW LEVEL SECURITY;

-- 3. Créer les politiques RLS pour permettre l'accès
CREATE POLICY "Allow all operations for vocabulary_sheets" ON vocabulary_sheets
FOR ALL USING (true);

-- 4. Créer les index pour améliorer les performances
CREATE INDEX idx_vocabulary_sheets_pedagogy_sheet_id ON vocabulary_sheets(pedagogy_sheet_id);
CREATE INDEX idx_vocabulary_sheets_created_at ON vocabulary_sheets(created_at);

-- 5. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vocabulary_sheets_updated_at 
    BEFORE UPDATE ON vocabulary_sheets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Commentaires pour documentation
COMMENT ON TABLE vocabulary_sheets IS 'Table de liaison entre la page Vocabulaire et les fiches pédagogiques';
COMMENT ON COLUMN vocabulary_sheets.pedagogy_sheet_id IS 'Référence vers la fiche pédagogique';
COMMENT ON COLUMN vocabulary_sheets.created_at IS 'Date de création de l''association';
COMMENT ON COLUMN vocabulary_sheets.updated_at IS 'Date de dernière modification';