-- OTP codes for custom email verification
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  username text NOT NULL,
  password_hash text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only one pending code per email at a time
CREATE UNIQUE INDEX IF NOT EXISTS email_verifications_email_idx ON public.email_verifications(email);

-- No RLS needed — only accessed server-side via service logic
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- No public access at all — all operations go through server actions
CREATE POLICY "No direct access" ON public.email_verifications
  USING (false);
