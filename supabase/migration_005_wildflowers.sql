-- One-time paid Wildflower signals. Rows are written only by the verified
-- Stripe webhook after successful payment.
create table if not exists public.wildflowers (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  stripe_checkout_session_id text unique not null,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists idx_wildflowers_recipient on public.wildflowers(recipient_id, created_at desc);
alter table public.wildflowers enable row level security;

drop policy if exists "members can read received wildflowers" on public.wildflowers;
create policy "members can read received wildflowers"
  on public.wildflowers for select
  using (auth.uid() = recipient_id);
