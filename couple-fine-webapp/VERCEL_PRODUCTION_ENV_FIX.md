# 🚨 긴급: Vercel Production 환경변수 설정 가이드

## 현재 문제
- **환경변수가 Preview 환경에만 설정되어 있음**
- **joanddo.com (Production)에서 CRUD 기능이 작동하지 않음**
- **Supabase 연결 실패로 인한 기능 마비**

## 즉시 해결 방법

### 방법 1: Vercel 대시보드에서 직접 설정 (권장) ⭐

1. **Vercel 대시보드 접속**
   - https://vercel.com/racidcho-1617s-projects/couple-fine-webapp/settings/environment-variables

2. **각 환경변수 수정**
   
   **VITE_SUPABASE_URL 수정:**
   - Edit 버튼 클릭
   - Environment 섹션에서 체크:
     - ✅ **Production** (필수!)
     - ✅ Preview
     - ✅ Development
   - Save 클릭

   **VITE_SUPABASE_ANON_KEY 수정:**
   - Edit 버튼 클릭
   - Environment 섹션에서 체크:
     - ✅ **Production** (필수!)
     - ✅ Preview
     - ✅ Development
   - Save 클릭

3. **재배포 트리거**
   - Deployments 탭 이동
   - 최신 배포의 "..." 메뉴 → Redeploy
   - "Use existing Build Cache" 체크 해제
   - Redeploy 클릭

### 방법 2: Vercel CLI 사용 (토큰 필요)

1. **Vercel 토큰 생성**
   - https://vercel.com/account/tokens
   - "Create Token" 클릭
   - 토큰 복사

2. **환경변수 설정**
   ```bash
   cd couple-fine-webapp
   
   # 토큰으로 인증
   vercel login --token YOUR_TOKEN
   
   # Production 환경변수 설정
   vercel env add VITE_SUPABASE_URL production
   # 값 입력: https://wfbrlxlcpvbnwdvopejq.supabase.co
   
   vercel env add VITE_SUPABASE_ANON_KEY production
   # 값 입력: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYnJseGxjcHZibndkdm9wZWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0OTQ5NzQsImV4cCI6MjA1MTA3MDk3NH0.mBxKdg1Mh7dKx5-VXvT_v3r7vUNzlb2AvKL93NQzKHA
   
   # 재배포
   vercel --prod
   ```

## 확인 방법

1. **joanddo.com 접속**
2. **개발자 도구 → Console 열기**
3. **에러 메시지 확인**
   - Supabase 연결 에러가 없어야 함
   - "Missing environment variable" 에러가 없어야 함

4. **기능 테스트**
   - 로그인 (이메일 매직링크)
   - 새 규칙 추가
   - 벌금 기록
   - 보상 설정

## 환경변수 값

```bash
VITE_SUPABASE_URL=https://wfbrlxlcpvbnwdvopejq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYnJseGxjcHZibndkdm9wZWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0OTQ5NzQsImV4cCI6MjA1MTA3MDk3NH0.mBxKdg1Mh7dKx5-VXvT_v3r7vUNzlb2AvKL93NQzKHA
```

## 주의사항

⚠️ **Production 환경 체크박스를 반드시 선택해야 함**
⚠️ **환경변수 변경 후 반드시 재배포 필요**
⚠️ **캐시 사용 시 환경변수가 적용되지 않을 수 있음**

## 문제 지속 시

1. **Vercel Support**: https://vercel.com/support
2. **환경변수 확인**: Build Logs에서 환경변수 로드 확인
3. **Supabase 대시보드**: API 키가 올바른지 확인

---
*작성일: 2025-08-07*
*긴급도: 🔴 HIGH - 프로덕션 서비스 장애*