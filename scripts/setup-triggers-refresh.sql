-- ============================================================================
-- Triggers PostgreSQL pour rafraîchir les vues matérialisées automatiquement
-- ============================================================================

-- ATTENTION : Cette approche a un COÛT ÉLEVÉ
-- Elle rafraîchit les vues à CHAQUE modification de table
-- À utiliser uniquement si les données doivent être absolument à jour en temps réel

-- ============================================================================
-- ÉTAPE 1 : Ajouter des index UNIQUE pour REFRESH CONCURRENT
-- ============================================================================

-- Nécessaire pour utiliser REFRESH MATERIALIZED VIEW CONCURRENTLY
-- (qui ne bloque pas les lectures)

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_summary_unique
  ON attendance_summary(session_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_statistics_unique
  ON member_statistics(member_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pedagogy_usage_unique
  ON pedagogy_sheet_usage(sheet_id);

-- ============================================================================
-- ÉTAPE 2 : Créer la fonction de rafraîchissement concurrent
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_materialized_views_concurrent()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY member_statistics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY pedagogy_sheet_usage;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  -- Si le rafraîchissement concurrent échoue, faire un refresh normal
  REFRESH MATERIALIZED VIEW attendance_summary;
  REFRESH MATERIALIZED VIEW member_statistics;
  REFRESH MATERIALIZED VIEW pedagogy_sheet_usage;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 3 : Créer les triggers sur les tables de base
-- ============================================================================

-- Trigger sur sessions (affecte : attendance_summary, member_statistics)
CREATE TRIGGER trg_refresh_views_after_sessions
  AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_materialized_views_concurrent();

-- Trigger sur members (affecte : member_statistics)
CREATE TRIGGER trg_refresh_views_after_members
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_materialized_views_concurrent();

-- Trigger sur competition_participants (affecte : member_statistics)
CREATE TRIGGER trg_refresh_views_after_comp_participants
  AFTER INSERT OR UPDATE OR DELETE ON competition_participants
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_materialized_views_concurrent();

-- Trigger sur passeport_validations (affecte : member_statistics)
CREATE TRIGGER trg_refresh_views_after_passeport
  AFTER INSERT OR UPDATE OR DELETE ON passeport_validations
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_materialized_views_concurrent();

-- Trigger sur pedagogy_sheets (affecte : pedagogy_sheet_usage)
CREATE TRIGGER trg_refresh_views_after_pedagogy
  AFTER INSERT OR UPDATE OR DELETE ON pedagogy_sheets
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_materialized_views_concurrent();

-- Trigger sur exercises (affecte : pedagogy_sheet_usage)
CREATE TRIGGER trg_refresh_views_after_exercises
  AFTER INSERT OR UPDATE OR DELETE ON exercises
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_materialized_views_concurrent();

-- ============================================================================
-- Lister les triggers créés
-- ============================================================================

-- SELECT trigger_name, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table;

-- ============================================================================
-- SUPPRIMER les triggers (si nécessaire)
-- ============================================================================

-- DROP TRIGGER IF EXISTS trg_refresh_views_after_sessions ON sessions CASCADE;
-- DROP TRIGGER IF EXISTS trg_refresh_views_after_members ON members CASCADE;
-- etc...

-- ============================================================================
-- NOTES
-- ============================================================================

/*
ATTENTION - Impacts de cette approche :

❌ COÛTS ÉLEVÉS :
   - Rafraîchissement à CHAQUE modification
   - Peut ralentir les inserts/updates/deletes
   - Consomme beaucoup de ressources DB

✅ AVANTAGES :
   - Les vues sont TOUJOURS à jour en temps réel
   - Aucun délai d'attente

Recommandations :
- Utiliser les triggers SEULEMENT si vous avez besoin de données en temps réel
- Pour la plupart des cas, pg_cron (rafraîchissement périodique) est mieux
- Monitorer les performances avec les triggers activés

REFRESH CONCURRENTLY vs REFRESH NORMAL :
- CONCURRENT : Ne bloque pas les lectures, plus lent
- NORMAL : Bloque les lectures, plus rapide
- Nous utilisons CONCURRENT car Supabase a des utilisateurs 24/7
*/
