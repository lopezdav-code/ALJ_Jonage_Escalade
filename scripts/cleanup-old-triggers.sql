-- ============================================================================
-- CLEANUP - Supprimer les anciens triggers et la fonction incorrecte
-- Exécuter ceci AVANT setup-triggers-refresh.sql
-- ============================================================================

-- Supprimer les triggers si ils existent
DROP TRIGGER IF EXISTS trg_refresh_views_after_sessions ON sessions CASCADE;
DROP TRIGGER IF EXISTS trg_refresh_views_after_members ON members CASCADE;
DROP TRIGGER IF EXISTS trg_refresh_views_after_comp_participants ON competition_participants CASCADE;
DROP TRIGGER IF EXISTS trg_refresh_views_after_passeport ON passeport_validations CASCADE;
DROP TRIGGER IF EXISTS trg_refresh_views_after_pedagogy ON pedagogy_sheets CASCADE;
DROP TRIGGER IF EXISTS trg_refresh_views_after_exercises ON exercises CASCADE;

-- Supprimer la fonction incorrecte (RETURNS void)
DROP FUNCTION IF EXISTS refresh_materialized_views_concurrent() CASCADE;

-- Supprimer les index uniques s'ils existent
DROP INDEX IF EXISTS idx_attendance_summary_unique CASCADE;
DROP INDEX IF EXISTS idx_member_statistics_unique CASCADE;
DROP INDEX IF EXISTS idx_pedagogy_usage_unique CASCADE;

-- ============================================================================
-- Vérifier le résultat
-- ============================================================================

-- SELECT trigger_name, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table;
