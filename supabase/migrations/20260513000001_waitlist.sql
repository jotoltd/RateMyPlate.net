-- Waitlist for maintenance mode lead capture
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(email)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist
CREATE POLICY "Anyone can insert to waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- Only admins can read the waitlist
CREATE POLICY "Admins can read waitlist"
  ON public.waitlist FOR SELECT
  USING (public.is_admin());
