-- ============================================================================
-- Configuration de pg_cron pour rafraîchir les vues matérialisées
-- Supabase (PostgreSQL 14+)
-- ============================================================================

-- OPTION 1 : Rafraîchir toutes les nuits à 2h du matin
SELECT cron.schedule(
  'refresh-materialized-views-nightly',
  '0 2 * * *',  -- Tous les jours à 2h00 UTC
  'SELECT refresh_all_materialized_views();'
);

-- OPTION 2 : Rafraîchir toutes les heures
-- SELECT cron.schedule(
--   'refresh-materialized-views-hourly',
--   '0 * * * *',  -- Chaque heure
--   'SELECT refresh_all_materialized_views();'
-- );

-- OPTION 3 : Rafraîchir chaque 30 minutes
-- SELECT cron.schedule(
--   'refresh-materialized-views-30min',
--   '*/30 * * * *',  -- Toutes les 30 minutes
--   'SELECT refresh_all_materialized_views();'
-- );

-- ============================================================================
-- Vérifier les jobs cron planifiés
-- ============================================================================

-- SELECT * FROM cron.job;

-- ============================================================================
-- Modifier un job existant
-- ============================================================================

-- SELECT cron.alter_job(job_id, schedule => '0 3 * * *');  -- Changer l'heure

-- ============================================================================
-- Supprimer un job cron
-- ============================================================================

-- SELECT cron.unschedule('refresh-materialized-views-nightly');

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================

/*
Format cron : "minute heure jour_du_mois mois jour_de_la_semaine"

Exemples :
- '0 2 * * *'       → Tous les jours à 2h00
- '0 */4 * * *'     → Toutes les 4 heures
- '0 2 * * 0'       → Tous les dimanche à 2h00
- '*/15 * * * *'    → Toutes les 15 minutes
- '0 0 1 * *'       → Premier jour du mois à minuit
- '0 2 * * 1-5'     → Lundi à vendredi à 2h00 (jours travail)

pg_cron vs Application Refresh :

AVANTAGES pg_cron :
✅ Automatique, pas besoin du serveur app
✅ Exécution à heures fixes
✅ Réduit la charge côté app
✅ Rafraîchit CONCURRENTLY (ne bloque pas les lectures)

INCONVÉNIENTS pg_cron :
❌ Données potentiellement obsolètes entre rafraîchissements
❌ Consomme les ressources DB à l'heure planifiée

ALTERNATIVE : Application-level refresh
- Rafraîchir dans le code quand les données changent
- Plus à jour mais plus cher en ressources
*/
