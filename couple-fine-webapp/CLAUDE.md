# CLAUDE.md - Couple Fine WebApp 운영 가이드 🤖

> 이 문서는 Couple Fine WebApp 프로젝트에서 작업할 미래의 Claude 인스턴스를 위한 운영 가이드입니다.

## 🎯 프로젝트 개요

**우리 벌금통 (Couple Fine WebApp)**은 커플들이 일상의 약속을 재미있게 관리할 수 있는 웹 애플리케이션입니다.

### 핵심 컨셉
- 💑 커플 간 약속/규칙 관리
- 💰 벌금 시스템으로 재미있게 책임감 부여
- 🎁 모인 벌금으로 함께 즐길 보상 설정
- 📱 모바일 중심의 PWA 앱

## 🛠 기술 스택

```yaml
Frontend:
  - React: 18.3.1 (TypeScript)
  - Vite: 7.0.6 (빌드 도구)
  - TypeScript: 5.6.2
  - Tailwind CSS: 4.0.0 (@tailwindcss/postcss)
  - React Router: 6.29.2
  
Backend:
  - Supabase: PostgreSQL + Auth + Realtime
  - 현재 상태: 테스트 모드 (mock 데이터 사용)

State Management:
  - React Context API (AuthContext, AppContext)
  - useReducer 패턴 사용
```

## 📁 프로젝트 구조

```
couple-fine-webapp/
├── src/
│   ├── components/     # 재사용 가능한 UI 컴포넌트
│   │   ├── auth/       # 인증 관련 컴포넌트
│   │   └── layout/     # 레이아웃 컴포넌트 (Header, MobileNav)
│   ├── contexts/       # React Context 제공자
│   │   ├── AuthContext.tsx    # 인증 상태 관리
│   │   └── AppContext.tsx     # 앱 전역 상태 관리
│   ├── lib/           # 외부 라이브러리 설정
│   │   └── supabase.ts        # Supabase 클라이언트
│   ├── pages/         # 라우트 페이지 컴포넌트
│   │   ├── Dashboard.tsx      # 홈 화면
│   │   ├── Rules.tsx          # 규칙 관리
│   │   ├── NewViolation.tsx   # 벌금 기록
│   │   ├── Rewards.tsx        # 보상 관리
│   │   ├── Calendar.tsx       # 달력 뷰
│   │   └── Settings.tsx       # 설정
│   ├── types/         # TypeScript 타입 정의
│   └── App.tsx        # 메인 앱 컴포넌트
├── supabase/
│   └── migrations/    # 데이터베이스 마이그레이션
└── public/           # 정적 파일
```

## 🚀 개발 명령어

```bash
# 개발 서버 시작 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# TypeScript 타입 체크
npm run type-check

# 린트 실행 (아직 설정 안됨)
npm run lint
```

## 🌐 배포 정보

### Vercel 배포
- **플랫폼**: Vercel
- **상태**: 배포 준비 완료 (CLI 설치, 설정 파일 생성)
- **도메인**: Vercel에서 구매 완료
- **배포 파일**: `vercel.json`, `.github/workflows/deploy.yml`

### 배포 체크리스트
- [x] TypeScript 빌드 오류 수정
- [x] Vercel CLI 설치
- [x] vercel.json 설정
- [ ] Vercel 로그인 및 프로젝트 연결
- [ ] 환경 변수 설정
- [ ] 커스텀 도메인 연결

## 💡 중요한 개발 정보

### 1. 현재 인증 상태 (테스트 모드)
```typescript
// src/contexts/AuthContext.tsx
// 현재는 아무 이메일이나 입력하면 즉시 로그인되는 테스트 모드
// 실제 구현 시 Supabase Magic Link로 전환 필요
```

### 2. Mock 데이터 사용 중
```typescript
// src/contexts/AppContext.tsx
// mockCouple, mockRules, mockViolations, mockRewards 사용
// 실제 Supabase 연동 시 제거 필요
```

### 3. Tailwind CSS v4 설정
```javascript
// postcss.config.js
// @tailwindcss/postcss 플러그인 사용
// tailwind.config.js에서 커스텀 색상 정의 (primary, coral)
```

