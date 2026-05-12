-- Saved plates (collections)
create table if not exists saved_plates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  plate_id uuid references plates(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, plate_id)
);

alter table saved_plates enable row level security;

create policy "Users can manage own saved plates"
  on saved_plates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Comment likes
alter table comments add column if not exists like_count integer not null default 0;

create table if not exists comment_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  comment_id uuid references comments(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, comment_id)
);

alter table comment_likes enable row level security;

create policy "Users can manage own comment likes"
  on comment_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Comment likes viewable by all"
  on comment_likes for select
  using (true);
