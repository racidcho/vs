-- 🧹 CLEAN VERSION - 기존 정책 강제 삭제 후 재생성
-- Supabase SQL Editor에서 실행하세요

-- ========================================
-- 1단계: 기존 정책 완전 정리
-- ========================================

-- 현재 정책 확인
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- PROFILES 테이블 정책 모두 삭제
DROP POLICY IF EXISTS "allow_all_authenticated_users_view_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- COUPLES 테이블 정책 모두 삭제
DROP POLICY IF EXISTS "allow_couple_members_view_couples" ON couples;
DROP POLICY IF EXISTS "allow_authenticated_users_create_couples" ON couples;
DROP POLICY IF EXISTS "allow_couple_members_update_couples" ON couples;
DROP POLICY IF EXISTS "Users can view their couple" ON couples;
DROP POLICY IF EXISTS "Couple members can view couple" ON couples;
DROP POLICY IF EXISTS "Couple members can view couple data" ON couples;
DROP POLICY IF EXISTS "Users can create couple" ON couples;
DROP POLICY IF EXISTS "Anyone can create couple" ON couples;
DROP POLICY IF EXISTS "Couple members can update couple" ON couples;

-- RULES 테이블 정책 모두 삭제
DROP POLICY IF EXISTS "allow_couple_members_all_rules" ON rules;
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

-- VIOLATIONS 테이블 정책 모두 삭제
DROP POLICY IF EXISTS "allow_couple_members_all_violations" ON violations;
DROP POLICY IF EXISTS "Users can view couple violations" ON violations;
DROP POLICY IF EXISTS "Couple members can view violations" ON violations;
DROP POLICY IF EXISTS "Couple members can manage violations" ON violations;
DROP POLICY IF EXISTS "Users can create violations" ON violations;
DROP POLICY IF EXISTS "Couple members can create violations" ON violations;
DROP POLICY IF EXISTS "Users can update violations" ON violations;
DROP POLICY IF EXISTS "Couple members can update violations" ON violations;
DROP POLICY IF EXISTS "Users can delete couple violations" ON violations;
DROP POLICY IF EXISTS "Couple members can delete violations" ON violations;

-- REWARDS 테이블 정책 모두 삭제
DROP POLICY IF EXISTS "allow_couple_members_all_rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view couple rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can view rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can manage rewards" ON rewards;
DROP POLICY IF EXISTS "Users can create rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can create rewards" ON rewards;
DROP POLICY IF EXISTS "Users can update couple rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can update rewards" ON rewards;
DROP POLICY IF EXISTS "Users can delete couple rewards" ON rewards;
DROP POLICY IF EXISTS "Couple members can delete rewards" ON rewards;

-- ACTIVITY_LOGS 테이블 정책 모두 삭제
DROP POLICY IF EXISTS "allow_couple_members_view_activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "allow_couple_members_insert_activity_logs" ON activity_logs;

SELECT 'Step 1: 기존 정책 삭제 완료' as status;

-- ========================================
-- 2단계: 새로운 Ultra-Simple 정책 생성
-- ========================================

-- RLS 활성화 확인
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 🔑 PROFILES - 모든 인증된 사용자가 조회 가능 (파트너 이름 표시용)
CREATE POLICY "profiles_select_all_authenticated"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 💑 COUPLES - 커플 멤버만 접근
CREATE POLICY "couples_select_members"
ON couples FOR SELECT
TO authenticated
USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);

CREATE POLICY "couples_insert_creator"
ON couples FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = partner_1_id);

CREATE POLICY "couples_update_members"
ON couples FOR UPDATE
TO authenticated
USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id)
WITH CHECK (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);

-- 📋 RULES - 커플 멤버만 모든 작업 가능
CREATE POLICY "rules_all_couple_members"
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
CREATE POLICY "violations_all_couple_members"
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
CREATE POLICY "rewards_all_couple_members"
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
CREATE POLICY "activity_logs_select_couple_members"
ON activity_logs FOR SELECT
TO authenticated
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

CREATE POLICY "activity_logs_insert_couple_members"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

SELECT 'Step 2: 새로운 RLS 정책 생성 완료' as status;

-- ========================================
-- 3단계: Realtime 설정
-- ========================================

-- REPLICA IDENTITY 설정 (중요!)
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE couples REPLICA IDENTITY FULL;
ALTER TABLE rules REPLICA IDENTITY FULL;
ALTER TABLE violations REPLICA IDENTITY FULL;
ALTER TABLE rewards REPLICA IDENTITY FULL;
ALTER TABLE activity_logs REPLICA IDENTITY FULL;

-- supabase_realtime publication에 테이블 추가 (오류 무시)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'profiles already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE couples;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'couples already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE rules;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'rules already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE violations;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'violations already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE rewards;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'rewards already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'activity_logs already in publication';
END $$;

SELECT 'Step 3: Realtime 설정 완료' as status;

-- ========================================
-- 4단계: 최종 확인
-- ========================================

-- 현재 정책 확인
SELECT 'RLS 정책 현황:' as info;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Publication 확인
SELECT 'Publication 현황:' as info;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

SELECT '🎉 모든 설정 완료! Database → Replication에서 테이블별 Realtime을 활성화하세요.' as final_status;