-- SaddleMatch profile media: member-uploaded photos and one optional intro video.
-- Run this after schema.sql and migrations 002–003.

alter table public.profiles
  add column if not exists intro_video_url text;

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
  created_at,
  intro_video_url
from public.profiles;

grant select on public.public_profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated members can view profile media" on storage.objects;
create policy "authenticated members can view profile media"
  on storage.objects for select to authenticated
  using (bucket_id = 'profile-media');

drop policy if exists "members upload only their own profile media" on storage.objects;
create policy "members upload only their own profile media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "members update only their own profile media" on storage.objects;
create policy "members update only their own profile media"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "members remove only their own profile media" on storage.objects;
create policy "members remove only their own profile media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
