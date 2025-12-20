-- Add ai_poster_url column to competitions table for storing AI-generated poster URLs
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS ai_poster_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.competitions.ai_poster_url IS 'URL of the AI-generated poster for this competition';
