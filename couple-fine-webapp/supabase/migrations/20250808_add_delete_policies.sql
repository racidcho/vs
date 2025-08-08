-- Migration: Add DELETE policies for rules, rewards, and violations tables

-- DELETE policy for rules table
-- Users can delete rules for their couple
CREATE POLICY "Users can delete couple rules"
ON rules FOR DELETE
USING (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- DELETE policy for rewards table
-- Users can delete rewards for their couple
CREATE POLICY "Users can delete couple rewards"
ON rewards FOR DELETE
USING (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- DELETE policy for violations table
-- Users can delete violations for their couple
CREATE POLICY "Users can delete couple violations"
ON violations FOR DELETE
USING (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Also fix the INSERT and UPDATE policies to check profiles table instead of users
-- Drop existing policies that reference 'users' table
DROP POLICY IF EXISTS "Users can view couple rules" ON rules;
DROP POLICY IF EXISTS "Users can create couple rules" ON rules;
DROP POLICY IF EXISTS "Users can update own rules" ON rules;

-- Recreate with profiles table
CREATE POLICY "Users can view couple rules"
ON rules FOR SELECT
USING (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

CREATE POLICY "Users can create couple rules"
ON rules FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

CREATE POLICY "Users can update couple rules"
ON rules FOR UPDATE
USING (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Fix violations policies
DROP POLICY IF EXISTS "Users can view couple violations" ON violations;
DROP POLICY IF EXISTS "Users can create violations" ON violations;

CREATE POLICY "Users can view couple violations"
ON violations FOR SELECT
USING (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

CREATE POLICY "Users can create violations"
ON violations FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Fix rewards policies
DROP POLICY IF EXISTS "Users can view couple rewards" ON rewards;
DROP POLICY IF EXISTS "Users can create rewards" ON rewards;
DROP POLICY IF EXISTS "Users can update couple rewards" ON rewards;

CREATE POLICY "Users can view couple rewards"
ON rewards FOR SELECT
USING (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

CREATE POLICY "Users can create rewards"
ON rewards FOR INSERT
WITH CHECK (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

CREATE POLICY "Users can update couple rewards"
ON rewards FOR UPDATE
USING (
  couple_id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

-- Fix couples policies
DROP POLICY IF EXISTS "Users can view their couple" ON couples;
DROP POLICY IF EXISTS "Couple members can update couple" ON couples;

CREATE POLICY "Users can view their couple"
ON couples FOR SELECT
USING (
  id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);

CREATE POLICY "Couple members can update couple"
ON couples FOR UPDATE
USING (
  id IN (
    SELECT couple_id FROM profiles 
    WHERE auth.uid() = id AND couple_id IS NOT NULL
  )
);