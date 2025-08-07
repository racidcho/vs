import { test, expect, Page, BrowserContext } from '@playwright/test';
import { 
  waitForPageLoad, 
  loginUser, 
  setupPIN, 
  createCouple, 
  joinCouple,
  expectToast,
  expectCurrentUrl,
  TEST_DATA 
} from '../utils/test-helpers';

/**
 * 인증 플로우 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 회원가입 → 프로필 설정 → 커플 생성/연결
 * 2. 로그인 → PIN 설정 → 앱 잠금/해제
 * 3. 인증 상태 관리 및 리다이렉트
 */

test.describe('인증 플로우 테스트', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('사용자 1: 회원가입 → 커플 생성 플로우', async () => {
    // 1. 로그인 페이지 접속
    await page.goto('/');
    await waitForPageLoad(page);
    
    // 로그인되지 않은 상태에서는 로그인 페이지로 리다이렉트
    await expectCurrentUrl(page, '/login');
    
    // 2. 이메일로 로그인
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    
    // 로그인 처리 대기 (개발 환경에서는 OTP 자동 처리)
    await waitForPageLoad(page);
    
    // 3. 커플 설정 페이지로 이동
    await expectCurrentUrl(page, '/couple-setup');
    
    // 4. 새 커플 생성
    await page.click('[data-testid="create-couple-button"]');
    
    // 5. 프로필 정보 입력
    await page.fill('[data-testid="display-name-input"]', TEST_DATA.users.user1.displayName);
    
    // 6. 테마 선택
    await page.click(`[data-testid="theme-${TEST_DATA.couple.theme}"]`);
    
    // 7. 설정 완료
    await page.click('[data-testid="finish-setup-button"]');
    
    // 성공 메시지 확인
    await expectToast(page, '커플 설정이 완료되었습니다!');
    
    // 8. 대시보드로 이동 확인
    await expectCurrentUrl(page, '/');
    
    // 9. 커플 코드 확인 (파트너 연결을 위해 저장)
    await page.goto('/settings');
    const coupleCodeElement = page.locator('[data-testid="couple-code"]');
    const coupleCode = await coupleCodeElement.textContent();
    expect(coupleCode).toBeTruthy();
    
    // 전역 변수에 저장 (다음 테스트에서 사용)
    test.info().annotations.push({
      type: 'couple-code',
      description: coupleCode || ''
    });
  });

  test('사용자 1: PIN 설정 및 앱 잠금/해제', async () => {
    // PIN 설정 페이지로 이동
    await page.goto('/settings');
    
    // PIN 설정 버튼 클릭
    await page.click('[data-testid="setup-pin-button"]');
    
    // PIN 입력 모달 확인
    await expect(page.locator('[data-testid="pin-setup-modal"]')).toBeVisible();
    
    // PIN 입력
    for (const digit of TEST_DATA.users.user1.pin) {
      await page.click(`[data-testid="pin-digit-${digit}"]`);
    }
    
    // PIN 확인 단계
    await page.click('[data-testid="confirm-pin-step"]');
    
    // 같은 PIN 다시 입력
    for (const digit of TEST_DATA.users.user1.pin) {
      await page.click(`[data-testid="pin-digit-${digit}"]`);
    }
    
    // PIN 설정 완료
    await page.click('[data-testid="confirm-pin-button"]');
    
    // 성공 메시지
    await expectToast(page, 'PIN이 설정되었습니다');
    
    // 앱 잠금 테스트
    await page.click('[data-testid="lock-app-button"]');
    
    // 잠금 화면 확인
    await expect(page.locator('[data-testid="lock-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="pin-unlock-input"]')).toBeVisible();
    
    // 잘못된 PIN 입력 테스트
    await page.click('[data-testid="pin-digit-0"]');
    await page.click('[data-testid="pin-digit-0"]');
    await page.click('[data-testid="pin-digit-0"]');
    await page.click('[data-testid="pin-digit-0"]');
    
    // 오류 메시지 확인
    await expectToast(page, 'PIN이 올바르지 않습니다', 'error');
    
    // 올바른 PIN으로 잠금 해제
    for (const digit of TEST_DATA.users.user1.pin) {
      await page.click(`[data-testid="pin-digit-${digit}"]`);
    }
    
    // 잠금 해제 확인
    await expectCurrentUrl(page, '/');
    await expect(page.locator('[data-testid="lock-screen"]')).not.toBeVisible();
  });

  test('로그아웃 및 재로그인 플로우', async () => {
    // 설정에서 로그아웃
    await page.goto('/settings');
    await page.click('[data-testid="logout-button"]');
    
    // 확인 다이얼로그
    await page.click('[data-testid="confirm-logout-button"]');
    
    // 로그인 페이지로 리다이렉트 확인
    await expectCurrentUrl(page, '/login');
    
    // 재로그인
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    
    await waitForPageLoad(page);
    
    // 대시보드로 바로 이동 (이미 커플 설정 완료)
    await expectCurrentUrl(page, '/');
  });
});

