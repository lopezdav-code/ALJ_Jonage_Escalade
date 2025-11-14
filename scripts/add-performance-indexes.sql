-- ============================================================================
-- Script d'optimisation des performances - Index pour Supabase
-- Date: 2025-11-14
-- Description: Ajoute des index sur les colonnes fréquemment requêtées
--              pour améliorer les performances des requêtes
-- ============================================================================

-- ============================================================================
-- INDEX POUR LA TABLE SESSIONS
-- ============================================================================

-- Index composite pour les requêtes filtrant par schedule_id et triant par date
-- Utilisé dans: AttendanceRecap.jsx, SessionLog.jsx
CREATE INDEX IF NOT EXISTS idx_sessions_schedule_date
  ON sessions(schedule_id, date DESC);

-- Index composite pour les requêtes filtrant par cycle_id et triant par date
-- Utilisé dans: SessionLog.jsx, CycleDetail.jsx
CREATE INDEX IF NOT EXISTS idx_sessions_cycle_date
  ON sessions(cycle_id, date DESC);

-- Index composite pour les requêtes triant par date et heure
-- Utilisé dans: SessionLog.jsx, AttendanceRecap.jsx
CREATE INDEX IF NOT EXISTS idx_sessions_date_time
  ON sessions(date DESC, start_time DESC);

-- ============================================================================
-- INDEX POUR LA TABLE ACCESS_LOGS
-- ============================================================================

-- Index composite pour les requêtes filtrant par user_id et triant par date
-- Utilisé dans: AccessLogs.jsx
CREATE INDEX IF NOT EXISTS idx_access_logs_user_date
  ON access_logs(user_id, created_at DESC);

-- Index composite pour les requêtes filtrant par action et triant par date
-- Utilisé dans: AccessLogs.jsx
CREATE INDEX IF NOT EXISTS idx_access_logs_action_date
  ON access_logs(action, created_at DESC);

-- Index simple pour les requêtes triant par date de création
-- Utilisé dans: AccessLogs.jsx
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at
  ON access_logs(created_at DESC);

-- ============================================================================
-- INDEX POUR LA TABLE MEMBERS (IMPORTANT!)
-- ============================================================================

-- Index sur title - CRITIQUE car utilisé dans plusieurs filtres
-- Utilisé dans: VolunteerQuiz.jsx, MemberGroupTest.jsx, PasseportValidation.jsx
CREATE INDEX IF NOT EXISTS idx_members_title
  ON members(title);

-- Index sur groupe_id pour les requêtes de groupes
-- Utilisé dans: MemberGroupTest.jsx, GroupeAdmin.jsx
CREATE INDEX IF NOT EXISTS idx_members_groupe_id
  ON members(groupe_id);

-- Index sur emergency_contact_1_id pour les jointures
-- Utilisé dans: MemberView.jsx
CREATE INDEX IF NOT EXISTS idx_members_emergency_contact_1
  ON members(emergency_contact_1_id);

-- Index sur emergency_contact_2_id pour les jointures
-- Utilisé dans: MemberView.jsx
CREATE INDEX IF NOT EXISTS idx_members_emergency_contact_2
  ON members(emergency_contact_2_id);

-- ============================================================================
-- INDEX POUR LA TABLE SECURE_MEMBERS (Vue avec RLS)
-- ============================================================================

-- Index sur title pour la vue sécurisée
-- Utilisé dans: ValidatorCombobox.jsx, PasseportValidation.jsx
CREATE INDEX IF NOT EXISTS idx_secure_members_title
  ON secure_members(title);

-- ============================================================================
-- INDEX POUR LA TABLE COMPETITION_PARTICIPANTS
-- ============================================================================

-- Index sur member_id pour les requêtes de palmarès
-- Utilisé dans: MemberView.jsx, CompetitorSummary.jsx
CREATE INDEX IF NOT EXISTS idx_competition_participants_member
  ON competition_participants(member_id);

-- Index sur competition_id pour les listes de participants
-- Utilisé dans: CompetitionParticipants.jsx
CREATE INDEX IF NOT EXISTS idx_competition_participants_comp
  ON competition_participants(competition_id);

-- Index composite pour les requêtes de compétiteurs
-- Utilisé dans: MemberView.jsx
CREATE INDEX IF NOT EXISTS idx_competition_participants_member_role
  ON competition_participants(member_id, role);

-- ============================================================================
-- INDEX POUR LA TABLE COMPETITIONS
-- ============================================================================

-- Index sur start_date pour le tri chronologique
-- Utilisé dans: CompetitionsList.jsx, MemberView.jsx
CREATE INDEX IF NOT EXISTS idx_competitions_start_date
  ON competitions(start_date DESC);

-- Index composite pour les filtres de statut et date
-- Utilisé dans: CompetitionsList.jsx
CREATE INDEX IF NOT EXISTS idx_competitions_status_date
  ON competitions(status, start_date DESC);

-- ============================================================================
-- INDEX POUR LA TABLE NEWS
-- ============================================================================

-- Index composite pour les filtres de statut et tri par date
-- Utilisé dans: News.jsx
CREATE INDEX IF NOT EXISTS idx_news_status_date
  ON news(status, date DESC);

