import { test, expect, Page } from '@playwright/test';
import { 
  waitForPageLoad, 
  loginUser, 
  setMobileViewport,
  addRule,
  recordViolation,
  addReward,
  expectToast,
  clickMobileNav,
  TEST_DATA 
} from '../utils/test-helpers';

/**
 * 모바일 터치 인터랙션 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 터치 제스처 (탭, 롱프레스, 스와이프, 핀치)
 * 2. 모바일 특화 UI 컴포넌트 동작
 * 3. 하단 시트, 액션 시트, 컨텍스트 메뉴
 * 4. 풀 투 리프레시 및 스크롤 인터랙션
 * 5. 햅틱 피드백 시뮬레이션
 */

test.describe('모바일 터치 인터랙션 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    await setMobileViewport(page);
    await loginUser(page, TEST_DATA.users.user1.email);
    await waitForPageLoad(page);
  });

  test.describe('기본 터치 제스처 테스트', () => {
    
    test('단일 탭 제스처', async ({ page }) => {
      await page.goto('/');
      
      // 카드 탭 테스트
      const statsCard = page.locator('[data-testid="stats-card"]').first();
      if (await statsCard.count() > 0) {
        
        // 터치 이벤트로 탭 시뮬레이션
        await statsCard.dispatchEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 300 }]
        });
        
        await statsCard.dispatchEvent('touchend', {
          changedTouches: [{ clientX: 200, clientY: 300 }]
        });
        
        // 탭 결과 확인 (상세 뷰로 이동하거나 모달 오픈)
        const detailModal = page.locator('[data-testid="stats-detail-modal"]');
        if (await detailModal.count() > 0) {
          await expect(detailModal).toBeVisible();
        }
      }
      
      // 버튼 탭 테스트
      const actionButton = page.locator('[data-testid="quick-action-button"]').first();
      if (await actionButton.count() > 0) {
        await actionButton.tap();
        
        // 버튼 활성화 확인
        await expect(actionButton).toHaveClass(/active|pressed/);
      }
    });

    test('롱프레스 제스처', async ({ page }) => {
      await page.goto('/rules');
      
      // 규칙이 없으면 추가
      if (await page.locator('[data-testid^="rule-item-"]').count() === 0) {
        await addRule(page, TEST_DATA.rules[0]);
      }
      
      const ruleItem = page.locator('[data-testid^="rule-item-"]').first();
      
      // 롱프레스 시뮬레이션 (1초 이상 터치 유지)
      await ruleItem.dispatchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 300 }]
      });
      
      // 롱프레스 동안 대기
      await page.waitForTimeout(1200);
      
      await ruleItem.dispatchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 300 }]
      });
      
      // 롱프레스 컨텍스트 메뉴 확인
      const contextMenu = page.locator('[data-testid="rule-context-menu"]');
      await expect(contextMenu).toBeVisible();
      
      // 컨텍스트 메뉴 옵션들 확인
      await expect(contextMenu.locator('[data-testid="edit-option"]')).toBeVisible();
      await expect(contextMenu.locator('[data-testid="delete-option"]')).toBeVisible();
      await expect(contextMenu.locator('[data-testid="duplicate-option"]')).toBeVisible();
      
      // 햅틱 피드백 시뮬레이션 확인 (실제로는 navigator.vibrate 호출 확인)
      const vibrateCall = await page.evaluate(() => {
        return window.vibrateCallsCount || 0;
      });
      
      if (vibrateCall > 0) {
        console.log('Haptic feedback triggered for long press');
      }
    });

    test('스와이프 제스처 - 좌우', async ({ page }) => {
      await page.goto('/violations');
      
      // 위반 기록이 없으면 생성
      if (await page.locator('[data-testid^="violation-item-"]').count() === 0) {
        await addRule(page, TEST_DATA.rules[0]);
        await recordViolation(page, TEST_DATA.rules[0].title);
        await page.goto('/violations');
      }
      
      const violationItem = page.locator('[data-testid^="violation-item-"]').first();
      
      // 좌측 스와이프 (삭제 액션 표시)
      const itemBox = await violationItem.boundingBox();
      if (itemBox) {
        const startX = itemBox.x + itemBox.width - 50;
        const endX = itemBox.x + 50;
        const centerY = itemBox.y + itemBox.height / 2;
        
        await violationItem.dispatchEvent('touchstart', {
          touches: [{ clientX: startX, clientY: centerY }]
        });
        
        // 스와이프 동작
        for (let i = 0; i < 10; i++) {
          const currentX = startX - (startX - endX) * (i / 9);
          await violationItem.dispatchEvent('touchmove', {
            touches: [{ clientX: currentX, clientY: centerY }]
          });
          await page.waitForTimeout(10);
        }
        
        await violationItem.dispatchEvent('touchend', {
          changedTouches: [{ clientX: endX, clientY: centerY }]
        });
        
        // 스와이프 액션 버튼들 확인
        await expect(violationItem.locator('[data-testid="swipe-delete-button"]')).toBeVisible();
        await expect(violationItem.locator('[data-testid="swipe-edit-button"]')).toBeVisible();
      }
      
      // 우측 스와이프 (되돌리기)
      await violationItem.dispatchEvent('touchstart', {
        touches: [{ clientX: 50, clientY: 200 }]
      });
      
      await violationItem.dispatchEvent('touchmove', {
        touches: [{ clientX: 200, clientY: 200 }]
      });
      
      await violationItem.dispatchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 200 }]
      });
      
      // 스와이프 액션 버튼들이 사라졌는지 확인
      await expect(violationItem.locator('[data-testid="swipe-delete-button"]')).not.toBeVisible();
    });

    test('스와이프 제스처 - 상하 (풀 투 리프레시)', async ({ page }) => {
      await page.goto('/');
      
      const mainContent = page.locator('[data-testid="main-content"]');
      
      // 페이지 최상단으로 스크롤
      await mainContent.evaluate(el => {
        el.scrollTop = 0;
      });
      
      // 상단에서 아래로 스와이프 (풀 투 리프레시)
      await mainContent.dispatchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      
      // 아래로 당기기 (오버스크롤)
      for (let i = 0; i < 10; i++) {
        const currentY = 100 + i * 15; // 150px 아래로
        await mainContent.dispatchEvent('touchmove', {
          touches: [{ clientX: 200, clientY: currentY }]
        });
        await page.waitForTimeout(10);
      }
      
      await mainContent.dispatchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 250 }]
      });
      
      // 풀 투 리프레시 인디케이터 확인
      const refreshIndicator = page.locator('[data-testid="pull-refresh-indicator"]');
      if (await refreshIndicator.count() > 0) {
        await expect(refreshIndicator).toBeVisible();
        
        // 리프레시 완료 대기
        await expect(refreshIndicator).not.toBeVisible();
        
        // 성공 메시지 확인
        await expectToast(page, '데이터가 새로고침되었습니다.');
      }
    });

    test('핀치 줌 제스처 (이미지/차트)', async ({ page }) => {
      await page.goto('/');
      
      // 확대 가능한 요소 찾기 (차트나 이미지)
      const zoomableElement = page.locator('[data-testid="zoomable-chart"], [data-testid="zoomable-image"]').first();
      
      if (await zoomableElement.count() > 0) {
        const elementBox = await zoomableElement.boundingBox();
        if (elementBox) {
          const centerX = elementBox.x + elementBox.width / 2;
          const centerY = elementBox.y + elementBox.height / 2;
          
          // 핀치 줌 인 (확대)
          await zoomableElement.dispatchEvent('touchstart', {
            touches: [
              { clientX: centerX - 50, clientY: centerY },
              { clientX: centerX + 50, clientY: centerY }
            ]
          });
          
          // 두 터치 포인트를 멀리 이동 (확대)
          for (let i = 0; i < 10; i++) {
            const distance = 50 + i * 10; // 점점 멀어짐
            await zoomableElement.dispatchEvent('touchmove', {
              touches: [
                { clientX: centerX - distance, clientY: centerY },
                { clientX: centerX + distance, clientY: centerY }
              ]
            });
            await page.waitForTimeout(10);
          }
          
          await zoomableElement.dispatchEvent('touchend', {
            changedTouches: [
              { clientX: centerX - 150, clientY: centerY },
              { clientX: centerX + 150, clientY: centerY }
            ]
          });
          
          // 확대 상태 확인
          const zoomLevel = await zoomableElement.evaluate(el => {
            return window.getComputedStyle(el).transform;
          });
          
          expect(zoomLevel).toMatch(/scale\([1-9]\.|matrix\(/); // 확대된 상태
          
          // 확대된 상태에서 줌 컨트롤 표시 확인
          const zoomControls = page.locator('[data-testid="zoom-controls"]');
          if (await zoomControls.count() > 0) {
            await expect(zoomControls).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('모바일 UI 컴포넌트 인터랙션', () => {
    
    test('하단 시트 (Bottom Sheet) 인터랙션', async ({ page }) => {
      await page.goto('/violations/new');
      
      // 규칙 선택 하단 시트 열기
      const selectRuleButton = page.locator('[data-testid="select-rule-button"]');
      if (await selectRuleButton.count() > 0) {
        await selectRuleButton.tap();
        
        // 하단 시트 표시 확인
        const bottomSheet = page.locator('[data-testid="rule-selection-sheet"]');
        await expect(bottomSheet).toBeVisible();
        await expect(bottomSheet).toHaveClass(/open|visible/);
        
        // 하단 시트 드래그로 높이 조절
        const sheetHandle = bottomSheet.locator('[data-testid="sheet-handle"]');
        await sheetHandle.dragTo(page.locator('body'), {
          targetPosition: { x: 200, y: 100 } // 위로 드래그
        });
        
        // 확장된 상태 확인
        await expect(bottomSheet).toHaveClass(/expanded/);
        
        // 시트 외부 영역 탭하여 닫기
        await page.tap('body', { position: { x: 200, y: 100 } });
        await expect(bottomSheet).not.toBeVisible();
      }
    });

    test('액션 시트 (Action Sheet) 메뉴', async ({ page }) => {
      await page.goto('/settings');
      
      // 프로필 메뉴 버튼 탭
      const profileMenuButton = page.locator('[data-testid="profile-menu-button"]');
      if (await profileMenuButton.count() > 0) {
        await profileMenuButton.tap();
        
        // 액션 시트 표시 확인
        const actionSheet = page.locator('[data-testid="profile-action-sheet"]');
        await expect(actionSheet).toBeVisible();
        
        // 액션 옵션들 확인
        const actions = [
          { selector: '[data-testid="edit-profile-action"]', label: '프로필 편집' },
          { selector: '[data-testid="change-theme-action"]', label: '테마 변경' },
          { selector: '[data-testid="logout-action"]', label: '로그아웃' },
          { selector: '[data-testid="cancel-action"]', label: '취소' }
        ];
        
        for (const action of actions) {
          const actionElement = actionSheet.locator(action.selector);
          await expect(actionElement).toBeVisible();
          await expect(actionElement).toContainText(action.label);
          
          // 터치 타겟 크기 확인
          const actionBox = await actionElement.boundingBox();
          expect(actionBox?.height).toBeGreaterThanOrEqual(44);
        }
        
        // 취소 버튼으로 시트 닫기
        await actionSheet.locator('[data-testid="cancel-action"]').tap();
        await expect(actionSheet).not.toBeVisible();
      }
    });

    test('플로팅 액션 버튼 (FAB) 확장', async ({ page }) => {
      await page.goto('/');
      
      const fab = page.locator('[data-testid="floating-action-button"]');
      if (await fab.count() > 0) {
        
        // FAB 터치로 확장
        await fab.tap();
        
        // 확장된 액션 버튼들 확인
        const fabMenu = page.locator('[data-testid="fab-menu"]');
        await expect(fabMenu).toBeVisible();
        
        const fabActions = [
          '[data-testid="fab-add-rule"]',
          '[data-testid="fab-record-violation"]', 
          '[data-testid="fab-add-reward"]'
        ];
        
        for (const selector of fabActions) {
          const action = fabMenu.locator(selector);
          if (await action.count() > 0) {
            await expect(action).toBeVisible();
            
            // 애니메이션 확인 (opacity와 transform)
            await expect(action).toHaveCSS('opacity', '1');
            
            const transform = await action.evaluate(el => 
              window.getComputedStyle(el).transform
            );
            expect(transform).not.toBe('none'); // 애니메이션이 적용됨
          }
        }
        
        // 특정 액션 선택
        const addViolationAction = fabMenu.locator('[data-testid="fab-record-violation"]');
        if (await addViolationAction.count() > 0) {
          await addViolationAction.tap();
          
          // 위반 기록 페이지로 이동 확인
          await expect(page).toHaveURL(/.*\/violations\/new/);
        }
        
        // FAB 메뉴 자동 닫힘 확인
        await expect(fabMenu).not.toBeVisible();
      }
    });

    test('스와이프 탭 네비게이션', async ({ page }) => {
      await page.goto('/rewards');
      
      // 탭 컨테이너가 있는지 확인
      const tabContainer = page.locator('[data-testid="rewards-tabs"]');
      if (await tabContainer.count() > 0) {
        
        const tabContent = page.locator('[data-testid="tab-content"]');
        
        // 현재 활성 탭 확인
        let currentTab = await page.locator('[data-testid^="tab-"]:not([data-testid$="-content"]).active').getAttribute('data-tab');
        
        // 오른쪽으로 스와이프 (다음 탭)
        const contentBox = await tabContent.boundingBox();
        if (contentBox) {
          const centerY = contentBox.y + contentBox.height / 2;
          const startX = contentBox.x + contentBox.width - 50;
          const endX = contentBox.x + 50;
          
          await tabContent.dispatchEvent('touchstart', {
            touches: [{ clientX: startX, clientY: centerY }]
          });
          
          await tabContent.dispatchEvent('touchmove', {
            touches: [{ clientX: endX, clientY: centerY }]
          });
          
          await tabContent.dispatchEvent('touchend', {
            changedTouches: [{ clientX: endX, clientY: centerY }]
          });
          
          // 탭 전환 확인
          await page.waitForTimeout(300); // 애니메이션 대기
          const newTab = await page.locator('[data-testid^="tab-"]:not([data-testid$="-content"]).active').getAttribute('data-tab');
          expect(newTab).not.toBe(currentTab);
          
          // 스와이프 인디케이터 확인
          const swipeIndicator = page.locator('[data-testid="swipe-indicator"]');
          if (await swipeIndicator.count() > 0) {
            const indicatorPosition = await swipeIndicator.evaluate(el => 
              window.getComputedStyle(el).transform
            );
            expect(indicatorPosition).toMatch(/translateX/);
          }
        }
      }
    });
  });

  test.describe('향상된 터치 피드백', () => {
    
    test('터치 리플 효과', async ({ page }) => {
      await page.goto('/');
      
      // 리플 효과가 있는 버튼 찾기
      const rippleButton = page.locator('[data-testid="ripple-button"], .ripple, [class*="ripple"]').first();
      
      if (await rippleButton.count() > 0) {
        const buttonBox = await rippleButton.boundingBox();
        if (buttonBox) {
          const tapX = buttonBox.x + buttonBox.width / 3;
          const tapY = buttonBox.y + buttonBox.height / 3;
          
          // 터치 시작
          await rippleButton.dispatchEvent('touchstart', {
            touches: [{ clientX: tapX, clientY: tapY }]
          });
          
          // 리플 효과 요소 확인
          const rippleEffect = rippleButton.locator('.ripple-effect, [class*="ripple-effect"]');
          if (await rippleEffect.count() > 0) {
            await expect(rippleEffect).toBeVisible();
            
            // 리플 위치가 터치 포인트와 일치하는지 확인
            const rippleBox = await rippleEffect.boundingBox();
            if (rippleBox) {
              const rippleCenterX = rippleBox.x + rippleBox.width / 2;
              const rippleCenterY = rippleBox.y + rippleBox.height / 2;
              
              expect(Math.abs(rippleCenterX - tapX)).toBeLessThan(20);
              expect(Math.abs(rippleCenterY - tapY)).toBeLessThan(20);
            }
          }
          
          await rippleButton.dispatchEvent('touchend', {
            changedTouches: [{ clientX: tapX, clientY: tapY }]
          });
          
          // 리플 효과 종료 확인
          await page.waitForTimeout(500);
          if (await rippleEffect.count() > 0) {
            await expect(rippleEffect).not.toBeVisible();
          }
        }
      }
    });

    test('햅틱 피드백 시뮬레이션', async ({ page }) => {
      await page.goto('/violations/new');
      
      // 햅틱 피드백 호출을 추적하는 스크립트 주입
      await page.addInitScript(() => {
        let vibrateCount = 0;
        const originalVibrate = navigator.vibrate;
        
        navigator.vibrate = function(pattern) {
          vibrateCount++;
          window.vibrateCallsCount = vibrateCount;
          window.lastVibratePattern = pattern;
          
          // 실제 진동은 테스트 환경에서 작동하지 않으므로 로그만 기록
          console.log('Vibrate called with pattern:', pattern);
          
          return originalVibrate ? originalVibrate.call(navigator, pattern) : true;
        };
      });
      
      // 규칙이 없으면 추가
      if (await page.locator('[data-testid^="rule-option-"]').count() === 0) {
        await addRule(page, TEST_DATA.rules[0]);
        await page.goto('/violations/new');
      }
      
      // 규칙 선택 시 햅틱 피드백
      await page.click('[data-testid^="rule-option-"]');
      
      let vibrateCount = await page.evaluate(() => window.vibrateCallsCount || 0);
      expect(vibrateCount).toBeGreaterThan(0);
      
      // 위반 기록 버튼 터치 시 햅틱 피드백
      await page.click('[data-testid="record-violation-button"]');
      
      vibrateCount = await page.evaluate(() => window.vibrateCallsCount || 0);
      expect(vibrateCount).toBeGreaterThan(1); // 두 번째 햅틱 피드백
      
      // 마지막 진동 패턴 확인
      const lastPattern = await page.evaluate(() => window.lastVibratePattern);
      expect(lastPattern).toBeDefined();
    });

    test('터치 피드백 지연 및 정확도', async ({ page }) => {
      await page.goto('/rules');
      
      // 규칙이 없으면 추가
      if (await page.locator('[data-testid^="rule-item-"]').count() === 0) {
        await addRule(page, TEST_DATA.rules[0]);
      }
      
      const ruleItem = page.locator('[data-testid^="rule-item-"]').first();
      
      // 터치 시작 시간 기록
      const touchStartTime = Date.now();
      
      await ruleItem.dispatchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 300 }]
      });
      
      // 즉시 피드백 확인 (100ms 이내)
      await page.waitForTimeout(50);
      
      const hasImmediateFeedback = await ruleItem.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
               style.transform !== 'none' ||
               el.classList.contains('touched') ||
               el.classList.contains('active');
      });
      
      expect(hasImmediateFeedback).toBe(true);
      
      await ruleItem.dispatchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 300 }]
      });
      
      const touchEndTime = Date.now();
      const totalTouchTime = touchEndTime - touchStartTime;
      
      // 터치 피드백이 100ms 이내에 시작되었는지 확인
      expect(totalTouchTime).toBeLessThan(200); // 충분한 여유를 둠
    });
  });

  test.describe('제스처 충돌 및 우선순위', () => {
    
    test('스크롤 vs 스와이프 제스처 구분', async ({ page }) => {
      await page.goto('/violations');
      
      // 위반 목록이 충분히 길어야 함
      for (let i = 0; i < 5; i++) {
        await recordViolation(page, 'Test Rule', 10);
      }
      
      await page.goto('/violations');
      
      const violationsList = page.locator('[data-testid="violations-list"]');
      const firstItem = page.locator('[data-testid^="violation-item-"]').first();
      
      // 수직 스크롤 (위아래 움직임이 많음)
      const scrollStartY = 400;
      const scrollEndY = 200;
      
      await violationsList.dispatchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: scrollStartY }]
      });
      
      // 주로 Y축 움직임 (스크롤로 인식되어야 함)
      for (let i = 0; i < 10; i++) {
        const currentY = scrollStartY - (scrollStartY - scrollEndY) * (i / 9);
        const currentX = 200 + (i < 5 ? i * 2 : (10 - i) * 2); // 약간의 X축 흔들림
        
        await violationsList.dispatchEvent('touchmove', {
          touches: [{ clientX: currentX, clientY: currentY }]
        });
        await page.waitForTimeout(10);
      }
      
      await violationsList.dispatchEvent('touchend', {
        changedTouches: [{ clientX: 204, clientY: scrollEndY }]
      });
      
      // 스크롤이 발생했는지 확인 (스와이프 액션은 발생하지 않아야 함)
      await expect(firstItem.locator('[data-testid="swipe-actions"]')).not.toBeVisible();
      
      // 수평 스와이프 (좌우 움직임이 많음)
      const swipeStartX = 300;
      const swipeEndX = 100;
      
      await firstItem.dispatchEvent('touchstart', {
        touches: [{ clientX: swipeStartX, clientY: 300 }]
      });
      
      // 주로 X축 움직임 (스와이프로 인식되어야 함)
      for (let i = 0; i < 10; i++) {
        const currentX = swipeStartX - (swipeStartX - swipeEndX) * (i / 9);
        const currentY = 300 + (i % 2 === 0 ? 2 : -2); // 약간의 Y축 흔들림
        
        await firstItem.dispatchEvent('touchmove', {
          touches: [{ clientX: currentX, clientY: currentY }]
        });
        await page.waitForTimeout(10);
      }
      
      await firstItem.dispatchEvent('touchend', {
        changedTouches: [{ clientX: swipeEndX, clientY: 298 }]
      });
      
      // 스와이프 액션이 표시되었는지 확인
      const swipeActions = firstItem.locator('[data-testid="swipe-actions"]');
      if (await swipeActions.count() > 0) {
        await expect(swipeActions).toBeVisible();
      }
    });

    test('더블 탭 vs 싱글 탭 구분', async ({ page }) => {
      await page.goto('/');
      
      const zoomableElement = page.locator('[data-testid="stats-chart"]').first();
      if (await zoomableElement.count() > 0) {
        
        // 싱글 탭 테스트
        await zoomableElement.tap();
        await page.waitForTimeout(350); // 더블탭 대기 시간보다 길게
        
        // 싱글 탭 액션 확인 (상세 정보 표시 등)
        const singleTapResult = page.locator('[data-testid="chart-tooltip"], [data-testid="chart-details"]');
        if (await singleTapResult.count() > 0) {
          await expect(singleTapResult).toBeVisible();
        }
        
        // 더블 탭 테스트
        await zoomableElement.dblclick();
        
        // 더블 탭 액션 확인 (확대/축소)
        const doubleTapResult = page.locator('[data-testid="zoom-in-state"], [data-testid="zoom-controls"]');
        if (await doubleTapResult.count() > 0) {
          await expect(doubleTapResult).toBeVisible();
        }
        
        // 줌 레벨 변화 확인
        const transform = await zoomableElement.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        expect(transform).toMatch(/scale\(|matrix\(/);
      }
    });

    test('터치 vs 마우스 이벤트 구분', async ({ page }) => {
      await page.goto('/rules');
      
      // 규칙이 없으면 추가
      if (await page.locator('[data-testid^="rule-item-"]').count() === 0) {
        await addRule(page, TEST_DATA.rules[0]);
      }
      
      const ruleItem = page.locator('[data-testid^="rule-item-"]').first();
      
      // 터치 이벤트로 상호작용
      await ruleItem.dispatchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 300 }]
      });
      
      // 터치 기반 UI 표시 확인
      const touchUI = ruleItem.locator('[data-testid="touch-indicators"], .touch-only');
      if (await touchUI.count() > 0) {
        await expect(touchUI).toBeVisible();
      }
      
      await ruleItem.dispatchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 300 }]
      });
      
      // 마우스 이벤트로 상호작용 (시뮬레이션)
      await ruleItem.dispatchEvent('mouseenter');
      
      // 마우스 기반 UI 표시 확인 (호버 효과 등)
      const mouseUI = ruleItem.locator('[data-testid="hover-indicators"], .hover-only');
      if (await mouseUI.count() > 0) {
        await expect(mouseUI).toBeVisible();
      }
      
      await ruleItem.dispatchEvent('mouseleave');
      
      // 터치 디바이스에서는 호버 효과가 지속되지 않아야 함
      await page.waitForTimeout(100);
      if (await mouseUI.count() > 0) {
        await expect(mouseUI).not.toBeVisible();
      }
    });
  });

  test.describe('접근성 터치 지원', () => {
    
    test('큰 터치 타겟 모드', async ({ page }) => {
      // 접근성 설정 시뮬레이션
      await page.evaluate(() => {
        localStorage.setItem('accessibility-large-touch', 'true');
        document.documentElement.setAttribute('data-large-touch', 'true');
      });
      
      await page.goto('/');
      
      // 큰 터치 타겟 적용 확인
      const navItems = page.locator('[data-testid^="nav-"]');
      const navCount = await navItems.count();
      
      for (let i = 0; i < navCount; i++) {
        const navItem = navItems.nth(i);
        const box = await navItem.boundingBox();
        
        // 접근성 모드에서 더 큰 터치 타겟 (최소 48px)
        expect(box?.height).toBeGreaterThanOrEqual(48);
        expect(box?.width).toBeGreaterThanOrEqual(48);
      }
      
      // 버튼 간 간격도 더 넓어야 함
      if (navCount > 1) {
        const firstNav = await navItems.nth(0).boundingBox();
        const secondNav = await navItems.nth(1).boundingBox();
        
        if (firstNav && secondNav) {
          const gap = Math.abs(secondNav.x - (firstNav.x + firstNav.width));
          expect(gap).toBeGreaterThanOrEqual(16); // 접근성 모드에서 더 큰 간격
        }
      }
    });

    test('터치 지원 스크린 리더 내비게이션', async ({ page }) => {
      await page.goto('/rules');
      
      // 스크린 리더 사용자를 위한 터치 네비게이션 테스트
      const ruleItems = page.locator('[data-testid^="rule-item-"]');
      
      if (await ruleItems.count() === 0) {
        await addRule(page, TEST_DATA.rules[0]);
      }
      
      const firstRule = ruleItems.first();
      
      // 포커스 이동 확인
      await firstRule.focus();
      await expect(firstRule).toBeFocused();
      
      // 터치로 활성화
      await firstRule.tap();
      
      // ARIA 속성 확인
      await expect(firstRule).toHaveAttribute('role');
      await expect(firstRule).toHaveAttribute('aria-label');
      
      // 터치 액션에 대한 음성 안내 확인 (aria-live 영역)
      const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
      if (await liveRegion.count() > 0) {
        const announcement = await liveRegion.textContent();
        expect(announcement).toBeTruthy();
      }
    });

    test('보이스 오버 지원 터치 제스처', async ({ page }) => {
      // iOS VoiceOver 시뮬레이션
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-voiceover', 'true');
      });
      
      await page.goto('/violations/new');
      
      // VoiceOver 모드에서 터치 탐색
      const formElements = page.locator('input, button, select');
      const elementCount = await formElements.count();
      
      for (let i = 0; i < Math.min(elementCount, 3); i++) {
        const element = formElements.nth(i);
        
        // VoiceOver 탐색 터치 (한 손가락 탭)
        await element.dispatchEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 300 }]
        });
        
        await element.dispatchEvent('touchend', {
          changedTouches: [{ clientX: 200, clientY: 300 }]
        });
        
        // 포커스 확인
        await expect(element).toBeFocused();
        
        // 접근성 정보 확인
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaDescribedBy = await element.getAttribute('aria-describedby');
        
        expect(ariaLabel || ariaDescribedBy).toBeTruthy();
      }
      
      // VoiceOver 활성화 제스처 (더블 탭)
      const submitButton = page.locator('[data-testid="record-violation-button"]');
      if (await submitButton.count() > 0) {
        await submitButton.dblclick();
        
        // 버튼 활성화 확인
        // (실제 앱에서는 VoiceOver가 있을 때만 더블탭으로 활성화)
      }
    });
  });
});