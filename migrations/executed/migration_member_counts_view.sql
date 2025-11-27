-- Create index on student_session_comments for faster filtering by member_id
CREATE INDEX IF NOT EXISTS idx_student_session_comments_member_id ON student_session_comments(member_id);

-- Create GIN index on sessions students array for faster containment queries
CREATE INDEX IF NOT EXISTS idx_sessions_students ON sessions USING GIN (students);

-- Create a view to get counts for member details
CREATE OR REPLACE VIEW member_details_counts AS
SELECT
    m.id AS member_id,
    (
        SELECT COUNT(*)
        FROM sessions s
        WHERE s.students @> ARRAY[m.id]
    ) AS session_count,
    (
        SELECT COUNT(*)
        FROM student_session_comments ssc
        WHERE ssc.member_id = m.id
    ) AS comment_count,
    (
        SELECT COUNT(*)
        FROM competition_participants cp
        WHERE cp.member_id = m.id AND cp.role = 'Competiteur'
    ) AS competition_count,
    (
        SELECT COUNT(*)
        FROM competition_participants cp
        WHERE cp.member_id = m.id AND cp.role = 'Competiteur' AND cp.ranking IS NOT NULL
    ) AS award_count,
    (
        SELECT COUNT(*)
        FROM member_schedule ms
        WHERE ms.member_id = m.id
    ) AS schedule_count,
    (
        SELECT COUNT(*)
        FROM schedules s
        WHERE s.instructor_1_id = m.id 
           OR s.instructor_2_id = m.id 
           OR s.instructor_3_id = m.id 
           OR s.instructor_4_id = m.id
    ) AS teaching_count
FROM members m;
