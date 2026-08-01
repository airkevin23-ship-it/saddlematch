-- ============================================================
-- TX Connect — Supabase schema
-- Regional dating app for Houston, Austin, Dallas, San Antonio
-- Run this in the Supabase SQL editor on a fresh project.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Cities (seeded, fixed list for MVP)
-- ------------------------------------------------------------
create table if not exists public.cities (
  id serial primary key,
  slug text unique not null,
  name text not null
);

insert into public.cities (slug, name) values
  ('houston', 'Houston'),
  ('austin', 'Austin'),
  ('dallas', 'Dallas'),
  ('san-antonio', 'San Antonio')
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  birthdate date not null,
  gender text not null check (gender in ('male', 'female', 'nonbinary', 'other')),
  interested_in text[] not null default '{}',
  city_id int not null references public.cities(id),
  bio text default '',
  interests text[] default '{}',
  photo_urls text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_city on public.profiles(city_id);

-- ------------------------------------------------------------
-- Swipes (like / pass)
-- ------------------------------------------------------------
create table if not exists public.swipes (
  id uuid primary key default uuid_generate_v4(),
  swiper_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('like', 'pass')),
  created_at timestamptz default now(),
  unique (swiper_id, target_id)
);

create index if not exists idx_swipes_swiper on public.swipes(swiper_id);
create index if not exists idx_swipes_target on public.swipes(target_id);

-- ------------------------------------------------------------
-- Matches (created when both sides like each other)
-- ------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  match_reason text,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

create index if not exists idx_matches_user_a on public.matches(user_a);
create index if not exists idx_matches_user_b on public.matches(user_b);

-- ------------------------------------------------------------
-- Messages
-- ------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_match on public.messages(match_id, created_at);

-- ------------------------------------------------------------
-- Subscriptions (Stripe)
-- ------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Trigger: create match row when a mutual like happens
-- ------------------------------------------------------------
create or replace function public.handle_swipe_like()
returns trigger as $$
declare
  reciprocal record;
  a uuid;
  b uuid;
begin
  if new.action <> 'like' then
    return new;
  end if;

  select * into reciprocal
  from public.swipes
  where swiper_id = new.target_id
    and target_id = new.swiper_id
    and action = 'like';

  if found then
    if new.swiper_id < new.target_id then
      a := new.swiper_id;
      b := new.target_id;
    else
      a := new.target_id;
      b := new.swiper_id;
    end if;

    insert into public.matches (user_a, user_b)
    values (a, b)
    on conflict (user_a, user_b) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_handle_swipe_like on public.swipes;
create trigger trg_handle_swipe_like
  after insert on public.swipes
  for each row execute function public.handle_swipe_like();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.cities enable row level security;

create policy "profiles are readable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "users can create their own swipes"
  on public.swipes for insert
  with check (auth.uid() = swiper_id);

create policy "users can read swipes involving them"
  on public.swipes for select
  using (auth.uid() = swiper_id or auth.uid() = target_id);

create policy "users can read their own matches"
  on public.matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "users can update match reason for their matches"
  on public.matches for update
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "users can read their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "cities are publicly readable"
  on public.cities for select
  using (true);
