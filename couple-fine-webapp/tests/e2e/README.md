# 🧪 Couple Fine E2E 테스트 가이드

Couple Fine 웹앱을 위한 포괄적인 End-to-End 테스트 시스템입니다.

## 📋 목차

- [개요](#개요)
- [테스트 구조](#테스트-구조)
- [실행 방법](#실행-방법)
- [테스트 카테고리](#테스트-카테고리)
- [성능 및 접근성 테스트](#성능-및-접근성-테스트)
- [리포팅 시스템](#리포팅-시스템)
- [개발 가이드](#개발-가이드)

## 🎯 개요

이 E2E 테스트 시스템은 다음과 같은 포괄적인 테스트를 제공합니다:

- ✅ **핵심 기능 테스트**: 인증, 규칙, 위반, 보상 시스템
- 🔄 **실시간 동기화 테스트**: 커플 간 데이터 실시간 동기화
- 📱 **모바일 반응형 테스트**: 다양한 디바이스와 뷰포트
- 👆 **터치 인터랙션 테스트**: 모바일 제스처와 햅틱 피드백
- ⚡ **성능 테스트**: Core Web Vitals, 번들 크기, 메모리 사용량
- ♿ **접근성 테스트**: WCAG 준수, 색상 대비, 키보드 네비게이션
- 🌐 **크로스 브라우저 테스트**: Chrome, Firefox, Safari

## 📁 테스트 구조

```
tests/e2e/
├── core/                    # 핵심 기능 테스트
│   ├── auth-flow.spec.ts   # 인증 플로우 테스트
│   └── rules-violations.spec.ts # 규칙/위반 시스템 테스트
├── couple/                  # 커플 시스템 테스트
│   └── realtime-sync.spec.ts   # 실시간 동기화 테스트
├── mobile/                  # 모바일 특화 테스트
│   ├── responsive-layout.spec.ts  # 반응형 레이아웃
│   └── mobile-interactions.spec.ts # 모바일 인터랙션
├── performance/             # 성능 및 접근성 테스트
│   └── performance.spec.ts
├── utils/                   # 테스트 유틸리티
│   ├── test-helpers.ts     # 헬퍼 함수들
│   └── test-reporter.ts    # 리포팅 시스템
├── global-setup.ts         # 전역 설정
├── global-teardown.ts      # 전역 정리
├── run-tests.ts           # 통합 테스트 실행기
└── README.md              # 이 파일
```

## 🚀 실행 방법

### 기본 실행

```bash
# 모든 E2E 테스트 실행 (기본)
npm run test:e2e

# UI 모드로 테스트 실행 (시각적)
npm run test:e2e:ui

# 디버그 모드로 테스트 실행
npm run test:e2e:debug
```

### 통합 테스트 실행기

```bash
# 종합 테스트 실행 (권장)
npm run test:e2e:all

# 모든 브라우저에서 병렬 실행
npm run test:e2e:comprehensive

# 빠른 테스트 (Chrome만)
npm run test:e2e:quick
```

### 고급 옵션

```bash
# 특정 브라우저만 테스트
npm run test:e2e:all -- --browsers chromium,firefox

# 병렬 실행 활성화
npm run test:e2e:all -- --parallel

# 재시도 횟수 설정
npm run test:e2e:all -- --retries 3

# 커스텀 타임아웃 설정
npm run test:e2e:all -- --timeout 120000

# 리포트 디렉토리 변경
npm run test:e2e:all -- --report-dir custom-reports
```

## 📊 테스트 카테고리

### 1. 🔐 인증 플로우 테스트 (`auth-flow.spec.ts`)

- 이메일 로그인
- OTP 인증
- 프로필 설정
- 커플 연결 (생성/참여)
- 세션 관리

```typescript
// 예시: 로그인 테스트
test('이메일 로그인 및 프로필 설정', async ({ page }) => {
  await loginUser(page, TEST_DATA.users.user1.email);
  await expect(page).toHaveURL('/dashboard');
});
```

### 2. 📋 규칙/위반 시스템 테스트 (`rules-violations.spec.ts`)

- 규칙 생성, 수정, 삭제
- 위반 기록 및 관리
- 실시간 대시보드 업데이트
- 입력 검증 및 오류 처리

```typescript
// 예시: 규칙 추가 테스트
test('새 규칙 추가 및 검증', async ({ page }) => {
  await addRule(page, TEST_DATA.rules[0]);
  await expect(page.locator('[data-testid="rule-item"]')).toBeVisible();
});
```

### 3. 🔄 실시간 동기화 테스트 (`realtime-sync.spec.ts`)

- 듀얼 브라우저 컨텍스트
- 실시간 데이터 동기화
- 권한 및 보안 검증
- 네트워크 연결 시나리오

```typescript
// 예시: 실시간 동기화 테스트
test('커플 간 실시간 데이터 동기화', async ({ browser }) => {
  const helper = new DualContextTestHelper(context1, context2);
  await helper.testRealtimeSync(
    () => page1.click('[data-testid="add-violation"]'),
    '[data-testid="violation-item"]'
  );
});
```

### 4. 📱 모바일 반응형 테스트 (`responsive-layout.spec.ts`, `mobile-interactions.spec.ts`)

- 다양한 뷰포트 테스트
- 터치 제스처 시뮬레이션
- 햅틱 피드백 테스트
- 모바일 네비게이션

```typescript
// 예시: 터치 제스처 테스트
test('스와이프 제스처 테스트', async ({ page }) => {
  const utils = new TestUtils(page);
  await utils.simulateTouchGesture('[data-testid="card"]', 'swipeLeft');
});
```

## ⚡ 성능 및 접근성 테스트

### 성능 메트릭

- **Core Web Vitals**: LCP, FID, CLS 측정
- **로딩 시간**: 페이지 로드 및 인터랙션 응답 시간
- **번들 크기**: JavaScript, CSS 리소스 크기
- **메모리 사용량**: 메모리 누수 및 최적화 검증

### 접근성 표준

- **WCAG 2.1 AA 준수**: 색상 대비, ARIA 레이블
- **키보드 네비게이션**: Tab, Enter, 화살표 키 지원
- **터치 타겟 크기**: 최소 44px × 44px
- **스크린 리더 호환성**: 시맨틱 HTML, 적절한 헤딩 구조

```typescript
// 예시: 접근성 테스트
test('색상 대비 및 ARIA 검증', async ({ page }) => {
  const utils = new TestUtils(page);
  const results = await utils.checkAccessibility();
  expect(results.score).toBeGreaterThan(80);
});
```

## 📈 리포팅 시스템

### HTML 리포트

시각적이고 상세한 테스트 결과 리포트:

- 📊 종합 대시보드 (커버리지, 성능, 접근성 점수)
- 📈 상세 메트릭 (로딩 시간, 번들 크기, Core Web Vitals)
- 🐛 이슈 리스트 (오류, 경고, 개선사항)
- 📱 스크린샷 갤러리 (다양한 디바이스/브라우저)
- 💡 개선 권장사항

### JSON 리포트

프로그래밍 방식으로 활용 가능한 구조화된 데이터:

```json
{
  "timestamp": "2025-01-07T...",
  "summary": {
    "totalFeatures": 6,
    "coveredFeatures": 6,
    "totalErrors": 0,
    "accessibilityScore": 87,
    "performanceScore": 92
  },
  "metrics": {
    "performance": {...},
    "accessibility": {...},
    "coverage": {...}
  }
}
```

## 🛠 개발 가이드

### 새 테스트 추가

1. **테스트 파일 생성**:
```typescript
import { test, expect } from '@playwright/test';
import { TEST_DATA, TestUtils } from '../utils/test-helpers';

test.describe('새 기능 테스트', () => {
  test('기능 설명', async ({ page }) => {
    // 테스트 로직
  });
});
```

2. **헬퍼 함수 활용**:
```typescript
import { loginUser, addRule, TestUtils } from '../utils/test-helpers';

const utils = new TestUtils(page);
await utils.safeClick('[data-testid="button"]');
await utils.safeFill('[data-testid="input"]', 'value');
```

3. **데이터 testid 규칙**:
```html
<!-- 버튼 -->
<button data-testid="login-button">로그인</button>

<!-- 입력 필드 -->
<input data-testid="email-input" type="email" />

<!-- 리스트 아이템 -->
<div data-testid="rule-item-{id}">규칙 내용</div>
```

### 성능 테스트 추가

```typescript
test('새 기능 성능 테스트', async ({ page }) => {
  const utils = new TestUtils(page);
  
  const startTime = Date.now();
  await page.goto('/new-feature');
  const loadTime = Date.now() - startTime;
  
  const metrics = await utils.collectPerformanceMetrics();
  expect(loadTime).toBeLessThan(3000);
  expect(metrics.webVitals.lcp).toBeLessThan(2500);
});
```

### 접근성 테스트 추가

```typescript
test('새 기능 접근성 테스트', async ({ page }) => {
  await page.goto('/new-feature');
  
  const utils = new TestUtils(page);
  const results = await utils.checkAccessibility();
  
  expect(results.score).toBeGreaterThan(80);
  expect(results.issues.filter(i => i.severity === 'error')).toHaveLength(0);
});
```

### 실시간 테스트 추가

```typescript
test('새 기능 실시간 동기화', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const helper = new DualContextTestHelper(context1, context2);
  
  await helper.setup();
  await helper.loginBothUsers();
  
  await helper.testRealtimeSync(
    () => helper.getPages()[0].click('[data-testid="action"]'),
    '[data-testid="result"]',
    '예상 텍스트'
  );
  
  await helper.cleanup();
});
```

## 🔧 구성 설정

### Playwright 설정 (`playwright.config.ts`)

주요 설정 옵션:
- 브라우저 프로젝트 (Chrome, Firefox, Safari)
- 모바일 디바이스 에뮬레이션
- 성능 프로파일링
- 타임아웃 및 재시도 설정

### 환경 변수

```bash
# .env.test
VITE_SUPABASE_URL=your_test_supabase_url
VITE_SUPABASE_ANON_KEY=your_test_supabase_key
TEST_USER_EMAIL=test@example.com
```

## 🐛 문제 해결

### 일반적인 문제

1. **타임아웃 오류**:
   ```bash
   # 타임아웃 증가
   npm run test:e2e:all -- --timeout 120000
   ```

2. **요소를 찾을 수 없음**:
   ```typescript
   // waitFor 사용
   await page.waitForSelector('[data-testid="element"]', { state: 'visible' });
   ```

3. **실시간 동기화 실패**:
   ```typescript
   // 더 긴 대기 시간
   await waitForRealtimeUpdate(page, selector, text, 10000);
   ```

4. **메모리 부족**:
   ```bash
   # 순차 실행
   npm run test:e2e:all -- --parallel false
   ```

### 디버깅 도구

```bash
# 시각적 디버깅
npm run test:e2e:debug

# 스크린샷과 함께 실행
npm run test:e2e -- --screenshot=on

# 브라우저 콘솔 로그 확인
npm run test:e2e -- --reporter=line
```

## 📚 추가 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [Web.dev 성능 가이드](https://web.dev/performance/)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)

---

## 🤝 기여하기

새로운 테스트나 개선사항이 있다면:

1. 이슈를 생성하여 논의
2. 브랜치를 생성하여 테스트 작성
3. Pull Request 제출
4. 코드 리뷰 및 병합

**Happy Testing! 🎉**