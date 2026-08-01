-- ============================================================
-- SaddleMatch — Migration 003
-- Privacy & safety, built in from day one:
--   - blocks (mutually hides profiles from Discover/queue)
--   - reports (flags a user for review, does not auto-hide)
--   - profiles.is_demo (clearly marks fictional dev/test profiles
--     so they can never be mistaken for real members)
--   - cities.is_open (lets a city be gated to waitlist-only while
--     it's still being recruited)
-- Safe to run on top of schema.sql + migration_002_prompts.sql.
-- ============================================================

-- ------------------------------------------------------------
-- Demo profile flag
-- ------------------------------------------------------------
-- Fictional profiles used only so Discover/Matches feel populated
-- during development and testing. Never real members — the app
-- must always render a visible "Demo profile" badge wherever a
-- profile with is_demo = true is shown. Exclude these before a
-- real public launch (or keep them but never let a real user
-- believe one is an actual local match).
alter table public.profiles
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_profiles_is_demo on public.profiles(is_demo);

-- ------------------------------------------------------------
-- City open/closed (for a staged, city-by-city recruiting rollout)
-- ------------------------------------------------------------
-- Defaults to true so nothing changes until it's deliberately
-- flipped off for a city that isn't being actively recruited yet.
alter table public.cities
  add column if not exists is_open boolean not null default true;

-- ------------------------------------------------------------
-- Blocks — one-directional row, hides in both directions in queries
-- ------------------------------------------------------------
create table if not exists public.blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists idx_blocks_blocker on public.blocks(blocker_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_id);

alter table public.blocks enable row level security;

drop policy if exists "users manage their own blocks" on public.blocks;
create policy "users manage their own blocks"
  on public.blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- ------------------------------------------------------------
-- Reports — logged for review, does not auto-hide anyone
-- ------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz default now(),
  check (reporter_id <> reported_id)
);

create index if not exists idx_reports_reported on public.reports(reported_id);
create index if not exists idx_reports_status on public.reports(status);

alter table public.reports enable row level security;

drop policy if exists "users can file reports" on public.reports;
create policy "users can file reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "users can read their own filed reports" on public.reports;
create policy "users can read their own filed reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- ------------------------------------------------------------
-- Tighten profiles RLS: a user may only read their OWN full row
-- (which includes birthdate — needed for their own profile editor).
-- Other users' profiles must go through public_profiles below,
-- which deliberately excludes birthdate and exposes computed age
-- instead. This closes a real gap: the previous "any authenticated
-- user can read any profile" policy let the raw birthdate of every
-- other member leak to the client.
-- ------------------------------------------------------------
drop policy if exists "profiles are readable by authenticated users" on public.profiles;

create policy "users can read their own full profile"
  on public.profiles for select
  using (auth.uid() = id);

-- ------------------------------------------------------------
-- public_profiles — the safe, other-member-facing view.
-- Runs with the view owner's privileges (standard Postgres view
-- behavior), so it can read across all profiles while the base
-- table stays locked to owner-only above. Exposes only what the
-- product needs to show about someone else: never birthdate,
-- never interested_in (their private matching preference).
-- ------------------------------------------------------------
create or replace view public.public_profiles as
select
  id,
  display_name,
  date_part('year', age(current_date, birthdate))::int as age,
  gender,
  city_id,
  bio,
  interests,
  photo_urls,
  prompts,
  is_active,
  is_demo,
  created_at
from public.profiles;

grant select on public.public_profiles to authenticated;

-- ------------------------------------------------------------
-- Waitlist signups — for recruiting real members city-by-city
-- (rodeos, country-music events, western bars, local Facebook
-- groups, TikTok) instead of opening every city at once.
-- Anyone can insert (no auth required — this is a pre-signup form).
-- ------------------------------------------------------------
create table if not exists public.waitlist_signups (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  city_id int not null references public.cities(id),
  source text,
  created_at timestamptz default now()
);

create index if not exists idx_waitlist_city on public.waitlist_signups(city_id);

alter table public.waitlist_signups enable row level security;

drop policy if exists "anyone can join the waitlist" on public.waitlist_signups;
create policy "anyone can join the waitlist"
  on public.waitlist_signups for insert
  with check (true);