### 4. 환경 변수 설정
```bash
# .env 파일 생성 필요 (.env.example 참고)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: 핑크 계열 파스텔톤 (#ec4899)
- **Coral**: 코랄 계열 (#f97316)
- **배경**: 그라데이션 (from-pink-100 to-purple-100)

### UI 특징
- 📱 모바일 우선 디자인
- 🎨 파스텔톤 색상
- ✨ 그라데이션 효과
- 🔄 부드러운 애니메이션
- 😊 이모지 활용
- 📍 하단 네비게이션 바

## 📱 페이지별 기능 현황

### Dashboard (홈)
- ✅ 시간대별 인사말
- ✅ 통계 카드 (2x2 그리드)
- ✅ 빠른 액션 버튼
- ✅ 최근 활동 목록
- ✅ 오늘의 한마디

### Rules (우리들의 약속)
- ✅ 규칙 목록 표시
- ⏳ 규칙 추가/수정/삭제 (UI만)
- ✅ 활성/비활성 상태 표시

### NewViolation (벌금 기록하기)
- ✅ 벌금 추가/차감 선택
- ✅ 규칙 선택 드롭다운
- ✅ 금액 입력
- ✅ 메모 기능
- ⏳ 실제 저장 기능

### Rewards (우리의 보상)
- ✅ 현재 모인 벌금 표시
- ✅ 보상 목표 진행률
- ⏳ 보상 추가/달성 기능

### Settings (내 정보 설정)
- ✅ 프로필 편집 UI
- ✅ 커플 정보 표시
- ⏳ PIN 설정 (UI만)
- ✅ 테마 설정 UI
- ✅ 푸시 알림 토글 UI

## 🔧 주요 작업 패턴

### 1. 새 페이지 추가하기
```typescript
1. src/pages/에 컴포넌트 생성
2. App.tsx에 라우트 추가
3. MobileNav.tsx에 네비게이션 아이템 추가
```

### 2. 상태 관리 패턴
```typescript
// AppContext 사용
const { state, dispatch } = useApp();

// 액션 디스패치
dispatch({ type: 'ADD_VIOLATION', payload: violation });
```

### 3. Supabase 데이터 연동 (준비됨)
```typescript
// src/lib/supabase.ts의 헬퍼 사용
import { supabase, Tables } from '../lib/supabase';

// 데이터 가져오기
const { data, error } = await supabase
  .from(Tables.rules)
  .select('*');
```

### 4. 모바일 최적화 체크리스트
- ✅ 터치 타겟 최소 44px
- ✅ 하단 네비게이션 여백 고려
- ✅ 스크롤 최소화
- ✅ 큰 글씨와 명확한 버튼

## ⚠️ 주의사항

1. **테스트 모드**: 현재 모든 데이터는 임시 저장됨
2. **PIN 시스템**: UI만 구현되고 실제 작동 안 함
3. **커플 연결**: 커플 코드 시스템 미구현
4. **환경 변수**: Supabase 연동 시 .env 파일 필수

## 📝 현재 작업 우선순위

1. 🔴 **긴급**: Supabase 실제 연동
2. 🟠 **높음**: 데이터 CRUD 구현
3. 🟡 **중간**: 커플 연결 시스템
4. 🟢 **낮음**: PIN 인증, 푸시 알림

## 🐛 알려진 이슈

1. 데이터가 새로고침 시 초기화됨 (mock 데이터 사용)
2. 커플 코드 입력해도 연결 안 됨
3. PIN 설정이 저장되지 않음
4. 오프라인 동기화 미완성

## 💬 한국어 톤앤매너

- 친근하고 귀여운 말투 사용
- 이모지 적극 활용
- 존댓말보다는 반말체 선호
- 예시: "오늘도 화이팅!" "벌금 기록했어요 💰"

## 🔗 유용한 링크

- [프로젝트 현황](./PROJECT_STATUS.md)
- [개발 로그](./DEVELOPMENT_LOG.md)
- [배포 가이드](./DEPLOYMENT.md)
- [GitHub Repository](https://github.com/racidcho/vs.git)
- [React 문서](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase 문서](https://supabase.com/docs)
- [Vercel 문서](https://vercel.com/docs)

## 💡 팁

1. **빠른 개발**: `npm run dev`로 즉시 시작
2. **모바일 테스트**: Chrome DevTools의 기기 에뮬레이션 사용
3. **상태 디버깅**: React DevTools Extension 설치 권장
4. **타입 안전성**: TypeScript 타입 적극 활용

---

*이 문서는 Claude AI가 프로젝트를 효율적으로 이해하고 작업할 수 있도록 작성되었습니다.*
*최종 업데이트: 2025-08-07*