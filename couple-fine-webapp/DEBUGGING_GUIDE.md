# 🔍 Supabase 실시간 동기화 디버깅 가이드

## 📱 모바일/프로덕션 디버깅 (NEW!)

### joanddo.com에서 바로 디버깅하기

1. **디버그 패널 활성화**
   ```
   https://joanddo.com?debug=true
   ```
   URL 끝에 `?debug=true`를 추가하면 오른쪽 하단에 🐛 버튼이 나타납니다.

2. **디버그 패널 사용법**
   - 🐛 버튼 클릭 → 디버그 패널 열림
   - **🔍 전체 진단**: 모든 테스트 자동 실행
   - **🔄 데이터 새로고침**: 커플 데이터 다시 로드
   - **🧪 테스트 규칙 생성**: CRUD 작업 테스트
   - **📡 실시간 테스트**: WebSocket 연결 테스트

3. **로그 확인**
   - ✅ 초록색: 성공
   - ❌ 빨간색: 실패
   - ⚠️ 노란색: 경고
   - 로그는 패널 하단에 시간순으로 표시됩니다

## 💻 PC 브라우저 디버깅

### 개발자 도구 콘솔 사용

1. **브라우저 콘솔 열기**
   - Chrome/Edge: `F12` 또는 `Ctrl+Shift+I`
   - Console 탭으로 이동

2. **전체 진단 실행**
   ```javascript
   // 모든 테스트를 한 번에 실행
   await supabaseDebug.runFullDiagnostics()
   ```

3. **개별 테스트**
   ```javascript
   // Supabase 연결 확인
   await supabaseDebug.checkConnection()
   
   // 인증 상태 확인
   await supabaseDebug.checkAuth()
   
   // RLS 정책 테스트
   await appDebug.testRLS()
   
   // CRUD 작업 테스트
   await appDebug.testCRUD()
   
   // 실시간 구독 테스트
   supabaseDebug.testRealtime('rules')
   supabaseDebug.testRealtime('violations')
   supabaseDebug.testRealtime('rewards')
   ```

4. **앱 상태 확인**
   ```javascript
   // 현재 앱 상태
   appDebug.getState()
   
   // 사용자 정보
   appDebug.getUser()
   
   // 커플 ID
   appDebug.getCoupleId()
   ```

5. **수동 CRUD 테스트**
   ```javascript
   // 규칙 생성
   await appDebug.createRule('테스트 규칙', '디버깅용', 5000)
   
   // 벌금 생성
   const state = appDebug.getState()
   const ruleId = state.rules[0]?.id
   const userId = state.user?.id
   if (ruleId && userId) {
     await appDebug.createViolation(ruleId, userId, 5000, '테스트')
   }
   
   // 보상 생성
   await appDebug.createReward('테스트 보상', '디버깅용', 50000)
   ```

## 🔬 실시간 동기화 테스트

### 두 개의 탭/기기에서 테스트

1. **첫 번째 탭/기기**
   - joanddo.com?debug=true 접속
   - 로그인
   - 디버그 패널 열기
   - "📡 실시간 테스트" 클릭

2. **두 번째 탭/기기**
   - 같은 커플 계정으로 로그인
   - 디버그 패널 열기
   - "🧪 테스트 규칙 생성" 클릭

3. **확인 사항**
   - 첫 번째 탭에서 "📨 이벤트 수신" 메시지 확인
   - 규칙 목록이 자동으로 업데이트되는지 확인

## 🛠️ 로컬 개발 환경 설정

### 1. Supabase Local Development (권장)

Supabase CLI로 로컬에서 실제와 동일한 환경 구축:

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 초기화
supabase init

# 로컬 Supabase 시작
supabase start

# 로컬 환경 정보가 출력됩니다:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

**장점:**
- 실제 Supabase와 100% 동일한 환경
- RLS, Realtime, Auth 모두 테스트 가능
- 이메일 인증 없이 테스트 가능
- 데이터베이스 직접 접근 가능

**환경변수 설정:**
```env
# .env.local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### 2. 개발용 Auth 우회 설정

실제 App에 개발 모드 추가:

```typescript
// src/contexts/AuthContext.tsx
const isDevelopment = import.meta.env.DEV;

// 개발 모드에서는 이메일 인증 건너뛰기
if (isDevelopment) {
  // 자동 로그인 또는 간단한 로그인
  const { data } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword'
  });
} else {
  // 프로덕션: 정상적인 OTP 인증
}
```

**테스트 계정 생성:**
```sql
-- Supabase SQL Editor에서 실행
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES 
  ('test1@example.com', crypt('testpassword', gen_salt('bf')), now()),
  ('test2@example.com', crypt('testpassword', gen_salt('bf')), now());
```

## 📊 문제 진단 체크리스트

### ✅ 연결 문제
- [ ] Supabase URL이 올바른가?
- [ ] ANON KEY가 올바른가?
- [ ] 네트워크 연결이 정상인가?

### ✅ 인증 문제
- [ ] 로그인이 되어 있는가?
- [ ] JWT 토큰이 만료되지 않았는가?
- [ ] 세션이 유효한가?

### ✅ RLS 정책 문제
- [ ] profiles 테이블 SELECT 권한이 있는가?
- [ ] couples 테이블 접근 권한이 있는가?
- [ ] rules/violations/rewards CRUD 권한이 있는가?

### ✅ 실시간 동기화 문제
- [ ] WebSocket 연결이 되는가?
- [ ] 채널 구독이 성공했는가?
- [ ] 이벤트가 발생하는가?
- [ ] 이벤트를 수신하는가?

## 🎯 자주 발생하는 문제와 해결법

### 1. "JWT expired" 오류
**문제**: 세션이 만료됨
**해결**: 
```javascript
// 다시 로그인
location.href = '/login'
```

### 2. RLS 정책 오류
**문제**: 테이블 접근 권한 없음
**해결**: Supabase 대시보드에서 RLS 정책 확인 및 수정

### 3. 실시간 구독 안됨
**문제**: WebSocket 연결 실패
**해결**:
```javascript
// 채널 상태 확인
const channels = appDebug.supabase.getChannels()
console.log('Active channels:', channels)

// 수동으로 재연결
appDebug.supabase.removeAllChannels()
location.reload()
```

### 4. CRUD 작업 실패
**문제**: 데이터 생성/수정/삭제 안됨
**해결**:
- RLS 정책 확인
- couple_id가 올바른지 확인
- 필수 필드가 모두 있는지 확인

## 📝 디버그 결과 보고

문제를 발견하면 다음 정보를 수집해주세요:

1. **디버그 패널 스크린샷**
2. **전체 진단 결과**
3. **오류 메시지**
4. **재현 방법**

## 💡 Tips

- 모바일에서는 `?debug=true`로 디버그 패널 사용
- PC에서는 개발자 도구 콘솔이 더 상세한 정보 제공
- 실시간 테스트는 두 개의 탭/기기 필요
- 로컬 개발 환경이 가장 완벽한 테스트 환경

---

*최종 업데이트: 2025-08-09*