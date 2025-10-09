-- Script de migration pour corriger le type de colonne ip_address
-- À exécuter dans l'éditeur SQL de Supabase si la table existe déjà

-- Option 1: Modifier le type de colonne existant (si la table utilise INET)
DO $$ 
BEGIN
    -- Vérifier si la colonne existe et est de type inet
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'access_logs' 
        AND column_name = 'ip_address' 
        AND data_type = 'inet'
    ) THEN
        -- Modifier le type de colonne
        ALTER TABLE access_logs ALTER COLUMN ip_address TYPE TEXT;
        RAISE NOTICE 'Colonne ip_address convertie de INET vers TEXT';
    END IF;
END $$;

-- Option 2: Si la table n'existe pas, la créer avec le bon schéma
CREATE TABLE IF NOT EXISTS access_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL DEFAULT 'login',
  ip_address TEXT DEFAULT '127.0.0.1',
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
DROP POLICY IF EXISTS "Users can insert their own logs" ON access_logs;
CREATE POLICY "Users can insert their own logs" ON access_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre la lecture seulement aux admins
DROP POLICY IF EXISTS "Admins can view all logs" ON access_logs;
CREATE POLICY "Admins can view all logs" ON access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique pour permettre la suppression seulement aux admins (pour le nettoyage)
DROP POLICY IF EXISTS "Admins can delete logs" ON access_logs;
CREATE POLICY "Admins can delete logs" ON access_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );