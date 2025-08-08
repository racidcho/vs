-- Migration: Fix profile access for partners
-- Created: 2025-08-08 
-- Purpose: Allow partners to view each other's profiles for display_name

-- Drop existing profile select policy
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- Create updated profile select policy that allows partner access
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

COMMENT ON MIGRATION IS 'Fix profile access policy to allow partners to view each other for display_name';