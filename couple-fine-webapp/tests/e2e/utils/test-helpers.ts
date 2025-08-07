import { Page, Locator, expect, BrowserContext } from '@playwright/test';

/**
 * E2E 테스트 헬퍼 함수들
 * 공통으로 사용되는 테스트 유틸리티
 */

// 성능 임계값 설정
export const PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD_TIME: 3000, // 3초
  API_RESPONSE_TIME: 500, // 0.5초
  INTERACTION_DELAY: 100, // 100ms
  BUNDLE_SIZE: 2048, // 2MB
  MEMORY_USAGE: 100 // 100MB
} as const;

// 접근성 기준
export const ACCESSIBILITY_STANDARDS = {
  MIN_CONTRAST_RATIO: 4.5, // WCAG AA
  MIN_TOUCH_TARGET: 44, // 44px x 44px
  MAX_TAB_STOPS: 50 // 최대 탭 정지점
} as const;

// 네트워크 조건
export const NETWORK_CONDITIONS = {
  FAST_3G: {
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
    uploadThroughput: 0.75 * 1024 * 1024 / 8, // 0.75 Mbps
    latency: 562.5
  },
  SLOW_3G: {
    downloadThroughput: 0.5 * 1024 * 1024 / 8, // 0.5 Mbps
    uploadThroughput: 0.5 * 1024 * 1024 / 8, // 0.5 Mbps
    latency: 2000
  }
} as const;

// 테스트 데이터
export const TEST_DATA = {
  users: {
    user1: {
      email: 'test1@coupleapp.test',
      displayName: '김철수',
      pin: '1234'
    },
    user2: {
      email: 'test2@coupleapp.test', 
      displayName: '이영희',
      pin: '5678'
    }
  },
  couple: {
    theme: 'pink'
  },
  rules: [
    {
      type: 'word' as const,
      title: '욕설 금지',
      penalty: 5
    },
    {
      type: 'behavior' as const, 
      title: '지각 금지',
      penalty: 10
    }
  ],
  rewards: [
    {
      title: '맛집 데이트',
      target: 50
    }
  ]
} as const;

/**
 * 페이지 로딩 대기
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * 모바일 뷰포트 설정
 */
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 });
}

/**
 * 데스크톱 뷰포트 설정
 */
export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1280, height: 720 });
}

/**
 * 로그인 헬퍼
 */
export async function loginUser(page: Page, email: string) {
  await page.goto('/login');
  
  // 이메일 입력
  await page.fill('[data-testid="email-input"]', email);
  
  // 로그인 버튼 클릭
  await page.click('[data-testid="login-button"]');
  
  // OTP 입력 대기 (개발 모드에서는 자동으로 처리됨)
  await waitForPageLoad(page);
}

/**
 * PIN 설정 헬퍼
 */
export async function setupPIN(page: Page, pin: string) {
  await page.goto('/settings');
  
  // PIN 설정 버튼 클릭
  await page.click('[data-testid="setup-pin-button"]');
  
  // PIN 입력
  for (const digit of pin) {
    await page.click(`[data-testid="pin-digit-${digit}"]`);
  }
  
  // 확인
  await page.click('[data-testid="confirm-pin-button"]');
  
  await waitForPageLoad(page);
}

/**
 * 커플 생성 헬퍼
 */
export async function createCouple(page: Page, theme: string = 'pink') {
  await page.goto('/couple-setup');
  
  // 새 커플 생성
  await page.click('[data-testid="create-couple-button"]');
  
  // 테마 선택
  await page.click(`[data-testid="theme-${theme}"]`);
  
  // 생성 완료
  await page.click('[data-testid="finish-setup-button"]');
  
  await waitForPageLoad(page);
  
  // 커플 코드 추출
  const codeElement = page.locator('[data-testid="couple-code"]');
  const coupleCode = await codeElement.textContent();
  
  return coupleCode?.trim() || '';
}

/**
 * 커플 참여 헬퍼
 */
export async function joinCouple(page: Page, code: string) {
  await page.goto('/couple-setup');
  
  // 참여하기 탭
  await page.click('[data-testid="join-couple-tab"]');
  
  // 커플 코드 입력
  await page.fill('[data-testid="couple-code-input"]', code);
  
  // 참여하기
  await page.click('[data-testid="join-couple-button"]');
  
  await waitForPageLoad(page);
}

