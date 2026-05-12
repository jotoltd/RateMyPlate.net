-- Rate My Plate — initial schema

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null
);

-- Plates table
create table if not exists public.plates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text not null,
  ai_rating integer check (ai_rating between 1 and 10),
  ai_comment text,
  avg_user_rating numeric(4,2),
  rating_count integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Ratings table
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid references public.plates(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null check (score between 1 and 10),
  comment text,
  created_at timestamptz default now() not null,
  unique(plate_id, user_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.plates enable row level security;
alter table public.ratings enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Plates policies
create policy "Plates are viewable by everyone"
  on public.plates for select using (true);

create policy "Authenticated users can insert plates"
  on public.plates for insert with check (auth.uid() = user_id);

create policy "Users can update their own plates"
  on public.plates for update using (auth.uid() = user_id);

create policy "Users can delete their own plates"
  on public.plates for delete using (auth.uid() = user_id);

create policy "Anyone can update avg_user_rating and rating_count"
  on public.plates for update using (true) with check (true);

-- Ratings policies
create policy "Ratings are viewable by everyone"
  on public.ratings for select using (true);

create policy "Authenticated users can insert ratings"
  on public.ratings for insert with check (auth.uid() = user_id);

create policy "Users can update their own ratings"
  on public.ratings for update using (auth.uid() = user_id);

-- Storage bucket for plate images
insert into storage.buckets (id, name, public)
values ('plates', 'plates', true)
on conflict do nothing;

-- Storage policies
create policy "Anyone can view plate images"
  on storage.objects for select
  using (bucket_id = 'plates');

create policy "Authenticated users can upload plate images"
  on storage.objects for insert
  with check (bucket_id = 'plates' and auth.role() = 'authenticated');

create policy "Users can update their own plate images"
  on storage.objects for update
  using (bucket_id = 'plates' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own plate images"
  on storage.objects for delete
  using (bucket_id = 'plates' and auth.uid()::text = (storage.foldername(name))[1]);
