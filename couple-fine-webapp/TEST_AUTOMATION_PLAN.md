# 🤖 Couple Fine WebApp 테스트 자동화 시스템

## 📋 현재 상태 분석 (2025-08-09)

### ✅ 해결된 문제들

1. **첫 번째 사용자의 파트너 정보 표시 문제**
   - AppContext에서 커플 데이터 로드 시 partner_1, partner_2 관계 포함
   - Dashboard에서 파트너 정보 정상 표시

2. **두 번째 사용자의 축하 화면 표시 문제**
   - NameSetup.tsx에서 커플 완성 여부 체크 로직 수정
   - 두 번째 사용자도 축하 화면으로 자동 이동

3. **CRUD 작업 권한 문제**
   - RLS 정책 마이그레이션 파일 생성 완료
   - 양쪽 파트너 모두 CRUD 작업 가능

### ⚠️ 발견된 이슈

1. **실시간 동기화 미활성화**
   - `useRealtime` 훅이 구현되어 있으나 사용되지 않음
   - AppContext에서 실시간 구독이 비활성화 상태

2. **세션 관리 문제**
   - 한 브라우저에서 다중 세션 관리 불가
   - 자동 로그아웃 문제 가능성

## 🎯 테스트 자동화 시스템 구현 계획

### 1. 테스트 환경 구축

#### 1.1 테스트 계정 시스템
```javascript
// 고정된 테스트 계정 사용
const TEST_ACCOUNTS = {
  user1: {
    email: 'test1@joanddo.test',
    id: 'test-user-1-uuid',
    display_name: '테스트유저1'
  },
  user2: {
    email: 'test2@joanddo.test', 
    id: 'test-user-2-uuid',
    display_name: '테스트유저2'
  }
};
```

#### 1.2 인증 우회 시스템
- Supabase Service Role Key 활용
- 직접 세션 토큰 생성
- OTP 과정 완전 스킵

### 2. 자동화 스크립트 구조

```javascript
// test-automation.js
class CoupleAppTestAutomation {
  constructor() {
    this.supabaseAdmin = createClient(url, serviceRoleKey);
    this.browser1 = null;
    this.browser2 = null;
  }

  // 테스트 전 정리
  async cleanupBeforeTest() {
    // 테스트 데이터 완전 삭제
    await this.deleteTestData();
  }

  // 테스트 계정 설정
  async setupTestAccounts() {
    // 세션 토큰 직접 생성
    const session1 = await this.createSession(TEST_ACCOUNTS.user1);
    const session2 = await this.createSession(TEST_ACCOUNTS.user2);
    return { session1, session2 };
  }

  // 브라우저 세션 주입
  async injectSession(page, session) {
    await page.evaluateOnNewDocument((sessionData) => {
      localStorage.setItem('sb-auth-token', JSON.stringify(sessionData));
    }, session);
  }

  // 테스트 시나리오 실행
  async runTestScenarios() {
    // 1. 커플 연결 테스트
    await this.testCoupleConnection();
    
    // 2. 실시간 동기화 테스트
    await this.testRealtimeSync();
    
    // 3. CRUD 권한 테스트
    await this.testCRUDOperations();
    
    // 4. 파트너 정보 표시 테스트
    await this.testPartnerInfoDisplay();
  }

  // 테스트 후 정리
  async cleanupAfterTest() {
    await this.deleteTestData();
    await this.closeBrowsers();
  }
}
```

### 3. 테스트 시나리오

#### 3.1 커플 연결 시나리오
```javascript
async testCoupleConnection() {
  // User1: 커플 생성
  await this.page1.click('[data-test="create-couple"]');
  const code = await this.page1.textContent('[data-test="couple-code"]');
  
  // User2: 커플 참여
  await this.page2.fill('[data-test="couple-code-input"]', code);
  await this.page2.click('[data-test="join-couple"]');
  
  // 검증: 양쪽 모두 연결 확인
  await this.verifyConnection(this.page1, this.page2);
}
```

#### 3.2 실시간 동기화 시나리오
```javascript
async testRealtimeSync() {
  // User1: 규칙 생성
  await this.page1.click('[data-test="add-rule"]');
  await this.page1.fill('[data-test="rule-title"]', '테스트 규칙');
  await this.page1.click('[data-test="save-rule"]');
  
  // User2: 실시간 업데이트 확인 (5초 이내)
  await this.page2.waitForSelector(':text("테스트 규칙")', { timeout: 5000 });
}
```

