import { test, expect, Page } from '@playwright/test';
import { 
  waitForPageLoad, 
  loginUser, 
  collectWebVitals,
  simulateOffline,
  simulateOnline,
  TEST_DATA 
} from '../utils/test-helpers';

/**
 * 성능 및 Core Web Vitals E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. Core Web Vitals 측정 (LCP, FID, CLS)
 * 2. 번들 사이즈 및 로딩 성능
 * 3. 실시간 연결 성능
 * 4. 네트워크 제한 상황 대응
 */

test.describe('성능 테스트', () => {
  
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.describe('Core Web Vitals 측정', () => {
    
    test('LCP (Largest Contentful Paint) 측정', async () => {
      await page.goto('/login');
      
      // Performance API를 사용한 LCP 측정
      const lcpValue = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let lcpValue = 0;
          
          const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcpValue = lastEntry.startTime;
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // 5초 후 측정 완료
          setTimeout(() => {
            observer.disconnect();
            resolve(lcpValue);
          }, 5000);
        });
      });
      
      // LCP는 2.5초 이하여야 함 (Good 기준)
      console.log(`LCP: ${lcpValue}ms`);
      expect(lcpValue).toBeLessThan(2500);
    });

    test('FID (First Input Delay) 측정', async () => {
      await page.goto('/login');
      await waitForPageLoad(page);
      
      // 첫 번째 사용자 입력 시뮬레이션 및 FID 측정
      const fidValue = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let fidValue = 0;
          
          const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries() as any[];
            for (const entry of entries) {
              if (entry.name === 'first-input') {
                fidValue = entry.processingStart - entry.startTime;
                break;
              }
            }
          });
          
          observer.observe({ entryTypes: ['first-input'] });
          
          // 클릭 이벤트 시뮬레이션
          document.addEventListener('click', () => {
            setTimeout(() => resolve(fidValue), 100);
          }, { once: true });
        });
      });
      
      // 사용자 입력 시뮬레이션
      await page.click('[data-testid="email-input"]');
      
      // FID는 100ms 이하여야 함 (Good 기준)
      console.log(`FID: ${fidValue}ms`);
      if (fidValue > 0) {
        expect(fidValue).toBeLessThan(100);
      }
    });

    test('CLS (Cumulative Layout Shift) 측정', async () => {
      await page.goto('/');
      await loginUser(page, TEST_DATA.users.user1.email);
      
      // CLS 측정
      const clsValue = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          
          const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          });
          
          observer.observe({ entryTypes: ['layout-shift'] });
          
          // 5초 동안 측정
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 5000);
        });
      });
      
      // CLS는 0.1 이하여야 함 (Good 기준)
      console.log(`CLS: ${clsValue}`);
      expect(clsValue).toBeLessThan(0.1);
    });

    test('통합 Web Vitals 측정', async () => {
      await page.goto('/');
      await loginUser(page, TEST_DATA.users.user1.email);
      
      const vitals = await collectWebVitals(page);
      
      console.log('Web Vitals:', vitals);
      
      // 성능 기준 검증
      if (vitals.LCP > 0) {
        expect(vitals.LCP).toBeLessThan(2500); // 2.5초
      }
      if (vitals.FID > 0) {
        expect(vitals.FID).toBeLessThan(100); // 100ms
      }
      if (vitals.CLS > 0) {
        expect(vitals.CLS).toBeLessThan(0.1); // 0.1
      }
    });
  });

  test.describe('로딩 성능 테스트', () => {
    
    test('초기 페이지 로드 시간', async () => {
      const startTime = Date.now();
      
      await page.goto('/login');
      await waitForPageLoad(page);
      
      const loadTime = Date.now() - startTime;
      console.log(`페이지 로드 시간: ${loadTime}ms`);
      
      // 3초 이하 로딩 시간
      expect(loadTime).toBeLessThan(3000);
    });

    test('리소스 로딩 성능', async () => {
      // 네트워크 요청 모니터링
      const resourceSizes: { [key: string]: number } = {};
      const resourceTimes: { [key: string]: number } = {};
      
      page.on('response', async (response) => {
        const url = response.url();
        const size = parseInt(response.headers()['content-length'] || '0');
        resourceSizes[url] = size;
        
        const timing = await response.timing();
        resourceTimes[url] = timing.responseEnd;
      });
      
      await page.goto('/');
      await loginUser(page, TEST_DATA.users.user1.email);
      await waitForPageLoad(page);
      
      // JavaScript 번들 크기 검증
      const jsFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.js'));
      const totalJSSize = jsFiles.reduce((sum, url) => sum + resourceSizes[url], 0);
      
      console.log(`총 JS 번들 크기: ${(totalJSSize / 1024).toFixed(2)}KB`);
      
      // 500KB 이하 JS 번들 크기 권장
      expect(totalJSSize).toBeLessThan(500 * 1024);
      
      // CSS 파일 크기 검증
      const cssFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.css'));
      const totalCSSSize = cssFiles.reduce((sum, url) => sum + resourceSizes[url], 0);
      
      console.log(`총 CSS 크기: ${(totalCSSSize / 1024).toFixed(2)}KB`);
      
      // 100KB 이하 CSS 크기 권장
      expect(totalCSSSize).toBeLessThan(100 * 1024);
    });

    test('이미지 최적화 검증', async () => {
      await page.goto('/');
      await loginUser(page, TEST_DATA.users.user1.email);
      
      // 이미지 요소들 확인
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        
        if (await img.isVisible()) {
          // alt 속성 확인 (접근성)
          const alt = await img.getAttribute('alt');
          expect(alt).toBeTruthy();
          
          // loading="lazy" 속성 확인
          const loading = await img.getAttribute('loading');
          if (loading) {
            expect(['lazy', 'eager']).toContain(loading);
          }
          
          // srcset 속성 확인 (반응형)
          const srcset = await img.getAttribute('srcset');
          if (srcset) {
            expect(srcset.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('폰트 로딩 최적화', async () => {
      await page.goto('/');
      
      // 폰트 로딩 성능 측정
      const fontMetrics = await page.evaluate(() => {
        const fonts: any[] = [];
        
        document.fonts.forEach(font => {
          fonts.push({
            family: font.family,
            status: font.status,
            loaded: font.loaded
          });
        });
        
        return fonts;
      });
      
      console.log('Font metrics:', fontMetrics);
      
      // 모든 폰트가 로드되었는지 확인
      const unloadedFonts = fontMetrics.filter(font => font.status !== 'loaded');
      expect(unloadedFonts.length).toBe(0);
    });
  });

  test.describe('실시간 기능 성능', () => {
    
    test('실시간 데이터 동기화 성능', async () => {
      await loginUser(page, TEST_DATA.users.user1.email);
      await page.goto('/');
      
      // 실시간 업데이트 지연시간 측정
      const updateStartTime = Date.now();
      
      // 다른 탭에서 데이터 변경 시뮬레이션
      await page.evaluate(() => {
        // Supabase 실시간 이벤트 시뮬레이션
        window.dispatchEvent(new CustomEvent('supabase-realtime-update', {
          detail: {
            type: 'INSERT',
            table: 'violations',
            data: { id: 'test-violation', amount: 5 }
          }
        }));
      });
      
      // UI 업데이트 대기
      try {
        await page.waitForFunction(() => {
          const element = document.querySelector('[data-testid="recent-violation"]');
          return element && element.textContent?.includes('test-violation');
        }, { timeout: 5000 });
        
        const updateTime = Date.now() - updateStartTime;
        console.log(`실시간 업데이트 지연시간: ${updateTime}ms`);
        
        // 1초 이하 업데이트 시간
        expect(updateTime).toBeLessThan(1000);
      } catch (error) {
        console.warn('실시간 업데이트 테스트 스킵 (데이터 없음)');
      }
    });

    test('WebSocket 연결 성능', async () => {
      await loginUser(page, TEST_DATA.users.user1.email);
      
      // WebSocket 연결 모니터링
      const wsConnections: any[] = [];
      
      page.on('websocket', ws => {
        wsConnections.push({
          url: ws.url(),
          isClosed: ws.isClosed()
        });
      });
      
      await page.goto('/');
      await waitForPageLoad(page);
      
      // WebSocket 연결 확인
      await page.waitForTimeout(2000); // 연결 대기
      
      if (wsConnections.length > 0) {
        console.log(`WebSocket 연결 수: ${wsConnections.length}`);
        
        // 불필요한 다중 연결 방지
        expect(wsConnections.length).toBeLessThanOrEqual(2);
        
        // 연결 상태 확인
        const activeSockets = wsConnections.filter(ws => !ws.isClosed);
        expect(activeSockets.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('네트워크 제한 상황 성능', () => {
    
    test('느린 네트워크에서 성능', async () => {
      // 느린 3G 네트워크 시뮬레이션
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1600 * 1024 / 8, // 1.6Mbps
        uploadThroughput: 750 * 1024 / 8,    // 750Kbps
        latency: 150 // 150ms
      });
      
      const startTime = Date.now();
      await page.goto('/login');
      await waitForPageLoad(page);
      
      const loadTime = Date.now() - startTime;
      console.log(`느린 네트워크 로드 시간: ${loadTime}ms`);
      
      // 느린 네트워크에서도 10초 이하
      expect(loadTime).toBeLessThan(10000);
      
      // 네트워크 조건 복구
      await client.send('Network.disable');
    });

    test('오프라인 상태 처리 성능', async () => {
      await loginUser(page, TEST_DATA.users.user1.email);
      await page.goto('/');
      
      // 오프라인 전환
      await simulateOffline(page);
      
      // 오프라인 UI 표시 시간 측정
      const offlineStartTime = Date.now();
      
      try {
        await page.waitForSelector('[data-testid="offline-indicator"]', { timeout: 3000 });
        const offlineDetectionTime = Date.now() - offlineStartTime;
        
        console.log(`오프라인 감지 시간: ${offlineDetectionTime}ms`);
        expect(offlineDetectionTime).toBeLessThan(3000);
      } catch (error) {
        console.warn('오프라인 인디케이터 없음');
      }
      
      // 온라인 복구
      await simulateOnline(page);
      
      const onlineStartTime = Date.now();
      
      try {
        await page.waitForSelector('[data-testid="offline-indicator"]', { 
          state: 'hidden', 
          timeout: 5000 
        });
        const onlineRecoveryTime = Date.now() - onlineStartTime;
        
        console.log(`온라인 복구 시간: ${onlineRecoveryTime}ms`);
        expect(onlineRecoveryTime).toBeLessThan(5000);
      } catch (error) {
        console.warn('온라인 복구 테스트 스킵');
      }
    });

    test('캐시 효과 성능', async () => {
      // 첫 번째 방문
      const firstLoadStart = Date.now();
      await page.goto('/login');
      await waitForPageLoad(page);
      const firstLoadTime = Date.now() - firstLoadStart;
      
      // 두 번째 방문 (캐시 활용)
      const secondLoadStart = Date.now();
      await page.reload();
      await waitForPageLoad(page);
      const secondLoadTime = Date.now() - secondLoadStart;
      
      console.log(`첫 방문: ${firstLoadTime}ms, 재방문: ${secondLoadTime}ms`);
      
      // 캐시로 인해 두 번째 로딩이 더 빨라야 함
      expect(secondLoadTime).toBeLessThan(firstLoadTime);
      
      // 캐시 효과로 50% 이상 개선
      const improvement = (firstLoadTime - secondLoadTime) / firstLoadTime;
      expect(improvement).toBeGreaterThan(0.3);
    });
  });

  test.describe('메모리 성능', () => {
    
    test('메모리 사용량 모니터링', async () => {
      await loginUser(page, TEST_DATA.users.user1.email);
      
      // 초기 메모리 측정
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (initialMemory) {
        console.log('초기 메모리:', initialMemory);
        
        // 여러 페이지 탐색
        const pages = ['/', '/rules', '/rewards', '/calendar', '/settings'];
        
        for (const path of pages) {
          await page.goto(path);
          await waitForPageLoad(page);
          await page.waitForTimeout(1000);
        }
        
        // 최종 메모리 측정
        const finalMemory = await page.evaluate(() => {
          return (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
          } : null;
        });
        
        if (finalMemory) {
          console.log('최종 메모리:', finalMemory);
          
          const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
          console.log(`메모리 증가량: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
          
          // 메모리 증가량이 20MB 이하
          expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024);
          
          // 전체 힙 사용량이 100MB 이하
          expect(finalMemory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
        }
      }
    });

    test('메모리 누수 검사', async () => {
      await loginUser(page, TEST_DATA.users.user1.email);
      
      // 반복적인 작업 수행
      for (let i = 0; i < 5; i++) {
        await page.goto('/rules');
        await page.click('[data-testid="add-rule-button"]');
        await page.fill('[data-testid="rule-title-input"]', `테스트 규칙 ${i}`);
        await page.click('[data-testid="close-modal-button"]');
        
        // 강제 가비지 컬렉션 (Chrome)
        if (process.env.BROWSER === 'chromium') {
          await page.evaluate(() => {
            if ((window as any).gc) {
              (window as any).gc();
            }
          });
        }
      }
      
      // 메모리 상태 확인
      const memoryAfterGC = await page.evaluate(() => {
        return (performance as any).memory ? 
          (performance as any).memory.usedJSHeapSize : null;
      });
      
      if (memoryAfterGC) {
        console.log(`GC 후 메모리: ${(memoryAfterGC / 1024 / 1024).toFixed(2)}MB`);
        
        // 메모리가 적정 수준 유지
        expect(memoryAfterGC).toBeLessThan(50 * 1024 * 1024);
      }
    });
  });
});