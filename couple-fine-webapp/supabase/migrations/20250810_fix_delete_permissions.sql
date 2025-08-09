-- 삭제 기능을 위한 RLS 정책 추가
-- 2025-08-10: 삭제 기능이 작동하지 않는 문제 해결

-- Rules 테이블 삭제 정책
DROP POLICY IF EXISTS "Users can delete couple rules" ON rules;
CREATE POLICY "Users can delete couple rules" ON rules 
FOR DELETE 
TO authenticated 
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Violations 테이블 삭제 정책  
DROP POLICY IF EXISTS "Users can delete couple violations" ON violations;
CREATE POLICY "Users can delete couple violations" ON violations 
FOR DELETE 
TO authenticated 
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- Rewards 테이블 삭제 정책
DROP POLICY IF EXISTS "Users can delete couple rewards" ON rewards;
CREATE POLICY "Users can delete couple rewards" ON rewards 
FOR DELETE 
TO authenticated 
USING (
  couple_id IN (
    SELECT id FROM couples 
    WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  )
);

-- 확인용 정책 조회
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('rules', 'violations', 'rewards')
AND cmd = 'DELETE';