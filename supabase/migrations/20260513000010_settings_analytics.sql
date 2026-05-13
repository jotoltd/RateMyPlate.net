ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS analytics_id text DEFAULT 'G-KY54CZX9QJ',
  ADD COLUMN IF NOT EXISTS site_announcement text DEFAULT NULL;

UPDATE public.app_settings SET analytics_id = 'G-KY54CZX9QJ' WHERE analytics_id IS NULL;
