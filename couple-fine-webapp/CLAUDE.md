# CLAUDE.md - Couple Fine WebApp 운영 가이드 🤖

> 이 문서는 Couple Fine WebApp 프로젝트에서 작업할 미래의 Claude 인스턴스를 위한 운영 가이드입니다.

## 🎯 프로젝트 개요

**우리 벌금통 (Couple Fine WebApp)**은 커플들이 일상의 약속을 재미있게 관리할 수 있는 웹 애플리케이션입니다.

### 핵심 컨셉
- 💑 커플 간 약속/규칙 관리
- 💰 벌금 시스템으로 재미있게 책임감 부여
- 🎁 모인 벌금으로 함께 즐길 보상 설정
- 👥 개인화된 표시 이름으로 더욱 친근한 경험
- 🆚 Versus 통계로 재미있는 경쟁과 격려
- 📍 명확한 벌금 기여도로 투명한 관리
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
  - Supabase: PostgreSQL + Auth + Realtime + RLS
  - 현재 상태: 완전 연동 완료 (실시간 동기화)

State Management:
  - React Context API (AuthContext, AppContext)
  - useReducer 패턴 사용

Architecture:
  - MVP 패턴 (개별 함수 중심)
  - 상세 가이드: MVP_ARCHITECTURE.md 참조
```

## 📁 프로젝트 구조

```
couple-fine-webapp/
├── src/
│   ├── components/     # 재사용 가능한 UI 컴포넌트
│   │   ├── VersusWidget.tsx     # 커플 벌금 비교 위젯
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
- **상태**: 프로덕션 배포 완료 ✅
- **도메인**: joanddo.com (Vercel에서 구매 완료)
- **프로덕션 URL**: https://couple-fine-webapp-ch7kqsduz-racidcho-1617s-projects.vercel.app
- **배포 파일**: `vercel.json`, `.github/workflows/deploy.yml`

### 배포 체크리스트 ⭐ **진행 중**
- [x] TypeScript 빌드 오류 수정
- [x] Vercel CLI 설치
- [x] vercel.json 설정
- [x] Vercel 프로젝트 연결 및 첫 배포 성공
- [x] 환경 변수 설정 (Supabase 키)
- [x] 커스텀 도메인 연결 (joanddo.com 완료)
- [x] HTTPS 인증서 자동 적용
- [x] 프로덕션 배포 완료
- [x] GitHub-Vercel 자동 배포 연동
- [x] 순환 의존성 버그 수정 (2025-08-08)
- [ ] Vercel 환경변수 대시보드 설정 필요

## 🔧 최근 수정사항 (2025-08-08)

### 주요 기능 추가 ⭐ NEW
1. **온보딩 플로우 개선** 🎯
   - 목업 데이터 완전 제거 - 새 커플은 빈 상태로 시작
   - 커플 생성 → 이름 설정 → 대시보드 순서의 온보딩 플로우
   - CoupleSetup 페이지 환영 메시지 개선 (그라데이션, 애니메이션)
   - 현재 로그인된 이메일 표시 기능
   - "다른 이메일로 로그인하기" 버튼 추가로 계정 전환 용이

2. **대시보드 UI 대규모 개선** ✨
   - Versus 위젯을 상단으로 이동하여 더 눈에 띄게 배치
   - 플로팅 하트 애니메이션 배경 추가
   - "오늘 누가 벌금 받았나요? 👀" 섹션 추가
   - 통계 카드를 하단으로 재배치
   - 전체적으로 더 아기자기하고 귀여운 디자인

3. **네비게이션 바 벌금 상태 표시** 📊
   - 하단 네비게이션 위에 실시간 벌금 현황 바 추가
   - "지원 5만원 🏆 VS 3만원 정훈" 형태로 표시
   - 진행률 바로 시각적 비교 (승자는 초록색)
   - 애니메이션과 이모지로 재미있는 경쟁 요소