test.describe('두 번째 사용자 - 커플 참여 플로우', () => {
  
  let context: BrowserContext;
  let page: Page;
  let coupleCode: string;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // 이전 테스트에서 생성된 커플 코드 가져오기 (실제로는 환경 변수나 공유 상태에서)
    coupleCode = 'TEST001'; // 실제 구현에서는 동적으로 가져와야 함
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('사용자 2: 로그인 → 커플 참여 플로우', async () => {
    // 로그인
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user2.email);
    await page.click('[data-testid="login-button"]');
    
    await waitForPageLoad(page);
    await expectCurrentUrl(page, '/couple-setup');
    
    // 커플 참여하기 탭 선택
    await page.click('[data-testid="join-couple-tab"]');
    
    // 프로필 정보 입력
    await page.fill('[data-testid="display-name-input"]', TEST_DATA.users.user2.displayName);
    
    // 커플 코드 입력
    await page.fill('[data-testid="couple-code-input"]', coupleCode);
    
    // 참여하기 클릭
    await page.click('[data-testid="join-couple-button"]');
    
    // 성공 메시지 및 대시보드 이동 확인
    await expectToast(page, '커플 연결이 완료되었습니다!');
    await expectCurrentUrl(page, '/');
    
    // PIN 설정
    await setupPIN(page, TEST_DATA.users.user2.pin);
  });

  test('사용자 2: 커플 연결 상태 확인', async () => {
    // 설정 페이지에서 커플 정보 확인
    await page.goto('/settings');
    
    // 파트너 정보 표시 확인
    await expect(page.locator('[data-testid="partner-name"]')).toContainText(TEST_DATA.users.user1.displayName);
    
    // 커플 코드 확인
    await expect(page.locator('[data-testid="couple-code"]')).toContainText(coupleCode);
    
    // 테마 확인
    await expect(page.locator(`[data-testid="current-theme-${TEST_DATA.couple.theme}"]`)).toBeVisible();
  });
});

test.describe('인증 보안 테스트', () => {
  
  test('비인증 접근 보호 테스트', async ({ page }) => {
    // 로그아웃 상태에서 보호된 라우트 접근
    const protectedRoutes = [
      '/',
      '/rules', 
      '/violations/new',
      '/rewards',
      '/calendar',
      '/settings'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await waitForPageLoad(page);
      
      // 로그인 페이지로 리다이렉트되어야 함
      await expectCurrentUrl(page, '/login');
    }
  });

  test('커플 미설정 사용자 접근 제한 테스트', async ({ page }) => {
    // 로그인은 했지만 커플 설정을 안 한 사용자 시뮬레이션
    await page.goto('/login');
    await page.evaluate(() => {
      // 로컬스토리지에 인증 정보만 설정 (커플 정보 없음)
      localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // 커플 설정 페이지로 리다이렉트되어야 함
    await expectCurrentUrl(page, '/couple-setup');
  });

  test('세션 만료 처리 테스트', async ({ page }) => {
    // 만료된 토큰으로 접근
    await page.goto('/login');
    await page.evaluate(() => {
      // 만료된 토큰 설정
      localStorage.setItem('supabase.auth.token', 'expired-token');
    });
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // 로그인 페이지로 리다이렉트 및 오류 메시지
    await expectCurrentUrl(page, '/login');
    await expectToast(page, '세션이 만료되었습니다. 다시 로그인해주세요.', 'error');
  });
});