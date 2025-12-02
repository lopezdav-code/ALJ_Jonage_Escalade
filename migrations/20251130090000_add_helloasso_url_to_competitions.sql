-- Add helloasso_widget_url column to competitions table
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS helloasso_widget_url TEXT;
