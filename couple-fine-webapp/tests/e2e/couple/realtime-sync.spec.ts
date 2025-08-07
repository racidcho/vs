import { test, expect, Page, BrowserContext } from '@playwright/test';
import { 
  waitForPageLoad, 
  loginUser, 
  createCouple,
  joinCouple,
  addRule,
  recordViolation,
  addReward,
  expectToast,
  expectCurrentUrl,
  waitForRealtimeUpdate,
  TEST_DATA 
} from '../utils/test-helpers';

/**
 * 커플 시스템 실시간 동기화 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 두 브라우저 세션으로 커플 연결 시뮬레이션
 * 2. 실시간 데이터 동기화 검증 (규칙, 위반, 보상)
 * 3. 권한 및 보안 테스트
 * 4. 네트워크 연결 중단/복구 시나리오
 * 5. 동시 편집 충돌 처리 테스트
 */

test.describe('커플 시스템 실시간 동기화 테스트', () => {
  
  let user1Context: BrowserContext;
  let user2Context: BrowserContext;
  let user1Page: Page;
  let user2Page: Page;
  let coupleCode: string;

  test.beforeAll(async ({ browser }) => {
    // 두 사용자 브라우저 컨텍스트 생성
    user1Context = await browser.newContext();
    user2Context = await browser.newContext();
    
    user1Page = await user1Context.newPage();
    user2Page = await user2Context.newPage();
  });

  test.afterAll(async () => {
    await user1Context.close();
    await user2Context.close();
  });

  test.describe('커플 연결 및 기본 동기화', () => {
    
    test('사용자 1: 커플 생성 및 코드 공유', async () => {
      // 사용자 1 로그인
      await loginUser(user1Page, TEST_DATA.users.user1.email);
      
      // 커플 생성
      coupleCode = await createCouple(user1Page, TEST_DATA.couple.theme);
      
      expect(coupleCode).toBeTruthy();
      expect(coupleCode.length).toBeGreaterThan(5);
      
      // 커플 설정 완료 확인
      await expectCurrentUrl(user1Page, '/');
      
      // 대시보드에서 커플 정보 확인
      await expect(user1Page.locator('[data-testid="couple-status"]')).toContainText('연결 대기 중');
      await expect(user1Page.locator('[data-testid="couple-code-display"]')).toContainText(coupleCode);
    });

    test('사용자 2: 커플 참여 및 연결 완료', async () => {
      // 사용자 2 로그인
      await loginUser(user2Page, TEST_DATA.users.user2.email);
      
      // 커플 참여
      await joinCouple(user2Page, coupleCode);
      
      // 연결 완료 확인
      await expectCurrentUrl(user2Page, '/');
      await expectToast(user2Page, '커플 연결이 완료되었습니다!');
      
      // 대시보드에서 파트너 정보 확인
      await expect(user2Page.locator('[data-testid="couple-status"]')).toContainText('연결됨');
      await expect(user2Page.locator('[data-testid="partner-name"]')).toContainText(TEST_DATA.users.user1.displayName);
    });

    test('양쪽 사용자에서 커플 연결 상태 동기화 확인', async () => {
      // 사용자 1 페이지에서 연결 상태 업데이트 확인
      await user1Page.reload();
      await waitForPageLoad(user1Page);
      
      await waitForRealtimeUpdate(
        user1Page,
        '[data-testid="couple-status"]',
        '연결됨'
      );
      
      await expect(user1Page.locator('[data-testid="partner-name"]')).toContainText(TEST_DATA.users.user2.displayName);
      
      // 사용자 2에서도 확인
      await expect(user2Page.locator('[data-testid="partner-name"]')).toContainText(TEST_DATA.users.user1.displayName);
      
      // 테마 동기화 확인
      await expect(user1Page.locator(`[data-testid="current-theme-${TEST_DATA.couple.theme}"]`)).toBeVisible();
      await expect(user2Page.locator(`[data-testid="current-theme-${TEST_DATA.couple.theme}"]`)).toBeVisible();
    });
  });

  test.describe('규칙 시스템 실시간 동기화', () => {
    
    test('사용자 1이 규칙 추가 → 사용자 2에게 실시간 반영', async () => {
      // 사용자 1이 규칙 추가
      await addRule(user1Page, TEST_DATA.rules[0]);
      
      // 사용자 2 화면에서 실시간 업데이트 확인
      await user2Page.goto('/rules');
      await waitForRealtimeUpdate(
        user2Page,
        `[data-testid="rule-item-${TEST_DATA.rules[0].title}"]`,
        TEST_DATA.rules[0].title
      );
      
      // 규칙 상세 정보도 동기화되었는지 확인
      const user2RuleItem = user2Page.locator(`[data-testid="rule-item-${TEST_DATA.rules[0].title}"]`);
      await expect(user2RuleItem).toBeVisible();
      await expect(user2RuleItem.locator('[data-testid="rule-penalty"]')).toContainText(`${TEST_DATA.rules[0].penalty}원`);
      await expect(user2RuleItem.locator('[data-testid="rule-creator"]')).toContainText(TEST_DATA.users.user1.displayName);
      
      // 새 규칙 알림 확인
      await expectToast(user2Page, `${TEST_DATA.users.user1.displayName}님이 새 규칙을 추가했습니다: ${TEST_DATA.rules[0].title}`);
    });

    test('사용자 2가 규칙 편집 → 사용자 1에게 실시간 반영', async () => {
      // 사용자 2가 규칙 편집
      const originalTitle = TEST_DATA.rules[0].title;
      const newTitle = originalTitle + ' (수정됨)';
      const newPenalty = TEST_DATA.rules[0].penalty + 5;
      
      await user2Page.goto('/rules');
      const ruleItem = user2Page.locator(`[data-testid="rule-item-${originalTitle}"]`);
      await ruleItem.locator('[data-testid="rule-menu-button"]').click();
      await user2Page.click('[data-testid="edit-rule-option"]');
      
      await user2Page.fill('[data-testid="rule-title-input"]', newTitle);
      await user2Page.fill('[data-testid="penalty-amount-input"]', newPenalty.toString());
      await user2Page.click('[data-testid="save-changes-button"]');
      
      await expectToast(user2Page, '규칙이 수정되었습니다.');
      
      // 사용자 1 화면에서 실시간 업데이트 확인
      await user1Page.goto('/rules');
      await waitForRealtimeUpdate(
        user1Page,
        `[data-testid="rule-item-${newTitle}"]`,
        newTitle
      );
      
      const user1UpdatedRule = user1Page.locator(`[data-testid="rule-item-${newTitle}"]`);
      await expect(user1UpdatedRule).toBeVisible();
      await expect(user1UpdatedRule.locator('[data-testid="rule-penalty"]')).toContainText(`${newPenalty}원`);
      
      // 수정 알림 확인
      await expectToast(user1Page, `${TEST_DATA.users.user2.displayName}님이 규칙을 수정했습니다: ${newTitle}`);
      
      // 이전 제목의 규칙은 사라져야 함
      await expect(user1Page.locator(`[data-testid="rule-item-${originalTitle}"]`)).not.toBeVisible();
    });

    test('동시 규칙 편집 충돌 처리', async () => {
      const ruleTitle = TEST_DATA.rules[0].title + ' (수정됨)';
      
      // 두 사용자가 동시에 같은 규칙 편집 시도
      await Promise.all([
        user1Page.goto('/rules'),
        user2Page.goto('/rules')
      ]);
      
      // 사용자 1이 먼저 편집 시작
      const user1Rule = user1Page.locator(`[data-testid="rule-item-${ruleTitle}"]`);
      await user1Rule.locator('[data-testid="rule-menu-button"]').click();
      await user1Page.click('[data-testid="edit-rule-option"]');
      
      // 사용자 2도 편집 시도
      const user2Rule = user2Page.locator(`[data-testid="rule-item-${ruleTitle}"]`);
      await user2Rule.locator('[data-testid="rule-menu-button"]').click();
      await user2Page.click('[data-testid="edit-rule-option"]');
      
      // 사용자 2에게 편집 중 경고 표시
      await expectToast(user2Page, `${TEST_DATA.users.user1.displayName}님이 현재 이 규칙을 편집 중입니다.`, 'error');
      
      // 사용자 2의 편집 모달은 읽기 전용 모드로 표시
      await expect(user2Page.locator('[data-testid="edit-rule-modal"]')).toHaveClass(/readonly/);
      await expect(user2Page.locator('[data-testid="rule-title-input"]')).toBeDisabled();
    });
  });

  test.describe('위반 기록 실시간 동기화', () => {
    
    test('사용자 1이 위반 기록 → 사용자 2 대시보드 실시간 업데이트', async () => {
      const ruleTitle = TEST_DATA.rules[0].title + ' (수정됨)';
      
      // 초기 잔액 기록
      await user2Page.goto('/');
      const initialBalance = await user2Page.locator('[data-testid="current-balance"]').textContent();
      
      // 사용자 1이 위반 기록
      await recordViolation(user1Page, ruleTitle);
      
      // 사용자 2 대시보드에서 실시간 업데이트 확인
      await user2Page.goto('/');
      await waitForRealtimeUpdate(
        user2Page,
        '[data-testid="current-balance"]',
        (TEST_DATA.rules[0].penalty + 5).toString() // 수정된 벌금
      );
      
      // 잔액 변화 확인
      const newBalance = await user2Page.locator('[data-testid="current-balance"]').textContent();
      expect(newBalance).not.toBe(initialBalance);
      
      // 최근 위반 목록 업데이트 확인
      const recentViolations = user2Page.locator('[data-testid="recent-violations-list"]');
      await expect(recentViolations.locator('li').first()).toContainText(ruleTitle);
      await expect(recentViolations.locator('li').first().locator('[data-testid="violator-name"]'))
        .toContainText(TEST_DATA.users.user1.displayName);
      
      // 위반 알림 확인
      await expectToast(user2Page, `${TEST_DATA.users.user1.displayName}님이 "${ruleTitle}" 규칙을 위반했습니다.`);
      
      // 통계 카드 업데이트 확인
      await expect(user2Page.locator('[data-testid="today-violations"]')).toContainText('1');
      await expect(user2Page.locator('[data-testid="total-violations"]')).toContainText('1');
    });

    test('사용자 2가 위반 기록 → 양쪽에서 누적 잔액 확인', async () => {
      // 현재 잔액 확인
      await user1Page.goto('/');
      const currentBalance = await user1Page.locator('[data-testid="current-balance"]').textContent();
      const currentAmount = parseInt(currentBalance?.replace(/[^\d]/g, '') || '0');
      
      // 사용자 2가 추가 위반 기록
      await recordViolation(user2Page, TEST_DATA.rules[0].title + ' (수정됨)', 20);
      
      // 양쪽 사용자 화면에서 누적 잔액 확인
      const expectedNewBalance = currentAmount + 20;
      
      await Promise.all([
        waitForRealtimeUpdate(user1Page, '[data-testid="current-balance"]', expectedNewBalance.toString()),
        waitForRealtimeUpdate(user2Page, '[data-testid="current-balance"]', expectedNewBalance.toString())
      ]);
      
      // 위반 통계 업데이트 확인
      await expect(user1Page.locator('[data-testid="total-violations"]')).toContainText('2');
      await expect(user2Page.locator('[data-testid="total-violations"]')).toContainText('2');
      
      // 사용자별 위반 횟수 확인
      await user1Page.goto('/violations');
      const user1Violations = user1Page.locator('[data-testid="my-violations-count"]');
      const user2Violations = user1Page.locator('[data-testid="partner-violations-count"]');
      
      await expect(user1Violations).toContainText('1'); // 사용자 1의 위반
      await expect(user2Violations).toContainText('1'); // 사용자 2의 위반
    });
  });

  test.describe('보상 시스템 실시간 동기화', () => {
    
    test('사용자 1이 보상 추가 → 사용자 2에게 실시간 반영', async () => {
      // 사용자 1이 보상 추가
      await addReward(user1Page, TEST_DATA.rewards[0]);
      
      // 사용자 2 화면에서 실시간 업데이트 확인
      await user2Page.goto('/rewards');
      await waitForRealtimeUpdate(
        user2Page,
        `[data-testid="reward-${TEST_DATA.rewards[0].title}"]`,
        TEST_DATA.rewards[0].title
      );
      
      const user2Reward = user2Page.locator(`[data-testid="reward-${TEST_DATA.rewards[0].title}"]`);
      await expect(user2Reward).toBeVisible();
      await expect(user2Reward.locator('[data-testid="reward-target"]')).toContainText(`${TEST_DATA.rewards[0].target}만원`);
      await expect(user2Reward.locator('[data-testid="reward-creator"]')).toContainText(TEST_DATA.users.user1.displayName);
      
      // 새 보상 알림 확인
      await expectToast(user2Page, `${TEST_DATA.users.user1.displayName}님이 새 보상을 추가했습니다: ${TEST_DATA.rewards[0].title}`);
    });

    test('보상 진행률 실시간 업데이트 확인', async () => {
      const rewardTitle = TEST_DATA.rewards[0].title;
      
      // 두 사용자 모두 보상 페이지로 이동
      await Promise.all([
        user1Page.goto('/rewards'),
        user2Page.goto('/rewards')
      ]);
      
      // 초기 진행률 확인 (이전 위반들로 인해 이미 진행된 상태)
      const user1Reward = user1Page.locator(`[data-testid="reward-${rewardTitle}"]`);
      const user2Reward = user2Page.locator(`[data-testid="reward-${rewardTitle}"]`);
      
      const currentProgress = await user1Reward.locator('[data-testid="reward-progress"]').textContent();
      
      // 두 사용자 화면에서 같은 진행률 표시 확인
      await expect(user1Reward.locator('[data-testid="reward-progress"]')).toContainText(currentProgress || '');
      await expect(user2Reward.locator('[data-testid="reward-progress"]')).toContainText(currentProgress || '');
      
      // 추가 위반으로 진행률 올리기
      if (!currentProgress?.includes('100%')) {
        await recordViolation(user1Page, TEST_DATA.rules[0].title + ' (수정됨)', 30);
        
        // 양쪽에서 진행률 업데이트 확인
        await Promise.all([
          waitForRealtimeUpdate(user1Page, `[data-testid="reward-${rewardTitle}"] [data-testid="reward-progress"]`, '%'),
          waitForRealtimeUpdate(user2Page, `[data-testid="reward-${rewardTitle}"] [data-testid="reward-progress"]`, '%')
        ]);
        
        // 진행률이 양쪽에서 동일한지 확인
        const user1Progress = await user1Reward.locator('[data-testid="reward-progress"]').textContent();
        const user2Progress = await user2Reward.locator('[data-testid="reward-progress"]').textContent();
        expect(user1Progress).toBe(user2Progress);
      }
    });

    test('보상 달성 및 수령 실시간 동기화', async () => {
      const rewardTitle = TEST_DATA.rewards[0].title;
      
      // 보상 달성까지 추가 위반 (필요한 경우)
      const currentProgress = await user1Page.locator(`[data-testid="reward-${rewardTitle}"] [data-testid="reward-progress"]`).textContent();
      
      if (!currentProgress?.includes('100%')) {
        await recordViolation(user1Page, TEST_DATA.rules[0].title + ' (수정됨)', 50);
        
        // 양쪽에서 달성 알림 확인
        await Promise.all([
          expectToast(user1Page, `🎉 보상 달성! "${rewardTitle}" 보상을 받을 수 있습니다!`),
          expectToast(user2Page, `🎉 보상 달성! "${rewardTitle}" 보상을 받을 수 있습니다!`)
        ]);
      }
      
      // 사용자 1이 보상 수령
      await user1Page.goto('/rewards');
      const user1Reward = user1Page.locator(`[data-testid="reward-${rewardTitle}"]`);
      await user1Reward.locator('[data-testid="claim-reward-button"]').click();
      
      await user1Page.fill('[data-testid="reward-review-input"]', '함께 보상을 받아서 기뻐요!');
      await user1Page.click('[data-testid="confirm-claim-button"]');
      
      await expectToast(user1Page, '보상을 받으셨군요! 축하합니다! 🎉');
      
      // 사용자 2 화면에서 보상 수령 상태 실시간 반영 확인
      await user2Page.goto('/rewards');
      await waitForRealtimeUpdate(
        user2Page,
        `[data-testid="reward-${rewardTitle}"]`,
        '수령완료'
      );
      
      const user2Reward = user2Page.locator(`[data-testid="reward-${rewardTitle}"]`);
      await expect(user2Reward).toHaveClass(/claimed/);
      await expect(user2Reward.locator('[data-testid="reward-status"]')).toContainText('수령완료');
      await expect(user2Reward.locator('[data-testid="claim-reward-button"]')).toBeDisabled();
      
      // 보상 수령 알림
      await expectToast(user2Page, `${TEST_DATA.users.user1.displayName}님이 "${rewardTitle}" 보상을 받았습니다! 🎉`);
      
      // 양쪽 대시보드에서 벌금 리셋 확인
      await Promise.all([
        user1Page.goto('/'),
        user2Page.goto('/')
      ]);
      
      await expect(user1Page.locator('[data-testid="current-balance"]')).toContainText('0원');
      await expect(user2Page.locator('[data-testid="current-balance"]')).toContainText('0원');
    });
  });

  test.describe('네트워크 연결 및 복구 테스트', () => {
    
    test('네트워크 연결 중단 시 오프라인 모드 전환', async () => {
      // 사용자 1을 오프라인으로 설정
      await user1Page.context().setOffline(true);
      
      // 오프라인 상태 표시 확인
      await expect(user1Page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(user1Page.locator('[data-testid="offline-message"]')).toContainText('인터넷 연결이 끊어졌습니다');
      
      // 오프라인에서 위반 기록 시도
      await user1Page.goto('/violations/new');
      await user1Page.click(`[data-testid="rule-option-${TEST_DATA.rules[0].title} (수정됨)"]`);
      await user1Page.click('[data-testid="record-violation-button"]');
      
      // 오프라인 대기 메시지
      await expectToast(user1Page, '오프라인 상태입니다. 연결이 복구되면 자동으로 동기화됩니다.', 'error');
      
      // 로컬에 임시 저장된 상태 확인
      await expect(user1Page.locator('[data-testid="pending-sync-indicator"]')).toBeVisible();
    });

    test('네트워크 복구 시 자동 동기화', async () => {
      // 네트워크 복구
      await user1Page.context().setOffline(false);
      
      // 연결 복구 표시
      await expectToast(user1Page, '인터넷 연결이 복구되었습니다. 데이터를 동기화하는 중...');
      
      // 자동 동기화 진행
      await expect(user1Page.locator('[data-testid="sync-progress"]')).toBeVisible();
      
      // 동기화 완료 후 오프라인 인디케이터 제거
      await expect(user1Page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
      await expect(user1Page.locator('[data-testid="pending-sync-indicator"]')).not.toBeVisible();
      
      // 동기화 완료 메시지
      await expectToast(user1Page, '모든 데이터가 동기화되었습니다.');
      
      // 사용자 2 화면에서 오프라인 중 기록된 위반 확인
      await user2Page.goto('/');
      const recentViolations = user2Page.locator('[data-testid="recent-violations-list"]');
      await expect(recentViolations.locator('li').first().locator('[data-testid="violator-name"]'))
        .toContainText(TEST_DATA.users.user1.displayName);
    });
  });

  test.describe('권한 및 보안 테스트', () => {
    
    test('파트너의 민감한 정보 접근 제한', async () => {
      // 사용자 1이 개인 설정 페이지 접근
      await user1Page.goto('/settings');
      
      // 개인 정보 확인 가능
      await expect(user1Page.locator('[data-testid="my-email"]')).toBeVisible();
      await expect(user1Page.locator('[data-testid="my-pin-settings"]')).toBeVisible();
      
      // 파트너 정보는 제한된 내용만 표시
      await expect(user1Page.locator('[data-testid="partner-name"]')).toBeVisible();
      await expect(user1Page.locator('[data-testid="partner-email"]')).not.toBeVisible(); // 이메일은 비공개
      await expect(user1Page.locator('[data-testid="partner-pin-settings"]')).not.toBeVisible(); // PIN 설정은 비공개
    });

    test('타인의 위반 기록을 본인 명의로 기록 시도 방지', async () => {
      await user1Page.goto('/violations/new');
      
      // 위반자 선택 옵션이 있는지 확인
      const violatorSelect = user1Page.locator('[data-testid="violator-select"]');
      
      if (await violatorSelect.count() > 0) {
        // 자신의 위반만 기록 가능
        const options = await violatorSelect.locator('option').allTextContents();
        expect(options).toContain(TEST_DATA.users.user1.displayName);
        expect(options).not.toContain(`${TEST_DATA.users.user2.displayName} (본인 대신 기록)`);
      }
    });

    test('규칙 삭제 권한 - 생성자만 삭제 가능', async () => {
      // 사용자 2가 사용자 1이 만든 규칙 삭제 시도
      await user2Page.goto('/rules');
      const user1CreatedRule = user2Page.locator(`[data-testid="rule-item-${TEST_DATA.rules[0].title} (수정됨)"]`);
      
      // 삭제 버튼이 비활성화되어 있거나 없어야 함
      const deleteButton = user1CreatedRule.locator('[data-testid="delete-rule-button"]');
      
      if (await deleteButton.count() > 0) {
        await expect(deleteButton).toBeDisabled();
        
        // 호버 시 권한 부족 툴팁 표시
        await deleteButton.hover();
        await expect(user2Page.locator('[data-testid="permission-tooltip"]'))
          .toContainText('규칙 생성자만 삭제할 수 있습니다');
      } else {
        // 삭제 버튼 자체가 표시되지 않음
        await expect(deleteButton).toHaveCount(0);
      }
    });
  });

  test.describe('성능 및 최적화 테스트', () => {
    
    test('대량 데이터 실시간 동기화 성능', async () => {
      const startTime = Date.now();
      
      // 여러 위반 기록을 빠르게 생성
      for (let i = 0; i < 5; i++) {
        await recordViolation(user1Page, TEST_DATA.rules[0].title + ' (수정됨)', 5);
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 간격
      }
      
      // 사용자 2 화면에서 모든 위반이 동기화되는 시간 측정
      await user2Page.goto('/violations');
      
      // 5개의 위반 기록이 모두 표시될 때까지 대기
      await expect(user2Page.locator('[data-testid="violation-list"] li')).toHaveCount(7); // 이전 2개 + 새로운 5개
      
      const endTime = Date.now();
      const syncTime = endTime - startTime;
      
      // 동기화 시간이 10초 이내여야 함
      expect(syncTime).toBeLessThan(10000);
      
      console.log(`Real-time sync performance: ${syncTime}ms for 5 violations`);
    });

    test('연결 상태 표시기 정확성', async () => {
      // 정상 연결 상태
      await expect(user1Page.locator('[data-testid="connection-status"]')).toHaveClass(/connected/);
      
      // 연결 불안정 시뮬레이션
      await user1Page.context().setOffline(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await user1Page.context().setOffline(false);
      
      // 재연결 중 상태
      await expect(user1Page.locator('[data-testid="connection-status"]')).toHaveClass(/reconnecting/);
      
      // 재연결 완료
      await waitForRealtimeUpdate(user1Page, '[data-testid="connection-status"]', 'connected');
      await expect(user1Page.locator('[data-testid="connection-status"]')).toHaveClass(/connected/);
    });
  });
});