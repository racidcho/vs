-- Migration: Simplified and More Reliable RLS Policies
-- Focus: Simple couple_id based access with equal permissions for both partners

-- ========================================
-- CLEAN UP EXISTING POLICIES
-- ========================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their couple" ON couples;
DROP POLICY IF EXISTS "Couple members can update couple" ON couples;
DROP POLICY IF EXISTS "Users can create couple" ON couples;

DROP POLICY IF EXISTS "Users can view couple rules" ON rules;
DROP POLICY IF EXISTS "Users can create couple rules" ON rules;
DROP POLICY IF EXISTS "Users can update couple rules" ON rules;
DROP POLICY IF EXISTS "Users can update own rules" ON rules;
DROP POLICY IF EXISTS "Users can delete couple rules" ON rules;

DROP POLICY IF EXISTS "Users can view couple violations" ON violations;
DROP POLICY IF EXISTS "Users can create violations" ON violations;
DROP POLICY IF EXISTS "Users can update violations" ON violations;
DROP POLICY IF EXISTS "Users can delete couple violations" ON violations;

DROP POLICY IF EXISTS "Users can view couple rewards" ON rewards;
DROP POLICY IF EXISTS "Users can create rewards" ON rewards;
DROP POLICY IF EXISTS "Users can update couple rewards" ON rewards;
DROP POLICY IF EXISTS "Users can delete couple rewards" ON rewards;

DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ========================================
-- PROFILES TABLE POLICIES (Foundation)
-- ========================================

-- Users can view all profiles (needed for partner info)
CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- ========================================
-- COUPLES TABLE POLICIES
-- ========================================

-- Users can view couples they are part of (as partner_1 OR partner_2)
CREATE POLICY "Couple members can view couple"
ON couples FOR SELECT
USING (
  auth.uid() = partner_1_id OR auth.uid() = partner_2_id
);

-- Users can create couples (will be partner_1)
CREATE POLICY "Anyone can create couple"
ON couples FOR INSERT
WITH CHECK (auth.uid() = partner_1_id);

-- Couple members can update their couple
CREATE POLICY "Couple members can update couple"
ON couples FOR UPDATE
USING (
  auth.uid() = partner_1_id OR auth.uid() = partner_2_id
);

-- ========================================
-- RULES TABLE POLICIES
-- ========================================

-- Couple members can view rules for their couple
CREATE POLICY "Couple members can view rules"
ON rules FOR SELECT
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Couple members can create rules for their couple
CREATE POLICY "Couple members can create rules"
ON rules FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Couple members can update rules for their couple
CREATE POLICY "Couple members can update rules"
ON rules FOR UPDATE
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Couple members can delete rules for their couple
CREATE POLICY "Couple members can delete rules"
ON rules FOR DELETE
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- ========================================
-- VIOLATIONS TABLE POLICIES
-- ========================================

-- Couple members can view violations for their couple
CREATE POLICY "Couple members can view violations"
ON violations FOR SELECT
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Couple members can create violations for their couple
CREATE POLICY "Couple members can create violations"
ON violations FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Couple members can update violations for their couple
CREATE POLICY "Couple members can update violations"
ON violations FOR UPDATE
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Couple members can delete violations for their couple
CREATE POLICY "Couple members can delete violations"
ON violations FOR DELETE
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- ========================================
-- REWARDS TABLE POLICIES
-- ========================================

-- Couple members can view rewards for their couple
CREATE POLICY "Couple members can view rewards"
ON rewards FOR SELECT
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Couple members can create rewards for their couple
CREATE POLICY "Couple members can create rewards"
ON rewards FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Couple members can update rewards for their couple
CREATE POLICY "Couple members can update rewards"
ON rewards FOR UPDATE
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Couple members can delete rewards for their couple
CREATE POLICY "Couple members can delete rewards"
ON rewards FOR DELETE
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- ========================================
-- ENABLE RLS (Make sure it's enabled)
-- ========================================

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICATION QUERIES (for testing)
-- ========================================

-- Test couple access
-- SELECT * FROM couples WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id;

-- Test rules access
-- SELECT r.* FROM rules r 
-- JOIN couples c ON r.couple_id = c.id 
-- WHERE auth.uid() = c.partner_1_id OR auth.uid() = c.partner_2_id;