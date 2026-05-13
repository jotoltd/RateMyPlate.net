-- Add moderation status to plates
ALTER TABLE public.plates
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- Index for fast queue queries
CREATE INDEX IF NOT EXISTS plates_status_idx ON public.plates (status, created_at DESC);

-- Existing plates that were already live should be approved automatically
UPDATE public.plates SET status = 'approved' WHERE status = 'pending';
