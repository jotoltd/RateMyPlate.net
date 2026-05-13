-- Read-only RPC to fetch pending verification username without consuming the code
CREATE OR REPLACE FUNCTION public.get_pending_verification(p_email text)
RETURNS TABLE(username text, password_hash text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ev.username, ev.password_hash
  FROM public.email_verifications ev
  WHERE ev.email = p_email
    AND ev.expires_at > now();
END;
$$;
