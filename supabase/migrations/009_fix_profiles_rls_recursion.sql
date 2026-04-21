-- ============================================================
-- FARfit Platform — Migration 009: Fix profiles RLS recursion
-- ============================================================
-- Root cause: "profiles: trainer reads their clients" (from 008)
-- queries public.profiles inline within a profiles policy.
-- Inline SQL in a policy is subject to RLS, so evaluating the
-- profiles policy triggers itself → infinite recursion.
--
-- Fix: add SECURITY DEFINER helpers (is_trainer, get_my_role) that
-- bypass RLS when reading profiles, then use them in all policies
-- that previously did inline SELECT on profiles.
-- ============================================================

-- ── SECURITY DEFINER helpers ─────────────────────────────────

create or replace function public.is_trainer()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'trainer'
  );
$$;

create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── Fix profiles table ───────────────────────────────────────
-- Drop the recursive policy from migration 008 and replace it.

drop policy if exists "profiles: trainer reads their clients" on public.profiles;

create policy "profiles: trainer reads their clients"
  on public.profiles for select
  using (
    public.is_trainer()
    and exists (
      select 1 from public.clients c
      where c.id = profiles.id
        and c.trainer_id = auth.uid()
    )
  );

-- ── Fix other tables that inline-query profiles for role ─────
-- These are on *other* tables so they don't self-recurse on profiles,
-- but they trigger profiles RLS which then hits the recursive policy
-- above. Replace them all with is_trainer() / is_admin() calls.

-- clients
drop policy if exists "clients: trainer reads their clients"   on public.clients;
drop policy if exists "clients: trainer updates their clients" on public.clients;
drop policy if exists "clients: trainer inserts for their clients" on public.clients;

create policy "clients: trainer reads their clients"
  on public.clients for select
  using (trainer_id = auth.uid() and public.is_trainer());

create policy "clients: trainer updates their clients"
  on public.clients for update
  using (trainer_id = auth.uid() and public.is_trainer());

create policy "clients: trainer inserts for their clients"
  on public.clients for insert
  with check (trainer_id = auth.uid() and public.is_trainer());

-- plans
drop policy if exists "plans: trainer full access for their clients" on public.plans;

create policy "plans: trainer full access for their clients"
  on public.plans for all
  using (trainer_id = auth.uid() and public.is_trainer());

-- assessments
drop policy if exists "assessments: trainer reads their clients" on public.assessments;

create policy "assessments: trainer reads their clients"
  on public.assessments for select
  using (
    public.is_trainer()
    and exists (
      select 1 from public.clients c
      where c.id = assessments.client_id
        and c.trainer_id = auth.uid()
    )
  );

-- chat_sessions
drop policy if exists "chat_sessions: trainer reads their clients" on public.chat_sessions;

create policy "chat_sessions: trainer reads their clients"
  on public.chat_sessions for select
  using (trainer_id = auth.uid() and public.is_trainer());

-- chat_messages
drop policy if exists "chat_messages: trainer reads their clients" on public.chat_messages;

create policy "chat_messages: trainer reads their clients"
  on public.chat_messages for select
  using (
    public.is_trainer()
    and exists (
      select 1 from public.clients c
      where c.id = chat_messages.client_id
        and c.trainer_id = auth.uid()
    )
  );

-- usage_events
drop policy if exists "usage_events: trainer reads their scope" on public.usage_events;

create policy "usage_events: trainer reads their scope"
  on public.usage_events for select
  using (trainer_id = auth.uid() and public.is_trainer());
