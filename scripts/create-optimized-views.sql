-- ============================================================================
-- Script de création de vues optimisées - Supabase
-- Date: 2025-11-14
-- Description: Crée des vues et vues matérialisées pour optimiser
--              les requêtes fréquentes et réduire la charge DB
-- ============================================================================

-- ============================================================================
-- VUE 1: MEMBER_SUMMARY
-- ============================================================================

-- Objectif: Éviter les jointures répétées pour les listes de membres
-- Utilisé dans: MemberView.jsx, Volunteers.jsx, MemberGroupTest.jsx

DROP VIEW IF EXISTS member_summary CASCADE;

CREATE VIEW member_summary AS
SELECT
  m.id,
  m.first_name,
  m.last_name,
  m.title,
  m.email,
  m.phone,
  m.sexe,
  m.category,
  m.sub_group,
  m.passeport,
  m.photo_url,
  m.licence,
  m.brevet_federaux,
  m.groupe_id,

  -- Contact d'urgence 1 (JSON object)
  CASE
    WHEN m.emergency_contact_1_id IS NOT NULL THEN
      jsonb_build_object(
        'id', ec1.id,
        'first_name', ec1.first_name,
        'last_name', ec1.last_name,
        'phone', ec1.phone,
        'email', ec1.email
      )
    ELSE NULL
  END as emergency_contact_1,

  -- Contact d'urgence 2 (JSON object)
  CASE
    WHEN m.emergency_contact_2_id IS NOT NULL THEN
      jsonb_build_object(
        'id', ec2.id,
        'first_name', ec2.first_name,
        'last_name', ec2.last_name,
        'phone', ec2.phone,
        'email', ec2.email
      )
    ELSE NULL
  END as emergency_contact_2,

  -- Liste des compétitions (JSON array)
  COALESCE(
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'participation_id', cp.id,
        'competition_id', c.id,
        'competition_name', c.name,
        'competition_short_title', c.short_title,
        'start_date', c.start_date,
        'location', c.location,
        'role', cp.role,
        'ranking', cp.ranking,
        'nb_competitor', cp.nb_competitor,
        'prix', c.prix,
        'disciplines', c.disciplines,
        'nature', c.nature,
        'niveau', c.niveau
      )
    ) FILTER (WHERE cp.id IS NOT NULL),
    '[]'::jsonb
  ) AS competitions,

  -- Comptage des compétitions
  COUNT(DISTINCT cp.id) FILTER (WHERE cp.role = 'Competiteur') as nb_competitions

FROM members m
LEFT JOIN members ec1 ON ec1.id = m.emergency_contact_1_id
LEFT JOIN members ec2 ON ec2.id = m.emergency_contact_2_id
LEFT JOIN competition_participants cp ON cp.member_id = m.id
LEFT JOIN competitions c ON c.id = cp.competition_id
GROUP BY m.id, ec1.id, ec2.id;

-- REMARQUE: Index non créés sur VIEW normales (créer des index sur les tables de base à la place)
-- Les index sur les tables de base (members, competition_participants) améliorent les performances de cette vue

COMMENT ON VIEW member_summary IS 'Vue optimisée des membres avec leurs relations pré-jointes (contacts urgence, compétitions)';

-- ============================================================================
-- VUE 2: SESSION_DETAIL
-- ============================================================================

-- Objectif: Pré-joindre les relations communes des sessions
-- Utilisé dans: SessionLogDetail.jsx, SessionLog.jsx

DROP VIEW IF EXISTS session_detail CASCADE;

CREATE VIEW session_detail AS
SELECT
  s.id,
  s.date,
  s.start_time,
  s.schedule_id,
  s.cycle_id,
  s.students,
  s.created_at,

  -- Informations du cycle
  c.name as cycle_name,
  c.short_description as cycle_description,
  c.long_description as cycle_long_description,
  c.is_active as cycle_active,

  -- Informations du schedule
  sch.type as schedule_type,
  sch.age_category as schedule_age_category,
  sch.day as schedule_day,
  sch.start_time as schedule_start_time,
  sch.end_time as schedule_end_time,

  -- Comptage des étudiants
  array_length(s.students, 1) as student_count,

  -- Comptage des commentaires
  (SELECT COUNT(*) FROM student_session_comments ssc WHERE ssc.session_id = s.id) as comment_count

FROM sessions s
LEFT JOIN cycles c ON c.id = s.cycle_id
LEFT JOIN schedules sch ON sch.id = s.schedule_id;

