-- Single-row settings table for global app configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true), -- enforces single row
  maintenance_mode boolean NOT NULL DEFAULT false
);

-- Seed the row
INSERT INTO public.app_settings (id, maintenance_mode)
VALUES (true, false)
ON CONFLICT (id) DO NOTHING;

-- Anon can read (proxy needs it without auth context)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Only service role / admin RPCs can update — no direct client updates
