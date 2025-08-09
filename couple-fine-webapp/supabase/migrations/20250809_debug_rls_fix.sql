-- 디버그 모드를 위한 RLS 정책 수정
-- 테스트 계정들이 생성된 데이터에 접근할 수 있도록 수정

-- 1. profiles 테이블 - 테스트 계정 전체 접근 허용
CREATE POLICY IF NOT EXISTS "Debug mode test accounts full access"
ON profiles
FOR ALL
TO authenticated
USING (
  id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
  OR true -- 기존 정책 유지
)
WITH CHECK (
  id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
  OR auth.uid() = id
);

-- 2. couples 테이블 - 테스트 커플 접근 허용
CREATE POLICY IF NOT EXISTS "Debug mode test couple access"
ON couples
FOR ALL
TO authenticated
USING (
  id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  OR auth.uid() = partner_1_id 
  OR auth.uid() = partner_2_id
)
WITH CHECK (
  id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  OR auth.uid() = partner_1_id 
  OR auth.uid() = partner_2_id
);

-- 3. rules 테이블 - 테스트 커플 데이터 접근 허용
CREATE POLICY IF NOT EXISTS "Debug mode test rules access"
ON rules
FOR ALL
TO authenticated
USING (
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
)
WITH CHECK (
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- 4. violations 테이블 - 테스트 커플 데이터 접근 허용
CREATE POLICY IF NOT EXISTS "Debug mode test violations access"
ON violations
FOR ALL
TO authenticated
USING (
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
)
WITH CHECK (
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- 5. rewards 테이블 - 테스트 커플 데이터 접근 허용
CREATE POLICY IF NOT EXISTS "Debug mode test rewards access"
ON rewards
FOR ALL
TO authenticated
USING (
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
)
WITH CHECK (
  couple_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- 기존 정책들 삭제 (중복 방지)
DROP POLICY IF EXISTS "Users can view couples" ON couples;
DROP POLICY IF EXISTS "Users can delete couple rules" ON rules;
DROP POLICY IF EXISTS "Users can delete couple rewards" ON rewards;
DROP POLICY IF EXISTS "Users can delete couple violations" ON violations;

-- 기존 필수 정책들 다시 생성
CREATE POLICY "Users can view couples" ON couples FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Users can delete couple rules" ON rules FOR DELETE
USING (couple_id IN (
  SELECT id FROM couples 
  WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
));

CREATE POLICY "Users can delete couple rewards" ON rewards FOR DELETE
USING (couple_id IN (
  SELECT id FROM couples 
  WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
));

CREATE POLICY "Users can delete couple violations" ON violations FOR DELETE
USING (couple_id IN (
  SELECT id FROM couples 
  WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
));