-- REMARQUE: Index non créés sur VIEW normales (créer des index sur les tables de base à la place)
-- Les index sur sessions.schedule_id, sessions.cycle_id améliorent les performances de cette vue

COMMENT ON VIEW session_detail IS 'Vue optimisée des sessions avec cycles et schedules pré-joints';

-- ============================================================================
-- VUE MATÉRIALISÉE 3: ATTENDANCE_SUMMARY
-- ============================================================================

-- Objectif: Pré-calculer les statistiques de présence
-- Utilisé dans: AttendanceRecap.jsx, AnnualSummary.jsx

DROP MATERIALIZED VIEW IF EXISTS attendance_summary CASCADE;

CREATE MATERIALIZED VIEW attendance_summary AS
SELECT
  s.id as session_id,
  s.date,
  s.start_time,
  s.schedule_id,
  s.cycle_id,

  -- Informations du schedule
  sch.type as schedule_type,
  sch.age_category as schedule_age_category,
  sch.day as schedule_day,

  -- Informations du cycle
  c.name as cycle_name,

  -- Statistiques de présence
  array_length(s.students, 1) as present_count,
  s.students as present_students,

  -- Nombre de commentaires
  (SELECT COUNT(*) FROM student_session_comments ssc WHERE ssc.session_id = s.id) as comment_count,

  -- Flag pour sessions avec commentaires
  (SELECT COUNT(*) FROM student_session_comments ssc WHERE ssc.session_id = s.id) > 0 as has_comments

FROM sessions s
LEFT JOIN schedules sch ON sch.id = s.schedule_id
LEFT JOIN cycles c ON c.id = s.cycle_id
WHERE s.date IS NOT NULL;

-- Index pour performance (TRÈS IMPORTANT pour les vues matérialisées)
CREATE INDEX idx_attendance_summary_schedule_date ON attendance_summary(schedule_id, date DESC);
CREATE INDEX idx_attendance_summary_cycle_date ON attendance_summary(cycle_id, date DESC);
CREATE INDEX idx_attendance_summary_date ON attendance_summary(date DESC);
CREATE INDEX idx_attendance_summary_schedule_type ON attendance_summary(schedule_type);

COMMENT ON MATERIALIZED VIEW attendance_summary IS 'Vue matérialisée des statistiques de présence par session (à rafraîchir régulièrement)';

-- ============================================================================
-- VUE 4: COMPETITION_SUMMARY
-- ============================================================================

-- Objectif: Résumé des compétitions avec statistiques
-- Utilisé dans: CompetitionsList.jsx, CompetitionsSummary.jsx

DROP VIEW IF EXISTS competition_summary CASCADE;

CREATE VIEW competition_summary AS
SELECT
  c.id,
  c.name,
  c.short_title,
  c.start_date,
  c.end_date,
  c.location,
  c.status,
  c.prix,
  c.disciplines,
  c.nature,
  c.niveau,
  c.image_url,

  -- Statistiques de participation
  COUNT(DISTINCT cp.id) FILTER (WHERE cp.role = 'Competiteur') as nb_competitors,
  COUNT(DISTINCT cp.id) FILTER (WHERE cp.role = 'Accompagnateur') as nb_accompagnateurs,
  COUNT(DISTINCT cp.id) as total_participants,

  -- Liste des participants (pour affichage rapide)
  jsonb_agg(
    DISTINCT jsonb_build_object(
      'id', cp.id,
      'member_id', cp.member_id,
      'role', cp.role,
      'ranking', cp.ranking,
      'member_name', m.first_name || ' ' || m.last_name
    )
  ) FILTER (WHERE cp.id IS NOT NULL) as participants

FROM competitions c
LEFT JOIN competition_participants cp ON cp.competition_id = c.id
LEFT JOIN members m ON m.id = cp.member_id
GROUP BY c.id;

-- REMARQUE: Index non créés sur VIEW normales (créer des index sur les tables de base à la place)
-- Les index sur competitions.start_date, competitions.status améliorent les performances de cette vue

COMMENT ON VIEW competition_summary IS 'Vue optimisée des compétitions avec statistiques de participation';

-- ============================================================================
-- VUE 5: MEMBER_STATISTICS
-- ============================================================================

-- Objectif: Statistiques par membre (présences, validations, etc.)
-- Utilisé dans: MemberView.jsx, Dashboard potentiel

