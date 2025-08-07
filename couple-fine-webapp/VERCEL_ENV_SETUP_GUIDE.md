# Vercel 환경변수 설정 가이드

Production 환경에서 Supabase 연결이 안 되는 문제 해결을 위한 가이드입니다.

## 🚨 문제점

현재 상황:
- GitHub Actions에서 빌드 시에만 환경변수 주입
- Vercel에서 재빌드 시 환경변수 손실
- Production에서 Supabase 연결 실패

## 🛠 해결방법 1: GitHub Actions 수정 (현재 적용됨)

`.github/workflows/deploy.yml`에서 Vercel 빌드 전에 `.env.production` 파일 생성:

```yaml
- name: Deploy to Vercel (Production)
  run: |
    npm i -g vercel
    vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
    
    # Set environment variables for build
    echo "VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}" > .env.production
    echo "VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}" >> .env.production
    
    vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
    vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🛠 해결방법 2: Vercel 대시보드 수동 설정 (백업)

만약 방법 1이 실패하면:

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. `couple-fine-webapp` 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수들 추가:

### Production Environment Variables

```
VITE_SUPABASE_URL = https://wfbrlxlcpvbnwdvopejq.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYnJseGxjcHZibndkdm9wZWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0OTQ5NzQsImV4cCI6MjA1MTA3MDk3NH0.mBxKdg1Mh7dKx5-VXvT_v3r7vUNzlb2AvKL93NQzKHA
```

**Environment**: Production ✅

5. Save 후 프로젝트 Redeploy

## 🔍 테스트 방법

배포 완료 후 브라우저에서 다음 JavaScript 코드로 테스트:

```javascript
console.log('환경변수 체크:', {
  hasSupabaseUrl: !!import.meta?.env?.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta?.env?.VITE_SUPABASE_ANON_KEY
});

// Supabase 연결 테스트
fetch('https://wfbrlxlcpvbnwdvopejq.supabase.co/rest/v1/', {
  headers: { 'apikey': 'eyJhbG...' }
}).then(r => console.log('Supabase 연결:', r.status));
```

## ✅ 성공 확인

- [ ] 로그인 페이지에서 실제 매직링크 전송
- [ ] 대시보드에서 실제 데이터 로드
- [ ] CRUD 기능 정상 작동
- [ ] 실시간 동기화 작동

---

*마지막 업데이트: 2025-08-07*