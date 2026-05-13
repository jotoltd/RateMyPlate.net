-- Admin system migration

-- 1. Add columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Grant admin to itsjmg@icloud.com
UPDATE public.profiles SET is_admin = true WHERE email = 'itsjmg@icloud.com';

-- 4. RLS helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 5. Admin RLS policies
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any plate" ON public.plates;
CREATE POLICY "Admins can delete any plate"
  ON public.plates FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any plate" ON public.plates;
CREATE POLICY "Admins can update any plate"
  ON public.plates FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;
CREATE POLICY "Admins can delete any comment"
  ON public.comments FOR DELETE
  USING (public.is_admin());
