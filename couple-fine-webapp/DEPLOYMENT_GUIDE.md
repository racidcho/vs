# 배포 가이드 🚀

> **우리 벌금통 완전 배포 가이드**  
> Supabase 설정부터 Vercel 배포까지 단계별 완전 가이드

## 📋 목차

1. [개요](#개요)
2. [Supabase 설정](#supabase-설정)
3. [로컬 개발 환경](#로컬-개발-환경)
4. [환경 변수 설정](#환경-변수-설정)
5. [Vercel 배포](#vercel-배포)
6. [도메인 연결](#도메인-연결)
7. [배포 후 검증](#배포-후-검증)
8. [문제 해결](#문제-해결)

---

## 🎯 개요

**우리 벌금통**은 완전히 클라우드 기반으로 운영되는 PWA입니다.

### 아키텍처 구성
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (글로벌 CDN + 서버리스)
- **Domain**: 커스텀 도메인 지원

### 배포 시간
- **전체 소요 시간**: 약 30분
- **Supabase 설정**: 15분
- **Vercel 배포**: 10분
- **도메인 연결**: 5분

---

## 🗄️ Supabase 설정

### 1단계: Supabase 프로젝트 생성

#### 1.1 계정 생성 및 프로젝트 설정
```bash
# 1. https://supabase.com 접속
# 2. "Start your project" 클릭
# 3. GitHub 계정으로 로그인
# 4. "New project" 클릭
# 5. 프로젝트 정보 입력:
#    - Name: couple-fine-app
#    - Database Password: 안전한 비밀번호 생성
#    - Region: Northeast Asia (ap-northeast-1) - 한국 최적화
```

#### 1.2 프로젝트 URL 및 키 확인
```bash
# Settings → API 메뉴에서 확인:
# - Project URL: https://xxxxx.supabase.co
# - anon (public) key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - service_role (secret) key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2단계: 데이터베이스 스키마 설정

#### 2.1 SQL Editor에서 스키마 실행
```sql
-- SQL Editor → New query → 아래 스키마 복사하여 실행

-- 1. 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  pin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 커플 테이블
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_fine_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 규칙 테이블
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  fine_amount DECIMAL(8,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 벌금 기록 테이블
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES rules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(8,2) NOT NULL,
  type TEXT DEFAULT 'fine',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 보상 테이블
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(8,2) NOT NULL,
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 활동 로그 테이블
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2 RLS (Row Level Security) 정책 설정
```sql
-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 프로필 정책
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
  
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 커플 정책
CREATE POLICY "Couple members can view couple" ON couples
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
  
CREATE POLICY "Couple members can update couple" ON couples
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
  
CREATE POLICY "Users can create couple" ON couples
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

-- 다른 테이블들 공통 정책
CREATE POLICY "Couple members can access rules" ON rules
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE auth.uid() = user1_id OR auth.uid() = user2_id
    )
  );

CREATE POLICY "Couple members can access violations" ON violations
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE auth.uid() = user1_id OR auth.uid() = user2_id
    )
  );

CREATE POLICY "Couple members can access rewards" ON rewards
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE auth.uid() = user1_id OR auth.uid() = user2_id
    )
  );

CREATE POLICY "Couple members can access activity_logs" ON activity_logs
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE auth.uid() = user1_id OR auth.uid() = user2_id
    )
  );
```

#### 2.3 트리거 함수 설정 (자동 업데이트)
```sql
-- 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 커플 잔액 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_couple_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE couples 
    SET total_fine_amount = total_fine_amount + 
      CASE WHEN NEW.type = 'fine' THEN NEW.amount 
           ELSE -NEW.amount END
    WHERE id = NEW.couple_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE couples 
    SET total_fine_amount = total_fine_amount - 
      CASE WHEN OLD.type = 'fine' THEN OLD.amount 
           ELSE -OLD.amount END
    WHERE id = OLD.couple_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 잔액 업데이트 트리거
CREATE TRIGGER update_couple_balance_trigger
  AFTER INSERT OR DELETE ON violations
  FOR EACH ROW EXECUTE FUNCTION update_couple_balance();
```

### 3단계: 실시간 구독 활성화

#### 3.1 Realtime 설정
```bash
# 1. Database → Replication 메뉴 이동
# 2. 아래 테이블들 체크하여 실시간 활성화:
#    - profiles ✅
#    - couples ✅  
#    - rules ✅
#    - violations ✅
#    - rewards ✅
#    - activity_logs ✅
```

#### 3.2 실시간 정책 설정
```sql
-- 실시간 구독 권한 설정 (SQL Editor에서 실행)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Realtime publication 생성
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE couples;
ALTER PUBLICATION supabase_realtime ADD TABLE rules;
ALTER PUBLICATION supabase_realtime ADD TABLE violations;
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
```

---

## 💻 로컬 개발 환경

### 1단계: 프로젝트 클론 및 설정
```bash
# 저장소 복제
git clone https://github.com/racidcho/vs.git
cd couple-fine-webapp

# 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env
```

### 2단계: 개발 서버 실행
```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
# http://localhost:5173
```

### 3단계: 빌드 테스트
```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

---

## ⚙️ 환경 변수 설정

### 로컬 개발용 (.env)
```bash
# .env 파일 생성 및 설정
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 예시:
# VITE_SUPABASE_URL=https://abcdefgh12345678.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdX...
```

### 프로덕션용 (Vercel 환경 변수)
```bash
# Vercel Dashboard에서 설정할 변수들:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

---

## ☁️ Vercel 배포

### 1단계: Vercel 계정 설정

#### 1.1 Vercel CLI 설치
```bash
# Vercel CLI 전역 설치
npm install -g vercel

# Vercel 로그인
vercel login
# GitHub 계정으로 로그인
```

#### 1.2 프로젝트 초기 배포
```bash
# 프로젝트 루트에서 실행
vercel

# 설정 질문에 답변:
# ? Set up and deploy "~/couple-fine-webapp"? [Y/n] Y
# ? Which scope do you want to deploy to? [개인 계정 선택]
# ? What's your project's name? couple-fine-webapp
# ? In which directory is your code located? ./
# ? Want to modify these settings? [y/N] N
```

### 2단계: 환경 변수 설정

#### 2.1 Vercel Dashboard에서 설정
```bash
# 1. https://vercel.com/dashboard 접속
# 2. couple-fine-webapp 프로젝트 선택
# 3. Settings → Environment Variables
# 4. 다음 변수들 추가:

# Production, Preview, Development 모두 체크하여 추가:
# Name: VITE_SUPABASE_URL
# Value: https://your-project-id.supabase.co

# Name: VITE_SUPABASE_ANON_KEY  
# Value: your-anon-key
```

#### 2.2 CLI로 환경 변수 설정 (선택사항)
```bash
# CLI로 환경 변수 추가
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### 3단계: 배포 설정 파일 확인

#### 3.1 vercel.json 확인
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### 4단계: 재배포 및 확인
```bash
# 환경 변수 설정 후 재배포
vercel --prod

# 배포 상태 확인
vercel ls

# 배포 로그 확인
vercel logs
```

---

## 🌐 도메인 연결

### 1단계: 도메인 구매 (선택사항)

#### 1.1 Vercel에서 도메인 구매
```bash
# Vercel Dashboard에서:
# 1. 프로젝트 → Settings → Domains
# 2. "Add Domain" 클릭
# 3. 원하는 도메인명 입력 (예: joanddo.com)
# 4. 결제 및 구매 완료
```

#### 1.2 외부 도메인 연결
```bash
# 외부에서 구매한 도메인 연결:
# 1. Vercel Dashboard → Settings → Domains
# 2. "Add Domain" → 도메인명 입력
# 3. DNS 설정:
#    - Type: CNAME
#    - Name: www (또는 @)
#    - Value: cname.vercel-dns.com
```

### 2단계: DNS 설정 확인
```bash
# DNS 전파 상태 확인 (터미널에서)
nslookup your-domain.com

# 또는 온라인 도구 사용:
# https://www.whatsmydns.net/
```

### 3단계: HTTPS 인증서 자동 설정
```bash
# Vercel에서 자동으로 처리:
# - Let's Encrypt SSL 인증서 자동 발급
# - HTTPS 자동 리디렉션
# - 인증서 자동 갱신
```

---

## ✅ 배포 후 검증

### 1단계: 기능 테스트 체크리스트

#### 1.1 인증 시스템 테스트
```bash
✅ 매직 링크 로그인 작동
✅ 이메일 전송 확인
✅ 로그인 후 리디렉션
✅ 로그아웃 기능
✅ 세션 유지 확인
```

#### 1.2 커플 시스템 테스트
```bash
✅ 새 커플 생성
✅ 6자리 코드 생성
✅ 코드로 커플 연결
✅ 커플 정보 실시간 동기화
```

#### 1.3 핵심 기능 테스트
```bash
✅ 규칙 추가/수정/삭제
✅ 벌금 기록 추가
✅ 보상 설정 및 달성
✅ 실시간 데이터 동기화
✅ 활동 피드 업데이트
```

#### 1.4 보안 기능 테스트
```bash
✅ PIN 설정 및 잠금
✅ 자동 잠금 타이머
✅ 데이터 접근 권한
✅ RLS 정책 적용
```

### 2단계: 성능 검증

#### 2.1 Lighthouse 점수 확인
```bash
# Chrome DevTools → Lighthouse 실행
# 목표 점수:
# - Performance: 90+ 점
# - Accessibility: 95+ 점  
# - Best Practices: 100 점
# - SEO: 90+ 점
# - PWA: 100 점
```

#### 2.2 로딩 시간 측정
```bash
# 목표 성능:
# - First Contentful Paint: < 1.5초
# - Largest Contentful Paint: < 2.5초  
# - First Input Delay: < 100ms
# - Cumulative Layout Shift: < 0.1
```

### 3단계: 브라우저 호환성 테스트
```bash
✅ Chrome (데스크톱/모바일)
✅ Safari (데스크톱/모바일)
✅ Firefox (데스크톱/모바일)
✅ Edge (데스크톱)
✅ Samsung Internet (모바일)
```

---

## 🔧 문제 해결

### 일반적인 배포 이슈

#### 1. 빌드 실패
```bash
# 문제: TypeScript 오류
# 해결: 타입 오류 수정
npm run type-check

# 문제: 의존성 오류
# 해결: package-lock.json 삭제 후 재설치
rm package-lock.json node_modules -rf
npm install
```

#### 2. 환경 변수 오류
```bash
# 문제: Supabase 연결 실패
# 해결 1: 환경 변수 확인
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# 해결 2: Vercel 환경 변수 재설정
vercel env ls
vercel env rm VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_URL
```

#### 3. 실시간 기능 오류
```bash
# 문제: 실시간 구독 실패
# 해결: Supabase Realtime 설정 확인
# 1. Database → Replication 활성화
# 2. RLS 정책 확인
# 3. 실시간 권한 설정 확인
```

#### 4. 도메인 연결 이슈
```bash
# 문제: DNS 전파 지연
# 해결: 24시간 대기 후 재확인

# 문제: SSL 인증서 오류  
# 해결: Vercel에서 자동 재발급 대기
```

### 디버깅 도구

#### 1. Vercel 로그 확인
```bash
# 빌드 로그 확인
vercel logs --follow

# 함수 로그 확인 (서버리스 함수 사용 시)
vercel logs --function=api
```

#### 2. Supabase 로그 확인
```bash
# Supabase Dashboard → Logs
# - Auth logs: 인증 관련
# - Database logs: DB 쿼리 관련  
# - Realtime logs: 실시간 구독 관련
```

#### 3. 브라우저 개발자 도구
```bash
# Console 탭: JavaScript 오류
# Network 탭: API 요청 상태
# Application 탭: 로컬 스토리지, 세션
```

### 성능 최적화

#### 1. 번들 크기 최적화
```bash
# 번들 분석
npm run build
npx vite-bundle-analyzer dist

# 불필요한 의존성 제거
npm uninstall unused-package
```

#### 2. 이미지 최적화
```bash
# 이미지 압축 도구 사용
# https://tinypng.com/
# https://squoosh.app/
```

#### 3. 캐시 전략
```bash
# vercel.json에서 헤더 설정
# - 정적 자산: 1년 캐시
# - HTML: 캐시 없음
# - Service Worker: 캐시 없음
```

---

## 📊 모니터링 설정

### 1. Vercel Analytics
```bash
# Vercel Dashboard → Analytics
# - 페이지 뷰 추적
# - 사용자 세션 분석
# - Core Web Vitals 모니터링
```

### 2. Supabase 모니터링  
```bash
# Supabase Dashboard → Settings → API
# - API 사용량 모니터링
# - 데이터베이스 사용량 추적
# - 실시간 연결 수 확인
```

### 3. 오류 추적 (선택사항)
```bash
# Sentry 설치 (선택사항)
npm install @sentry/react @sentry/tracing

# 환경 변수 추가
VITE_SENTRY_DSN=your-sentry-dsn
```

---

## 🎉 배포 완료 체크리스트

### 최종 확인 사항
```bash
✅ Supabase 데이터베이스 설정 완료
✅ 모든 테이블 및 정책 생성됨
✅ 실시간 구독 활성화됨
✅ 환경 변수 정확히 설정됨
✅ Vercel 배포 성공
✅ 도메인 연결 완료 (선택사항)
✅ HTTPS 인증서 적용됨
✅ 모든 기능 정상 작동
✅ 성능 목표 달성
✅ 모니터링 설정 완료
```

### 배포 후 작업
```bash
1. 🎯 사용자 테스트 진행
2. 📊 성능 모니터링 시작  
3. 🔄 정기적인 백업 확인
4. 📈 사용량 분석 시작
5. 🛡️ 보안 상태 점검
```

---

## 🔗 유용한 링크

### 공식 문서
- [Supabase 문서](https://supabase.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [React 문서](https://react.dev)
- [Vite 문서](https://vitejs.dev)

### 도구 및 서비스
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Repository](https://github.com/racidcho/vs)

### 문제 해결
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase+vercel)

---

**🎉 축하합니다! 우리 벌금통이 성공적으로 배포되었습니다!**

이제 전 세계 어디서나 안전하고 빠르게 서비스를 이용할 수 있습니다. 💕

*배포 가이드 마지막 업데이트: 2025-08-07*  
*완성된 우리 벌금통 배포 완료!* ✨