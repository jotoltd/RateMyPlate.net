-- Migration: Admin system
-- Run in Supabase SQL Editor

-- 1. Add is_admin flag to profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Add banned flag (for user banning)
alter table public.profiles
  add column if not exists banned boolean not null default false;

-- 3. Grant itsjmg@icloud.com admin rights
update public.profiles
set is_admin = true
where email = 'itsjmg@icloud.com';

-- 4. RLS helper function — lets admin users do anything
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 5. Allow admins to update ANY profile (ban/unban, revoke admin etc.)
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- 6. Allow admins to delete ANY plate
drop policy if exists "Admins can delete any plate" on public.plates;
create policy "Admins can delete any plate"
  on public.plates for delete
  using (public.is_admin());

-- 7. Allow admins to update ANY plate
drop policy if exists "Admins can update any plate" on public.plates;
create policy "Admins can update any plate"
  on public.plates for update
  using (public.is_admin());

-- 8. Allow admins to delete ANY comment
drop policy if exists "Admins can delete any comment" on public.comments;
create policy "Admins can delete any comment"
  on public.comments for delete
  using (public.is_admin());
