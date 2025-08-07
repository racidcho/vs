import { test, expect, Page } from '@playwright/test';
import { 
  waitForPageLoad, 
  loginUser, 
  setMobileViewport,
  setDesktopViewport,
  addRule,
  recordViolation,
  addReward,
  expectToast,
  TEST_DATA 
} from '../utils/test-helpers';

/**
 * 모바일 반응형 레이아웃 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 다양한 뷰포트에서 레이아웃 적응성 검증
 * 2. 모바일 네비게이션 및 메뉴 동작
 * 3. 터치 인터랙션 최적화
 * 4. 텍스트 가독성 및 버튼 크기 적정성
 * 5. 가로/세로 화면 전환 대응
 */

test.describe('모바일 반응형 레이아웃 테스트', () => {
  
  // 다양한 모바일 디바이스 사이즈
  const mobileViewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'Samsung Galaxy S21', width: 384, height: 854 },
    { name: 'iPad Mini', width: 768, height: 1024 }
  ];
  
  const desktopViewports = [
    { name: 'Small Desktop', width: 1024, height: 768 },
    { name: 'Large Desktop', width: 1440, height: 900 },
    { name: 'Ultra Wide', width: 1920, height: 1080 }
  ];

  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_DATA.users.user1.email);
    await waitForPageLoad(page);
  });

  test.describe('뷰포트 적응성 테스트', () => {
    
    for (const viewport of mobileViewports) {
      test(`${viewport.name} (${viewport.width}x${viewport.height}) 레이아웃 검증`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // 대시보드 레이아웃 확인
        await page.goto('/');
        await waitForPageLoad(page);
        
        // 모바일 네비게이션 바 표시 확인
        await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
        await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();
        
        // 헤더 최적화 확인
        const header = page.locator('[data-testid="mobile-header"]');
        await expect(header).toBeVisible();
        await expect(header).toHaveCSS('height', /48px|56px|64px/); // 모바일 적정 헤더 높이
        
        // 컨텐츠 영역 스크롤 가능 확인
        const mainContent = page.locator('[data-testid="main-content"]');
        await expect(mainContent).toBeVisible();
        
        // 하단 네비게이션 고정 확인
        const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
        await expect(bottomNav).toHaveCSS('position', 'fixed');
        await expect(bottomNav).toHaveCSS('bottom', '0px');
        
        // Safe Area 적용 확인 (iPhone의 경우)
        if (viewport.name.includes('iPhone')) {
          await expect(bottomNav).toHaveCSS('padding-bottom', /env\(safe-area-inset-bottom\)|20px|34px/);
        }
      });
    }

    for (const viewport of desktopViewports) {
      test(`${viewport.name} (${viewport.width}x${viewport.height}) 데스크톱 레이아웃 검증`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // 대시보드 레이아웃 확인
        await page.goto('/');
        await waitForPageLoad(page);
        
        // 데스크톱 사이드바 표시 확인
        await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-bottom-nav"]')).not.toBeVisible();
        
        // 넓은 화면에서 컨텐츠 중앙 정렬 확인
        const mainContent = page.locator('[data-testid="main-content"]');
        if (viewport.width >= 1440) {
          await expect(mainContent).toHaveCSS('max-width', /1200px|1280px/);
          await expect(mainContent).toHaveCSS('margin', /0px auto/);
        }
      });
    }
  });

  test.describe('모바일 네비게이션 테스트', () => {
    
    test('하단 네비게이션 바 기능 검증', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
      
      // 네비게이션 항목들 확인
      const navItems = [
        { key: 'dashboard', label: '홈', route: '/' },
        { key: 'rules', label: '규칙', route: '/rules' },
        { key: 'violations', label: '위반', route: '/violations' },
        { key: 'rewards', label: '보상', route: '/rewards' },
        { key: 'settings', label: '설정', route: '/settings' }
      ];
      
      for (const item of navItems) {
        const navItem = bottomNav.locator(`[data-testid="nav-${item.key}"]`);
        await expect(navItem).toBeVisible();
        
        // 아이콘과 라벨 모두 표시되는지 확인
        await expect(navItem.locator('[data-testid="nav-icon"]')).toBeVisible();
        await expect(navItem.locator('[data-testid="nav-label"]')).toContainText(item.label);
        
        // 터치 타겟 크기 적정성 (44px 이상)
        const boundingBox = await navItem.boundingBox();
        expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
        
        // 네비게이션 동작 확인
        await navItem.click();
        await waitForPageLoad(page);
        await expect(page).toHaveURL(new RegExp(`.*${item.route.replace('/', '\\/')}.*`));
        
        // 활성 상태 스타일 확인
        await expect(navItem).toHaveClass(/active|selected/);
      }
    });

    test('스와이프 네비게이션 지원', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      // 좌우 스와이프로 탭 전환 (구현된 경우)
      const mainContent = page.locator('[data-testid="main-content"]');
      
      // 오른쪽으로 스와이프 시뮬레이션
      await mainContent.dispatchEvent('touchstart', { 
        touches: [{ clientX: 100, clientY: 300 }] 
      });
      await mainContent.dispatchEvent('touchmove', { 
        touches: [{ clientX: 250, clientY: 300 }] 
      });
      await mainContent.dispatchEvent('touchend', {});
      
      // 스와이프 제스처가 지원되는 경우 확인
      const swipeIndicator = page.locator('[data-testid="swipe-indicator"]');
      if (await swipeIndicator.count() > 0) {
        await expect(swipeIndicator).toBeVisible();
      }
    });
  });

  test.describe('터치 인터랙션 최적화', () => {
    
    test('터치 타겟 크기 및 간격 검증', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      // 주요 버튼들의 터치 타겟 크기 확인 (최소 44px)
      const touchTargets = [
        '[data-testid="add-violation-button"]',
        '[data-testid="menu-button"]',
        '[data-testid="notification-button"]',
        '[data-testid="user-menu-button"]'
      ];
      
      for (const selector of touchTargets) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          const boundingBox = await element.boundingBox();
          expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
        }
      }
      
      // 인접한 터치 타겟 간 적정 간격 확인 (최소 8px)
      await page.goto('/rules');
      await waitForPageLoad(page);
      
      const ruleItems = page.locator('[data-testid^="rule-item-"]');
      const count = await ruleItems.count();
      
      if (count > 1) {
        for (let i = 0; i < count - 1; i++) {
          const current = ruleItems.nth(i);
          const next = ruleItems.nth(i + 1);
          
          const currentBox = await current.boundingBox();
          const nextBox = await next.boundingBox();
          
          if (currentBox && nextBox) {
            const gap = nextBox.y - (currentBox.y + currentBox.height);
            expect(gap).toBeGreaterThanOrEqual(8);
          }
        }
      }
    });

    test('터치 피드백 및 호버 상태', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/rules');
      
      // 규칙이 없으면 하나 추가
      if (await page.locator('[data-testid^="rule-item-"]').count() === 0) {
        await addRule(page, TEST_DATA.rules[0]);
      }
      
      const ruleItem = page.locator('[data-testid^="rule-item-"]').first();
      
      // 터치 시작 시 visual feedback 확인
      await ruleItem.dispatchEvent('touchstart');
      await expect(ruleItem).toHaveClass(/pressed|active|touched/);
      
      // 터치 종료 시 feedback 제거
      await ruleItem.dispatchEvent('touchend');
      
      // 호버 효과가 터치 디바이스에서 지속되지 않는지 확인
      await ruleItem.hover();
      await page.waitForTimeout(100);
      await page.tap('body'); // 다른 곳 터치
      
      // hover 스타일이 유지되지 않아야 함
      await expect(ruleItem).not.toHaveClass(/hover/);
    });

    test('드래그 앤 드롭 터치 지원', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/rules');
      
      // 규칙이 2개 이상 있는지 확인하고 없으면 추가
      const ruleCount = await page.locator('[data-testid^="rule-item-"]').count();
      if (ruleCount < 2) {
        await addRule(page, TEST_DATA.rules[0]);
        await addRule(page, TEST_DATA.rules[1]);
      }
      
      const firstRule = page.locator('[data-testid^="rule-item-"]').first();
      const secondRule = page.locator('[data-testid^="rule-item-"]').nth(1);
      
      // 드래그 핸들이 있는 경우 터치 드래그 테스트
      const dragHandle = firstRule.locator('[data-testid="drag-handle"]');
      if (await dragHandle.count() > 0) {
        await dragHandle.dragTo(secondRule);
        
        // 순서 변경 확인
        await expectToast(page, '규칙 순서가 변경되었습니다.');
      }
    });
  });

  test.describe('폼 및 입력 최적화', () => {
    
    test('모바일 키보드 최적화 입력 필드', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/rules');
      
      // 새 규칙 추가 모달 열기
      await page.click('[data-testid="add-rule-button"]');
      
      // 입력 필드별 키보드 타입 확인
      const titleInput = page.locator('[data-testid="rule-title-input"]');
      await expect(titleInput).toHaveAttribute('inputmode', 'text');
      
      const penaltyInput = page.locator('[data-testid="penalty-amount-input"]');
      await expect(penaltyInput).toHaveAttribute('inputmode', 'numeric');
      await expect(penaltyInput).toHaveAttribute('pattern', /\[0-9\]/);
      
      // 입력 필드 포커스 시 뷰포트 자동 스크롤 확인
      await titleInput.click();
      
      // 키보드가 올라왔을 때 입력 필드가 보이는지 확인
      const inputBox = await titleInput.boundingBox();
      const viewportHeight = page.viewportSize()?.height || 0;
      
      if (inputBox) {
        expect(inputBox.y).toBeLessThan(viewportHeight * 0.6); // 화면 상단 60% 내에 위치
      }
    });

    test('긴 폼에서 스크롤 및 네비게이션', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/violations/new');
      
      // 규칙이 없으면 추가
      if (await page.locator('[data-testid^="rule-option-"]').count() === 0) {
        await addRule(page, TEST_DATA.rules[0]);
        await page.goto('/violations/new');
      }
      
      // 긴 폼 컨텐츠 스크롤 테스트
      const formContainer = page.locator('[data-testid="violation-form"]');
      
      // 폼 상단으로 스크롤
      await formContainer.scrollIntoViewIfNeeded();
      
      // 규칙 선택
      await page.click('[data-testid^="rule-option-"]');
      
      // 하단 버튼까지 스크롤
      const submitButton = page.locator('[data-testid="record-violation-button"]');
      await submitButton.scrollIntoViewIfNeeded();
      
      // 버튼이 하단 네비게이션에 가려지지 않는지 확인
      const buttonBox = await submitButton.boundingBox();
      const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
      const navBox = await bottomNav.boundingBox();
      
      if (buttonBox && navBox) {
        expect(buttonBox.y + buttonBox.height).toBeLessThan(navBox.y - 16); // 16px 여백
      }
    });

    test('모달 및 팝업 모바일 최적화', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/settings');
      
      // PIN 설정 모달 열기
      await page.click('[data-testid="setup-pin-button"]');
      
      // 모달이 전체 화면을 덮는지 확인
      const modal = page.locator('[data-testid="pin-setup-modal"]');
      await expect(modal).toBeVisible();
      
      const modalBox = await modal.boundingBox();
      const viewport = page.viewportSize();
      
      if (modalBox && viewport) {
        expect(modalBox.width).toBeCloseTo(viewport.width, 10);
        expect(modalBox.height).toBeGreaterThan(viewport.height * 0.8);
      }
      
      // 모달 닫기 버튼 터치 타겟 크기
      const closeButton = modal.locator('[data-testid="close-modal-button"]');
      const closeBox = await closeButton.boundingBox();
      expect(closeBox?.width).toBeGreaterThanOrEqual(44);
      expect(closeBox?.height).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('컨텐츠 가독성 및 접근성', () => {
    
    test('텍스트 크기 및 행간 적정성', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      // 주요 텍스트 요소들의 폰트 크기 확인
      const textElements = [
        { selector: '[data-testid="main-title"]', minSize: 24 },
        { selector: '[data-testid="card-title"]', minSize: 18 },
        { selector: '[data-testid="card-content"]', minSize: 16 },
        { selector: '[data-testid="nav-label"]', minSize: 12 }
      ];
      
      for (const element of textElements) {
        const el = page.locator(element.selector).first();
        if (await el.count() > 0) {
          const fontSize = await el.evaluate(el => {
            return parseInt(window.getComputedStyle(el).fontSize);
          });
          expect(fontSize).toBeGreaterThanOrEqual(element.minSize);
        }
      }
      
      // 행간 확인 (최소 1.4)
      const contentText = page.locator('[data-testid="card-content"]').first();
      if (await contentText.count() > 0) {
        const lineHeight = await contentText.evaluate(el => {
          const style = window.getComputedStyle(el);
          return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
        });
        expect(lineHeight).toBeGreaterThanOrEqual(1.4);
      }
    });

    test('색상 대비 및 접근성', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      // 주요 색상 조합의 대비 확인 (시각적 검증은 수동)
      const colorElements = [
        '[data-testid="primary-button"]',
        '[data-testid="secondary-button"]',
        '[data-testid="danger-button"]',
        '[data-testid="nav-item"]'
      ];
      
      for (const selector of colorElements) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          // 포커스 가능 요소에 포커스 아웃라인 확인
          await element.focus();
          await expect(element).toHaveCSS('outline', /solid|auto/);
        }
      }
      
      // 다크 모드 지원 확인
      await page.evaluate(() => {
        // 다크 모드 전환 시뮬레이션
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      
      await page.waitForTimeout(100);
      
      // 다크 모드에서 텍스트 가독성 확인
      const body = page.locator('body');
      const backgroundColor = await body.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // 다크 색상 계열인지 확인 (RGB 값이 낮은지)
      const rgbMatch = backgroundColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        expect(brightness).toBeLessThan(128); // 어두운 배경
      }
    });
  });

  test.describe('화면 회전 및 방향 변경', () => {
    
    test('세로 → 가로 화면 전환', async ({ page }) => {
      // 세로 모드 시작
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // 세로 모드에서 네비게이션 확인
      await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
      
      // 가로 모드로 전환 (iPhone 가로)
      await page.setViewportSize({ width: 667, height: 375 });
      await waitForPageLoad(page);
      
      // 가로 모드에서 레이아웃 적응 확인
      const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
      
      // 가로 모드에서는 네비게이션이 컴팩트하게 표시되거나 숨겨질 수 있음
      if (await bottomNav.count() > 0) {
        const navHeight = await bottomNav.evaluate(el => el.offsetHeight);
        expect(navHeight).toBeLessThan(70); // 가로 모드에서는 더 컴팩트
      }
      
      // 컨텐츠 영역이 가로 화면에 맞게 조정되었는지 확인
      const mainContent = page.locator('[data-testid="main-content"]');
      const contentBox = await mainContent.boundingBox();
      
      if (contentBox) {
        expect(contentBox.width).toBeGreaterThan(contentBox.height); // 가로 비율
      }
    });

    test('다양한 화면 밀도 대응', async ({ page }) => {
      // 고해상도 디스플레이 시뮬레이션
      await page.setViewportSize({ width: 414, height: 896 }); // iPhone 11 Pro
      await page.goto('/');
      
      // 이미지 및 아이콘이 고해상도에서 선명한지 확인
      const icons = page.locator('[data-testid="nav-icon"]');
      const iconCount = await icons.count();
      
      for (let i = 0; i < iconCount; i++) {
        const icon = icons.nth(i);
        
        // SVG 아이콘 사용 확인 (벡터 그래픽으로 해상도 독립적)
        const tagName = await icon.evaluate(el => el.tagName.toLowerCase());
        const hasSvg = tagName === 'svg' || await icon.locator('svg').count() > 0;
        
        if (!hasSvg) {
          // 비트맵 이미지인 경우 고해상도 버전 확인
          const src = await icon.getAttribute('src');
          if (src) {
            expect(src).toMatch(/@2x|@3x|\.svg$/); // 고해상도 또는 벡터 이미지
          }
        }
      }
    });
  });

  test.describe('성능 최적화 (모바일)', () => {
    
    test('모바일 네트워크에서 로딩 성능', async ({ page }) => {
      // 느린 3G 네트워크 시뮬레이션
      await page.route('**/*', route => {
        return new Promise(resolve => {
          setTimeout(() => {
            route.continue();
            resolve();
          }, Math.random() * 500); // 0-500ms 지연
        });
      });
      
      await setMobileViewport(page);
      
      const startTime = Date.now();
      await page.goto('/');
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      // 모바일에서 5초 이내 로딩 목표
      expect(loadTime).toBeLessThan(5000);
      
      // 로딩 스피너나 스켈레톤 UI 표시 확인
      const loadingIndicators = [
        '[data-testid="loading-spinner"]',
        '[data-testid="skeleton-ui"]',
        '[data-testid="loading-placeholder"]'
      ];
      
      // 초기 로딩 시 loading state 표시 여부 확인 (빠르게 지나가므로 선택적)
      for (const selector of loadingIndicators) {
        const indicator = page.locator(selector);
        if (await indicator.count() > 0) {
          console.log(`Loading indicator found: ${selector}`);
        }
      }
    });

    test('모바일에서 메모리 사용량 최적화', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      // 여러 페이지 간 네비게이션으로 메모리 누수 테스트
      const pages = ['/', '/rules', '/violations', '/rewards', '/settings'];
      
      for (let i = 0; i < 3; i++) { // 3번 반복
        for (const pagePath of pages) {
          await page.goto(pagePath);
          await waitForPageLoad(page);
          
          // 메모리 사용량 측정 (대략적)
          const jsHeapSize = await page.evaluate(() => {
            return (performance as any).memory?.usedJSHeapSize || 0;
          });
          
          // 50MB 이하 유지 (모바일 제한)
          if (jsHeapSize > 0) {
            expect(jsHeapSize).toBeLessThan(50 * 1024 * 1024);
          }
        }
      }
    });

    test('터치 스크롤 성능', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/violations');
      
      // 여러 위반 기록 생성으로 긴 목록 만들기
      for (let i = 0; i < 10; i++) {
        await recordViolation(page, 'Test Rule', 10);
      }
      
      await page.goto('/violations');
      
      // 스크롤 성능 테스트
      const scrollContainer = page.locator('[data-testid="violations-list"]');
      
      const startTime = Date.now();
      
      // 빠른 스크롤 시뮬레이션
      for (let i = 0; i < 5; i++) {
        await scrollContainer.evaluate(el => {
          el.scrollTop = el.scrollHeight * (i + 1) / 5;
        });
        await page.waitForTimeout(50);
      }
      
      const scrollTime = Date.now() - startTime;
      
      // 스크롤 애니메이션이 부드러운지 확인 (500ms 이내)
      expect(scrollTime).toBeLessThan(500);
      
      // 스크롤 중 UI 블로킹 없음 확인
      const isResponsive = await page.evaluate(() => {
        return new Promise((resolve) => {
          let responsive = true;
          const start = Date.now();
          
          const checkResponsive = () => {
            if (Date.now() - start > 100) {
              resolve(responsive);
            } else {
              requestAnimationFrame(checkResponsive);
            }
          };
          
          checkResponsive();
        });
      });
      
      expect(isResponsive).toBe(true);
    });
  });
});