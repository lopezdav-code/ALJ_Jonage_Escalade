-- Création de la table access_logs simple et fonctionnelle
-- À exécuter dans l'éditeur SQL de Supabase

CREATE TABLE IF NOT EXISTS access_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL DEFAULT 'login',
  ip_address TEXT DEFAULT 'localhost',
  user_agent TEXT,
  session_id TEXT,
  log_type TEXT DEFAULT 'connection',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);

-- RLS (Row Level Security)
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion à tous les utilisateurs authentifiés
CREATE POLICY IF NOT EXISTS "Users can insert their own logs" ON access_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre la lecture seulement aux admins
CREATE POLICY IF NOT EXISTS "Admins can view all logs" ON access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique pour permettre la suppression seulement aux admins (pour le nettoyage)
CREATE POLICY IF NOT EXISTS "Admins can delete logs" ON access_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
