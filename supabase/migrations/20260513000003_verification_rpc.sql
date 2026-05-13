-- RPC functions for email verification OTP (SECURITY DEFINER bypasses RLS)

-- Upsert a new OTP code (overwrites any existing one for the email)
CREATE OR REPLACE FUNCTION public.upsert_email_verification(
  p_email text,
  p_code text,
  p_username text,
  p_password_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.email_verifications(email, code, username, password_hash)
  VALUES (p_email, p_code, p_username, p_password_hash)
  ON CONFLICT (email) DO UPDATE
    SET code = EXCLUDED.code,
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        expires_at = now() + interval '15 minutes',
        created_at = now();
END;
$$;

-- Verify a code — returns the row if valid, deletes it, returns null if expired/wrong
CREATE OR REPLACE FUNCTION public.verify_email_code(
  p_email text,
  p_code text
)
RETURNS TABLE(username text, password_hash text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.email_verifications%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM public.email_verifications
  WHERE email = p_email
    AND code = p_code
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Delete used code
  DELETE FROM public.email_verifications WHERE email = p_email;

  RETURN QUERY SELECT v_row.username, v_row.password_hash;
END;
$$;

-- Delete expired codes (can be called periodically)
CREATE OR REPLACE FUNCTION public.purge_expired_verifications()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.email_verifications WHERE expires_at < now();
$$;
