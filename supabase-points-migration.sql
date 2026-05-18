-- ============================================================
-- POINTS SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add points column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- 2. Helper: recalculate and update points for a plate owner
--    Called whenever a rating or comment changes on a plate.
CREATE OR REPLACE FUNCTION recalculate_plate_points(p_plate_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_owner_id UUID;
  v_upload_points INTEGER := 10;

  -- Rating points: 1-4 stars = 1pt each, 5 stars = 5pts each, cap 500
  v_rating_points INTEGER;

  -- Comment points: 1pt each, cap 500
  v_comment_points INTEGER;

  v_total INTEGER;
BEGIN
  -- Get plate owner
  SELECT user_id INTO v_owner_id FROM plates WHERE id = p_plate_id;
  IF v_owner_id IS NULL THEN RETURN; END IF;

  -- Rating points (capped at 500)
  SELECT LEAST(500, COALESCE(SUM(CASE WHEN score >= 5 THEN 5 ELSE 1 END), 0))
  INTO v_rating_points
  FROM ratings
  WHERE plate_id = p_plate_id;

  -- Comment points (capped at 500)
  SELECT LEAST(500, COALESCE(COUNT(*), 0))
  INTO v_comment_points
  FROM comments
  WHERE plate_id = p_plate_id;

  v_total := v_upload_points + v_rating_points + v_comment_points;

  -- Store per-plate points in a helper table so we can sum across all plates
  INSERT INTO plate_points (plate_id, owner_id, points)
  VALUES (p_plate_id, v_owner_id, v_total)
  ON CONFLICT (plate_id) DO UPDATE SET points = EXCLUDED.points, owner_id = EXCLUDED.owner_id;

  -- Recompute total profile points from all plates
  UPDATE profiles
  SET points = (SELECT COALESCE(SUM(pp.points), 0) FROM plate_points pp WHERE pp.owner_id = v_owner_id)
  WHERE id = v_owner_id;
END;
$$;

-- 3. Plate_points tracking table (one row per plate, stores current points for that plate)
CREATE TABLE IF NOT EXISTS plate_points (
  plate_id UUID PRIMARY KEY REFERENCES plates(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points   INTEGER NOT NULL DEFAULT 0
);

-- 4. Trigger: when a plate is inserted, seed plate_points with 10 upload points
CREATE OR REPLACE FUNCTION trg_plate_inserted()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO plate_points (plate_id, owner_id, points)
  VALUES (NEW.id, NEW.user_id, 10)
  ON CONFLICT (plate_id) DO NOTHING;

  UPDATE profiles SET points = COALESCE(points, 0) + 10 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_plate_inserted ON plates;
CREATE TRIGGER on_plate_inserted
  AFTER INSERT ON plates
  FOR EACH ROW EXECUTE FUNCTION trg_plate_inserted();

-- 5. Trigger: recalculate when a rating is inserted/updated/deleted
CREATE OR REPLACE FUNCTION trg_rating_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_plate_points(OLD.plate_id);
  ELSE
    PERFORM recalculate_plate_points(NEW.plate_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_rating_changed ON ratings;
CREATE TRIGGER on_rating_changed
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION trg_rating_changed();

-- 6. Trigger: recalculate when a comment is inserted/deleted
CREATE OR REPLACE FUNCTION trg_comment_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_plate_points(OLD.plate_id);
  ELSE
    PERFORM recalculate_plate_points(NEW.plate_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_changed ON comments;
CREATE TRIGGER on_comment_changed
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION trg_comment_changed();

-- 7. Backfill existing data
DO $$
DECLARE r RECORD;
BEGIN
  -- Seed plate_points for existing plates (10 pts each)
  INSERT INTO plate_points (plate_id, owner_id, points)
  SELECT id, user_id, 10 FROM plates
  ON CONFLICT (plate_id) DO NOTHING;

  -- Recalculate every plate with ratings or comments
  FOR r IN SELECT DISTINCT plate_id FROM ratings LOOP
    PERFORM recalculate_plate_points(r.plate_id);
  END LOOP;
  FOR r IN SELECT DISTINCT plate_id FROM comments LOOP
    PERFORM recalculate_plate_points(r.plate_id);
  END LOOP;

  -- Recalculate all profile totals from plate_points
  UPDATE profiles p
  SET points = (SELECT COALESCE(SUM(pp.points), 0) FROM plate_points pp WHERE pp.owner_id = p.id);
END;
$$;
