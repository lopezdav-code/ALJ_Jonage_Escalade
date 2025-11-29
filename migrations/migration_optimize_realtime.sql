-- Migration to optimize Supabase Realtime usage
-- This migration restricts the 'supabase_realtime' publication to only the 'site_config' table.
-- This reduces the load on the database by preventing Realtime from tracking changes on other tables.

BEGIN;

-- Drop the existing publication if it exists (to reset it) or alter it.
-- However, 'ALTER PUBLICATION ... SET TABLE ...' is the cleanest way to replace the table list.

ALTER PUBLICATION supabase_realtime SET TABLE site_config;

COMMIT;
