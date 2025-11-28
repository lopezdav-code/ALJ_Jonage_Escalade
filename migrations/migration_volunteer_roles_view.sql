-- ============================================
-- Création de la vue pour les rôles des bénévoles
-- ============================================

CREATE OR REPLACE VIEW volunteer_roles_view AS
WITH instructor_schedules AS (
    SELECT 
        instructor_1_id AS member_id, type FROM schedules WHERE instructor_1_id IS NOT NULL
    UNION ALL
    SELECT 
        instructor_2_id AS member_id, type FROM schedules WHERE instructor_2_id IS NOT NULL
    UNION ALL
    SELECT 
        instructor_3_id AS member_id, type FROM schedules WHERE instructor_3_id IS NOT NULL
    UNION ALL
    SELECT 
        instructor_4_id AS member_id, type FROM schedules WHERE instructor_4_id IS NOT NULL
)
SELECT 
    member_id,
    BOOL_OR(type = 'Autonomes') AS is_ouvreur,
    BOOL_OR(type != 'Autonomes') AS is_encadrant
FROM instructor_schedules
GROUP BY member_id;

-- Grant access to authenticated users
GRANT SELECT ON volunteer_roles_view TO authenticated;