4. **Settings 이름 섹션 개선** 💑
   - 이름 섹션을 최상단으로 이동
   - 그라데이션 배경과 바운싱 이모지 애니메이션
   - 내 이름/파트너 이름 카드를 나란히 배치
   - 더 큰 폰트와 명확한 편집 버튼

5. **사용자 표시 이름(Display Names) 기능** 
   - 커플이 서로에게 개인화된 이름 설정 가능 (예: 이지원, 한정훈)
   - Settings 페이지에 "우리들의 이름 💑" 섹션 추가
   - 파트너 이름 실시간 표시 및 편집 가능
   - 한국어 친화적 UI with 핑크/퍼플 그라데이션과 하트 이모지

6. **Versus 통계 위젯** 💫
   - 커플 간 벌금 현황 비교 표시 (누가 더 벌금이 많은지)
   - 시각적 진행률 바와 격려 메시지
   - "완벽한 균형 💕", "더 착해요! 💙" 등 귀여운 메시지
   - Dashboard 상단에 배치되어 재미있는 경쟁 요소 제공

7. **향상된 벌금 기여도 시스템**
   - 모든 벌금 기록에 "누가 받았는지" 명확하게 표시
   - "이지원님이 받은 벌금", "한정훈님이 차감한 벌금" 형태로 표시
   - NewViolation 페이지에서 벌금 받을 사람 선택 가능
   - 파트너 이모지(👩👨)로 시각적 구분

8. **OTP 코드 인증 시스템** (이전 구현 완료)
   - 매직링크 대신 6자리 OTP 코드 인증 방식
   - 크로스 디바이스 로그인 완벽 지원
   - 모바일 최적화된 OTP 입력 UI (숫자 키패드 자동 표시)
   - 코드 재전송 및 이메일 변경 기능 지원

### 주요 버그 수정 🛠️
1. **CRUD 작업 전체 수정** ⭐ NEW (2025-08-08)
   - 커플 코드 표시 안 되던 문제 해결 (Settings.tsx null 체크 추가)
   - 규칙/보상/벌금 삭제 기능 복구 (deleteRule을 실제 DELETE로 변경)
   - Supabase RLS DELETE 정책 추가
   - 커플 참여 코드 입력 오류 해결 (couples 테이블 SELECT 정책 수정)

2. **보상 생성 금액 필드 버그 수정**
   - 금액 필드가 1에 고정되어 지워지지 않던 문제 해결
   - 사용자가 자유롭게 금액 입력 및 수정 가능

3. **규칙 생성 금액 필드 버그 수정**
   - Rules 페이지에서도 벌금 금액이 1에 고정되던 문제 해결
   - 빈 값 입력 가능하도록 개선

4. **보상 생성 무한 로딩 문제 해결**
   - 보상 추가 버튼 클릭 시 발생하던 무한 로딩 상태 수정
   - 즉시 응답하는 UI로 개선

5. **월별 벌금 계산 로직 수정**
   - 차감 벌금이 월별 통계에서 올바르게 빼지지 않던 문제 해결
   - 추가(+) 벌금과 차감(-) 벌금이 정확하게 계산되도록 개선

6. **벌금 표시 개선**
   - 각 벌금 기록에 누가 받았는지 명확하게 표시
   - "이지원님이 받은 벌금" vs "한정훈님이 받은 벌금" 형태로 구분

7. **순환 의존성 문제 해결** (이전 수정 완료)
   - AppContext에서 useRealtime 훅 사용으로 인한 순환 의존성 제거
   - 앱이 로드되지 않는 치명적 버그 수정
   
8. **환경변수 업데이트** (이전 수정 완료)
   - Supabase ANON_KEY 올바른 키로 업데이트 (T9U로 끝나는 키)
   - .env 및 .env.production 파일 수정

9. **AuthContext refreshUser 버그 수정** (이전 수정 완료)
   - session 변수 참조 오류 수정 (session → currentSession)

