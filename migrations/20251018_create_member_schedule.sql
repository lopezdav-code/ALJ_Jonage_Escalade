-- Create member_schedule linking table
-- Run this first in Supabase SQL Editor

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.member_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  schedule_id uuid NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  match_type text NOT NULL,
  confidence integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, schedule_id)
);

CREATE INDEX IF NOT EXISTS idx_member_schedule_member_id ON public.member_schedule(member_id);
CREATE INDEX IF NOT EXISTS idx_member_schedule_schedule_id ON public.member_schedule(schedule_id);
