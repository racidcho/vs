# 🧪 로컬 테스트 환경 가이드

## 📋 두 가지 테스트 방법

### 방법 1: Supabase 로컬 환경 (Docker 필요)

#### 사전 요구사항
- Docker Desktop 설치 및 실행
- Node.js 18+ 

#### 설정 방법
```bash
# 1. Docker Desktop 실행 확인
docker --version

# 2. Supabase 로컬 시작
cd couple-fine-webapp
npx supabase start

# 3. 로컬 환경 정보 확인
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323 (DB 관리 UI)
# Inbucket URL: http://localhost:54324 (이메일 테스트)
# anon key와 service_role key가 출력됨

# 4. 환경변수 설정 (.env.local)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=[출력된 anon key]

# 5. 개발 서버 실행
npm run dev
```

#### 테스트 사용자 생성
```sql
-- Supabase Studio (http://localhost:54323) SQL Editor에서 실행
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES 
  ('test1@example.com', crypt('testpassword', gen_salt('bf')), now()),
  ('test2@example.com', crypt('testpassword', gen_salt('bf')), now());
```

### 방법 2: TestApp 환경 (Docker 불필요) ⭐ 추천

이미 구현된 테스트 환경으로 실시간 동기화 테스트가 가능합니다.

#### 사용 방법
```bash
# 1. 개발 서버 실행
cd couple-fine-webapp
npm run dev

# 2. 브라우저에서 테스트 페이지 접속
http://localhost:5173/test
```

#### 테스트 계정
- **사용자 A**: ABC@NAVER.COM / password123
- **사용자 B**: DDD@GMAIL.COM / password456

#### 테스트 기능
- ✅ 실시간 동기화 (BroadcastChannel)
- ✅ 규칙 생성/수정/삭제
- ✅ 벌금 기록
- ✅ 보상 관리
- ✅ 커플 간 데이터 공유
- ✅ 로컬 저장소 영속성

#### 테스트 시나리오
1. **두 개의 브라우저 탭 열기**
   - 탭 1: ABC@NAVER.COM 로그인
   - 탭 2: DDD@GMAIL.COM 로그인

2. **실시간 동기화 테스트**
   - 탭 1에서 규칙 생성
   - 탭 2에서 즉시 반영 확인

3. **CRUD 테스트**
   - 규칙 생성/수정/삭제
   - 벌금 추가/차감
   - 보상 설정/달성

## 🔍 비교표

| 항목 | Supabase 로컬 | TestApp |
|------|--------------|---------|
| Docker 필요 | ✅ 필수 | ❌ 불필요 |
| 설정 복잡도 | 높음 | 낮음 |
| 실제 DB 사용 | ✅ PostgreSQL | ❌ LocalStorage |
| 실시간 동기화 | ✅ WebSocket | ✅ BroadcastChannel |
| 이메일 인증 | ✅ Inbucket | ❌ Mock Auth |
| 프로덕션 유사도 | 100% | 70% |
| 빠른 테스트 | ❌ | ✅ |

## 💡 추천 사용 시나리오

### TestApp 사용 (빠른 테스트)
- UI/UX 개발
- 실시간 동기화 테스트
- 빠른 기능 검증
- Docker 설치 불가능한 환경

### Supabase 로컬 사용 (정밀 테스트)
- RLS 정책 테스트
- 데이터베이스 마이그레이션
- 프로덕션 배포 전 최종 검증
- 실제 SQL 쿼리 테스트

## 🚀 빠른 시작

**Docker 없이 바로 테스트하려면:**
```bash
npm run dev
# 브라우저에서 http://localhost:5173/test 접속
```

**Docker가 있다면:**
```bash
# Docker Desktop 실행 후
npx supabase start
npm run dev
```

---

*최종 업데이트: 2025-08-09*