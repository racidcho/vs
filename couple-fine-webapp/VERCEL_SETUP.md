# Vercel 배포 설정 가이드 🚀

## 현재 상태
- ✅ 도메인 구매 완료: **joanddo.com**
- ✅ DNS 설정 완료
- ✅ 구글 계정으로 로그인 완료
- ⏳ CLI 인증 대기 중

## CLI에서 로그인 완료 후 실행할 명령어

### 1. 프로젝트 연결
```bash
cd couple-fine-webapp
vercel link
```

프롬프트에 답변:
- Set up and deploy? **Yes**
- Which scope? **본인 계정 선택**
- Link to existing project? **No** (새 프로젝트 생성)
- Project name? **couple-fine-webapp** (또는 원하는 이름)
- In which directory is your code? **./** (현재 디렉토리)

### 2. 환경 변수 설정

#### 방법 1: CLI에서 설정
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

#### 방법 2: Vercel Dashboard에서 설정
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수 추가:
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon 키

### 3. 도메인 연결
```bash
vercel domains add joanddo.com
```

또는 Dashboard에서:
1. Settings → Domains
2. joanddo.com 추가
3. 이미 설정된 DNS 레코드 확인

### 4. 첫 배포 실행

#### 프리뷰 배포 (테스트)
```bash
vercel
```

#### 프로덕션 배포
```bash
vercel --prod
```

## 배포 성공 후 확인사항

### 접속 테스트
- [ ] https://joanddo.com 접속 확인
- [ ] 모바일 브라우저 테스트
- [ ] PWA 설치 테스트

### 기능 테스트
- [ ] 로그인 (테스트 모드)
- [ ] 페이지 네비게이션
- [ ] 반응형 디자인

## 자주 사용하는 명령어

```bash
# 배포 상태 확인
vercel ls

# 로그 확인
vercel logs

# 환경 변수 목록
vercel env ls

# 프로덕션 배포
vercel --prod

# 특정 브랜치 배포
vercel --prod --scope=your-team
```

## 트러블슈팅

### "No existing credentials found" 에러
```bash
vercel login
# Google 선택 후 브라우저에서 인증
```

### 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build
```

### 환경 변수 미적용
- Dashboard에서 재배포 트리거
- 또는 `vercel --prod --force`

## GitHub 자동 배포 설정

Vercel Dashboard에서:
1. Settings → Git
2. GitHub 저장소 연결 (racidcho/vs)
3. Branch 설정:
   - Production: main
   - Preview: 모든 PR

## 유용한 링크

- [Vercel Dashboard](https://vercel.com/dashboard)
- [프로젝트 설정](https://vercel.com/[your-username]/couple-fine-webapp/settings)
- [도메인 관리](https://vercel.com/[your-username]/couple-fine-webapp/settings/domains)
- [환경 변수](https://vercel.com/[your-username]/couple-fine-webapp/settings/environment-variables)

---

*작성일: 2025-08-07*