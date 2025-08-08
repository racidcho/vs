-- Migration: Fix RLS policies for rules and rewards tables
-- Created: 2025-08-08
-- Purpose: Fix "new row violates row-level security policy" errors

-- First, drop all existing conflicting policies to start fresh
DROP POLICY IF EXISTS "Couple members can manage rules" ON rules;
DROP POLICY IF EXISTS "Users can view couple rules" ON rules;
DROP POLICY IF EXISTS "Users can create couple rules" ON rules;
DROP POLICY IF EXISTS "Users can update couple rules" ON rules;
DROP POLICY IF EXISTS "Users can update own rules" ON rules;
DROP POLICY IF EXISTS "Users can delete couple rules" ON rules;

DROP POLICY IF EXISTS "Couple members can manage rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view couple rewards" ON rewards;
DROP POLICY IF EXISTS "Users can create rewards" ON rewards;
DROP POLICY IF EXISTS "Users can update couple rewards" ON rewards;
DROP POLICY IF EXISTS "Users can delete couple rewards" ON rewards;

-- Create proper RLS policies for RULES table
-- SELECT policy: Users can view rules for their couple
CREATE POLICY "rules_select_policy" ON rules
  FOR SELECT 
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- INSERT policy: Users can create rules for their couple
CREATE POLICY "rules_insert_policy" ON rules
  FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- UPDATE policy: Users can update rules for their couple
CREATE POLICY "rules_update_policy" ON rules
  FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- DELETE policy: Users can delete rules for their couple
CREATE POLICY "rules_delete_policy" ON rules
  FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- Create proper RLS policies for REWARDS table
-- SELECT policy: Users can view rewards for their couple
CREATE POLICY "rewards_select_policy" ON rewards
  FOR SELECT 
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- INSERT policy: Users can create rewards for their couple
CREATE POLICY "rewards_insert_policy" ON rewards
  FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- UPDATE policy: Users can update rewards for their couple
CREATE POLICY "rewards_update_policy" ON rewards
  FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- DELETE policy: Users can delete rewards for their couple
CREATE POLICY "rewards_delete_policy" ON rewards
  FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- Also fix violations policies for consistency
DROP POLICY IF EXISTS "Couple members can manage violations" ON violations;
DROP POLICY IF EXISTS "Users can view couple violations" ON violations;
DROP POLICY IF EXISTS "Users can create violations" ON violations;
DROP POLICY IF EXISTS "Users can delete couple violations" ON violations;

-- Create proper RLS policies for VIOLATIONS table
CREATE POLICY "violations_select_policy" ON violations
  FOR SELECT 
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

CREATE POLICY "violations_insert_policy" ON violations
  FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

CREATE POLICY "violations_update_policy" ON violations
  FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

CREATE POLICY "violations_delete_policy" ON violations
  FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- Also fix couples policies for consistency
DROP POLICY IF EXISTS "Couple members can view couple data" ON couples;
DROP POLICY IF EXISTS "Users can view their couple" ON couples;
DROP POLICY IF EXISTS "Couple members can update couple" ON couples;
DROP POLICY IF EXISTS "Authenticated users can create couple" ON couples;

-- Create proper RLS policies for COUPLES table
CREATE POLICY "couples_select_policy" ON couples
  FOR SELECT 
  USING (
    partner_1_id = auth.uid() OR partner_2_id = auth.uid()
  );

CREATE POLICY "couples_insert_policy" ON couples
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
  );

CREATE POLICY "couples_update_policy" ON couples
  FOR UPDATE
  USING (
    partner_1_id = auth.uid() OR partner_2_id = auth.uid()
  );

CREATE POLICY "couples_delete_policy" ON couples
  FOR DELETE
  USING (
    partner_1_id = auth.uid() OR partner_2_id = auth.uid()
  );

-- Fix profiles policies for consistency
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create proper RLS policies for PROFILES table
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT 
  USING (
    id = auth.uid() OR
    -- Allow viewing partner's profile if they're in the same couple
    id IN (
      SELECT CASE 
        WHEN partner_1_id = auth.uid() THEN partner_2_id
        WHEN partner_2_id = auth.uid() THEN partner_1_id
        ELSE NULL
      END
      FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (
    id = auth.uid()
  );

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (
    id = auth.uid()
  );

CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (
    id = auth.uid()
  );

-- Fix activity_logs policies for consistency
DROP POLICY IF EXISTS "Couple members can view activity logs" ON activity_logs;

CREATE POLICY "activity_logs_select_policy" ON activity_logs
  FOR SELECT 
  USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

CREATE POLICY "activity_logs_insert_policy" ON activity_logs
  FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- Create a helper function to check if user belongs to couple
-- This can be used for debugging and validation
CREATE OR REPLACE FUNCTION check_user_couple_access(user_id UUID, target_couple_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM couples 
    WHERE id = target_couple_id 
    AND (partner_1_id = user_id OR partner_2_id = user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON MIGRATION IS 'Fix RLS policies to resolve "new row violates row-level security policy" errors for rules and rewards tables';