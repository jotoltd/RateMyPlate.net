-- Migration: add email column to profiles (needed for Resend notification emails)
-- Run this in Supabase SQL Editor

alter table public.profiles
  add column if not exists email text;

-- Backfill existing users' emails from auth.users
-- (requires running as service role / postgres superuser)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;
