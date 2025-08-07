# Vercel 환경변수 설정 가이드 🚀

## ⚠️ 중요: Production 환경 설정 필수!

현재 환경변수가 Preview 환경에만 설정되어 있어 joanddo.com (Production)에서 작동하지 않습니다.

## 1. Vercel 대시보드 접속
1. https://vercel.com/dashboard 에 접속
2. 프로젝트 `couple-fine-webapp` 선택

## 2. 환경변수 설정 (Production 환경 필수!)
1. **Settings** 탭 클릭
2. **Environment Variables** 메뉴 선택
3. 다음 환경변수들을 추가:

### 필수 환경변수

```bash
# Supabase 설정
VITE_SUPABASE_URL=https://wfbrlxlcpvbnwdvopejq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYnJseGxjcHZibndkdm9wZWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0OTQ5NzQsImV4cCI6MjA1MTA3MDk3NH0.mBxKdg1Mh7dKx5-VXvT_v3r7vUNzlb2AvKL93NQzKHA
```

### 🔴 중요: 환경 선택
각 환경변수 추가 시:
1. Key와 Value 입력 후
2. **"Environment"** 섹션에서 반드시 체크:
   - ✅ **Production** (joanddo.com에서 사용)
   - ✅ **Preview** (프리뷰 배포에서 사용)  
   - ✅ **Development** (개발 환경용)
3. **"Save"** 버튼 클릭

## 3. 기존 환경변수 수정 방법
만약 이미 환경변수가 있지만 Preview에만 설정되어 있다면:
1. 각 환경변수 옆의 **"Edit"** 버튼 클릭
2. **"Production"** 체크박스 추가 선택
3. **"Save"** 버튼 클릭
4. 모든 환경변수에 대해 반복

## 4. 배포 재시작 (필수!)
환경변수 수정 후 반드시 재배포:
1. **Deployments** 탭으로 이동
2. 최신 배포 옆의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. **"Use existing Build Cache"** 체크 해제 (환경변수 변경 시)
5. **"Redeploy"** 버튼 클릭

## 5. 확인 방법
배포 완료 후 https://joanddo.com 에 접속하여:
1. 브라우저 개발자 도구 → Console 열기
2. Supabase 연결 에러가 없는지 확인
3. 로그인, 규칙 추가, 벌금 기록 등 CRUD 기능 테스트

### 테스트 체크리스트:
- [ ] 로그인 (이메일 매직링크) 작동
- [ ] 새 규칙 추가 및 저장
- [ ] 벌금 기록 추가
- [ ] 보상 목표 설정
- [ ] 실시간 데이터 동기화

## 🚨 주의사항
- VITE_ 접두사가 있는 변수만 클라이언트에서 접근 가능
- 환경변수 변경 후 반드시 재배포 필요
- Supabase 키는 anon key이므로 공개되어도 안전함 (RLS로 보호됨)
- **Production 환경 체크박스를 반드시 선택해야 joanddo.com에서 작동함**

---
*마지막 업데이트: 2025-08-07*