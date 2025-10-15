-- ============================================
-- Ajouter la relation entre sessions et schedule
-- ============================================

-- 1. Ajouter la colonne schedule_id à la table sessions
ALTER TABLE sessions
ADD COLUMN schedule_id UUID REFERENCES schedule(id) ON DELETE SET NULL;

-- 2. Créer un index pour améliorer les performances des jointures
CREATE INDEX IF NOT EXISTS idx_sessions_schedule_id ON sessions(schedule_id);

-- 3. Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN sessions.schedule_id IS 'Référence au créneau du planning associé à cette séance';

-- 4. Vérification : afficher quelques sessions pour voir la nouvelle colonne
SELECT
  id,
  date,
  start_time,
  session_objective,
  schedule_id,
  created_at
FROM sessions
ORDER BY created_at DESC
LIMIT 5;

-- 5. Statistiques
SELECT
  'Total sessions' as description,
  COUNT(*) as count
FROM sessions
UNION ALL
SELECT
  'Sessions liées à un créneau',
  COUNT(*)
FROM sessions
WHERE schedule_id IS NOT NULL;

-- Note: Les sessions existantes auront schedule_id = NULL
-- Vous pourrez les lier manuellement ou via l'interface d'édition