/**
 * 규칙 추가 헬퍼
 */
export async function addRule(page: Page, rule: typeof TEST_DATA.rules[0]) {
  await page.goto('/rules');
  
  // 새 규칙 버튼
  await page.click('[data-testid="add-rule-button"]');
  
  // 규칙 타입 선택
  await page.click(`[data-testid="rule-type-${rule.type}"]`);
  
  // 제목 입력
  await page.fill('[data-testid="rule-title-input"]', rule.title);
  
  // 벌금 입력
  await page.fill('[data-testid="penalty-amount-input"]', rule.penalty.toString());
  
  // 저장
  await page.click('[data-testid="save-rule-button"]');
  
  await waitForPageLoad(page);
}

/**
 * 위반 기록 헬퍼
 */
export async function recordViolation(page: Page, ruleTitle: string, amount?: number) {
  await page.goto('/violations/new');
  
  // 규칙 선택
  await page.click(`[data-testid="rule-option-${ruleTitle}"]`);
  
  // 금액 수정 (필요한 경우)
  if (amount) {
    await page.fill('[data-testid="violation-amount-input"]', amount.toString());
  }
  
  // 기록
  await page.click('[data-testid="record-violation-button"]');
  
  await waitForPageLoad(page);
}

/**
 * 보상 추가 헬퍼
 */
export async function addReward(page: Page, reward: typeof TEST_DATA.rewards[0]) {
  await page.goto('/rewards');
  
  // 새 보상 버튼
  await page.click('[data-testid="add-reward-button"]');
  
  // 제목 입력
  await page.fill('[data-testid="reward-title-input"]', reward.title);
  
  // 목표 금액 입력
  await page.fill('[data-testid="target-amount-input"]', reward.target.toString());
  
  // 저장
  await page.click('[data-testid="save-reward-button"]');
  
  await waitForPageLoad(page);
}

/**
 * 토스트 메시지 확인
 */
export async function expectToast(page: Page, message: string, type: 'success' | 'error' = 'success') {
  const toastSelector = '[data-testid="toast"]';
  await expect(page.locator(toastSelector)).toContainText(message);
  
  if (type === 'success') {
    await expect(page.locator(toastSelector)).toHaveClass(/success/);
  } else {
    await expect(page.locator(toastSelector)).toHaveClass(/error/);
  }
}

/**
 * 네비게이션 확인
 */
export async function expectCurrentUrl(page: Page, path: string) {
  await expect(page).toHaveURL(new RegExp(`.*${path.replace('/', '\\/')}.*`));
}

/**
 * 모바일 하단 네비게이션 클릭
 */
export async function clickMobileNav(page: Page, navItem: 'dashboard' | 'rules' | 'rewards' | 'calendar' | 'settings') {
  await page.click(`[data-testid="mobile-nav-${navItem}"]`);
  await waitForPageLoad(page);
}

/**
 * 실시간 업데이트 대기
 */
export async function waitForRealtimeUpdate(page: Page, selector: string, expectedText: string, timeout: number = 5000) {
  await page.waitForFunction(
    ({ selector, expectedText }) => {
      const element = document.querySelector(selector);
      return element?.textContent?.includes(expectedText);
    },
    { selector, expectedText },
    { timeout }
  );
}

/**
 * 네트워크 상태 시뮬레이션
 */
export async function simulateOffline(page: Page) {
  await page.context().setOffline(true);
}

export async function simulateOnline(page: Page) {
  await page.context().setOffline(false);
}

/**
 * 성능 메트릭 수집
 */
export async function collectWebVitals(page: Page) {
  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics = {
        FCP: 0,
        LCP: 0,
        FID: 0,
        CLS: 0
      };
      
      // Performance Observer로 메트릭 수집
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.FCP = entry.startTime;
          }
          if (entry.entryType === 'largest-contentful-paint') {
            metrics.LCP = entry.startTime;
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
      
      setTimeout(() => resolve(metrics), 3000);
    });
  });
  
  return vitals;
}

/**
 * 고급 테스트 유틸리티 클래스
 */
