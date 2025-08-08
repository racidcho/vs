-- Test script for RLS policies
-- Run this after applying the fix migration to verify everything works

-- 1. Check that all necessary policies exist
\echo '=== Checking Policy Existence ==='
SELECT 
  'Policy Check' as test_type,
  tablename,
  COUNT(*) as policy_count,
  array_agg(policyname ORDER BY policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('rules', 'rewards', 'violations', 'couples', 'profiles', 'activity_logs')
GROUP BY tablename
ORDER BY tablename;

-- 2. Verify RLS is enabled on all tables
\echo '=== Checking RLS Status ==='
SELECT 
  'RLS Status' as test_type,
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname IN ('rules', 'rewards', 'violations', 'couples', 'profiles', 'activity_logs')
  AND relkind = 'r'
ORDER BY relname;

-- 3. Check policy details for rules and rewards tables specifically
\echo '=== Rules Table Policies ==='
SELECT 
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'rules'
ORDER BY cmd, policyname;

\echo '=== Rewards Table Policies ==='
SELECT 
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'rewards'
ORDER BY cmd, policyname;

-- 4. Test the helper function
\echo '=== Testing Helper Function ==='
SELECT 
  'Helper Function' as test_type,
  proname as function_name,
  prokind as function_type
FROM pg_proc 
WHERE proname = 'check_user_couple_access'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Verify no conflicting/duplicate policies exist
\echo '=== Checking for Policy Conflicts ==='
SELECT 
  'Conflict Check' as test_type,
  tablename,
  COUNT(*) as total_policies,
  COUNT(DISTINCT policyname) as unique_policy_names,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT policyname) THEN 'No conflicts'
    ELSE 'CONFLICTS DETECTED!'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 0
ORDER BY tablename;

-- 6. Check that old conflicting policies are gone
\echo '=== Verifying Old Policies Removed ==='
SELECT 
  'Old Policy Check' as test_type,
  COUNT(*) as old_policies_found,
  CASE 
    WHEN COUNT(*) = 0 THEN 'All old policies removed successfully'
    ELSE 'WARNING: Old policies still exist'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    policyname LIKE '%manage%' OR 
    policyname LIKE 'Users can%' OR
    policyname LIKE 'Couple members can%'
  );

\echo '=== RLS Policy Test Complete ==='
\echo 'If all checks pass, your RLS policies should work correctly.'
\echo 'Test by creating rules and rewards in your application.'