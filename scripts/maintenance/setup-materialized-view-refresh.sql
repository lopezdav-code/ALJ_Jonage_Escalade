-- Script de configuration du rafraîchissement automatique des vues matérialisées
-- À exécuter dans l'éditeur SQL de Supabase avec les droits administrateur

-- =============================================
-- OPTION 1: Rafraîchissement manuel (pour tests)
-- =============================================
-- Exécuter ces commandes manuellement quand nécessaire:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_summary;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY member_statistics;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY pedagogy_sheet_usage;

-- =============================================
-- OPTION 2: Rafraîchissement automatique via pg_cron
-- =============================================

-- 1. Activer l'extension pg_cron (si ce n'est pas déjà fait)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Créer une fonction pour rafraîchir toutes les vues matérialisées
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Rafraîchir attendance_summary
  REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_summary;

  -- Rafraîchir member_statistics
  REFRESH MATERIALIZED VIEW CONCURRENTLY member_statistics;

  -- Rafraîchir pedagogy_sheet_usage
  REFRESH MATERIALIZED VIEW CONCURRENTLY pedagogy_sheet_usage;

  -- Optionnel: Logger le succès
  RAISE NOTICE 'Toutes les vues matérialisées ont été rafraîchies avec succès à %', NOW();
END;
$$;

-- Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION refresh_all_materialized_views() IS 'Rafraîchit toutes les vues matérialisées de manière concurrente (sans bloquer les lectures)';

-- 3. Programmer le rafraîchissement automatique
-- ⚠️ NOTE: pg_cron peut ne pas être disponible sur tous les plans Supabase
-- Vérifier la documentation Supabase pour votre plan

-- Option A: Rafraîchissement nocturne quotidien (à 2h du matin)
SELECT cron.schedule(
  'refresh-materialized-views-nightly',  -- nom du job
  '0 2 * * *',                            -- cron schedule (tous les jours à 2h00)
  'SELECT refresh_all_materialized_views();'
);

-- Option B: Rafraîchissement toutes les 6 heures
-- SELECT cron.schedule(
--   'refresh-materialized-views-6h',
--   '0 */6 * * *',                      -- toutes les 6 heures
--   'SELECT refresh_all_materialized_views();'
-- );

-- Option C: Rafraîchissement toutes les heures (pour données très dynamiques)
-- SELECT cron.schedule(
--   'refresh-materialized-views-hourly',
--   '0 * * * *',                        -- toutes les heures à la minute 0
--   'SELECT refresh_all_materialized_views();'
-- );

-- =============================================
-- GESTION DES JOBS CRON
-- =============================================

-- Lister tous les jobs cron configurés:
-- SELECT * FROM cron.job;

-- Désactiver un job (sans le supprimer):
-- UPDATE cron.job SET active = false WHERE jobname = 'refresh-materialized-views-nightly';

-- Réactiver un job:
-- UPDATE cron.job SET active = true WHERE jobname = 'refresh-materialized-views-nightly';

-- Supprimer un job:
-- SELECT cron.unschedule('refresh-materialized-views-nightly');

-- Voir l'historique d'exécution des jobs:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- =============================================
-- OPTION 3: Rafraîchissement via triggers (temps réel)
-- =============================================
-- ⚠️ ATTENTION: Cette approche peut impacter les performances si les tables sont très actives

-- Fonction pour rafraîchir une vue spécifique après modification
CREATE OR REPLACE FUNCTION refresh_attendance_summary_on_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Rafraîchir la vue de manière asynchrone pour ne pas bloquer la transaction
  PERFORM pg_notify('refresh_materialized_views', 'attendance_summary');
  RETURN NULL;
END;
$$;

-- Créer un trigger sur la table sessions pour rafraîchir attendance_summary
-- DÉCOMMENTER CI-DESSOUS SI VOUS VOULEZ UN RAFRAÎCHISSEMENT EN TEMPS RÉEL
-- ⚠️ Peut impacter les performances sur des tables très actives

-- DROP TRIGGER IF EXISTS trigger_refresh_attendance_summary ON sessions;
-- CREATE TRIGGER trigger_refresh_attendance_summary
--   AFTER INSERT OR UPDATE OR DELETE ON sessions
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION refresh_attendance_summary_on_change();

-- =============================================
-- TESTS ET VÉRIFICATION
-- =============================================

-- Test: Rafraîchir manuellement toutes les vues
SELECT refresh_all_materialized_views();

-- Vérifier que les vues contiennent des données
SELECT COUNT(*) as attendance_count FROM attendance_summary;
SELECT COUNT(*) as member_stats_count FROM member_statistics;
SELECT COUNT(*) as pedagogy_usage_count FROM pedagogy_sheet_usage;

-- Vérifier les dernières mises à jour (nécessite une colonne last_updated dans les vues)
-- Si vous voulez tracker les mises à jour, ajoutez:
-- ALTER MATERIALIZED VIEW attendance_summary ADD COLUMN last_refreshed TIMESTAMP DEFAULT NOW();

-- =============================================
-- SURVEILLANCE ET MONITORING
-- =============================================

-- Créer une vue pour monitorer les rafraîchissements
CREATE OR REPLACE VIEW materialized_view_refresh_status AS
SELECT
  schemaname,
  matviewname,
  matviewowner,
  tablespace,
  hasindexes,
  ispopulated,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- Consulter le statut des vues matérialisées
SELECT * FROM materialized_view_refresh_status;

-- =============================================
-- RECOMMANDATIONS
-- =============================================

/*
RECOMMANDATIONS POUR VOTRE APPLICATION:

1. **Fréquence de rafraîchissement:**
   - attendance_summary: Quotidien (2h du matin) - Les données de présence changent peu après les séances
   - member_statistics: Quotidien (2h du matin) - Les statistiques membres évoluent lentement
   - pedagogy_sheet_usage: Hebdomadaire - Usage des fiches pédagogiques stable

2. **Performance:**
   - Utilisez toujours REFRESH MATERIALIZED VIEW CONCURRENTLY pour éviter le verrouillage
   - Planifiez les rafraîchissements pendant les heures creuses (nuit)
   - Surveillez la durée d'exécution via cron.job_run_details

3. **Alternative si pg_cron n'est pas disponible:**
   - Utilisez un service externe (GitHub Actions, Netlify Functions, etc.)
   - Appelez l'API Supabase pour exécuter la fonction refresh_all_materialized_views()
   - Exemple avec curl:
     curl -X POST 'https://YOUR_PROJECT.supabase.co/rest/v1/rpc/refresh_all_materialized_views' \
       -H 'apikey: YOUR_ANON_KEY' \
       -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'

4. **Monitoring:**
   - Vérifiez régulièrement cron.job_run_details pour les échecs
   - Configurez des alertes si un rafraîchissement échoue
   - Surveillez la taille des vues avec materialized_view_refresh_status

5. **En cas de problème:**
   - Les vues normales (member_summary, session_detail, etc.) n'ont PAS besoin de rafraîchissement
   - Seules les MATERIALIZED VIEWS nécessitent un rafraîchissement
   - Si une vue matérialisée est corrompue, DROP et recréez-la
*/

-- =============================================
-- NETTOYAGE (SI NÉCESSAIRE)
-- =============================================

-- Pour désinstaller complètement:
-- SELECT cron.unschedule('refresh-materialized-views-nightly');
-- DROP FUNCTION IF EXISTS refresh_all_materialized_views() CASCADE;
-- DROP FUNCTION IF EXISTS refresh_attendance_summary_on_change() CASCADE;
-- DROP VIEW IF EXISTS materialized_view_refresh_status;
