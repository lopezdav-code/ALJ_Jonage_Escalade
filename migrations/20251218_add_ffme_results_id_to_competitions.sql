-- Add FFME results ID to competitions table
-- This stores the FFME competition ID from the URL (e.g., 13156 from https://mycompet.ffme.fr/resultat/resultat_13156)

ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS ffme_results_id TEXT NULL;

-- Add comment
COMMENT ON COLUMN competitions.ffme_results_id IS 'FFME competition ID for external results link (e.g., 13156 from https://mycompet.ffme.fr/resultat/resultat_13156)';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitions_ffme_results_id ON competitions(ffme_results_id);
