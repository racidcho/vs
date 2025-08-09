-- 🧪 테스트 사용자 설정 스크립트
-- 이메일 인증 우회 테스트를 위한 사용자 생성

-- 기존 테스트 데이터 정리
DELETE FROM activity_logs WHERE couple_id IN (
  SELECT id FROM couples WHERE couple_code LIKE 'TEST%'
);
DELETE FROM violations WHERE couple_id IN (
  SELECT id FROM couples WHERE couple_code LIKE 'TEST%'
);
DELETE FROM rewards WHERE couple_id IN (
  SELECT id FROM couples WHERE couple_code LIKE 'TEST%'
);
DELETE FROM rules WHERE couple_id IN (
  SELECT id FROM couples WHERE couple_code LIKE 'TEST%'
);
DELETE FROM couples WHERE couple_code LIKE 'TEST%';
DELETE FROM profiles WHERE email IN ('ABC@NAVER.COM', 'DDD@GMAIL.COM');

-- 테스트 사용자 프로필 생성
INSERT INTO profiles (id, email, display_name, created_at, updated_at) VALUES
('test-user-abc-123', 'ABC@NAVER.COM', '테스트사용자A', NOW(), NOW()),
('test-user-ddd-456', 'DDD@GMAIL.COM', '테스트사용자B', NOW(), NOW());

-- 테스트 커플 생성 (아직 연결되지 않은 상태)
INSERT INTO couples (id, couple_code, couple_name, partner_1_id, partner_2_id, total_balance, is_active, created_at, updated_at) VALUES
('test-couple-123', 'TEST01', '테스트커플', 'test-user-abc-123', NULL, 0, true, NOW(), NOW());

-- 첫 번째 사용자를 커플에 연결
UPDATE profiles SET couple_id = 'test-couple-123' WHERE id = 'test-user-abc-123';

-- 테스트용 기본 규칙 생성
INSERT INTO rules (id, couple_id, title, description, fine_amount, created_by_user_id, is_active, created_at, updated_at) VALUES
('test-rule-1', 'test-couple-123', '지각 금지', '약속 시간에 늦으면 벌금', 5000, 'test-user-abc-123', true, NOW(), NOW()),
('test-rule-2', 'test-couple-123', '욕설 금지', '서로에게 욕하면 벌금', 3000, 'test-user-abc-123', true, NOW(), NOW());

-- 테스트용 기본 보상 생성
INSERT INTO rewards (id, couple_id, title, description, target_amount, created_by_user_id, is_achieved, created_at, updated_at) VALUES
('test-reward-1', 'test-couple-123', '맛있는 저녁', '벌금 20000원 모이면 고급 레스토랑', 20000, 'test-user-abc-123', false, NOW(), NOW()),
('test-reward-2', 'test-couple-123', '주말 여행', '벌금 50000원 모이면 1박2일 여행', 50000, 'test-user-abc-123', false, NOW(), NOW());

-- 검증 쿼리
SELECT 'PROFILES' as table_name, count(*) as count FROM profiles WHERE email IN ('ABC@NAVER.COM', 'DDD@GMAIL.COM')
UNION ALL
SELECT 'COUPLES' as table_name, count(*) as count FROM couples WHERE couple_code LIKE 'TEST%'
UNION ALL  
SELECT 'RULES' as table_name, count(*) as count FROM rules WHERE couple_id = 'test-couple-123'
UNION ALL
SELECT 'REWARDS' as table_name, count(*) as count FROM rewards WHERE couple_id = 'test-couple-123';

-- 테스트 사용자 정보 조회
SELECT 
  p.email,
  p.display_name,
  p.couple_id,
  c.couple_code,
  c.couple_name,
  c.partner_1_id,
  c.partner_2_id
FROM profiles p
LEFT JOIN couples c ON p.couple_id = c.id
WHERE p.email IN ('ABC@NAVER.COM', 'DDD@GMAIL.COM');

COMMIT;

-- 성공 메시지
SELECT '✅ 테스트 사용자 설정 완료!' as message;