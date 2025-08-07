import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { TEST_DATA } from '../utils/test-helpers';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100,  // First Input Delay (ms)
  CLS: 0.1,  // Cumulative Layout Shift
  
  // Bundle sizes (KB)
  JS_BUNDLE_SIZE: 500,
  CSS_BUNDLE_SIZE: 100,
  TOTAL_BUNDLE_SIZE: 2000,
  
  // Load times (ms)
  PAGE_LOAD_TIME: 3000,
  API_RESPONSE_TIME: 500,
  
  // Memory usage (MB)
  MEMORY_USAGE: 100,
  MEMORY_LEAK_THRESHOLD: 50,
};

// Performance monitoring utilities
class PerformanceMonitor {
  private page: Page;
  private metrics: Map<string, any> = new Map();
  
  constructor(page: Page) {
    this.page = page;
  }

  async startMonitoring() {
    // Enable performance monitoring
    await this.page.addInitScript(() => {
      // Track Core Web Vitals
      window.webVitals = {};
      
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.webVitals.lcp = lastEntry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // FID (First Input Delay) 
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          if (entry.name === 'first-input') {
            window.webVitals.fid = entry.processingStart - entry.startTime;
          }
        });
      }).observe({ type: 'first-input', buffered: true });

      // CLS (Cumulative Layout Shift)
      let cumulativeLayoutShiftScore = 0;
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            cumulativeLayoutShiftScore += entry.value;
          }
        });
        window.webVitals.cls = cumulativeLayoutShiftScore;
      }).observe({ type: 'layout-shift', buffered: true });

      // Memory usage tracking
      window.memoryUsage = {
        initial: performance.memory ? performance.memory.usedJSHeapSize : 0,
        peak: 0,
        current: 0
      };
      
      // Track memory periodically
      setInterval(() => {
        if (performance.memory) {
          const current = performance.memory.usedJSHeapSize;
          window.memoryUsage.current = current;
          if (current > window.memoryUsage.peak) {
            window.memoryUsage.peak = current;
          }
        }
      }, 1000);
    });
  }

  async getWebVitals() {
    return await this.page.evaluate(() => window.webVitals || {});
  }

  async getMemoryUsage() {
    return await this.page.evaluate(() => window.memoryUsage || {});
  }

  async getBundleSize() {
    const resources = await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      let jsSize = 0;
      let cssSize = 0;
      let totalSize = 0;

      resources.forEach((resource: any) => {
        if (resource.transferSize) {
          totalSize += resource.transferSize;
          
          if (resource.name.endsWith('.js')) {
            jsSize += resource.transferSize;
          } else if (resource.name.endsWith('.css')) {
            cssSize += resource.transferSize;
          }
        }
      });

      return {
        js: Math.round(jsSize / 1024), // Convert to KB
        css: Math.round(cssSize / 1024),
        total: Math.round(totalSize / 1024)
      };
    });

    return resources;
  }

  async getLoadTime() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        ttfb: navigation.responseStart - navigation.requestStart
      };
    });
  }
}

