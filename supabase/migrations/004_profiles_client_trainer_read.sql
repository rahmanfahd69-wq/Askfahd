-- Allow clients to read their assigned trainer's profile row (for full_name)
create policy "profiles: client reads their trainer"
  on public.profiles for select
  using (id = public.get_my_trainer_id());
