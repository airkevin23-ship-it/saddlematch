alter table public.profiles
  add column if not exists preference_details jsonb not null default '{}'::jsonb;
