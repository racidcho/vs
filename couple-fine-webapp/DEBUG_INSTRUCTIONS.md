# 🔍 Supabase 실시간 동기화 문제 디버깅 가이드

## 문제 상황
1. **실시간 양방향 데이터 교환 안됨** - 커플 간 데이터가 실시간으로 동기화되지 않음
2. **CRUD 기능 실패** - 규칙, 벌금, 보상 생성/수정/삭제가 작동하지 않음

## 디버깅 도구 사용법

### 1. 브라우저 콘솔 열기
- Chrome/Edge: `F12` 또는 `Ctrl+Shift+I`
- Console 탭으로 이동

### 2. 디버깅 도구 확인
브라우저 콘솔에 다음과 같은 메시지가 표시되어야 합니다:
```
🔧 Supabase 디버깅 도구 활성화됨
🔧 앱 디버깅 도구 활성화됨
```

## 🎯 진단 명령어

### 전체 진단 실행 (권장)
```javascript
// 모든 테스트를 한 번에 실행
await supabaseDebug.runFullDiagnostics()
```

### 개별 테스트

#### 1. Supabase 연결 확인
```javascript
// 기본 연결 상태 확인
await supabaseDebug.checkConnection()
```

#### 2. 인증 상태 확인
```javascript
// 현재 로그인 상태와 세션 확인
await supabaseDebug.checkAuth()
```

#### 3. 커플 연결 상태 확인
```javascript
// 커플 정보와 파트너 정보 확인
const user = await supabaseDebug.checkAuth()
if (user) {
  await supabaseDebug.checkCouple(user.id)
}
```

#### 4. RLS 정책 테스트
```javascript
// 테이블별 접근 권한 확인
await appDebug.testRLS()
```

#### 5. CRUD 작업 테스트
```javascript
// 생성/수정/삭제 권한 테스트
await appDebug.testCRUD()
```

#### 6. 실시간 구독 테스트
```javascript
// 특정 테이블의 실시간 구독 테스트
supabaseDebug.testRealtime('rules')
supabaseDebug.testRealtime('violations')
supabaseDebug.testRealtime('rewards')
```

## 🔬 앱 상태 확인

### 현재 상태 보기
```javascript
// 전체 앱 상태
appDebug.getState()

// 현재 사용자 정보
appDebug.getUser()

// 커플 ID
appDebug.getCoupleId()
```

### 데이터 다시 로드
```javascript
// 커플 데이터 다시 로드
await appDebug.loadData()

// 전체 데이터 새로고침
await appDebug.refreshData()
```

## 🧪 수동 CRUD 테스트

### 규칙 생성 테스트
```javascript
// 새 규칙 만들기
await appDebug.createRule('테스트 규칙', '디버깅용 테스트', 5000)
```

### 벌금 생성 테스트
```javascript
// 먼저 규칙 ID 확인
const state = appDebug.getState()
const ruleId = state.rules[0]?.id
const userId = state.user?.id

if (ruleId && userId) {
  // 벌금 추가
  await appDebug.createViolation(ruleId, userId, 5000, '테스트 벌금')
}
```

### 보상 생성 테스트
```javascript
// 새 보상 만들기
await appDebug.createReward('테스트 보상', '디버깅용 보상', 50000)
```

## 📊 디버그 로그 해석

### 성공 표시
- ✅ 초록색 배경: 작업 성공
- 📨 이벤트 수신: 실시간 데이터 수신됨

### 경고 표시
- ⚠️ 주황색 배경: 경고 (주의 필요)
- 세션 없음, 커플 연결 안됨 등

### 오류 표시
- ❌ 빨간색 배경: 작업 실패
- 💥 예외 발생: 심각한 오류

## 🔍 문제 해결 절차

### 1단계: 전체 진단 실행
```javascript
await supabaseDebug.runFullDiagnostics()
```

### 2단계: 오류 메시지 확인
- RLS 정책 오류가 있다면 → Supabase 대시보드에서 RLS 정책 확인
- 인증 오류가 있다면 → 다시 로그인 시도
- 연결 오류가 있다면 → 환경변수 및 네트워크 확인

### 3단계: 실시간 구독 테스트
두 개의 브라우저 탭을 열고:

**탭 1에서:**
```javascript
// 실시간 구독 시작
supabaseDebug.testRealtime('rules')
```

**탭 2에서:**
```javascript
// 규칙 생성
await appDebug.createRule('실시간 테스트', '동기화 확인', 1000)
```

탭 1의 콘솔에서 "📨 이벤트 수신" 메시지가 나타나야 합니다.

### 4단계: 결과 캡처
1. 콘솔 로그 전체를 복사 (Ctrl+A, Ctrl+C)
2. 오류 메시지 스크린샷 촬영
3. 네트워크 탭에서 실패한 요청 확인

## 💡 자주 발생하는 문제

### 1. "JWT expired" 오류
```javascript
// 해결: 다시 로그인
location.href = '/login'
```

### 2. RLS 정책 오류
```javascript
// 현재 정책 확인
await appDebug.testRLS()
// "SELECT" 권한이 없다면 Supabase 대시보드에서 정책 수정 필요
```

### 3. 실시간 구독 안됨
```javascript
// WebSocket 연결 상태 확인
const channels = appDebug.supabase.getChannels()
console.log('Active channels:', channels)
```

## 📝 디버그 결과 보고

문제를 발견하면 다음 정보를 수집해주세요:

1. **전체 진단 결과**: `supabaseDebug.runFullDiagnostics()` 실행 결과
2. **앱 상태**: `appDebug.getState()` 결과
3. **오류 메시지**: 콘솔에 표시된 빨간색 오류
4. **네트워크 오류**: Network 탭의 실패한 요청

## 🚀 실행 예시

```javascript
// 1. 전체 진단
await supabaseDebug.runFullDiagnostics()

// 2. 문제가 있다면 개별 테스트
await appDebug.testRLS()
await appDebug.testCRUD()

// 3. 실시간 테스트
supabaseDebug.testRealtime('rules')

// 4. 수동으로 데이터 생성 테스트
await appDebug.createRule('디버그 테스트', '문제 확인용', 1000)
```

---

💡 **Tip**: 모든 명령어는 브라우저 개발자 도구의 Console 탭에서 실행하세요!