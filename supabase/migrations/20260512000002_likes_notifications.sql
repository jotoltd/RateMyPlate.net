-- Likes table
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid references public.plates(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(plate_id, user_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.likes for select using (true);

create policy "Authenticated users can like"
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike their own likes"
  on public.likes for delete using (auth.uid() = user_id);

-- Add like_count to plates
alter table public.plates add column if not exists like_count integer default 0 not null;

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('like', 'comment', 'rating', 'reply')),
  plate_id uuid references public.plates(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Authenticated users can insert notifications"
  on public.notifications for insert with check (auth.role() = 'authenticated');

create policy "Users can update their own notifications"
  on public.notifications for update using (auth.uid() = user_id);
