-- Fix CRUD operations for both users in a couple
-- This migration ensures both partners can create, read, update, and delete data

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create comprehensive policies for profiles
CREATE POLICY "profiles_select_all_authenticated"
ON profiles FOR SELECT
TO authenticated
USING (true);  -- All authenticated users can view profiles (needed for partner info)

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);  -- Users can only insert their own profile

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);  -- Users can only update their own profile

-- ============================================
-- COUPLES TABLE POLICIES  
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "couples_select_policy" ON couples;
DROP POLICY IF EXISTS "couples_insert_policy" ON couples;
DROP POLICY IF EXISTS "couples_update_policy" ON couples;

-- Create comprehensive policies for couples
CREATE POLICY "couples_select_active"
ON couples FOR SELECT
TO authenticated
USING (is_active = true);  -- All authenticated users can view active couples (for joining)

CREATE POLICY "couples_select_own"
ON couples FOR SELECT
TO authenticated
USING (
  auth.uid() = partner_1_id OR 
  auth.uid() = partner_2_id
);  -- Partners can always see their own couple

CREATE POLICY "couples_insert_authenticated"
ON couples FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = partner_1_id);  -- Only the creator can insert (as partner_1)

CREATE POLICY "couples_update_own"
ON couples FOR UPDATE
TO authenticated
USING (
  auth.uid() = partner_1_id OR 
  auth.uid() = partner_2_id
)
WITH CHECK (
  auth.uid() = partner_1_id OR 
  auth.uid() = partner_2_id
);  -- Both partners can update their couple

-- ============================================
-- RULES TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "rules_select_policy" ON rules;
DROP POLICY IF EXISTS "rules_insert_policy" ON rules;
DROP POLICY IF EXISTS "rules_update_policy" ON rules;
DROP POLICY IF EXISTS "rules_delete_policy" ON rules;

-- Create comprehensive policies for rules
CREATE POLICY "rules_select_couple"
ON rules FOR SELECT
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "rules_insert_couple"
ON rules FOR INSERT
TO authenticated
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "rules_update_couple"
ON rules FOR UPDATE
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
)
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "rules_delete_couple"
ON rules FOR DELETE
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- ============================================
-- REWARDS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "rewards_select_policy" ON rewards;
DROP POLICY IF EXISTS "rewards_insert_policy" ON rewards;
DROP POLICY IF EXISTS "rewards_update_policy" ON rewards;
DROP POLICY IF EXISTS "rewards_delete_policy" ON rewards;

-- Create comprehensive policies for rewards
CREATE POLICY "rewards_select_couple"
ON rewards FOR SELECT
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "rewards_insert_couple"
ON rewards FOR INSERT
TO authenticated
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "rewards_update_couple"
ON rewards FOR UPDATE
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
)
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "rewards_delete_couple"
ON rewards FOR DELETE
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- ============================================
-- VIOLATIONS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "violations_select_policy" ON violations;
DROP POLICY IF EXISTS "violations_insert_policy" ON violations;
DROP POLICY IF EXISTS "violations_update_policy" ON violations;
DROP POLICY IF EXISTS "violations_delete_policy" ON violations;

-- Create comprehensive policies for violations
CREATE POLICY "violations_select_couple"
ON violations FOR SELECT
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "violations_insert_couple"
ON violations FOR INSERT
TO authenticated
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "violations_update_couple"
ON violations FOR UPDATE
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
)
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "violations_delete_couple"
ON violations FOR DELETE
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- ============================================
-- ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================

GRANT ALL ON profiles TO authenticated;
GRANT ALL ON couples TO authenticated;
GRANT ALL ON rules TO authenticated;
GRANT ALL ON rewards TO authenticated;
GRANT ALL ON violations TO authenticated;

-- Grant usage on sequences (for auto-increment IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;