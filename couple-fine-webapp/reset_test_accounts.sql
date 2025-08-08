-- ============================================
-- 🔄 테스트 초기화 SQL (언제든 재사용 가능)
-- ============================================
-- 사용법: 
-- 1. Supabase Dashboard > SQL Editor
-- 2. 이 내용 복사/붙여넣기
-- 3. Run 클릭
-- ============================================

-- 방법 1: 특정 이메일 완전 삭제
DELETE FROM auth.users 
WHERE email IN (
    'racidcho@naver.com', 
    'test2@test.com'
    -- 필요하면 여기에 더 추가
);

-- 방법 2: test로 시작하는 모든 테스트 계정 삭제
-- DELETE FROM auth.users 
-- WHERE email LIKE 'test%@%';

-- 방법 3: 오늘 생성된 테스트 계정만 삭제
-- DELETE FROM auth.users 
-- WHERE email LIKE 'test%' 
-- AND created_at > CURRENT_DATE;

-- ============================================
-- 삭제 후 확인
-- ============================================
SELECT 
    email, 
    created_at 
FROM auth.users 
WHERE email IN ('racidcho@naver.com', 'test2@test.com');

-- 결과가 없으면 성공적으로 삭제된 것입니다!