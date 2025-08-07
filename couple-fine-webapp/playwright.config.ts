import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Couple Fine Webapp 종합 테스트 설정
 */
export default defineConfig({
  // 테스트 디렉터리
  testDir: './tests/e2e',
  
  // 전역 설정
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? 'github' : 'list'
  ],
  
  // 테스트 결과 출력 디렉터리
  outputDir: 'test-results',
  
  // 전역 테스트 설정
  use: {
    // 기본 URL (개발 서버)
    baseURL: 'http://localhost:5173',
    
    // 스크린샷 및 비디오
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // 브라우저 컨텍스트 설정
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // 액션 타임아웃
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // 로케이션 (한국)
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul'
  },

  // 테스트 프로젝트 설정
  projects: [
    // Desktop 테스트
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*.spec.ts', '!**/*mobile*.spec.ts']
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/*.spec.ts', '!**/*mobile*.spec.ts']
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/*.spec.ts', '!**/*mobile*.spec.ts']
    },

    // 모바일 테스트
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/*mobile*.spec.ts', '**/auth/*.spec.ts', '**/core/*.spec.ts']
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/*mobile*.spec.ts', '**/auth/*.spec.ts', '**/core/*.spec.ts']
    },

    // 성능 테스트용 프로젝트
    {
      name: 'Performance',
      use: { 
        ...devices['Desktop Chrome'],
        // 네트워크 제한 시뮬레이션
        launchOptions: {
          args: ['--disable-dev-shm-usage']
        }
      },
      testMatch: ['**/performance/*.spec.ts']
    }
  ],

  // 개발 서버 설정
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2분
  },

  // 전역 설정
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
  
  // 기대값 설정
  expect: {
    // 스크린샷 비교 허용 오차
    threshold: 0.2,
    toMatchSnapshot: {
      threshold: 0.2,
      animation: 'disabled'
    }
  }
});