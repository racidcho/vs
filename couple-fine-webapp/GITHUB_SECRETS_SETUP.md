# GitHub Secrets 설정 가이드

## 🔐 GitHub Repository에 Secrets 추가하기

### 1단계: GitHub Repository 접속
1. https://github.com/racidcho/vs 접속
2. 상단 메뉴에서 **Settings** 클릭

### 2단계: Secrets 설정
1. 왼쪽 사이드바에서 **Secrets and variables** → **Actions** 클릭
2. **New repository secret** 버튼 클릭

### 3단계: 환경변수 추가
다음 Secret들을 추가하세요:

#### VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://wfbrlxlcpvbnwdvopejq.supabase.co`

#### VITE_SUPABASE_ANON_KEY  
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYnJseGxjcHZibndkdm9wZWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0OTQ5NzQsImV4cCI6MjA1MTA3MDk3NH0.mBxKdg1Mh7dKx5-VXvT_v3r7vUNzlb2AvKL93NQzKHA`

#### VERCEL_TOKEN (선택사항 - 자동 배포용)
- **Name**: `VERCEL_TOKEN`
- **Value**: Vercel 대시보드에서 생성한 토큰
- 생성 방법: Vercel Dashboard → Settings → Tokens → Create

## 🎯 왜 GitHub Secrets를 사용하나요?

1. **보안**: 민감한 정보가 코드에 노출되지 않음
2. **환경 분리**: Production과 Development 환경을 안전하게 분리
3. **자동화**: GitHub Actions와 연동하여 자동 배포 시 환경변수 주입
4. **버전 관리**: Secret 값 변경 시 코드 수정 없이 업데이트 가능

## ✅ 설정 확인
Settings → Secrets and variables → Actions에서 다음이 표시되어야 합니다:
- VITE_SUPABASE_URL (Repository secret)
- VITE_SUPABASE_ANON_KEY (Repository secret)

## 🚀 다음 단계
GitHub Actions 워크플로우가 이 Secrets를 사용하여 빌드 시 환경변수를 주입합니다.