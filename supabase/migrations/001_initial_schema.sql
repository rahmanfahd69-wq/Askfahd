-- ============================================================
-- FARfit Platform — Migration 001: Initial Schema
-- Run in Supabase SQL Editor (or via Supabase CLI)
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
create type public.role_enum as enum ('admin', 'trainer', 'client');
create type public.plan_type as enum ('full', 'workout', 'nutrition');
create type public.plan_source as enum ('ai', 'trainer');
create type public.message_role as enum ('user', 'assistant');

-- ── profiles ─────────────────────────────────────────────────
-- Extends auth.users. Created automatically via trigger (003).
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.role_enum not null,
  full_name   text not null,
  email       text not null unique,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── trainers ─────────────────────────────────────────────────
create table public.trainers (
  id                uuid primary key references public.profiles(id) on delete cascade,
  bio               text,
  coaching_style    text,
  ai_system_prompt  text,
  ai_name           text not null default 'Coach',
  photo_url         text,
  specialties       text[] not null default '{}',
  whatsapp_number   text,
  instagram_handle  text,
  max_clients       int not null default 20,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── clients ──────────────────────────────────────────────────
create table public.clients (
  id               uuid primary key references public.profiles(id) on delete cascade,
  trainer_id       uuid references public.trainers(id) on delete set null,
  age              int,
  gender           text,
  height_cm        numeric(5,1),
  weight_kg        numeric(5,1),
  goals            text[] not null default '{}',
  activity_level   text,
  gym_access       text,
  diet_type        text,
  sleep_hours      text,
  stress_level     text,
  work_hours       text,
  injuries         text[] not null default '{}',
  notes            text,          -- private trainer notes
  onboarding_done  boolean not null default false,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index clients_trainer_idx on public.clients(trainer_id);

-- ── plans ────────────────────────────────────────────────────
create table public.plans (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  trainer_id    uuid not null references public.trainers(id) on delete cascade,
  type          public.plan_type not null default 'full',
  title         text,
  content       jsonb not null default '{}',
  is_active     boolean not null default true,
  generated_by  public.plan_source not null default 'ai',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index plans_client_idx  on public.plans(client_id);
create index plans_trainer_idx on public.plans(trainer_id);
create index plans_active_idx  on public.plans(client_id, is_active);

-- ── assessments ──────────────────────────────────────────────
create table public.assessments (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  answers     jsonb not null default '{}',
  plan_id     uuid references public.plans(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index assessments_client_idx on public.assessments(client_id);

-- ── chat_sessions ────────────────────────────────────────────
create table public.chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  trainer_id  uuid not null references public.trainers(id) on delete cascade,
  title       text not null default 'New conversation',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index chat_sessions_client_idx  on public.chat_sessions(client_id);
create index chat_sessions_trainer_idx on public.chat_sessions(trainer_id);

-- ── chat_messages ────────────────────────────────────────────
create table public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.chat_sessions(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  role         public.message_role not null,
  content      text not null,
  tokens_used  int,
  created_at   timestamptz not null default now()
);

create index chat_messages_session_idx on public.chat_messages(session_id);
create index chat_messages_client_idx  on public.chat_messages(client_id);

-- ── usage_events ─────────────────────────────────────────────
create table public.usage_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  trainer_id  uuid references public.trainers(id) on delete set null,
  event_type  text not null,   -- 'chat_message' | 'plan_generated' | 'assessment_taken' | 'login'
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index usage_events_user_idx    on public.usage_events(user_id);
create index usage_events_trainer_idx on public.usage_events(trainer_id);
create index usage_events_type_idx    on public.usage_events(event_type);
create index usage_events_created_idx on public.usage_events(created_at desc);