### 알려진 이슈
1. **Vercel 환경변수**
   - Vercel 대시보드에서 환경변수 직접 설정 필요
   - VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY 설정 필수

## 💡 중요한 개발 정보

### 1. Supabase RLS 정책 추가 사항 ⭐ NEW (2025-08-08)
```sql
-- DELETE 정책 (필수 - 삭제 기능을 위해 반드시 필요)
CREATE POLICY "Users can delete couple rules" ON rules FOR DELETE;
CREATE POLICY "Users can delete couple rewards" ON rewards FOR DELETE;
CREATE POLICY "Users can delete couple violations" ON violations FOR DELETE;

-- 커플 참여를 위한 SELECT 정책 (필수)
CREATE POLICY "Users can view couples" ON couples FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);
```

### 2. Supabase 인증 시스템 (OTP 코드 방식 - 완전 구현)
```typescript
// src/contexts/AuthContext.tsx
// OTP 코드 인증 시스템 완전 구현 (6자리 인증 코드)
// 크로스 디바이스 로그인 지원 - 어떤 기기에서든 로그인 가능
// 사용자 프로필 자동 생성 및 관리
// 세션 관리 및 자동 갱신
// 코드 재전송 및 이메일 변경 기능
```

### 2. 실시간 데이터 동기화 (완전 구현)
```typescript
// src/contexts/AppContext.tsx
// 실제 Supabase 테이블 연동 완료
// 실시간 구독 시스템 활성화
// 커플 간 데이터 실시간 동기화
// 자동 백업 및 오프라인 지원
```

### 3. Tailwind CSS v4 설정
```javascript
// postcss.config.js
// @tailwindcss/postcss 플러그인 사용
// tailwind.config.js에서 커스텀 색상 정의 (primary, coral)
```

### 4. 환경 변수 설정 (배포 완료)
```bash
# .env 파일 (로컬 개발용)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Vercel 환경 변수 (프로덕션)
# ✅ 이미 설정 완료됨
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

### Dashboard (홈) ⭐ **향상됨**
- ✅ 시간대별 인사말
- ✅ 통계 카드 (2x2 그리드)
- ✅ **Versus 통계 위젯** - 커플 벌금 비교와 격려 메시지
- ✅ 빠른 액션 버튼
- ✅ **향상된 최근 활동** - 벌금을 받은 사람 명시
- ✅ **파트너 이모지** - 👩👨 시각적 구분
- ✅ 오늘의 한마디

### CoupleSetup (커플 연결) ⭐ **구현 완료**
- ✅ 새 커플 생성 기능
- ✅ 커플 코드 자동 생성
- ✅ 커플 코드로 연결 기능
- ✅ 기본 규칙/보상 템플릿 자동 생성

### Rules (우리들의 약속) ⭐ **구현 완료**
- ✅ 규칙 목록 실시간 표시
- ✅ 규칙 추가/수정/삭제 완전 구현
- ✅ 카테고리별 관리 (일반, 건강, 생활)
- ✅ 활성/비활성 상태 관리

### NewViolation (벌금 기록하기) ⭐ **완전 구현 + 향상**
- ✅ 벌금 추가/차감 선택
- ✅ **벌금 받을 사람 선택** - 본인 또는 파트너 선택
- ✅ **파트너 표시** - 이름과 이모지로 명확한 구분
- ✅ 규칙 선택 드롭다운 (실시간)
- ✅ 금액 입력 및 메모
- ✅ **스마트 알림** - "이지원님에게 벌금 5만원이 추가되었어요!"
- ✅ 실시간 저장 및 동기화
- ✅ 자동 잔액 업데이트

### Rewards (우리의 보상) ⭐ **완전 구현 + 버그 수정**
- ✅ 현재 모인 벌금 실시간 표시
- ✅ 보상 목표 진행률 자동 계산
- ✅ 보상 추가/수정/달성 완전 구현
- ✅ **금액 필드 버그 수정** - 1에 고정되던 문제 해결
- ✅ **무한 로딩 문제 해결** - 즉시 응답하는 UI
- ✅ 달성 알림 시스템

### Calendar (달력) ⭐ **완전 구현 + 향상**
- ✅ 월별 벌금 기록 캘린더
- ✅ 일별 상세 내역
- ✅ **벌금 받은 사람 표시** - "이지원님이 받은 벌금" 형태
- ✅ **파트너 이모지** - 👩👨 시각적 구분
- ✅ **월별 계산 로직 수정** - 차감 벌금 올바르게 처리
- ✅ 월간 통계

### Settings (내 정보 설정) ⭐ **완전 구현 + 신기능**
- ✅ 프로필 편집 기능
- ✅ **"우리들의 이름 💑" 섹션** - 표시 이름 설정
- ✅ **내 이름 편집** - 개인화된 표시 이름 설정
- ✅ **파트너 이름 표시** - 파트너가 설정한 이름 실시간 표시
- ✅ **한국어 친화적 UI** - 핑크/퍼플 그라데이션과 하트 이모지
- ✅ 커플 정보 실시간 표시  
- ✅ PIN 설정 시스템 완전 구현
- ✅ 테마 설정 (라이트모드 고정) 
- ✅ 앱 잠금 설정

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

### 3. Supabase 데이터 연동 (완전 구현)
```typescript
// src/lib/supabase.ts의 완전 구현된 함수들 사용
import { supabase } from '../lib/supabase';

