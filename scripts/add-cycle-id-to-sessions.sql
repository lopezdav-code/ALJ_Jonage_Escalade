-- Ajout de la colonne cycle_id dans la table sessions
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL;

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_sessions_cycle_id ON public.sessions(cycle_id);

-- Commentaire pour documentation
COMMENT ON COLUMN public.sessions.cycle_id IS 'ID du cycle auquel appartient cette séance (optionnel)';

-- Si vous voulez voir les sessions d'un cycle avec leurs informations
-- Exemple de requête :
-- SELECT s.*, c.name as cycle_name 
-- FROM sessions s 
-- LEFT JOIN cycles c ON s.cycle_id = c.id 
-- WHERE c.id = 'cycle_id_here';
