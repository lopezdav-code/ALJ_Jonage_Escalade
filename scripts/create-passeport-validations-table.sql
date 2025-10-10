-- Table pour stocker les validations des passeports d'escalade
CREATE TABLE IF NOT EXISTS passeport_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  passeport_type TEXT NOT NULL CHECK (passeport_type IN ('blanc', 'jaune', 'orange', 'rouge')),
  competences JSONB NOT NULL,
  date_validation DATE NOT NULL,
  validateur TEXT NOT NULL,
  observations TEXT,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_passeport_validations_member_id ON passeport_validations(member_id);
CREATE INDEX IF NOT EXISTS idx_passeport_validations_type ON passeport_validations(passeport_type);
CREATE INDEX IF NOT EXISTS idx_passeport_validations_date ON passeport_validations(date_validation DESC);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_passeport_validations_updated_at
    BEFORE UPDATE ON passeport_validations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE passeport_validations IS 'Stocke l''historique des validations de passeports d''escalade';
COMMENT ON COLUMN passeport_validations.member_id IS 'Référence au membre ayant obtenu le passeport';
COMMENT ON COLUMN passeport_validations.passeport_type IS 'Type de passeport: blanc, jaune, orange, rouge';
COMMENT ON COLUMN passeport_validations.competences IS 'Objet JSON contenant toutes les compétences validées';
COMMENT ON COLUMN passeport_validations.date_validation IS 'Date officielle de validation du passeport';
COMMENT ON COLUMN passeport_validations.validateur IS 'Nom de l''initiateur/moniteur ayant validé';
COMMENT ON COLUMN passeport_validations.observations IS 'Remarques sur la performance du grimpeur';
COMMENT ON COLUMN passeport_validations.validated_at IS 'Timestamp de l''enregistrement de la validation';

-- Exemple de requête pour voir l'historique d'un membre
-- SELECT 
--   pv.passeport_type,
--   pv.date_validation,
--   pv.validateur,
--   pv.observations,
--   m.first_name,
--   m.last_name
-- FROM passeport_validations pv
-- JOIN members m ON pv.member_id = m.id
-- WHERE m.id = 'ID_DU_MEMBRE'
-- ORDER BY pv.date_validation DESC;

-- Exemple de requête pour voir tous les passeports validés récemment
-- SELECT 
--   m.first_name || ' ' || m.last_name AS grimpeur,
--   pv.passeport_type,
--   pv.date_validation,
--   pv.validateur
-- FROM passeport_validations pv
-- JOIN members m ON pv.member_id = m.id
-- WHERE pv.date_validation >= CURRENT_DATE - INTERVAL '30 days'
-- ORDER BY pv.date_validation DESC;