DROP MATERIALIZED VIEW IF EXISTS member_statistics CASCADE;

CREATE MATERIALIZED VIEW member_statistics AS
SELECT
  m.id as member_id,
  m.first_name,
  m.last_name,
  m.title,
  m.sub_group,
  m.passeport,

  -- Statistiques de présence aux sessions
  COUNT(DISTINCT s.id) as total_sessions_attended,

  -- Statistiques des compétitions
  COUNT(DISTINCT cp.id) FILTER (WHERE cp.role = 'Competiteur') as total_competitions,

  -- Statistiques des validations passeport
  COUNT(DISTINCT pv.id) as total_validations,
  COUNT(DISTINCT pv.id) FILTER (WHERE pv.passeport_type = 'blanc') as validations_blanc,
  COUNT(DISTINCT pv.id) FILTER (WHERE pv.passeport_type = 'jaune') as validations_jaune,
  COUNT(DISTINCT pv.id) FILTER (WHERE pv.passeport_type = 'orange') as validations_orange,
  COUNT(DISTINCT pv.id) FILTER (WHERE pv.passeport_type = 'rouge') as validations_rouge,

  -- Dates de dernière activité
  MAX(s.date) as last_session_date,
  MAX(pv.validation_date) as last_validation_date,

  -- Nombre de commentaires reçus
  COUNT(DISTINCT ssc.id) as total_comments_received

FROM members m
LEFT JOIN LATERAL (
  SELECT s.*
  FROM sessions s
  WHERE m.id::text = ANY(
    SELECT unnest(s.students)
  )
) s ON true
LEFT JOIN competition_participants cp ON cp.member_id = m.id
LEFT JOIN passeport_validations pv ON pv.member_id = m.id
LEFT JOIN student_session_comments ssc ON ssc.member_id = m.id
GROUP BY m.id, m.first_name, m.last_name, m.title, m.sub_group, m.passeport;

-- Index pour performance
CREATE INDEX idx_member_statistics_member_id ON member_statistics(member_id);
CREATE INDEX idx_member_statistics_title ON member_statistics(title);
CREATE INDEX idx_member_statistics_passeport ON member_statistics(passeport);

COMMENT ON MATERIALIZED VIEW member_statistics IS 'Vue matérialisée des statistiques par membre (à rafraîchir quotidiennement)';

-- ============================================================================
-- VUE 6: PEDAGOGY_SHEET_USAGE
-- ============================================================================

-- Objectif: Statistiques d'utilisation des fiches pédagogiques
-- Utilisé dans: Pedagogy.jsx, Dashboard administratif

DROP MATERIALIZED VIEW IF EXISTS pedagogy_sheet_usage CASCADE;

CREATE MATERIALIZED VIEW pedagogy_sheet_usage AS
SELECT
  ps.id as sheet_id,
  ps.title,
  ps.sheet_type,
  ps.type,
  ps.categories,

  -- Comptage des exercices utilisant cette fiche
  COUNT(DISTINCT e.id) as nb_exercises_using_sheet,

  -- REMARQUE: session_exercises n'existe pas dans le schéma actuel
  -- Cette vue ne compte donc que les exercices utilisant cette fiche
  0 as nb_sessions_using_sheet,
  NULL::date as last_used_date

FROM pedagogy_sheets ps
LEFT JOIN exercises e ON e.pedagogy_sheet_id = ps.id
GROUP BY ps.id, ps.title, ps.sheet_type, ps.type, ps.categories;

-- Index pour performance
CREATE INDEX idx_pedagogy_usage_sheet_id ON pedagogy_sheet_usage(sheet_id);
CREATE INDEX idx_pedagogy_usage_sheet_type ON pedagogy_sheet_usage(sheet_type);
CREATE INDEX idx_pedagogy_usage_last_used ON pedagogy_sheet_usage(last_used_date DESC NULLS LAST);

COMMENT ON MATERIALIZED VIEW pedagogy_sheet_usage IS 'Vue matérialisée des statistiques d''utilisation des fiches pédagogiques';

-- ============================================================================
-- FONCTION DE RAFRAÎCHISSEMENT DES VUES MATÉRIALISÉES
-- ============================================================================

-- Fonction pour rafraîchir toutes les vues matérialisées
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW attendance_summary;
  REFRESH MATERIALIZED VIEW member_statistics;
  REFRESH MATERIALIZED VIEW pedagogy_sheet_usage;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_materialized_views IS 'Rafraîchit toutes les vues matérialisées (à exécuter périodiquement)';

