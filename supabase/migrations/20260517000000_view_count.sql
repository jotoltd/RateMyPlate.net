-- Migration: add view_count to plates + increment RPC
alter table public.plates
  add column if not exists view_count integer default 0 not null;

create or replace function increment_view_count(plate_id uuid)
returns void
language sql
security definer
as $$
  update public.plates
  set view_count = view_count + 1
  where id = plate_id;
$$;
