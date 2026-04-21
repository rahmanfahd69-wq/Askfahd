-- ============================================================
-- FARfit Platform — Migration 008: Fix Client Management
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Allow trainers to INSERT clients (needed for upsert flow)
--    Previously only update was allowed; upsert requires insert permission.
create policy "clients: trainer inserts for their clients"
  on public.clients for insert
  with check (
    trainer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );

-- 2. Allow trainers to read their clients' PROFILE rows (full_name, email).
--    Without this, the trainer client list shows no names and the detail page
--    cannot fetch client info.
create policy "profiles: trainer reads their clients"
  on public.profiles for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = profiles.id
        and c.trainer_id = auth.uid()
    )
    and exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'trainer')
  );
