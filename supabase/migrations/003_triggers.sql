-- ============================================================
-- FARfit Platform — Migration 003: Triggers & Functions
-- Run AFTER 001 and 002
-- ============================================================

-- ── Auto-create profile on new auth.users row ────────────────
--
-- When a user is created via the Supabase Admin API (supabase.auth.admin.createUser),
-- pass the role in raw_user_meta_data:
--   { "full_name": "Jane Smith", "role": "trainer" }
-- This trigger reads those fields and inserts the profile row automatically.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role public.role_enum;
  v_name text;
begin
  -- Read role from metadata, default to 'client' if not provided
  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.role_enum,
    'client'
  );

  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, role, full_name, email)
  values (new.id, v_role, v_name, new.email);

  -- For trainer role: also create the trainers row
  if v_role = 'trainer' then
    insert into public.trainers (id)
    values (new.id);
  end if;

  -- For client role: also create the clients row
  if v_role = 'client' then
    insert into public.clients (id)
    values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Auto-update updated_at timestamps ────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger trainers_updated_at
  before update on public.trainers
  for each row execute procedure public.handle_updated_at();

create trigger clients_updated_at
  before update on public.clients
  for each row execute procedure public.handle_updated_at();

create trigger plans_updated_at
  before update on public.plans
  for each row execute procedure public.handle_updated_at();

create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute procedure public.handle_updated_at();

-- ── Ensure only one active plan per client per type ──────────
create or replace function public.deactivate_old_plans()
returns trigger language plpgsql as $$
begin
  if new.is_active = true then
    update public.plans
    set is_active = false
    where client_id = new.client_id
      and type = new.type
      and id != new.id
      and is_active = true;
  end if;
  return new;
end;
$$;

create trigger one_active_plan_per_type
  after insert or update on public.plans
  for each row execute procedure public.deactivate_old_plans();
