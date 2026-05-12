-- Comments table with nested replies support
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid references public.plates(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  created_at timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

create policy "Authenticated users can insert comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.comments for update using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete using (auth.uid() = user_id);
