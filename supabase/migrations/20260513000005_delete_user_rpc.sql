-- Allow a user to delete their own auth.users record (SECURITY DEFINER)
-- This avoids needing the service role key for account deletion.
CREATE OR REPLACE FUNCTION public.delete_own_auth_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
