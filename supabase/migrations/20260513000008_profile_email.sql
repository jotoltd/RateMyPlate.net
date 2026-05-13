-- Store email on profile so server actions can send notifications without service role key
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill from auth.users for existing profiles (runs as postgres superuser in migration)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
