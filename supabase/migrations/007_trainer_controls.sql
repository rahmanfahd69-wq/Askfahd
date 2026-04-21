-- ============================================================
-- FARfit Platform — Migration 007: Trainer Controls
-- Run in Supabase SQL Editor
-- ============================================================

-- Track when client was last active (updated on client dashboard load)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Ensure onboarding_done defaults true going forward
-- (trainers control profiles, no client assessment needed)
ALTER TABLE public.clients
  ALTER COLUMN onboarding_done SET DEFAULT true;

-- Backfill existing clients: if trainer has filled in info, mark onboarding done
UPDATE public.clients
SET onboarding_done = true
WHERE onboarding_done = false;
