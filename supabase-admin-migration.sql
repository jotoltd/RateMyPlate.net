-- Rate My Plate - Admin Features Migration
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. REPORTS / MODERATION SYSTEM
-- ============================================

-- Reports table for users to report content
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_plate_id uuid REFERENCES public.plates(id) ON DELETE CASCADE,
  reported_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  reason text NOT NULL, -- 'spam', 'inappropriate', 'harassment', 'copyright', 'other'
  details text,
  status text DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
  resolution text,
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz,
  CHECK (
    (reported_plate_id IS NOT NULL) OR 
    (reported_user_id IS NOT NULL) OR 
    (reported_comment_id IS NOT NULL)
  )
);

-- Banned users table
CREATE TABLE IF NOT EXISTS public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  banned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  banned_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz, -- NULL = permanent ban
  is_active boolean DEFAULT true,
  unbanned_at timestamptz,
  unbanned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(user_id)
);

-- Admin action log
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL, -- 'ban_user', 'unban_user', 'delete_plate', 'resolve_report', 'feature_plate', etc.
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_plate_id uuid REFERENCES public.plates(id) ON DELETE CASCADE,
  details jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- 2. FEATURED/CURATED PLATES
-- ============================================

-- Featured plates table
CREATE TABLE IF NOT EXISTS public.featured_plates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_id uuid REFERENCES public.plates(id) ON DELETE CASCADE NOT NULL,
  featured_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  featured_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz, -- NULL = permanent feature
  reason text, -- why it was featured
  position integer DEFAULT 0, -- sort order
  is_active boolean DEFAULT true,
  category text, -- 'homepage', 'trending', 'editor_pick', etc.
  UNIQUE(plate_id, category)
);

-- ============================================
-- 3. ANALYTICS / METRICS
-- ============================================

