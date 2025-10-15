-- Migration: Ajout d'une table pour les commentaires par élève et par session
-- Date: 2025-10-15

-- Créer la table student_session_comments
CREATE TABLE IF NOT EXISTS student_session_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte unique : un seul commentaire par élève et par session
  UNIQUE(session_id, member_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_student_session_comments_session_id ON student_session_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_student_session_comments_member_id ON student_session_comments(member_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_student_session_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_session_comments_updated_at
  BEFORE UPDATE ON student_session_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_student_session_comments_updated_at();

-- Politique RLS (Row Level Security)
ALTER TABLE student_session_comments ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés peuvent lire tous les commentaires
CREATE POLICY "Authenticated users can read all student session comments"
  ON student_session_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les admins peuvent insérer des commentaires
CREATE POLICY "Only admins can insert student session comments"
  ON student_session_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent modifier des commentaires
CREATE POLICY "Only admins can update student session comments"
  ON student_session_comments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer des commentaires
CREATE POLICY "Only admins can delete student session comments"
  ON student_session_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commentaire sur la table
COMMENT ON TABLE student_session_comments IS 'Commentaires individuels pour chaque élève présent à une session';
COMMENT ON COLUMN student_session_comments.session_id IS 'Référence vers la session';
COMMENT ON COLUMN student_session_comments.member_id IS 'Référence vers l''élève';
COMMENT ON COLUMN student_session_comments.comment IS 'Commentaire pour cet élève lors de cette session';
