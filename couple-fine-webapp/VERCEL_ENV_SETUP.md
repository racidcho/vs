# Vercel 환경변수 설정 가이드 🚀

## 1. Vercel 대시보드 접속
1. https://vercel.com/dashboard 에 접속
2. 프로젝트 `couple-fine-webapp` 선택

## 2. 환경변수 설정
1. **Settings** 탭 클릭
2. **Environment Variables** 메뉴 선택
3. 다음 환경변수들을 추가:

### 필수 환경변수

```bash
# Supabase 설정
VITE_SUPABASE_URL=https://wfbrlxlcpvbnwdvopejq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYnJseGxjcHZibndkdm9wZWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwNzQzMDMsImV4cCI6MjAzODY1MDMwM30.k3JiCMmn2wDH8sJXtKJJgJE3f2rYQHfOLSMk8xZzYXE

# 앱 설정
VITE_APP_NAME=Couple Fine
VITE_APP_VERSION=1.0.0
```

## 3. 환경별 설정
- **Production**: 위의 모든 변수 추가
- **Preview**: 위의 모든 변수 추가 
- **Development**: 위의 모든 변수 추가

## 4. 배포 트리거
환경변수 추가 후 자동으로 재배포가 시작됩니다.

## 5. 확인 방법
배포 완료 후 https://joanddo.com 에 접속하여:
1. "🔍 DB테스트" 버튼 클릭
2. 모든 테스트 항목이 ✅ 표시되는지 확인

## 🚨 주의사항
- VITE_ 접두사가 있는 변수만 클라이언트에서 접근 가능
- 환경변수 변경 후 반드시 재배포 필요
- Supabase 키는 anon key이므로 공개되어도 안전함 (RLS로 보호됨)

---
*마지막 업데이트: 2025-08-07*