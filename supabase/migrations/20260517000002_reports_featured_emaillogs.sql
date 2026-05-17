-- Reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  plate_id uuid references public.plates(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  resolved boolean default false not null,
  created_at timestamptz default now() not null
);
alter table public.reports enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='reports' and policyname='Users can create reports') then
    create policy "Users can create reports" on public.reports for insert with check (auth.uid() = reporter_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='reports' and policyname='Admins can view reports') then
    create policy "Admins can view reports" on public.reports for select
      using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
  end if;
  if not exists (select 1 from pg_policies where tablename='reports' and policyname='Admins can update reports') then
    create policy "Admins can update reports" on public.reports for update
      using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
  end if;
end $$;

-- Email audit log
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  recipient_email text not null,
  subject text,
  sent_at timestamptz default now() not null
);
alter table public.email_logs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='email_logs' and policyname='Admins can view email logs') then
    create policy "Admins can view email logs" on public.email_logs for select
      using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
  end if;
  if not exists (select 1 from pg_policies where tablename='email_logs' and policyname='Service can insert email logs') then
    create policy "Service can insert email logs" on public.email_logs for insert with check (true);
  end if;
end $$;

-- Featured plate on app_settings
alter table public.app_settings add column if not exists featured_plate_id uuid references public.plates(id) on delete set null;
