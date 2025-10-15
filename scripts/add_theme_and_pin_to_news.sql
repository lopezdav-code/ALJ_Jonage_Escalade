-- Add 'theme' and 'is_pinned' columns to the 'news' table
-- Default theme is 'Information générale' and is_pinned is FALSE

ALTER TABLE news
ADD COLUMN theme VARCHAR(255) NOT NULL DEFAULT 'Information générale',
ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
