-- Core preferences used for a member's daily SaddleMatch roundup.
alter table public.profiles
  add column if not exists min_age int not null default 18 check (min_age between 18 and 99),
  add column if not exists max_age int not null default 99 check (max_age between 18 and 99),
  add column if not exists relationship_intent text not null default 'open_to_either'
    check (relationship_intent in ('long_term', 'short_term', 'open_to_either'));

alter table public.profiles
  drop constraint if exists profiles_age_range_valid;
alter table public.profiles
  add constraint profiles_age_range_valid check (min_age <= max_age);
