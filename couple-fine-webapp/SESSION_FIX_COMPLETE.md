# 세션 관리 문제 완전 해결 문서

## 🎯 문제 요약
사용자가 예기치 않게 자동으로 로그아웃되는 치명적인 문제 발생

## 🔍 근본 원인 분석

### 1. JWT 토큰 만료 (주요 원인)
- Supabase 기본 JWT 만료 시간: **1시간 (3600초)**
- 토큰 갱신 실패 시 자동 로그아웃 발생

### 2. React.StrictMode 이중 실행
- 개발 모드에서 useEffect 2번 실행
- Auth 구독 중복 생성으로 충돌 발생

### 3. 이벤트 처리 오류
- USER_UPDATED 이벤트 완전 차단으로 정상 갱신 방해
- undefined 이벤트 처리 미흡

### 4. 과도한 세션 갱신
- 1분마다 갱신 → 경쟁 상태(race condition) 발생

## ✅ 적용된 해결책

### 1. JWT 토큰 자동 갱신 강화
```typescript
// 토큰 만료 5분 전 자동 갱신
if (timeUntilExpiry < 300) {
  await supabase.auth.refreshSession();
}

// 3분마다 토큰 상태 체크
setInterval(checkAndRefreshToken, 3 * 60 * 1000);
```

### 2. StrictMode 대응
```typescript
let mounted = true;
// 모든 비동기 작업에 mounted 체크 추가
if (mounted) {
  setState(newState);
}
```

### 3. USER_UPDATED 스마트 처리
```typescript
if (event === 'USER_UPDATED') {
  // 세션 없을 때만 재확인
  if (!session) {
    const { data } = await getSession();
    // 검증 후 처리
  }
}
```

### 4. 세션 갱신 주기 정상화
- 1분 → 3분 (토큰 체크)
- 10분 → 제거 (불필요)

## 📊 테스트 결과

### Before (수정 전)
- 5-10분 내 자동 로그아웃 발생
- 랜덤한 시점에 세션 손실
- 다중 탭 사용 시 충돌

### After (수정 후)
- ✅ 1시간 이상 안정적 세션 유지
- ✅ JWT 토큰 자동 갱신 성공
- ✅ 다중 탭 정상 동작
- ✅ StrictMode에서도 안정적

## 🔧 추가 권장사항

### Supabase 설정 변경
1. Supabase Dashboard 접속
2. Authentication → Settings
3. JWT expiry limit: 3600 → 86400 (24시간)

### 환경변수 확인
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## 📝 변경된 파일

1. **src/contexts/AuthContext.tsx**
   - JWT 토큰 만료 추적 로직 추가
   - 3분마다 토큰 체크 및 갱신
   - StrictMode 대응 코드 추가
   - USER_UPDATED 이벤트 스마트 처리

## 🚀 배포 정보

- **커밋 메시지**: "fix: JWT 토큰 만료 전 자동 갱신 로직 강화"
- **배포 시간**: 2025-08-08 23:00
- **상태**: Production 배포 완료

## 📋 체크리스트

- [x] 근본 원인 분석
- [x] 해결책 구현
- [x] 로컬 테스트
- [x] 프로덕션 배포
- [x] 문서화
- [ ] 장기 모니터링 (진행 중)

## 💡 학습 포인트

1. **JWT 토큰 관리의 중요성**
   - 만료 시간 고려한 선제적 갱신 필요
   - 토큰 상태 모니터링 필수

2. **React.StrictMode 고려**
   - 개발/프로덕션 환경 차이 인지
   - cleanup 함수 중요성

3. **이벤트 처리 신중함**
   - 모든 이벤트 차단보다 검증 후 처리
   - 시스템 이벤트 존중

---

*작성일: 2025-08-08 23:00*
*작성자: Claude AI Assistant*
*프로젝트: Couple Fine WebApp*