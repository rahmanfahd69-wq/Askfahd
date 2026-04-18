-- ============================================================
-- FARfit Platform — Migration 006: New Client Fields + Data Fix
-- Run in Supabase SQL Editor
-- ============================================================

-- FIX 4: New fields for trainer to fill in per client
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS requirements       text,
  ADD COLUMN IF NOT EXISTS medical_conditions text,
  ADD COLUMN IF NOT EXISTS medications        text,
  ADD COLUMN IF NOT EXISTS allergies          text,
  ADD COLUMN IF NOT EXISTS ai_instructions    text;

-- FIX 6: Backfill profiles that have a blank or missing full_name
-- (happens when the trigger fired but metadata had no full_name)
UPDATE public.profiles p
SET full_name = COALESCE(
  NULLIF(TRIM((SELECT u.raw_user_meta_data->>'full_name' FROM auth.users u WHERE u.id = p.id)), ''),
  split_part(p.email, '@', 1)
)
WHERE TRIM(p.full_name) = '' OR p.full_name IS NULL OR p.full_name = split_part(p.email, '@', 1);
