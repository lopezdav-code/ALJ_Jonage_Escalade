-- Create FFME competitions index table
-- This table stores FFME competition IDs and titles scraped from mycompet.ffme.fr

CREATE TABLE IF NOT EXISTS ffme_competitions_index (
  id BIGSERIAL PRIMARY KEY,
  ffme_id BIGINT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on ffme_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_ffme_competitions_index_ffme_id 
  ON ffme_competitions_index(ffme_id);

-- Create index on title for searching
CREATE INDEX IF NOT EXISTS idx_ffme_competitions_index_title 
  ON ffme_competitions_index USING GIN (to_tsvector('french', title));

-- Enable RLS (Row Level Security)
ALTER TABLE ffme_competitions_index ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON ffme_competitions_index;
CREATE POLICY "Allow read access to authenticated users"
  ON ffme_competitions_index
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert (for scrapers)
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON ffme_competitions_index;
CREATE POLICY "Allow authenticated users to insert"
  ON ffme_competitions_index
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update (for scrapers)
DROP POLICY IF EXISTS "Allow authenticated users to update" ON ffme_competitions_index;
CREATE POLICY "Allow authenticated users to update"
  ON ffme_competitions_index
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow service role to manage (for scripts)
DROP POLICY IF EXISTS "Allow service role to manage" ON ffme_competitions_index;
CREATE POLICY "Allow service role to manage"
  ON ffme_competitions_index
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE ffme_competitions_index IS 'Index of FFME competitions scraped from mycompet.ffme.fr for quick lookup';
COMMENT ON COLUMN ffme_competitions_index.ffme_id IS 'The ID from mycompet.ffme.fr URL (e.g., 13150 from resultat_13150)';
COMMENT ON COLUMN ffme_competitions_index.title IS 'Competition title extracted from the resultat page';
