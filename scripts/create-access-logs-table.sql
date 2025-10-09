-- Table pour stocker les logs d'accès des utilisateurs
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'page_view', 'error')),
    page TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_session_id ON access_logs(session_id);

-- Politique de sécurité : seuls les admins peuvent lire les logs
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs d'insérer leurs propres logs
CREATE POLICY "Users can insert their own logs" ON access_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux admins de lire tous les logs
CREATE POLICY "Admins can read all logs" ON access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Politique pour permettre aux admins de supprimer les logs
CREATE POLICY "Admins can delete logs" ON access_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Fonction pour nettoyer automatiquement les anciens logs (plus de 90 jours)
CREATE OR REPLACE FUNCTION cleanup_old_access_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM access_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optionnel : Créer une tâche automatique pour nettoyer les logs (nécessite l'extension pg_cron)
-- SELECT cron.schedule('cleanup-access-logs', '0 2 * * *', 'SELECT cleanup_old_access_logs();');

COMMENT ON TABLE access_logs IS 'Logs d''accès et de navigation des utilisateurs';
COMMENT ON COLUMN access_logs.action IS 'Type d''action : login, logout, page_view, error';
COMMENT ON COLUMN access_logs.page IS 'URL ou nom de la page visitée';
COMMENT ON COLUMN access_logs.ip_address IS 'Adresse IP de l''utilisateur';
COMMENT ON COLUMN access_logs.user_agent IS 'User agent du navigateur';
COMMENT ON COLUMN access_logs.session_id IS 'Identifiant de session pour regrouper les actions';
COMMENT ON COLUMN access_logs.metadata IS 'Données additionnelles en JSON';