# RLS (Row Level Security) Troubleshooting Guide

## Issue: "new row violates row-level security policy" 

This error occurs when trying to INSERT data into tables with RLS enabled, typically for the `rules` and `rewards` tables.

## Root Causes Identified

1. **Conflicting Policies**: Multiple migrations created overlapping policies with the same names
2. **Schema Mismatch**: Some policies referenced `users` table instead of `profiles` table
3. **Logic Inconsistency**: Different policy implementations across migrations

## Solution Applied

### Migration `20250808000002_fix_rls_policies.sql`

This migration:
- ✅ Drops all conflicting/duplicate policies
- ✅ Creates consistent, properly named policies for all operations (SELECT, INSERT, UPDATE, DELETE)
- ✅ Uses consistent logic across all tables
- ✅ References the correct `couples` table structure with `partner_1_id` and `partner_2_id`

### Key Policy Logic

All policies now use this consistent pattern:
```sql
-- For couple-related tables (rules, rewards, violations, activity_logs)
couple_id IN (
  SELECT id FROM couples 
  WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
)

-- For couples table directly
partner_1_id = auth.uid() OR partner_2_id = auth.uid()

-- For profiles table
id = auth.uid()
```

## Verification Steps

1. **Apply the migration**:
   ```bash
   npx supabase db push
   ```

2. **Run verification**:
   ```bash
   npx supabase db reset --local  # if testing locally
   ```

3. **Test in your application**:
   - Create a couple
   - Try adding rules and rewards
   - Verify no RLS errors occur

## Policy Structure

### Rules Table
- `rules_select_policy` - View rules for your couple
- `rules_insert_policy` - Create rules for your couple  
- `rules_update_policy` - Update rules for your couple
- `rules_delete_policy` - Delete rules for your couple

### Rewards Table
- `rewards_select_policy` - View rewards for your couple
- `rewards_insert_policy` - Create rewards for your couple
- `rewards_update_policy` - Update rewards for your couple  
- `rewards_delete_policy` - Delete rewards for your couple

### Similar patterns for all other tables

## Debugging RLS Issues

### Check if RLS is enabled:
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('rules', 'rewards', 'violations', 'couples', 'profiles');
```

### View current policies:
```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('rules', 'rewards');
```

### Test couple membership:
```sql
SELECT check_user_couple_access(auth.uid(), 'your-couple-id-here');
```

### Check authenticated user:
```sql
SELECT auth.uid(), auth.role();
```

## Common Issues & Solutions

1. **User not authenticated**: Ensure `auth.uid()` returns a valid UUID
2. **User not in couple**: Ensure the user's profile has a valid `couple_id`
3. **Couple relationship missing**: Ensure the couple record exists with proper `partner_1_id`/`partner_2_id`
4. **Policy conflicts**: Our migration removes all old policies to prevent conflicts

## Application-Level Checks

Before inserting rules/rewards, verify:

```typescript
// Check if user has a couple_id
const { data: profile } = await supabase
  .from('profiles')
  .select('couple_id')
  .eq('id', user.id)
  .single();

if (!profile?.couple_id) {
  throw new Error('User must be in a couple to create rules/rewards');
}

// Then proceed with insert, using the couple_id
const { error } = await supabase
  .from('rules')  // or 'rewards'
  .insert({
    couple_id: profile.couple_id,
    title: 'Rule title',
    // ... other fields
  });
```

## Migration History

- `001_create_initial_schema.sql` - Original schema with basic RLS
- `002_create_rls_policies.sql` - Additional policies (conflicting)
- `20250807000001_initial_schema.sql` - Recreated schema (conflicting)
- `20250808_add_delete_policies.sql` - More policies (conflicting)
- `20250808000002_fix_rls_policies.sql` - **FIXED ALL ISSUES** ✅
- `20250808000003_verify_rls_policies.sql` - Verification script

The fix migration consolidates all policies into a consistent, working set.