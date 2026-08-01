-- ============================================================
-- TX Connect — Migration 002
-- Adds Hinge-style prompts, comment-on-like, and a Coffee-Meets-Bagel
-- style daily curated queue. Safe to run on top of schema.sql.
-- ============================================================

-- Prompt-based profiles (replaces free-text-only bio as the main
-- personality signal; bio becomes a short optional tagline).
alter table public.profiles
  add column if not exists prompts jsonb not null default '[]'::jsonb;

-- Comment-on-like: when a user likes a specific prompt/photo, the
-- comment they leave becomes the opening message automatically.
alter table public.swipes
  add column if not exists like_comment text,
  add column if not exists liked_prompt_index int;

-- Daily curated queue (Coffee Meets Bagel / Crush style): a capped,
-- once-a-day set of candidates instead of infinite swiping.
create table if not exists public.daily_queues (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  queue_date date not null,
  candidate_ids uuid[] not null default '{}',
  updated_at timestamptz default now()
);

alter table public.daily_queues enable row level security;

drop policy if exists "users manage their own daily queue" on public.daily_queues;
create policy "users manage their own daily queue"
  on public.daily_queues for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
