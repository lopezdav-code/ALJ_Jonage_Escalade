-- Add 'competition_id' column to the 'news' table
-- This column will store the ID of a competition if the news theme is 'Compétition'.
-- It is nullable as not all news items will be linked to a competition.

ALTER TABLE news
ADD COLUMN competition_id UUID REFERENCES competitions(id);
