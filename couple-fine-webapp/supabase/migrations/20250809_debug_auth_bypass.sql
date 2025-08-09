-- 디버그 모드를 위한 인증 우회 RLS 정책
-- 테스트 계정 ID들이 인증 없이도 데이터를 생성/수정/삭제할 수 있도록 허용

-- 1. profiles 테이블 - 테스트 계정 생성 허용
DROP POLICY IF EXISTS "Debug mode test accounts full access" ON profiles;
CREATE POLICY "Debug mode test accounts full access"
ON profiles
FOR ALL
USING (
  -- 테스트 계정 ID들에 대해서는 무조건 허용
  id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
  -- 또는 일반 인증된 사용자
  OR auth.uid() IS NOT NULL
)
WITH CHECK (
  -- 테스트 계정 ID들에 대해서는 무조건 허용
  id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
  -- 또는 본인 프로필 수정만 허용
  OR auth.uid() = id
);

-- 2. couples 테이블 - 테스트 커플 생성 허용
DROP POLICY IF EXISTS "Debug mode test couple access" ON couples;
CREATE POLICY "Debug mode test couple access"
ON couples
FOR ALL
USING (
  -- 테스트 커플 ID에 대해서는 무조건 허용
  id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  -- 또는 테스트 계정들이 파트너인 경우
  OR partner_1_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
  OR partner_2_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
  -- 또는 일반 사용자의 커플
  OR auth.uid() = partner_1_id 
  OR auth.uid() = partner_2_id
)
WITH CHECK (
  -- 테스트 커플 ID에 대해서는 무조건 허용
  id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  -- 또는 테스트 계정들이 파트너인 경우
  OR partner_1_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
  OR partner_2_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
  -- 또는 일반 사용자가 파트너인 경우
  OR auth.uid() = partner_1_id 
  OR auth.uid() = partner_2_id
);

-- 3. rules 테이블 - 테스트 커플 규칙 생성 허용
DROP POLICY IF EXISTS "Debug mode test rules access" ON rules;
CREATE POLICY "Debug mode test rules access"
ON rules
FOR ALL
USING (
  -- 테스트 커플 데이터는 무조건 허용
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  -- 또는 일반 사용자의 커플 규칙
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
)
WITH CHECK (
  -- 테스트 커플 데이터는 무조건 허용
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  -- 또는 일반 사용자의 커플 규칙
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- 4. violations 테이블 - 테스트 커플 벌금 기록 허용
DROP POLICY IF EXISTS "Debug mode test violations access" ON violations;
CREATE POLICY "Debug mode test violations access"
ON violations
FOR ALL
USING (
  -- 테스트 커플 데이터는 무조건 허용
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  -- 또는 일반 사용자의 커플 벌금 기록
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
)
WITH CHECK (
  -- 테스트 커플 데이터는 무조건 허용
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  -- 또는 일반 사용자의 커플 벌금 기록
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- 5. rewards 테이블 - 테스트 커플 보상 허용
DROP POLICY IF EXISTS "Debug mode test rewards access" ON rewards;
CREATE POLICY "Debug mode test rewards access"
ON rewards
FOR ALL
USING (
  -- 테스트 커플 데이터는 무조건 허용
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  -- 또는 일반 사용자의 커플 보상
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
)
WITH CHECK (
  -- 테스트 커플 데이터는 무조건 허용
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  -- 또는 일반 사용자의 커플 보상
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);