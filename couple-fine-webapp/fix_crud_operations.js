import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL 또는 Service Key가 설정되지 않았습니다.');
  console.log('환경변수를 확인해주세요: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Service role client for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixCrudOperations() {
  console.log('🔧 CRUD 작업 수정을 시작합니다...\n');

  const migration = `
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
  `;

  try {
    console.log('🔄 RLS 정책을 업데이트하는 중...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { query: migration });
    
    if (error) {
      console.error('❌ 마이그레이션 실행 실패:', error);
      console.log('\n💡 대안: Supabase 대시보드에서 직접 실행해주세요:');
      console.log('1. https://app.supabase.com 로 이동');
      console.log('2. 프로젝트 선택');
      console.log('3. SQL Editor로 이동');
      console.log('4. 다음 파일의 내용을 복사하여 실행:');
      console.log('   supabase/migrations/20250809_fix_crud_operations.sql');
    } else {
      console.log('✅ RLS 정책이 성공적으로 업데이트되었습니다!');
      console.log('\n🎉 이제 양쪽 사용자 모두 CRUD 작업을 수행할 수 있습니다:');
      console.log('   - 규칙 생성/수정/삭제');
      console.log('   - 보상 생성/수정/삭제');
      console.log('   - 벌금 기록 생성/수정/삭제');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.log('\n💡 Service Key가 필요합니다. SUPABASE_SERVICE_KEY 환경변수를 설정해주세요.');
    console.log('또는 Supabase 대시보드에서 직접 SQL을 실행해주세요.');
  }
}

// Run the fix
fixCrudOperations();