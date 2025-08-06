-- Migration: Create Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only see and update their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Couples table policies
-- Users can only see couples they belong to
CREATE POLICY "Users can view their couple"
ON couples FOR SELECT
USING (
  id IN (
    SELECT couple_id FROM users 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Users can update their couple (for theme changes, etc.)
CREATE POLICY "Couple members can update couple"
ON couples FOR UPDATE
USING (
  id IN (
    SELECT couple_id FROM users 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Any authenticated user can create a new couple
CREATE POLICY "Authenticated users can create couple"
ON couples FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Rules table policies
-- Users can only see rules for their couple
CREATE POLICY "Users can view couple rules"
ON rules FOR SELECT
USING (
  couple_id IN (
    SELECT couple_id FROM users 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Users can create rules for their couple
CREATE POLICY "Users can create couple rules"
ON rules FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT couple_id FROM users 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  ) AND
  created_by = auth.uid()
);

-- Users can update rules they created (soft delete by setting is_active = false)
CREATE POLICY "Users can update own rules"
ON rules FOR UPDATE
USING (
  couple_id IN (
    SELECT couple_id FROM users 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  ) AND
  created_by = auth.uid()
);

-- Violations table policies
-- Users can view violations for their couple
CREATE POLICY "Users can view couple violations"
ON violations FOR SELECT
USING (
  rule_id IN (
    SELECT r.id FROM rules r
    JOIN users u ON u.couple_id = r.couple_id
    WHERE u.id = auth.uid() AND u.couple_id IS NOT NULL
  )
);

-- Users can create violations for their couple
CREATE POLICY "Users can create violations"
ON violations FOR INSERT
WITH CHECK (
  rule_id IN (
    SELECT r.id FROM rules r
    JOIN users u ON u.couple_id = r.couple_id
    WHERE u.id = auth.uid() AND u.couple_id IS NOT NULL
  ) AND
  (violator_id = auth.uid() OR partner_id = auth.uid())
);

-- Rewards table policies
-- Users can view rewards for their couple
CREATE POLICY "Users can view couple rewards"
ON rewards FOR SELECT
USING (
  couple_id IN (
    SELECT couple_id FROM users 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Users can create rewards for their couple
CREATE POLICY "Users can create rewards"
ON rewards FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT couple_id FROM users 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Users can update rewards for their couple (mark as claimed, etc.)
CREATE POLICY "Users can update couple rewards"
ON rewards FOR UPDATE
USING (
  couple_id IN (
    SELECT couple_id FROM users 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();