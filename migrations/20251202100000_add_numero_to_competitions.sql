-- Add numero column to competitions table
-- This column stores the official competition number
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS numero TEXT;

-- Add index for faster searches by numero
CREATE INDEX IF NOT EXISTS idx_competitions_numero ON public.competitions(numero);

-- Add comment to explain the column
COMMENT ON COLUMN public.competitions.numero IS 'Numéro officiel de la compétition';
