-- Add unique constraint on numero_billet column in competition_registrations table
-- This ensures that each ticket number can only be used once
-- Using a partial unique index that ignores NULL values

CREATE UNIQUE INDEX IF NOT EXISTS unique_numero_billet
ON competition_registrations (numero_billet)
WHERE numero_billet IS NOT NULL;
