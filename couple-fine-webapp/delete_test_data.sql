-- ⚠️ 주의: 이 스크립트는 테스트 데이터를 완전히 삭제합니다
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. 먼저 삭제할 사용자들의 정보 확인
SELECT id, email, couple_id, display_name 
FROM profiles 
WHERE email IN ('racidcho@naver.com', 'test2@test.com');

-- 2. 해당 커플의 ID 찾기 (위 쿼리 결과에서 couple_id 확인)
-- couple_id를 아래 쿼리들에서 'YOUR_COUPLE_ID'와 교체하세요

-- 3. 벌금 기록 삭제
DELETE FROM violations 
WHERE couple_id = 'YOUR_COUPLE_ID';

-- 4. 규칙 삭제
DELETE FROM rules 
WHERE couple_id = 'YOUR_COUPLE_ID';

-- 5. 보상 삭제
DELETE FROM rewards 
WHERE couple_id = 'YOUR_COUPLE_ID';

-- 6. 프로필에서 커플 연결 해제 (삭제하지 않고 연결만 해제)
UPDATE profiles 
SET couple_id = NULL, display_name = NULL
WHERE email IN ('racidcho@naver.com', 'test2@test.com');

-- 7. 커플 테이블에서 삭제
DELETE FROM couples 
WHERE id = 'YOUR_COUPLE_ID';

-- 8. 확인 - 모든 데이터가 삭제되었는지 체크
SELECT * FROM profiles WHERE email IN ('racidcho@naver.com', 'test2@test.com');

-- ====================================
-- 또는 더 간단한 방법: 특정 이메일의 모든 데이터 한번에 삭제
-- ====================================

-- 옵션 A: 커플 데이터만 초기화 (계정은 유지)
DO $$
DECLARE
    v_couple_id UUID;
BEGIN
    -- racidcho@naver.com의 couple_id 찾기
    SELECT couple_id INTO v_couple_id 
    FROM profiles 
    WHERE email = 'racidcho@naver.com';
    
    IF v_couple_id IS NOT NULL THEN
        -- 관련 데이터 삭제
        DELETE FROM violations WHERE couple_id = v_couple_id;
        DELETE FROM rules WHERE couple_id = v_couple_id;
        DELETE FROM rewards WHERE couple_id = v_couple_id;
        
        -- 프로필 초기화
        UPDATE profiles 
        SET couple_id = NULL, display_name = NULL
        WHERE couple_id = v_couple_id;
        
        -- 커플 삭제
        DELETE FROM couples WHERE id = v_couple_id;
        
        RAISE NOTICE '커플 데이터가 삭제되었습니다: %', v_couple_id;
    ELSE
        RAISE NOTICE '해당 이메일의 커플 데이터를 찾을 수 없습니다';
    END IF;
END $$;

-- 옵션 B: Auth 사용자까지 완전 삭제 (주의!)
-- Supabase Dashboard > Authentication > Users 에서 직접 삭제하는 것을 권장