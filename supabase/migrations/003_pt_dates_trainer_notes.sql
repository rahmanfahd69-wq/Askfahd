-- ============================================================
-- FARfit Platform — Migration 003: PT Dates + Trainer Notes
-- Run in Supabase SQL Editor
-- ============================================================

alter table public.clients
  add column if not exists pt_start_date  date,
  add column if not exists pt_end_date    date,
  add column if not exists trainer_notes  text;