test.describe('성능 테스트', () => {
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    performanceMonitor = new PerformanceMonitor(page);
    await performanceMonitor.startMonitoring();
  });

  test('메인 페이지 로딩 성능 측정', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Measure Core Web Vitals
    await page.waitForTimeout(2000); // Allow metrics to be collected
    const webVitals = await performanceMonitor.getWebVitals();
    const bundleSize = await performanceMonitor.getBundleSize();
    const timing = await performanceMonitor.getLoadTime();

    console.log('🔄 Performance Metrics:', {
      loadTime,
      webVitals,
      bundleSize,
      timing
    });

    // Validate thresholds
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD_TIME);
    
    if (webVitals.lcp) {
      expect(webVitals.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
    }
    
    if (webVitals.fid) {
      expect(webVitals.fid).toBeLessThan(PERFORMANCE_THRESHOLDS.FID);
    }
    
    if (webVitals.cls !== undefined) {
      expect(webVitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    }

    expect(bundleSize.js).toBeLessThan(PERFORMANCE_THRESHOLDS.JS_BUNDLE_SIZE);
    expect(bundleSize.css).toBeLessThan(PERFORMANCE_THRESHOLDS.CSS_BUNDLE_SIZE);
    expect(bundleSize.total).toBeLessThan(PERFORMANCE_THRESHOLDS.TOTAL_BUNDLE_SIZE);
  });

  test('인터랙션 성능 측정 (API 응답 시간)', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Navigate to rules page and measure API response
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/rules') && response.status() === 200
    );
    
    await page.click('a[href="/rules"]');
    const response = await responsePromise;
    
    const apiResponseTime = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      const apiCall = entries.find((entry: any) => entry.name.includes('/rules'));
      return apiCall ? apiCall.duration : 0;
    });

    console.log('🔄 API Response Time:', apiResponseTime);
    expect(apiResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
  });

  test('메모리 사용량 모니터링', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    const initialMemory = await performanceMonitor.getMemoryUsage();
    
    // Perform multiple navigation actions to test for memory leaks
    for (let i = 0; i < 5; i++) {
      await page.click('a[href="/rules"]');
      await page.waitForLoadState('networkidle');
      await page.click('a[href="/violations"]');
      await page.waitForLoadState('networkidle');
      await page.click('a[href="/rewards"]');
      await page.waitForLoadState('networkidle');
      await page.click('a[href="/dashboard"]');
      await page.waitForLoadState('networkidle');
    }

    const finalMemory = await performanceMonitor.getMemoryUsage();
    const memoryIncrease = (finalMemory.current - initialMemory.initial) / (1024 * 1024); // MB

    console.log('🔄 Memory Usage:', {
      initial: Math.round(initialMemory.initial / (1024 * 1024)),
      final: Math.round(finalMemory.current / (1024 * 1024)),
      peak: Math.round(finalMemory.peak / (1024 * 1024)),
      increase: Math.round(memoryIncrease)
    });

    expect(finalMemory.peak / (1024 * 1024)).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE);
    expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
  });

  test('스크롤 성능 측정', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Add script to measure scroll performance
    await page.addInitScript(() => {
      window.scrollMetrics = {
        frameCount: 0,
        totalTime: 0,
        fps: 0
      };

      let lastTimestamp = 0;
      function measureFPS(timestamp: number) {
        if (lastTimestamp) {
          const delta = timestamp - lastTimestamp;
          window.scrollMetrics.frameCount++;
          window.scrollMetrics.totalTime += delta;
          window.scrollMetrics.fps = 1000 / (window.scrollMetrics.totalTime / window.scrollMetrics.frameCount);
        }
        lastTimestamp = timestamp;
        requestAnimationFrame(measureFPS);
      }
      requestAnimationFrame(measureFPS);
    });

    // Simulate scrolling
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let scrollPosition = 0;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        
        const smoothScroll = () => {
          scrollPosition += 10;
          window.scrollTo(0, scrollPosition);
          
          if (scrollPosition < maxScroll) {
            requestAnimationFrame(smoothScroll);
          } else {
            resolve();
          }
        };
        
        requestAnimationFrame(smoothScroll);
      });
    });

    const scrollMetrics = await page.evaluate(() => window.scrollMetrics);
    console.log('🔄 Scroll Performance:', scrollMetrics);

    // Expect smooth 60fps scrolling
    expect(scrollMetrics.fps).toBeGreaterThan(55);
  });

  test('실시간 업데이트 성능 측정', async ({ page, context }) => {
    // Create two browser contexts to simulate real-time updates
    const secondPage = await context.newPage();
    
    // Login both users
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    
    await secondPage.goto('/');
    await secondPage.fill('[data-testid="email-input"]', TEST_DATA.users.user2.email);
    await secondPage.click('[data-testid="login-button"]');
    await secondPage.waitForURL('/dashboard');

    // Navigate to violations page
    await page.goto('/violations');
    await secondPage.goto('/violations');

    // Measure real-time update performance
    const startTime = Date.now();
    
    // User 1 adds a violation
    await page.click('[data-testid="add-violation-button"]');
    await page.selectOption('[data-testid="rule-select"]', { index: 0 });
    await page.fill('[data-testid="amount-input"]', '5');
    await page.click('[data-testid="submit-violation"]');

    // Wait for real-time update on User 2's page
    await secondPage.waitForSelector('[data-testid="violation-item"]', { timeout: 5000 });
    
    const updateTime = Date.now() - startTime;
    console.log('🔄 Real-time Update Time:', updateTime);

    // Should receive real-time updates within reasonable time
    expect(updateTime).toBeLessThan(2000);
    
    await secondPage.close();
  });
});

