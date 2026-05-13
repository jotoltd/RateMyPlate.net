-- Migration: add view_count to plates
-- Run this in Supabase SQL Editor if your DB already exists

alter table public.plates
  add column if not exists view_count integer default 0 not null;

-- RPC function to increment view count safely (bypasses RLS)
create or replace function increment_view_count(plate_id uuid)
returns void
language sql
security definer
as $$
  update public.plates
  set view_count = view_count + 1
  where id = plate_id;
$$;
