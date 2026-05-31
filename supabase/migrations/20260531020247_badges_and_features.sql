-- Badges system
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon_url text,
  color text DEFAULT '#FFA500',
  category text DEFAULT 'general',
  requirement_type text,
  requirement_value integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  awarded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
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

-- Banned users table
CREATE TABLE IF NOT EXISTS public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  banned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  banned_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  unbanned_at timestamptz,
  unbanned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(user_id)
);

-- Admin action log
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_plate_id uuid REFERENCES public.plates(id) ON DELETE CASCADE,
  details jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Featured plates table
CREATE TABLE IF NOT EXISTS public.featured_plates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_id uuid REFERENCES public.plates(id) ON DELETE CASCADE NOT NULL,
  featured_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  featured_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  reason text,
  position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  category text,
  UNIQUE(plate_id, category)
);

-- Analytics tables
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  dau integer DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  plate_id uuid REFERENCES public.plates(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at);

-- RLS policies
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_plates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Badges policies
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can manage badges" ON public.badges FOR ALL USING (public.is_admin());

-- User badges policies
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Only admins can award badges" ON public.user_badges FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Only admins can remove badges" ON public.user_badges FOR DELETE USING (public.is_admin());

-- Banned users policies
CREATE POLICY "Only admins can view banned users" ON public.banned_users FOR SELECT USING (public.is_admin());
CREATE POLICY "Only admins can manage bans" ON public.banned_users FOR ALL USING (public.is_admin());

-- Admin actions policies
CREATE POLICY "Only admins can view admin actions" ON public.admin_actions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can log actions" ON public.admin_actions FOR INSERT WITH CHECK (public.is_admin());

-- Featured plates policies
CREATE POLICY "Featured plates are viewable by everyone" ON public.featured_plates FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can feature plates" ON public.featured_plates FOR ALL USING (public.is_admin());

-- Analytics policies
CREATE POLICY "Only admins can view metrics" ON public.daily_metrics FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can view own activities" ON public.user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all activities" ON public.user_activities FOR SELECT USING (public.is_admin());
CREATE POLICY "System can log activities" ON public.user_activities FOR INSERT WITH CHECK (true);

-- Auto-award triggers
CREATE OR REPLACE FUNCTION public.check_plate_badges()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.plates WHERE user_id = NEW.user_id) >= 50 THEN
    INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
    SELECT NEW.user_id, (SELECT id FROM public.badges WHERE name = 'Plate Master'), NOW()
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_plate_badges_trigger ON public.plates;
CREATE TRIGGER check_plate_badges_trigger
  AFTER INSERT ON public.plates
  FOR EACH ROW EXECUTE FUNCTION public.check_plate_badges();

CREATE OR REPLACE FUNCTION public.check_rating_badges()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.ratings WHERE user_id = NEW.user_id) >= 100 THEN
    INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
    SELECT NEW.user_id, (SELECT id FROM public.badges WHERE name = 'Critic'), NOW()
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_rating_badges_trigger ON public.ratings;
CREATE TRIGGER check_rating_badges_trigger
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.check_rating_badges();