-- Index composite pour les actualités épinglées
-- Utilisé dans: News.jsx
CREATE INDEX IF NOT EXISTS idx_news_pinned_date
  ON news(is_pinned DESC, date DESC);

-- Index pour les actualités privées
-- Utilisé dans: News.jsx
CREATE INDEX IF NOT EXISTS idx_news_is_private
  ON news(is_private);

-- ============================================================================
-- INDEX POUR LA TABLE STUDENT_SESSION_COMMENTS
-- ============================================================================

-- Index sur session_id pour charger les commentaires d'une session
-- Utilisé dans: SessionLogDetail.jsx, AttendanceRecap.jsx
CREATE INDEX IF NOT EXISTS idx_student_comments_session
  ON student_session_comments(session_id);

-- Index sur member_id pour charger l'historique des commentaires d'un membre
-- Utilisé dans: MemberView.jsx (potentiel)
CREATE INDEX IF NOT EXISTS idx_student_comments_member
  ON student_session_comments(member_id);

-- ============================================================================
-- INDEX POUR LA TABLE PEDAGOGY_SHEETS
-- ============================================================================

-- Index sur sheet_type pour filtrer par type de fiche
-- Utilisé dans: Pedagogy.jsx, ExerciseProgress.jsx
CREATE INDEX IF NOT EXISTS idx_pedagogy_sheets_type
  ON pedagogy_sheets(sheet_type);

-- Index sur title pour les recherches textuelles
-- Utilisé dans: Pedagogy.jsx
CREATE INDEX IF NOT EXISTS idx_pedagogy_sheets_title
  ON pedagogy_sheets(title);

-- ============================================================================
-- INDEX POUR LA TABLE EXERCISES
-- ============================================================================

-- Index sur pedagogy_sheet_id pour les jointures
-- Utilisé dans: SessionLogDetail.jsx
CREATE INDEX IF NOT EXISTS idx_exercises_pedagogy_sheet
  ON exercises(pedagogy_sheet_id);

-- ============================================================================
-- INDEX POUR LA TABLE SCHEDULES
-- ============================================================================

-- Index sur type et age_category pour les filtres
-- Utilisé dans: ScheduleAdmin.jsx, AttendanceRecap.jsx
CREATE INDEX IF NOT EXISTS idx_schedules_type_age
  ON schedules(type, age_category);

-- ============================================================================
-- INDEX POUR LA TABLE PASSEPORT_VALIDATIONS
-- ============================================================================

-- Index sur member_id pour l'historique des validations
-- Utilisé dans: PasseportHistory.jsx, PasseportViewer.jsx
CREATE INDEX IF NOT EXISTS idx_passeport_validations_member
  ON passeport_validations(member_id);

-- Index sur validation_date pour le tri chronologique
-- Utilisé dans: PasseportHistory.jsx
CREATE INDEX IF NOT EXISTS idx_passeport_validations_date
  ON passeport_validations(validation_date DESC);

-- Index composite pour les requêtes de passeport spécifique
-- Utilisé dans: PasseportHistory.jsx
CREATE INDEX IF NOT EXISTS idx_passeport_validations_member_passeport
  ON passeport_validations(member_id, passeport_type);

-- ============================================================================
-- INDEX POUR LA TABLE BUREAU
-- ============================================================================

-- Index sur members_id pour les jointures avec members
-- Utilisé dans: MemberGroupTest.jsx, Volunteers.jsx
CREATE INDEX IF NOT EXISTS idx_bureau_members_id
  ON bureau(members_id);

-- Index sur role pour filtrer par rôle
-- Utilisé dans: Volunteers.jsx
CREATE INDEX IF NOT EXISTS idx_bureau_role
  ON bureau(role);

-- ============================================================================
-- INDEX POUR LA TABLE CYCLES
-- ============================================================================

-- Index sur active pour filtrer les cycles actifs
-- Utilisé dans: CycleManagement.jsx
CREATE INDEX IF NOT EXISTS idx_cycles_active
  ON cycles(active);

-- ============================================================================
-- VÉRIFICATION DES INDEX CRÉÉS
-- ============================================================================

-- Pour vérifier que les index ont été créés, exécutez cette requête :
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================

-- 1. Exécuter ce script dans l'éditeur SQL de Supabase
-- 2. Les index sont créés avec IF NOT EXISTS pour éviter les erreurs
-- 3. La création des index peut prendre quelques secondes à quelques minutes
--    selon la taille des tables
-- 4. Après création, PostgreSQL utilisera automatiquement ces index
-- 5. Pour monitorer l'utilisation des index :
--    SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

-- ============================================================================
-- IMPACT ATTENDU
-- ============================================================================

-- Amélioration des performances :
-- - Requêtes sur sessions : -40 à -60% temps d'exécution
-- - Requêtes sur members : -30 à -50% temps d'exécution
-- - Requêtes sur access_logs : -50 à -70% temps d'exécution
-- - Requêtes sur competitions : -40 à -60% temps d'exécution
-- - Charges globales de la DB : -30 à -50%

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