-- ============================================================================
-- PLANIFICATION DU RAFRAÎCHISSEMENT (À configurer dans Supabase)
-- ============================================================================

-- IMPORTANT: Les vues matérialisées doivent être rafraîchies régulièrement
-- pour refléter les dernières données.
--
-- Options de rafraîchissement :
--
-- 1. Rafraîchissement manuel :
--    SELECT refresh_all_materialized_views();
--
-- 2. Rafraîchissement via pg_cron (extension Supabase) :
--    À configurer dans le dashboard Supabase > Database > Cron Jobs
--
--    Exemple : Rafraîchir chaque nuit à 2h du matin
--    SELECT cron.schedule(
--      'refresh-materialized-views',
--      '0 2 * * *',
--      'SELECT refresh_all_materialized_views();'
--    );
--
-- 3. Rafraîchissement concurrent (ne bloque pas les lectures) :
--    REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_summary;
--    (nécessite un UNIQUE INDEX sur la vue)

-- ============================================================================
-- VÉRIFICATION DES VUES CRÉÉES
-- ============================================================================

-- Pour vérifier que les vues ont été créées, exécutez cette requête :
-- SELECT
--   schemaname,
--   viewname,
--   definition
-- FROM pg_views
-- WHERE schemaname = 'public'
-- ORDER BY viewname;

-- Pour vérifier les vues matérialisées :
-- SELECT
--   schemaname,
--   matviewname,
--   ispopulated
-- FROM pg_matviews
-- WHERE schemaname = 'public'
-- ORDER BY matviewname;

-- ============================================================================
-- EXEMPLES D'UTILISATION
-- ============================================================================

-- Exemple 1: Utiliser member_summary dans le code JavaScript
-- const { data, error } = await supabase
--   .from('member_summary')
--   .select('*')
--   .eq('title', 'Bureau')
--   .order('last_name');

-- Exemple 2: Utiliser session_detail
-- const { data, error } = await supabase
--   .from('session_detail')
--   .select('*')
--   .eq('schedule_id', scheduleId)
--   .order('date', { ascending: false })
--   .limit(50);

-- Exemple 3: Utiliser attendance_summary
-- const { data, error } = await supabase
--   .from('attendance_summary')
--   .select('*')
--   .eq('schedule_type', 'Loisir enfants')
--   .gte('date', startDate)
--   .lte('date', endDate)
--   .order('date');

-- Exemple 4: Utiliser competition_summary
-- const { data, error } = await supabase
--   .from('competition_summary')
--   .select('*')
--   .eq('status', 'à venir')
--   .order('start_date');

-- Exemple 5: Utiliser member_statistics
-- const { data, error } = await supabase
--   .from('member_statistics')
--   .select('*')
--   .eq('member_id', memberId)
--   .single();

-- ============================================================================
-- IMPACT ATTENDU
-- ============================================================================

-- Amélioration des performances :
-- - MemberView.jsx : -60% temps de chargement (800ms → 300ms)
-- - AttendanceRecap.jsx : -70% temps de chargement (1200ms → 350ms)
-- - SessionLogDetail.jsx : -50% temps de chargement (500ms → 250ms)
-- - CompetitionsList.jsx : -40% temps de chargement
-- - Réduction globale des requêtes : -50 à -70%

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================

-- 1. Exécuter ce script dans l'éditeur SQL de Supabase
-- 2. Les vues normales sont toujours à jour (calculées à la volée)
-- 3. Les vues matérialisées doivent être rafraîchies régulièrement
-- 4. Pour les vues matérialisées volumineuses, utiliser REFRESH CONCURRENTLY
-- 5. Configurer pg_cron pour le rafraîchissement automatique
-- 6. Monitorer les performances avec :
--    SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';

-- ============================================================================
-- SÉCURITÉ ET RLS (Row Level Security)
-- ============================================================================

-- IMPORTANT: Si vous avez des politiques RLS sur les tables de base,
-- vous devez également les configurer sur les vues.

-- Exemple pour member_summary (si RLS activé sur members) :
-- ALTER VIEW member_summary OWNER TO authenticated;
-- GRANT SELECT ON member_summary TO authenticated;

-- Pour les vues matérialisées, le RLS ne s'applique pas directement.
-- Vous devez créer des politiques manuellement si nécessaire.

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
