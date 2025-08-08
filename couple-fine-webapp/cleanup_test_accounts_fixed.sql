-- ============================================
-- Supabase SQL Editor에서 실행할 수정된 쿼리
-- display_name은 NULL이 될 수 없으므로 빈 문자열로 설정
-- ============================================

-- 방법 1: 커플 데이터만 초기화 (계정 유지)
DO $$
DECLARE
    v_couple_id UUID;
BEGIN
    -- racidcho@naver.com의 couple_id 찾기
    SELECT couple_id INTO v_couple_id
    FROM profiles 
    WHERE email = 'racidcho@naver.com';
    
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
        
        -- 4. 프로필 초기화 (couple_id만 NULL로, display_name은 빈 문자열로)
        UPDATE profiles 
        SET couple_id = NULL, 
            display_name = '',  -- NULL 대신 빈 문자열
            updated_at = NOW()
        WHERE couple_id = v_couple_id;
        RAISE NOTICE '프로필 초기화 완료';
        
        -- 5. 커플 테이블에서 삭제
        DELETE FROM couples WHERE id = v_couple_id;
        RAISE NOTICE '커플 데이터 삭제 완료: %', v_couple_id;
    ELSE
        RAISE NOTICE '커플 데이터를 찾을 수 없습니다';
    END IF;
END $$;

-- 삭제 확인
SELECT 
    p.id,
    p.email,
    p.couple_id,
    p.display_name,
    p.created_at
FROM profiles p
WHERE p.email IN ('racidcho@naver.com', 'test2@test.com');

-- ============================================
-- 방법 2: Auth 사용자 완전 삭제 (더 깔끔함)
-- 이렇게 하면 다시 회원가입해야 하지만 가장 깨끗합니다
-- ============================================

DELETE FROM auth.users 
WHERE email IN ('racidcho@naver.com', 'test2@test.com');

-- 이 방법을 사용하면 profiles 테이블의 데이터도 자동으로 삭제됩니다
-- (ON DELETE CASCADE 설정되어 있을 경우)

-- ============================================
-- 방법 3: 프로필만 리셋 (가장 간단)
-- ============================================

UPDATE profiles 
SET 
    couple_id = NULL,
    display_name = ''  -- 빈 문자열로 설정
WHERE email IN ('racidcho@naver.com', 'test2@test.com');

-- 그 다음 고아가 된 커플 데이터 정리
DELETE FROM couples 
WHERE id NOT IN (
    SELECT DISTINCT couple_id 
    FROM profiles 
    WHERE couple_id IS NOT NULL
);