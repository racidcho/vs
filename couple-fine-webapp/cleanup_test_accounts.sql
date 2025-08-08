-- ============================================
-- Supabase SQL Editor에서 실행할 쿼리
-- ============================================

-- 1단계: 먼저 현재 데이터 확인
SELECT 
    p.id as user_id,
    p.email,
    p.couple_id,
    p.display_name,
    c.couple_code,
    c.couple_name
FROM profiles p
LEFT JOIN couples c ON p.couple_id = c.id
WHERE p.email IN ('racidcho@naver.com', 'test2@test.com');

-- 2단계: 커플 ID 확인 후 관련 데이터 모두 삭제
-- 위 쿼리 결과에서 couple_id 확인 후 아래 쿼리 실행

-- 모든 관련 데이터를 한 번에 삭제하는 함수
DO $$
DECLARE
    v_couple_id UUID;
    v_user_id1 UUID;
    v_user_id2 UUID;
BEGIN
    -- racidcho@naver.com의 couple_id 찾기
    SELECT couple_id, id INTO v_couple_id, v_user_id1
    FROM profiles 
    WHERE email = 'racidcho@naver.com';
    
    -- test2@test.com의 user_id 찾기
    SELECT id INTO v_user_id2
    FROM profiles 
    WHERE email = 'test2@test.com';
    
    IF v_couple_id IS NOT NULL THEN
        -- 1. 벌금 기록 삭제
        DELETE FROM violations WHERE couple_id = v_couple_id;
        RAISE NOTICE '벌금 기록 삭제 완료';
        
        -- 2. 규칙 삭제
        DELETE FROM rules WHERE couple_id = v_couple_id;
        RAISE NOTICE '규칙 삭제 완료';
        
        -- 3. 보상 삭제
        DELETE FROM rewards WHERE couple_id = v_couple_id;
        RAISE NOTICE '보상 삭제 완료';
        
        -- 4. 프로필 초기화 (couple_id와 display_name을 NULL로)
        UPDATE profiles 
        SET couple_id = NULL, 
            display_name = NULL,
            updated_at = NOW()
        WHERE couple_id = v_couple_id;
        RAISE NOTICE '프로필 초기화 완료';
        
        -- 5. 커플 테이블에서 삭제
        DELETE FROM couples WHERE id = v_couple_id;
        RAISE NOTICE '커플 데이터 삭제 완료: %', v_couple_id;
    ELSE
        RAISE NOTICE '커플 데이터를 찾을 수 없습니다';
    END IF;
    
    -- 6. Auth 사용자 삭제 (선택사항 - 주석 해제하여 사용)
    -- DELETE FROM auth.users WHERE email IN ('racidcho@naver.com', 'test2@test.com');
    -- RAISE NOTICE 'Auth 사용자 삭제 완료';
    
END $$;

-- 3단계: 삭제 확인
SELECT 
    p.id,
    p.email,
    p.couple_id,
    p.display_name,
    p.created_at
FROM profiles p
WHERE p.email IN ('racidcho@naver.com', 'test2@test.com');

-- 커플 테이블 확인
SELECT * FROM couples WHERE couple_code IN (
    SELECT couple_code FROM couples 
    WHERE id IN (
        SELECT couple_id FROM profiles 
        WHERE email IN ('racidcho@naver.com', 'test2@test.com')
    )
);

-- ============================================
-- 만약 Auth 사용자까지 완전 삭제하고 싶다면
-- (주의: 이렇게 하면 다시 회원가입해야 함)
-- ============================================

-- Auth 사용자 완전 삭제 (프로필도 자동 삭제됨)
DELETE FROM auth.users 
WHERE email IN ('racidcho@naver.com', 'test2@test.com');

-- ============================================
-- 또는 특정 커플 코드로 삭제하기
-- ============================================

-- 특정 커플 코드의 모든 데이터 삭제
DO $$
DECLARE
    v_couple_id UUID;
BEGIN
    -- 커플 코드로 couple_id 찾기 (여기에 실제 코드 입력)
    SELECT id INTO v_couple_id
    FROM couples 
    WHERE couple_code = 'YOUR_COUPLE_CODE_HERE';  -- 예: 'ABC123'
    
    IF v_couple_id IS NOT NULL THEN
        -- 관련 데이터 모두 삭제
        DELETE FROM violations WHERE couple_id = v_couple_id;
        DELETE FROM rules WHERE couple_id = v_couple_id;
        DELETE FROM rewards WHERE couple_id = v_couple_id;
        
        -- 프로필 초기화
        UPDATE profiles 
        SET couple_id = NULL, display_name = NULL
        WHERE couple_id = v_couple_id;
        
        -- 커플 삭제
        DELETE FROM couples WHERE id = v_couple_id;
        
        RAISE NOTICE '커플 코드 % 의 모든 데이터가 삭제되었습니다', 'YOUR_COUPLE_CODE_HERE';
    END IF;
END $$;