-- Daily platform metrics snapshot
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  dau integer DEFAULT 0, -- daily active users
  new_users integer DEFAULT 0,
  new_plates integer DEFAULT 0,
  new_ratings integer DEFAULT 0,
  new_likes integer DEFAULT 0,
  new_comments integer DEFAULT 0,
  total_plates integer DEFAULT 0,
  total_users integer DEFAULT 0,
  avg_plates_per_user numeric(6,2) DEFAULT 0,
  top_chef_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  top_plate_id uuid REFERENCES public.plates(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- User activity log for analytics
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'view_plate', 'upload_plate', 'like', 'rate', 'comment', 'follow', 'share'
  plate_id uuid REFERENCES public.plates(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at);

-- ============================================
-- 4. USER BADGES / VERIFICATION
-- ============================================

-- Badges definition table
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon_url text,
  color text DEFAULT '#FFA500', -- hex color
  category text DEFAULT 'general', -- 'verified', 'achievement', 'rank', 'special'
  requirement_type text, -- 'manual', 'plates_count', 'followers_count', 'ratings_received', 'points'
  requirement_value integer, -- e.g., 100 plates, 1000 followers
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- User badges (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  awarded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL = auto-awarded
  awarded_at timestamptz DEFAULT now() NOT NULL,
  reason text,
  UNIQUE(user_id, badge_id)
);

-- Insert default badges
INSERT INTO public.badges (name, description, category, color) VALUES
  ('Verified Chef', 'Identity verified by our team', 'verified', '#1DA1F2'),
  ('Top Contributor', 'Contributed significantly to the community', 'rank', '#FFD700'),
  ('Rising Star', 'Gained 100+ followers in a week', 'achievement', '#FF6B6B'),
  ('Plate Master', 'Uploaded 50+ plates', 'achievement', '#4ECDC4'),
  ('Critic', 'Rated 100+ plates', 'achievement', '#95E1D3'),
  ('Influencer', 'Reached 1,000 followers', 'rank', '#F38181'),
  ('Early Adopter', 'Joined during beta', 'special', '#AA96DA'),
  ('AI Approved', 'Received an AI rating of 9+', 'achievement', '#FCBAD3')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. ADMIN ROLE CHECK
-- ============================================

-- Add is_admin flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- ============================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Reports policies
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" 
  ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" 
  ON public.reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Authenticated users can create reports" 
  ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports" 
  ON public.reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Banned users policies
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view banned users" 
  ON public.banned_users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can insert banned users" 
  ON public.banned_users FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can update banned users" 
  ON public.banned_users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin actions policies
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin actions" 
  ON public.admin_actions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can log admin actions" 
  ON public.admin_actions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Featured plates policies
ALTER TABLE public.featured_plates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured plates are viewable by everyone" 
  ON public.featured_plates FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can feature plates" 
  ON public.featured_plates FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Daily metrics policies
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view metrics" 
  ON public.daily_metrics FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- User activities policies
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities" 
  ON public.user_activities FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities" 
  ON public.user_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "System can log activities" 
  ON public.user_activities FOR INSERT WITH CHECK (true);

-- Badges policies
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone" 
  ON public.badges FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage badges" 
  ON public.badges FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- User badges policies
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone" 
  ON public.user_badges FOR SELECT USING (true);

CREATE POLICY "Only admins can award badges manually" 
  ON public.user_badges FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can remove badges" 
  ON public.user_badges FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================
-- 7. FUNCTIONS FOR AUTO-AWARDING BADGES
-- ============================================

-- Function to check and award badges after plate upload
CREATE OR REPLACE FUNCTION public.check_plate_badges()
RETURNS TRIGGER AS $$
BEGIN
  -- Award "Plate Master" badge (50+ plates)
  IF (
    SELECT COUNT(*) FROM public.plates WHERE user_id = NEW.user_id
  ) >= 50 THEN
    INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
    SELECT 
      NEW.user_id,
      (SELECT id FROM public.badges WHERE name = 'Plate Master'),
      NOW()
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for plate upload
DROP TRIGGER IF EXISTS check_plate_badges_trigger ON public.plates;
CREATE TRIGGER check_plate_badges_trigger
  AFTER INSERT ON public.plates
  FOR EACH ROW
  EXECUTE FUNCTION public.check_plate_badges();

-- Function to check and award badges after rating
CREATE OR REPLACE FUNCTION public.check_rating_badges()
RETURNS TRIGGER AS $$
BEGIN
  -- Award "Critic" badge (100+ ratings given)
  IF (
    SELECT COUNT(*) FROM public.ratings WHERE user_id = NEW.user_id
  ) >= 100 THEN
    INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
    SELECT 
      NEW.user_id,
      (SELECT id FROM public.badges WHERE name = 'Critic'),
      NOW()
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Award "AI Approved" badge (AI rating 9+)
  IF NEW.ai_rating >= 9 THEN
    INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
    SELECT 
      NEW.user_id,
      (SELECT id FROM public.badges WHERE name = 'AI Approved'),
      NOW()
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rating
DROP TRIGGER IF EXISTS check_rating_badges_trigger ON public.ratings;
CREATE TRIGGER check_rating_badges_trigger
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_rating_badges();

-- ============================================
-- 8. DAILY METRICS CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_daily_metrics(target_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_metrics (
    date,
    dau,
    new_users,
    new_plates,
    new_ratings,
    new_likes,
    new_comments,
    total_plates,
    total_users,
    avg_plates_per_user
  )
  SELECT
    target_date,
    COUNT(DISTINCT ua.user_id) FILTER (WHERE ua.created_at::date = target_date),
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at::date = target_date AND p.id LIKE '%'), -- new users logic
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at::date = target_date),
    COUNT(DISTINCT r.id) FILTER (WHERE r.created_at::date = target_date),
    0, -- likes count (if likes table exists)
    0, -- comments count (if comments table exists)
    (SELECT COUNT(*) FROM public.plates),
    (SELECT COUNT(*) FROM public.profiles),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) > 0 
      THEN (SELECT COUNT(*) FROM public.plates)::numeric / (SELECT COUNT(*) FROM public.profiles)
      ELSE 0 
    END
  FROM public.user_activities ua
  FULL OUTER JOIN public.plates p ON true
  FULL OUTER JOIN public.ratings r ON true
  ON CONFLICT (date) DO UPDATE SET
    dau = EXCLUDED.dau,
    new_plates = EXCLUDED.new_plates,
    new_ratings = EXCLUDED.new_ratings,
    total_plates = EXCLUDED.total_plates,
    total_users = EXCLUDED.total_users,
    avg_plates_per_user = EXCLUDED.avg_plates_per_user,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE! Run this in Supabase SQL Editor
-- ============================================
