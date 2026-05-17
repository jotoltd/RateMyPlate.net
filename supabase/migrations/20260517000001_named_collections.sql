-- Migration: named collections (boards)
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now() not null
);

create table if not exists public.collection_plates (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete cascade not null,
  plate_id uuid references public.plates(id) on delete cascade not null,
  added_at timestamptz default now() not null,
  unique(collection_id, plate_id)
);

alter table public.collections enable row level security;
alter table public.collection_plates enable row level security;

create policy "Collections viewable by owner"
  on public.collections for select using (auth.uid() = user_id);

create policy "Users can create collections"
  on public.collections for insert with check (auth.uid() = user_id);

create policy "Users can update own collections"
  on public.collections for update using (auth.uid() = user_id);

create policy "Users can delete own collections"
  on public.collections for delete using (auth.uid() = user_id);

create policy "Collection plates viewable by collection owner"
  on public.collection_plates for select
  using (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()));

create policy "Users can add plates to own collections"
  on public.collection_plates for insert
  with check (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()));

create policy "Users can remove plates from own collections"
  on public.collection_plates for delete
  using (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()));