export class TestUtils {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 요소가 보일 때까지 대기 (향상된 버전)
   */
  async waitForElementVisible(selector: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    
    // 요소가 실제로 상호작용 가능한지 확인
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               window.getComputedStyle(element).visibility !== 'hidden' &&
               window.getComputedStyle(element).opacity !== '0';
      },
      selector,
      { timeout: 5000 }
    );
  }

  /**
   * 안전한 클릭 (중복 클릭 방지)
   */
  async safeClick(selector: string, options?: { timeout?: number, force?: boolean }): Promise<void> {
    await this.waitForElementVisible(selector, options?.timeout);
    
    // 로딩 상태가 있는지 확인
    const hasLoading = await this.page.locator('.loading, .animate-spin').count();
    if (hasLoading > 0) {
      await this.page.waitForSelector('.loading, .animate-spin', { state: 'hidden', timeout: 5000 });
    }
    
    await this.page.click(selector, { 
      force: options?.force || false,
      timeout: options?.timeout || 30000 
    });
  }

  /**
   * 안전한 입력 (기존 값 지우기)
   */
  async safeFill(selector: string, value: string): Promise<void> {
    await this.waitForElementVisible(selector);
    await this.page.locator(selector).clear();
    await this.page.fill(selector, value);
    
    // 입력값이 올바르게 설정되었는지 확인
    const actualValue = await this.page.inputValue(selector);
    if (actualValue !== value) {
      // 재시도
      await this.page.locator(selector).clear();
      await this.page.fill(selector, value);
    }
  }

  /**
   * 모바일 터치 제스처 시뮬레이션
   */
  async simulateTouchGesture(
    selector: string, 
    gesture: 'tap' | 'longPress' | 'swipeLeft' | 'swipeRight' | 'swipeUp' | 'swipeDown',
    options?: { duration?: number }
  ): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    
    const box = await element.boundingBox();
    if (!box) throw new Error(`Element ${selector} not found`);
    
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    switch (gesture) {
      case 'tap':
        await this.page.touchscreen.tap(centerX, centerY);
        break;
        
      case 'longPress':
        await this.page.mouse.move(centerX, centerY);
        await this.page.mouse.down();
        await this.page.waitForTimeout(options?.duration || 800);
        await this.page.mouse.up();
        break;
        
      case 'swipeLeft':
        await this.page.touchscreen.tap(centerX, centerY);
        await this.page.mouse.move(centerX, centerY);
        await this.page.mouse.down();
        await this.page.mouse.move(centerX - 100, centerY, { steps: 10 });
        await this.page.mouse.up();
        break;
        
      case 'swipeRight':
        await this.page.touchscreen.tap(centerX, centerY);
        await this.page.mouse.move(centerX, centerY);
        await this.page.mouse.down();
        await this.page.mouse.move(centerX + 100, centerY, { steps: 10 });
        await this.page.mouse.up();
        break;
        
      case 'swipeUp':
        await this.page.touchscreen.tap(centerX, centerY);
        await this.page.mouse.move(centerX, centerY);
        await this.page.mouse.down();
        await this.page.mouse.move(centerX, centerY - 100, { steps: 10 });
        await this.page.mouse.up();
        break;
        
      case 'swipeDown':
        await this.page.touchscreen.tap(centerX, centerY);
        await this.page.mouse.move(centerX, centerY);
        await this.page.mouse.down();
        await this.page.mouse.move(centerX, centerY + 100, { steps: 10 });
        await this.page.mouse.up();
        break;
    }
  }

  /**
   * 접근성 검사
   */
  async checkAccessibility(): Promise<{
    score: number;
    issues: Array<{
      type: 'contrast' | 'aria' | 'keyboard' | 'semantics';
      severity: 'error' | 'warning';
      message: string;
    }>;
  }> {
    const issues: Array<{
      type: 'contrast' | 'aria' | 'keyboard' | 'semantics';
      severity: 'error' | 'warning';
      message: string;
    }> = [];

    // 색상 대비 검사
    const contrastIssues = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, select, [role="button"]');
      const contrastIssues: Array<{ element: string; contrast: number }> = [];
      
      elements.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // 간단한 명도 계산
        const bgLuminance = getLuminanceFromColor(bgColor);
        const textLuminance = getLuminanceFromColor(textColor);
        const contrast = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                        (Math.min(bgLuminance, textLuminance) + 0.05);
        
        if (contrast < 4.5) {
          contrastIssues.push({
            element: `${el.tagName}[${index}]`,
            contrast: Math.round(contrast * 100) / 100
          });
        }
      });
      
      function getLuminanceFromColor(color: string): number {
        const rgb = color.match(/\d+/g);
        if (!rgb || rgb.length < 3) return 0;
        
        const [r, g, b] = rgb.map(val => {
          const c = parseInt(val) / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      
      return contrastIssues;
    });

    contrastIssues.forEach(issue => {
      issues.push({
        type: 'contrast',
        severity: 'error',
        message: `Element ${issue.element} has low contrast ratio: ${issue.contrast}`
      });
    });

    // ARIA 속성 검사
    const ariaIssues = await this.page.evaluate(() => {
      const interactive = document.querySelectorAll('button, input, select, [role="button"], [tabindex]');
      const ariaIssues: Array<string> = [];
      
      interactive.forEach((el, index) => {
        const hasLabel = el.getAttribute('aria-label') || 
                        el.getAttribute('aria-labelledby') ||
                        el.querySelector('label') ||
                        el.textContent?.trim();
                        
        if (!hasLabel) {
          ariaIssues.push(`${el.tagName}[${index}] missing accessible label`);
        }
      });
      
      return ariaIssues;
    });

    ariaIssues.forEach(issue => {
      issues.push({
        type: 'aria',
        severity: 'warning',
        message: issue
      });
    });

    // 터치 타겟 크기 검사
    const touchTargetIssues = await this.page.evaluate(() => {
      const interactive = document.querySelectorAll('button, a, input, select, [role="button"]');
      const sizeIssues: Array<string> = [];
      
      interactive.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          sizeIssues.push(`${el.tagName}[${index}] is too small: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        }
      });
      
      return sizeIssues;
    });

    touchTargetIssues.forEach(issue => {
      issues.push({
        type: 'keyboard',
        severity: 'warning',
        message: issue
      });
    });

    // 접근성 점수 계산
    const totalChecks = contrastIssues.length + ariaIssues.length + touchTargetIssues.length;
    const score = totalChecks > 0 ? Math.max(0, 100 - (issues.length * 10)) : 100;

    return { score, issues };
  }

  /**
   * 성능 메트릭 수집 (향상된 버전)
   */
  async collectPerformanceMetrics(): Promise<{
    webVitals: any;
    timing: any;
    resources: any;
    memory: any;
  }> {
    const [webVitals, timing, resources, memory] = await Promise.all([
      this.page.evaluate(() => window.webVitals || {}),
      this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
      }),
      this.page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        let totalSize = 0;
        let jsSize = 0;
        let cssSize = 0;
        let imgSize = 0;
        
        resources.forEach((resource: any) => {
          if (resource.transferSize) {
            totalSize += resource.transferSize;
            
            if (resource.name.match(/\.(js|mjs)$/)) {
              jsSize += resource.transferSize;
            } else if (resource.name.match(/\.css$/)) {
              cssSize += resource.transferSize;
            } else if (resource.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
              imgSize += resource.transferSize;
            }
          }
        });
        
        return {
          total: Math.round(totalSize / 1024), // KB
          js: Math.round(jsSize / 1024),
          css: Math.round(cssSize / 1024),
          images: Math.round(imgSize / 1024),
          resourceCount: resources.length
        };
      }),
      this.page.evaluate(() => {
        if (performance.memory) {
          return {
            used: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)), // MB
            total: Math.round(performance.memory.totalJSHeapSize / (1024 * 1024)),
            limit: Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024))
          };
        }
        return null;
      })
    ]);

    return { webVitals, timing, resources, memory };
  }

  /**
   * 스크린샷 비교
   */
  async compareScreenshots(name: string, options?: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
    threshold?: number;
  }): Promise<void> {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage: options?.fullPage,
      clip: options?.clip,
      threshold: options?.threshold || 0.2
    });
  }

  /**
   * 반응형 테스트
   */
  async testResponsiveLayout(breakpoints?: Array<{name: string, width: number, height: number}>): Promise<void> {
    const defaultBreakpoints = breakpoints || [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 800 }
    ];

    for (const breakpoint of defaultBreakpoints) {
      await this.page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await this.page.waitForLoadState('networkidle');
      
      // 레이아웃 시프트 확인
      const hasOverflow = await this.page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth > window.innerWidth || body.scrollHeight > window.innerHeight;
      });
      
      console.log(`📱 ${breakpoint.name} (${breakpoint.width}x${breakpoint.height}): ${hasOverflow ? 'Has overflow' : 'No overflow'}`);
      
      // 필요시 스크린샷 저장
      await this.page.screenshot({ 
        path: `test-results/responsive-${breakpoint.name}.png`,
        fullPage: true 
      });
    }
  }
}

/**
 * 듀얼 브라우저 컨텍스트 테스트 헬퍼
 */
export class DualContextTestHelper {
  private context1: BrowserContext;
  private context2: BrowserContext;
  private page1: Page;
  private page2: Page;
  
  constructor(context1: BrowserContext, context2: BrowserContext) {
    this.context1 = context1;
    this.context2 = context2;
  }
  
  async setup(): Promise<void> {
    this.page1 = await this.context1.newPage();
    this.page2 = await this.context2.newPage();
  }
  
  async loginBothUsers(): Promise<void> {
    await Promise.all([
      loginUser(this.page1, TEST_DATA.users.user1.email),
      loginUser(this.page2, TEST_DATA.users.user2.email)
    ]);
  }
  
  async navigateBoth(path: string): Promise<void> {
    await Promise.all([
      this.page1.goto(path),
      this.page2.goto(path)
    ]);
  }
  
  async testRealtimeSync(action: () => Promise<void>, expectedSelector: string, expectedText?: string): Promise<void> {
    // 실시간 동기화 테스트
    await action();
    
    if (expectedText) {
      await waitForRealtimeUpdate(this.page2, expectedSelector, expectedText);
    } else {
      await this.page2.waitForSelector(expectedSelector, { timeout: 5000 });
    }
  }
  
  getPages(): [Page, Page] {
    return [this.page1, this.page2];
  }
  
  async cleanup(): Promise<void> {
    await Promise.all([
      this.page1?.close(),
      this.page2?.close()
    ]);
  }
}

/**
 * 테스트 데이터 생성기
 */
export class TestDataGenerator {
  static generateRandomEmail(): string {
    const timestamp = Date.now();
    return `test-${timestamp}@coupleapp.test`;
  }
  
  static generateRandomRule(): typeof TEST_DATA.rules[0] {
    const rules = [
      { type: 'word' as const, title: '욕설 금지', penalty: 5 },
      { type: 'behavior' as const, title: '지각 금지', penalty: 10 },
      { type: 'word' as const, title: '거짓말 금지', penalty: 15 },
      { type: 'behavior' as const, title: '약속 취소 금지', penalty: 20 }
    ];
    
    return rules[Math.floor(Math.random() * rules.length)];
  }
  
  static generateRandomReward(): typeof TEST_DATA.rewards[0] {
    const rewards = [
      { title: '맛집 데이트', target: 50 },
      { title: '영화 관람', target: 30 },
      { title: '주말 여행', target: 100 },
      { title: '커플 마사지', target: 80 }
    ];
    
    return rewards[Math.floor(Math.random() * rewards.length)];
  }
}

/**
 * 로그 수집기
 */
export class TestLogger {
  private logs: Array<{ level: string; message: string; timestamp: Date }> = [];
  
  constructor(page: Page) {
    page.on('console', msg => {
      this.logs.push({
        level: msg.type(),
        message: msg.text(),
        timestamp: new Date()
      });
    });
    
    page.on('pageerror', error => {
      this.logs.push({
        level: 'error',
        message: error.message,
        timestamp: new Date()
      });
    });
  }
  
  getErrors(): Array<{ message: string; timestamp: Date }> {
    return this.logs
      .filter(log => log.level === 'error')
      .map(log => ({ message: log.message, timestamp: log.timestamp }));
  }
  
  getWarnings(): Array<{ message: string; timestamp: Date }> {
    return this.logs
      .filter(log => log.level === 'warning')
      .map(log => ({ message: log.message, timestamp: log.timestamp }));
  }
  
  getAllLogs(): Array<{ level: string; message: string; timestamp: Date }> {
    return [...this.logs];
  }
  
  clearLogs(): void {
    this.logs = [];
  }
}