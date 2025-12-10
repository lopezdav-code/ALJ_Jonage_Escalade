-- Fix: Make comment field nullable in student_session_comments
-- Date: 2025-12-10
-- Reason: Allow saving max_moulinette and max_tete without requiring a comment

ALTER TABLE student_session_comments
ALTER COLUMN comment DROP NOT NULL;

-- Update comment field description
COMMENT ON COLUMN student_session_comments.comment IS 'Commentaire optionnel pour cet élève lors de cette session';
