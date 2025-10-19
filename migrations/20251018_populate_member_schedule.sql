-- Populate member_schedule based on matching rules
-- Strategy:
-- 1) Strict: exact match between members.title = schedules.type AND members.sub_group matches schedules.age_category or day or start_time (if applicable)
-- 2) Fallback: match members.title -> schedules.type and members.category -> schedules.age_category
-- 3) Manual review entries inserted with low confidence

-- NOTE: Review results in a transaction and commit when satisfied
BEGIN;

-- 1) Strict matching by title -> type and sub_group text contained in age_category or day
INSERT INTO public.member_schedule (member_id, schedule_id, match_type, confidence)
SELECT m.id, s.id, 'strict_title_subgroup', 100
FROM public.members m
JOIN public.schedules s
  ON lower(trim(m.title)) = lower(trim(s.type))
WHERE (
  (m.sub_group IS NOT NULL AND m.sub_group <> '' AND (position(lower(m.sub_group) in lower(s.age_category)) > 0 OR position(lower(m.sub_group) in lower(s.day)) > 0))
)
AND NOT EXISTS (
  SELECT 1 FROM public.member_schedule ms WHERE ms.member_id = m.id AND ms.schedule_id = s.id
);

-- 2) Title -> type and category -> age_category (useful for categories U11/U13/U15 etc.)
INSERT INTO public.member_schedule (member_id, schedule_id, match_type, confidence)
SELECT m.id, s.id, 'title_category', 80
FROM public.members m
JOIN public.schedules s
  ON lower(trim(m.title)) = lower(trim(s.type))
WHERE m.category IS NOT NULL AND m.category <> ''
  AND position(lower(m.category) in lower(s.age_category)) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.member_schedule ms WHERE ms.member_id = m.id AND ms.schedule_id = s.id
  );

-- 3) Fuzzy: title startswith schedule.type or vice-versa
INSERT INTO public.member_schedule (member_id, schedule_id, match_type, confidence)
SELECT m.id, s.id, 'fuzzy_title', 50
FROM public.members m
JOIN public.schedules s
  ON (lower(s.type) LIKE lower(trim(m.title)) || '%' OR lower(trim(m.title)) LIKE lower(s.type) || '%')
WHERE NOT EXISTS (
  SELECT 1 FROM public.member_schedule ms WHERE ms.member_id = m.id AND ms.schedule_id = s.id
);

-- 4) Mark unmatched members for manual review with NULL schedule_id (optional table) -- create if not exists
CREATE TABLE IF NOT EXISTS public.member_schedule_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert members with no match into review table
INSERT INTO public.member_schedule_review (member_id, note)
SELECT m.id, 'no_match_found' FROM public.members m
WHERE NOT EXISTS (SELECT 1 FROM public.member_schedule ms WHERE ms.member_id = m.id)
AND NOT EXISTS (SELECT 1 FROM public.member_schedule_review r WHERE r.member_id = m.id);

-- Commit after manual review
-- COMMIT;

-- To inspect inserted rows:
-- SELECT * FROM public.member_schedule LIMIT 200;
