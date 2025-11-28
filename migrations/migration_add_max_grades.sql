-- Add max_moulinette and max_tete columns to student_session_comments table
ALTER TABLE student_session_comments
ADD COLUMN IF NOT EXISTS max_moulinette text,
ADD COLUMN IF NOT EXISTS max_tete text;