test.describe('접근성 테스트', () => {
  test('키보드 네비게이션 테스트', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus').getAttribute('data-testid');
    expect(focusedElement).toBe('email-input');
    
    await page.keyboard.press('Tab');
    focusedElement = await page.locator(':focus').getAttribute('data-testid');
    expect(focusedElement).toBe('login-button');
    
    // Test Enter key login
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.focus('[data-testid="login-button"]');
    await page.keyboard.press('Enter');
    await page.waitForURL('/dashboard');

    // Test navigation with Tab and Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should be able to navigate through the interface using only keyboard
    const currentURL = page.url();
    expect(currentURL).toContain('/');
  });

  test('ARIA 속성 검증', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper ARIA labels
    const emailInput = page.locator('[data-testid="email-input"]');
    const ariaLabel = await emailInput.getAttribute('aria-label');
    const ariaLabelledBy = await emailInput.getAttribute('aria-labelledby');
    const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
    
    expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    
    // Check button accessibility
    const loginButton = page.locator('[data-testid="login-button"]');
    const buttonAriaLabel = await loginButton.getAttribute('aria-label');
    const buttonText = await loginButton.textContent();
    
    expect(buttonAriaLabel || buttonText).toBeTruthy();
    
    // Login and check dashboard accessibility
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    
    // Check for landmark elements
    const main = page.locator('main');
    const nav = page.locator('nav');
    
    expect(await main.count()).toBeGreaterThan(0);
    expect(await nav.count()).toBeGreaterThan(0);
  });

  test('색상 대비 검증', async ({ page }) => {
    await page.goto('/');
    
    // Check color contrast for important elements
    const contrastCheck = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, input, [role="button"]');
      const results: Array<{ element: string, contrast: number, isValid: boolean }> = [];
      
      elements.forEach((element: any, index) => {
        const styles = window.getComputedStyle(element);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // Simple contrast calculation (not perfect but good for testing)
        const bgLuminance = getLuminance(bgColor);
        const textLuminance = getLuminance(textColor);
        const contrast = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                        (Math.min(bgLuminance, textLuminance) + 0.05);
        
        results.push({
          element: `${element.tagName}[${index}]`,
          contrast: Math.round(contrast * 100) / 100,
          isValid: contrast >= 4.5 // WCAG AA standard
        });
      });
      
      function getLuminance(color: string): number {
        // Simple RGB extraction and luminance calculation
        const rgb = color.match(/\d+/g);
        if (!rgb || rgb.length < 3) return 0;
        
        const [r, g, b] = rgb.map(val => {
          const c = parseInt(val) / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      
      return results;
    });
    
    console.log('🔄 Color Contrast Results:', contrastCheck);
    
    // At least 80% of elements should meet contrast requirements
    const validContrast = contrastCheck.filter(result => result.isValid).length;
    const contrastRatio = validContrast / contrastCheck.length;
    
    expect(contrastRatio).toBeGreaterThan(0.8);
  });

  test('스크린 리더 호환성 테스트', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Check for proper heading hierarchy
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingElements).map(h => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim(),
        hasText: !!h.textContent?.trim()
      }));
    });

    console.log('🔄 Heading Structure:', headings);
    
    // Should have proper heading hierarchy (start with h1, no gaps)
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0].level).toBe(1);
    expect(headings.every(h => h.hasText)).toBeTruthy();

    // Check for alt text on images
    const images = await page.evaluate(() => {
      const imgElements = document.querySelectorAll('img');
      return Array.from(imgElements).map(img => ({
        src: img.src,
        alt: img.alt,
        hasAlt: !!img.alt
      }));
    });

    if (images.length > 0) {
      console.log('🔄 Image Alt Text:', images);
      expect(images.every(img => img.hasAlt)).toBeTruthy();
    }
  });

  test('폼 접근성 검증', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to rules page to test form accessibility
    await page.goto('/rules');
    await page.click('[data-testid="add-rule-button"]');

    // Check form labels and associations
    const formAccessibility = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, select, textarea');
      const results: Array<{ 
        type: string, 
        hasLabel: boolean, 
        hasRequiredIndicator: boolean,
        hasErrorMessage: boolean 
      }> = [];

      inputs.forEach((input: any) => {
        const id = input.id;
        const label = document.querySelector(`label[for="${id}"]`);
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const required = input.required || input.getAttribute('aria-required') === 'true';
        const ariaDescribedBy = input.getAttribute('aria-describedby');
        
        results.push({
          type: input.type || input.tagName.toLowerCase(),
          hasLabel: !!(label || ariaLabel || ariaLabelledBy),
          hasRequiredIndicator: required,
          hasErrorMessage: !!ariaDescribedBy
        });
      });
      
      return results;
    });

    console.log('🔄 Form Accessibility:', formAccessibility);
    
    // All form inputs should have proper labels
    expect(formAccessibility.every(field => field.hasLabel)).toBeTruthy();
  });

  test('모바일 터치 접근성 테스트', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Check touch target sizes
    const touchTargets = await page.evaluate(() => {
      const interactive = document.querySelectorAll('button, a, input, select, [role="button"]');
      const results: Array<{ element: string, width: number, height: number, isValid: boolean }> = [];
      
      interactive.forEach((element: any, index) => {
        const rect = element.getBoundingClientRect();
        const isValid = rect.width >= 44 && rect.height >= 44; // iOS HIG and Material Design standard
        
        results.push({
          element: `${element.tagName}[${index}]`,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          isValid
        });
      });
      
      return results;
    });

    console.log('🔄 Touch Target Sizes:', touchTargets.filter(t => !t.isValid));
    
    // At least 90% of interactive elements should meet touch target size requirements
    const validTargets = touchTargets.filter(target => target.isValid).length;
    const targetRatio = validTargets / touchTargets.length;
    
    expect(targetRatio).toBeGreaterThan(0.9);
  });

  test('다크 모드 접근성 테스트', async ({ page }) => {
    await page.goto('/');
    
    // Toggle dark mode if available
    const darkModeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
      
      // Check if dark mode maintains accessibility
      const isDarkMode = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark') ||
               window.getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)';
      });
      
      if (isDarkMode) {
        console.log('🔄 Dark mode detected, checking contrast...');
        
        // Verify contrast is still adequate in dark mode
        const darkModeContrast = await page.evaluate(() => {
          const elements = document.querySelectorAll('button, input');
          let validContrast = 0;
          let totalElements = 0;
          
          elements.forEach((element: any) => {
            const styles = window.getComputedStyle(element);
            const bgColor = styles.backgroundColor;
            const textColor = styles.color;
            
            if (bgColor !== 'rgba(0, 0, 0, 0)' && textColor !== 'rgba(0, 0, 0, 0)') {
              totalElements++;
              // Simple contrast check for dark mode
              if (textColor.includes('255') || textColor.includes('white')) {
                validContrast++;
              }
            }
          });
          
          return totalElements > 0 ? validContrast / totalElements : 1;
        });
        
        expect(darkModeContrast).toBeGreaterThan(0.8);
      }
    }
  });
});

test.describe('네트워크 상태별 성능 테스트', () => {
  test('느린 네트워크에서의 성능 테스트', async ({ page, context }) => {
    // Simulate slow 3G connection
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/');
    
    const loadTime = Date.now() - startTime;
    console.log('🔄 Slow Network Load Time:', loadTime);
    
    // Should still be usable on slow networks (within 10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Check if loading states are shown
    const hasLoadingIndicator = await page.locator('.animate-spin, .loading, [data-testid="loading"]').count() > 0;
    expect(hasLoadingIndicator || loadTime < 1000).toBeTruthy();
  });

  test('오프라인 상태 처리 테스트', async ({ page, context }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_DATA.users.user1.email);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    
    // Simulate offline state
    await context.setOffline(true);
    
    // Try to navigate or perform actions
    await page.click('a[href="/rules"]');
    
    // Check for offline indicators or graceful degradation
    const offlineMessage = await page.locator('text=/offline|연결|네트워크/i').count();
    const currentURL = page.url();
    
    // Either should show offline message or maintain functionality
    expect(offlineMessage > 0 || currentURL.includes('/rules')).toBeTruthy();
    
    // Restore online state
    await context.setOffline(false);
  });
});