#### 3.3 CRUD 권한 시나리오
```javascript
async testCRUDOperations() {
  // User1: 생성
  const ruleId = await this.createRule(this.page1, '규칙1');
  
  // User2: 수정
  await this.updateRule(this.page2, ruleId, '수정된 규칙1');
  
  // User1: 삭제 확인
  await this.deleteRule(this.page1, ruleId);
  
  // User2: 삭제 확인
  await this.verifyDeleted(this.page2, ruleId);
}
```

### 4. 데이터베이스 관리

#### 4.1 테스트 데이터 격리
```sql
-- 모든 테스트 데이터는 'TEST_' 접두사 사용
-- CASCADE DELETE로 연관 데이터 자동 정리
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void AS $$
BEGIN
  DELETE FROM violations WHERE couple_id LIKE 'TEST_%';
  DELETE FROM rewards WHERE couple_id LIKE 'TEST_%';
  DELETE FROM rules WHERE couple_id LIKE 'TEST_%';
  DELETE FROM couples WHERE id LIKE 'TEST_%';
  DELETE FROM profiles WHERE email LIKE '%@joanddo.test';
END;
$$ LANGUAGE plpgsql;
```

#### 4.2 테스트 데이터 시딩
```javascript
async seedTestData() {
  // 기본 테스트 데이터 생성
  const couple = await this.createTestCouple();
  const rules = await this.createTestRules(couple.id);
  const rewards = await this.createTestRewards(couple.id);
  return { couple, rules, rewards };
}
```

### 5. 실행 및 모니터링

#### 5.1 단일 테스트 실행
```bash
node test-automation.js --scenario=couple-connection
```

#### 5.2 전체 테스트 실행
```bash
node test-automation.js --all
```

#### 5.3 연속 테스트 실행
```bash
node test-automation.js --continuous --interval=60
```

### 6. 결과 리포팅

#### 6.1 테스트 결과 구조
```json
{
  "timestamp": "2025-08-09T12:00:00Z",
  "duration": 45000,
  "scenarios": {
    "couple_connection": {
      "status": "passed",
      "duration": 5000,
      "screenshots": ["user1-connected.png", "user2-connected.png"]
    },
    "realtime_sync": {
      "status": "passed",
      "duration": 3000,
      "latency": 1200
    },
    "crud_operations": {
      "status": "passed",
      "duration": 8000,
      "operations": {
        "create": "passed",
        "read": "passed",
        "update": "passed",
        "delete": "passed"
      }
    }
  },
  "errors": [],
  "warnings": []
}
```

#### 6.2 실패 시 디버깅 정보
- 스크린샷 자동 캡처
- 브라우저 콘솔 로그
- 네트워크 요청 기록
- Supabase 쿼리 로그

## 📊 성공 지표

### 필수 테스트 통과 기준
1. ✅ 커플 연결 100% 성공
2. ✅ 실시간 동기화 5초 이내
3. ✅ CRUD 작업 양쪽 모두 가능
4. ✅ 파트너 정보 정확히 표시
5. ✅ 세션 30분 이상 유지

### 성능 목표
- 페이지 로드: < 3초
- API 응답: < 500ms
- 실시간 동기화: < 2초
- 테스트 완료: < 60초

## 🔧 구현 우선순위

### Phase 1: 기본 자동화 (즉시)
1. Service Role Key 설정
2. 테스트 계정 생성 스크립트
3. 세션 주입 메커니즘
4. 기본 시나리오 구현

### Phase 2: 고급 기능 (1일 내)
1. 실시간 동기화 검증
2. 성능 측정
3. 에러 처리
4. 리포팅 시스템

### Phase 3: CI/CD 통합 (추후)
1. GitHub Actions 연동
2. 자동 배포 전 테스트
3. 일일 리포트
4. 알림 시스템

## 🚀 실행 계획

### 즉시 실행 작업
1. ✅ 현재 문제 분석 완료
2. 🔄 테스트 자동화 스크립트 작성
3. ⏳ 테스트 실행 및 검증
4. ⏳ 문제 수정 및 재테스트

### 예상 소요 시간
- 스크립트 작성: 30분
- 초기 테스트: 15분
- 문제 수정: 30분
- 최종 검증: 15분
- **총 예상 시간: 1시간 30분**

## 📝 참고사항

### 주의사항
1. 테스트 데이터는 반드시 'TEST_' 접두사 사용
2. 프로덕션 데이터와 절대 섞이지 않도록 주의
3. 테스트 후 반드시 정리
4. Service Role Key는 절대 노출 금지

### 개선 가능 사항
1. useRealtime 훅 활성화 필요
2. 세션 관리 로직 개선
3. 에러 핸들링 강화
4. 로딩 성능 최적화

---

*마지막 업데이트: 2025-08-09 20:30 KST*
*작성자: Claude AI Assistant*