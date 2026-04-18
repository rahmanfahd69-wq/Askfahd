-- ============================================================
-- FARfit Platform — Migration 002: Row Level Security
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles      enable row level security;
alter table public.trainers      enable row level security;
alter table public.clients       enable row level security;
alter table public.plans         enable row level security;
alter table public.assessments   enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.usage_events  enable row level security;

-- ── Helper: is_admin() ───────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── Helper: get_my_trainer_id() ──────────────────────────────
create or replace function public.get_my_trainer_id()
returns uuid language sql security definer stable as $$
  select trainer_id from public.clients where id = auth.uid();
$$;

-- ============================================================
-- profiles
-- ============================================================
create policy "profiles: own read"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: own update"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

create policy "profiles: admin insert"
  on public.profiles for insert
  with check (public.is_admin());

-- ============================================================
-- trainers
-- ============================================================
create policy "trainers: admin full access"
  on public.trainers for all
  using (public.is_admin());

create policy "trainers: own read+update"
  on public.trainers for select
  using (id = auth.uid());

create policy "trainers: own update"
  on public.trainers for update
  using (id = auth.uid());

-- Clients can read their assigned trainer's row
create policy "trainers: client reads their trainer"
  on public.trainers for select
  using (id = public.get_my_trainer_id());

-- ============================================================
-- clients
-- ============================================================
create policy "clients: admin full access"
  on public.clients for all
  using (public.is_admin());

create policy "clients: own read+update"
  on public.clients for select
  using (id = auth.uid());

create policy "clients: own update"
  on public.clients for update
  using (id = auth.uid());

-- Trainer reads/updates their own clients
create policy "clients: trainer reads their clients"
  on public.clients for select
  using (
    trainer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );

create policy "clients: trainer updates their clients"
  on public.clients for update
  using (
    trainer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );

-- ============================================================
-- plans
-- ============================================================
create policy "plans: admin full access"
  on public.plans for all
  using (public.is_admin());

create policy "plans: client reads own"
  on public.plans for select
  using (client_id = auth.uid());

create policy "plans: trainer full access for their clients"
  on public.plans for all
  using (
    trainer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );

-- ============================================================
-- assessments
-- ============================================================
create policy "assessments: admin full access"
  on public.assessments for all
  using (public.is_admin());

create policy "assessments: client read+insert own"
  on public.assessments for select
  using (client_id = auth.uid());

create policy "assessments: client insert own"
  on public.assessments for insert
  with check (client_id = auth.uid());

create policy "assessments: trainer reads their clients"
  on public.assessments for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = assessments.client_id
        and c.trainer_id = auth.uid()
    )
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );

-- ============================================================
-- chat_sessions
-- ============================================================
create policy "chat_sessions: admin full access"
  on public.chat_sessions for all
  using (public.is_admin());

create policy "chat_sessions: client read+insert own"
  on public.chat_sessions for select
  using (client_id = auth.uid());

create policy "chat_sessions: client insert own"
  on public.chat_sessions for insert
  with check (client_id = auth.uid());

create policy "chat_sessions: trainer reads their clients"
  on public.chat_sessions for select
  using (
    trainer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );

-- ============================================================
-- chat_messages
-- ============================================================
create policy "chat_messages: admin full access"
  on public.chat_messages for all
  using (public.is_admin());

create policy "chat_messages: client read+insert own"
  on public.chat_messages for select
  using (client_id = auth.uid());

create policy "chat_messages: client insert own"
  on public.chat_messages for insert
  with check (client_id = auth.uid());

create policy "chat_messages: trainer reads their clients"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = chat_messages.client_id
        and c.trainer_id = auth.uid()
    )
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );

-- ============================================================
-- usage_events (append-only, no client/trainer read)
-- ============================================================
create policy "usage_events: admin reads all"
  on public.usage_events for select
  using (public.is_admin());

create policy "usage_events: trainer reads their scope"
  on public.usage_events for select
  using (
    trainer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );

create policy "usage_events: any authenticated insert"
  on public.usage_events for insert
  with check (user_id = auth.uid());
