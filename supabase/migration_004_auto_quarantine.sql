-- SaddleMatch Migration 004: Auto-quarantine after 3+ reports in 24h.
-- Hides a profile from Discover automatically; does NOT delete data
-- or block messaging. Reversible from /admin/moderation.

alter table public.profiles
  add column if not exists is_quarantined boolean not null default false;

create index if not exists idx_profiles_is_quarantined on public.profiles(is_quarantined);

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
  is_quarantined,
  created_at
from public.profiles;

grant select on public.public_profiles to authenticated;

create or replace function public.check_auto_quarantine()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_report_count int;
begin
  select count(*) into recent_report_count
  from public.reports
  where reported_id = new.reported_id
    and created_at > now() - interval '24 hours';

  if recent_report_count >= 3 then
    update public.profiles
    set is_quarantined = true
    where id = new.reported_id
      and is_quarantined = false;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_auto_quarantine on public.reports;
create trigger trg_check_auto_quarantine
  after insert on public.reports
  for each row
  execute function public.check_auto_quarantine();