// 실시간 구독 예시
useEffect(() => {
  const subscription = supabase
    .channel('violations')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'violations' },
      (payload) => {
        // 실시간 데이터 처리
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### 4. 모바일 최적화 체크리스트
- ✅ 터치 타겟 최소 44px
- ✅ 하단 네비게이션 여백 고려
- ✅ 스크롤 최소화
- ✅ 큰 글씨와 명확한 버튼

## 🔥 완성된 고급 기능들

1. **실시간 동기화**: 커플 간 모든 데이터 실시간 공유
2. **보안 PIN 잠금**: 생체인증 지원, 자동/수동 잠금
3. **오프라인 PWA**: 완전한 오프라인 동작 지원
4. **자동 백업**: 모든 데이터 안전하게 클라우드 저장

## 🎯 핵심 사용 패턴

### 커플 연결하기
1. 한 명이 "새 커플 만들기" 선택
2. 생성된 6자리 코드를 상대방에게 전달  
3. 상대방이 코드 입력하여 연결 완료
4. 기본 규칙과 보상이 자동으로 생성됨

### 벌금 기록하기  
1. "벌금 기록하기" 페이지 진입
2. 추가/차감 선택
3. 규칙 선택 (드롭다운에서 실시간 목록)
4. 금액과 메모 입력 후 저장
5. 상대방에게 즉시 알림 및 동기화

### 보상 달성하기
1. 목표 금액 달성 시 자동 알림
2. "달성하기" 버튼으로 보상 해제  
3. 활동 피드에 자동 기록

## 🔧 고급 기능 활용

### PIN 보안 잠금
- 설정에서 4자리 PIN 설정
- 앱 재진입 시 자동 잠금
- 생체인증 (지문, 얼굴) 지원

### 실시간 활동 피드
- 모든 활동이 실시간으로 피드에 표시
- 벌금 기록, 규칙 추가, 보상 달성 등
- 커플 간 투명한 소통
- **벌금 기여도 표시** - 누가 받았는지 명확히 표시

### 표시 이름 및 Versus 기능
- Settings에서 "우리들의 이름 💑"에서 개인화된 이름 설정
- 파트너 이름은 실시간으로 표시되며 편집 불가
- Versus 위젯으로 재미있는 비교 통계 제공
- 격려 메시지로 건전한 경쟁 분위기 조성

## 🔧 문제 해결 및 사용법

### 표시 이름 설정하기
1. Settings (설정) 페이지로 이동
2. "우리들의 이름 💑" 섹션 찾기
3. "내 이름" 카드에서 연필 아이콘 클릭
4. 원하는 이름 입력 (예: 이지원, 한정훈)
5. 저장 버튼으로 완료

### Versus 통계 이해하기
- **완벽한 균형**: 두 사람의 벌금이 똑같을 때 "둘 다 똑같이 착해요! 💕"
- **작은 차이** (<20%): "조금 더 착해요! 💙"
- **중간 차이** (<50%): "더 착해요! 대단해요 💚" 
- **큰 차이** (>50%): "압도적으로 착해요! 👑"
- 진행률 바로 시각적 비교 가능

### 벌금 기여도 확인하기
- 모든 벌금 기록에 벌금을 받은 사람이 표시됨
- "이지원님이 받은 벌금" vs "한정훈님이 차감한 벌금" 형태
- 파트너 이모지(👩👨)로 시각적 구분
- NewViolation에서 벌금 받을 사람 선택 가능

### 자주 발생하는 문제
1. **파트너 이름이 안 보여요**: 파트너가 아직 이름을 설정하지 않았을 수 있음
2. **Versus 통계가 안 나와요**: 아직 벌금 기록이 없거나 커플 연결이 완료되지 않음
3. **보상 금액을 수정할 수 없어요**: 이미 해결됨 - 자유롭게 입력 가능

## 💬 한국어 톤앤매너

- 친근하고 귀여운 말투 사용
- 이모지 적극 활용
- 존댓말보다는 반말체 선호
- 예시: "오늘도 화이팅!" "벌금 기록했어요 💰"

## 🔗 유용한 링크

### 📚 프로젝트 문서
- [프로젝트 현황](./PROJECT_STATUS.md) - 전체 개발 현황 및 성과
- [MVP 아키텍처 가이드](./MVP_ARCHITECTURE.md) ⭐ - 핵심 설계 철학
- [API 레퍼런스](./API_REFERENCE.md) ⭐ - 완전한 API 가이드
- [배포 가이드](./DEPLOYMENT_GUIDE.md) ⭐ - Supabase부터 Vercel까지
- [사용자 매뉴얼](./USER_MANUAL.md) ⭐ - 완전한 사용법 가이드
- [개발 로그](./DEVELOPMENT_LOG.md) - 일일 개발 기록

### 🌐 라이브 서비스
- [프로덕션 서비스](https://joanddo.com) - 완성된 서비스 체험
- [GitHub Repository](https://github.com/racidcho/vs.git)

### 📖 기술 문서
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

---

## 🎉 프로젝트 현황

**우리 벌금통**은 커플을 위한 PWA 웹앱으로 개발 중입니다.

### ✨ 주요 성취
- **100% TypeScript**: 완전한 타입 안전성
- **실시간 동기화**: Supabase Realtime 완전 활용  
- **엔터프라이즈급 보안**: RLS, PIN 인증, 데이터 암호화
- **모바일 퍼스트**: PWA, 오프라인 지원, 네이티브 앱 경험
- **사용자 친화적**: 직관적 UI, 자연스러운 한국어

### 🚀 현재 상태
- **로컬 개발**: `npm run dev`로 즉시 시작 (정상 작동)
- **프로덕션**: https://joanddo.com 배포 중 (환경변수 설정 필요)
- **기능 구현**: 대부분의 CRUD, 실시간, 보안 기능 구현 완료
- **문서화**: 개발자 가이드 제공

### 📝 다음 단계
1. Vercel 대시보드에서 환경변수 설정
2. 프로덕션 배포 확인
3. 사용자 테스트 및 피드백 수집

*이 문서는 Claude AI가 지원하는 커플 벌금 관리 PWA 웹앱의 개발 가이드입니다.*
*최종 업데이트: 2025-08-08 (CRUD 전체 수정, RLS 정책 추가, 커플 참여 버그 수정)*