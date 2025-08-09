-- 🚀 JOANDDO.COM 즉시 적용 - Supabase SQL Editor에서 실행하세요
-- 순서: 1. RLS 정책 → 2. Realtime 설정

-- ========================================
-- 1단계: RLS 정책 정리 및 재생성 (20250808_ultra_simple_rls_fix.sql)
-- ========================================

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their couple" ON couples;
DROP POLICY IF EXISTS "Couple members can view couple" ON couples;
DROP POLICY IF EXISTS "Couple members can view couple data" ON couples;
DROP POLICY IF EXISTS "Users can create couple" ON couples;
DROP POLICY IF EXISTS "Anyone can create couple" ON couples;
DROP POLICY IF EXISTS "Couple members can update couple" ON couples;
DROP POLICY IF EXISTS "Users can view couple rules" ON rules;
DROP POLICY IF EXISTS "Couple members can view rules" ON rules;
DROP POLICY IF EXISTS "Couple members can manage rules" ON rules;
DROP POLICY IF EXISTS "Users can create couple rules" ON rules;
DROP POLICY IF EXISTS "Couple members can create rules" ON rules;
DROP POLICY IF EXISTS "Users can update couple rules" ON rules;
DROP POLICY IF EXISTS "Couple members can update rules" ON rules;
DROP POLICY IF EXISTS "Users can update own rules" ON rules;
DROP POLICY IF EXISTS "Users can delete couple rules" ON rules;
DROP POLICY IF EXISTS "Couple members can delete rules" ON rules;
DROP POLICY IF EXISTS "Users can view couple violations" ON violations;
DROP POLICY IF EXISTS "Couple members can view violations" ON violations;
DROP POLICY IF EXISTS "Couple members can manage violations" ON violations;
DROP POLICY IF EXISTS "Users can create violations" ON violations;
DROP POLICY IF EXISTS "Couple members can create violations" ON violations;
DROP POLICY IF EXISTS "Users can update violations" ON violations;
DROP POLICY IF EXISTS "Couple members can update violations" ON violations;
DROP POLICY IF EXISTS "Users can delete couple violations" ON violations;
DROP POLICY IF EXISTS "Couple members can delete violations" ON violations;
DROP POLICY IF EXISTS "Users can view couple rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can view rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can manage rewards" ON rewards;
DROP POLICY IF EXISTS "Users can create rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can create rewards" ON rewards;
DROP POLICY IF EXISTS "Users can update couple rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can update rewards" ON rewards;
DROP POLICY IF EXISTS "Users can delete couple rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can delete rewards" ON rewards;

-- RLS 활성화 확인
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 🔑 PROFILES - 모든 인증된 사용자가 조회 가능 (파트너 이름 표시용)
CREATE POLICY "allow_all_authenticated_users_view_profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_users_insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 💑 COUPLES - 커플 멤버만 접근
CREATE POLICY "allow_couple_members_view_couples"
ON couples FOR SELECT
TO authenticated
USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);

CREATE POLICY "allow_authenticated_users_create_couples"
ON couples FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = partner_1_id);

CREATE POLICY "allow_couple_members_update_couples"
ON couples FOR UPDATE
TO authenticated
USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id)
WITH CHECK (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);

-- 📋 RULES - 커플 멤버만 모든 작업 가능
CREATE POLICY "allow_couple_members_all_rules"
ON rules FOR ALL
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

-- ⚖️ VIOLATIONS - 커플 멤버만 모든 작업 가능
CREATE POLICY "allow_couple_members_all_violations"
ON violations FOR ALL
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

-- 🎁 REWARDS - 커플 멤버만 모든 작업 가능
CREATE POLICY "allow_couple_members_all_rewards"
ON rewards FOR ALL
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

-- 📊 ACTIVITY_LOGS
CREATE POLICY "allow_couple_members_view_activity_logs"
ON activity_logs FOR SELECT
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "allow_couple_members_insert_activity_logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- ========================================
-- 2단계: Realtime 설정 (20250808_enable_realtime.sql)
-- ========================================

-- REPLICA IDENTITY 설정 (중요!)
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE couples REPLICA IDENTITY FULL;
ALTER TABLE rules REPLICA IDENTITY FULL;
ALTER TABLE violations REPLICA IDENTITY FULL;
ALTER TABLE rewards REPLICA IDENTITY FULL;
ALTER TABLE activity_logs REPLICA IDENTITY FULL;

-- supabase_realtime publication에 테이블 추가
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE couples;
ALTER PUBLICATION supabase_realtime ADD TABLE rules;
ALTER PUBLICATION supabase_realtime ADD TABLE violations;
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- ========================================
-- 3단계: 디버깅 함수 생성
-- ========================================

-- RLS 정책 확인 함수
CREATE OR REPLACE FUNCTION debug_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  policy_name TEXT,
  policy_cmd TEXT,
  policy_roles TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pol.schemaname || '.' || pol.tablename as table_name,
    pol.policyname as policy_name,
    pol.cmd as policy_cmd,
    pol.roles as policy_roles
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
  ORDER BY pol.tablename, pol.policyname;
END;
$$ LANGUAGE plpgsql;

-- 커플 접근 테스트 함수  
CREATE OR REPLACE FUNCTION test_couple_access(test_user_id UUID, test_couple_id UUID)
RETURNS TABLE (
  table_name TEXT,
  can_select BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  error_msg TEXT := '';
BEGIN
  -- Test profiles table
  BEGIN
    PERFORM 1 FROM profiles WHERE id = test_user_id;
    RETURN QUERY SELECT 'profiles'::TEXT, true, ''::TEXT;
  EXCEPTION WHEN OTHERS THEN
    error_msg := SQLERRM;
    RETURN QUERY SELECT 'profiles'::TEXT, false, error_msg;
  END;
  
  -- Test couples table
  BEGIN
    PERFORM 1 FROM couples WHERE id = test_couple_id;
    RETURN QUERY SELECT 'couples'::TEXT, true, ''::TEXT;
  EXCEPTION WHEN OTHERS THEN
    error_msg := SQLERRM;
    RETURN QUERY SELECT 'couples'::TEXT, false, error_msg;
  END;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 완료! 이제 Supabase Dashboard에서 다음 작업:
-- ========================================
-- 1. Database → Replication → 모든 테이블 Realtime 켜기
-- 2. 각 테이블에서 INSERT, UPDATE, DELETE 이벤트 활성화

SELECT 'RLS 정책 및 Realtime 설정 완료!' as status;