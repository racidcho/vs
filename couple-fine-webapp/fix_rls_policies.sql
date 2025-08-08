-- ============================================
-- RLS 정책 수정 - 규칙/보상 생성 오류 해결
-- ============================================

-- 기존 정책들 모두 삭제
DROP POLICY IF EXISTS "Users can create rules" ON rules;
DROP POLICY IF EXISTS "Users can create rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view couple rules" ON rules;
DROP POLICY IF EXISTS "Users can view couple rewards" ON rewards;
DROP POLICY IF EXISTS "Users can update couple rules" ON rules;
DROP POLICY IF EXISTS "Users can update couple rewards" ON rewards;
DROP POLICY IF EXISTS "Users can delete couple rules" ON rules;
DROP POLICY IF EXISTS "Users can delete couple rewards" ON rewards;

-- Rules 테이블 정책 생성
CREATE POLICY "Allow insert rules for couple members" ON rules
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = couple_id 
    AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
  )
);

CREATE POLICY "Allow select rules for couple members" ON rules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = couple_id 
    AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
  )
);

CREATE POLICY "Allow update rules for couple members" ON rules
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = couple_id 
    AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
  )
);

CREATE POLICY "Allow delete rules for couple members" ON rules
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = couple_id 
    AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
  )
);

-- Rewards 테이블 정책 생성
CREATE POLICY "Allow insert rewards for couple members" ON rewards
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = couple_id 
    AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
  )
);

CREATE POLICY "Allow select rewards for couple members" ON rewards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = couple_id 
    AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
  )
);

CREATE POLICY "Allow update rewards for couple members" ON rewards
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = couple_id 
    AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
  )
);

CREATE POLICY "Allow delete rewards for couple members" ON rewards
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM couples 
    WHERE id = couple_id 
    AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
  )
);

-- 정책 활성화
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('rules', 'rewards')
ORDER BY tablename, cmd;