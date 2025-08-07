import { test, expect, Page, BrowserContext } from '@playwright/test';
import { 
  waitForPageLoad, 
  loginUser, 
  addReward,
  recordViolation,
  expectToast,
  expectCurrentUrl,
  waitForRealtimeUpdate,
  TEST_DATA 
} from '../utils/test-helpers';

/**
 * 보상 시스템 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 보상 추가 → 목표 달성 → 보상 완료
 * 2. 보상 진행률 추적
 * 3. 보상 달성 알림
 * 4. 보상 히스토리 관리
 */

test.describe('보상 시스템 테스트', () => {
  
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // 로그인 및 기본 설정
    await loginUser(page, TEST_DATA.users.user1.email);
    await waitForPageLoad(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('보상 생성 및 관리', () => {
    
    test('새 보상 추가', async () => {
      // 보상 페이지로 이동
      await page.goto('/rewards');
      await waitForPageLoad(page);
      
      // 현재 보상 개수 확인
      const initialRewardsCount = await page.locator('[data-testid="reward-item"]').count();
      
      // 새 보상 추가 버튼
      await page.click('[data-testid="add-reward-button"]');
      
      // 보상 추가 모달 확인
      await expect(page.locator('[data-testid="add-reward-modal"]')).toBeVisible();
      
      // 보상 정보 입력
      const reward = TEST_DATA.rewards[0];
      await page.fill('[data-testid="reward-title-input"]', reward.title);
      await page.fill('[data-testid="target-amount-input"]', reward.target.toString());
      
      // 설명 입력 (선택사항)
      await page.fill('[data-testid="reward-description-input"]', '벌금 50만원 모으면 고급 레스토랑에서 데이트');
      
      // 보상 카테고리 선택
      await page.selectOption('[data-testid="reward-category-select"]', 'date');
      
      // 저장
      await page.click('[data-testid="save-reward-button"]');
      
      // 성공 메시지
      await expectToast(page, '보상이 추가되었습니다');
      
      // 모달 닫힘 확인
      await expect(page.locator('[data-testid="add-reward-modal"]')).not.toBeVisible();
      
      // 새 보상이 목록에 추가되었는지 확인
      const newRewardsCount = await page.locator('[data-testid="reward-item"]').count();
      expect(newRewardsCount).toBe(initialRewardsCount + 1);
      
      // 추가된 보상 내용 확인
      const newReward = page.locator(`[data-testid="reward-${reward.title}"]`);
      await expect(newReward).toBeVisible();
      await expect(newReward.locator('[data-testid="reward-title"]')).toContainText(reward.title);
      await expect(newReward.locator('[data-testid="reward-target"]')).toContainText(`${reward.target}만원`);
      await expect(newReward.locator('[data-testid="reward-progress"]')).toContainText('0%');
    });

    test('다양한 카테고리 보상 추가', async () => {
      const rewards = [
        { title: '새 옷 쇼핑', target: 30, category: 'shopping' },
        { title: '주말 여행', target: 100, category: 'travel' },
        { title: '커플링 구매', target: 20, category: 'gift' }
      ];
      
      for (const reward of rewards) {
        await page.click('[data-testid="add-reward-button"]');
        
        await page.fill('[data-testid="reward-title-input"]', reward.title);
        await page.fill('[data-testid="target-amount-input"]', reward.target.toString());
        await page.selectOption('[data-testid="reward-category-select"]', reward.category);
        
        await page.click('[data-testid="save-reward-button"]');
        await expectToast(page, '보상이 추가되었습니다');
        
        // 추가 확인
        await expect(page.locator(`[data-testid="reward-${reward.title}"]`)).toBeVisible();
      }
    });

    test('보상 수정 및 삭제', async () => {
      const rewardToEdit = '새 옷 쇼핑';
      
      // 보상 편집 버튼 클릭
      await page.click(`[data-testid="edit-reward-${rewardToEdit}"]`);
      
      // 편집 모달 확인
      await expect(page.locator('[data-testid="edit-reward-modal"]')).toBeVisible();
      
      // 내용 수정
      const newTitle = '명품 옷 쇼핑';
      await page.fill('[data-testid="reward-title-input"]', '');
      await page.fill('[data-testid="reward-title-input"]', newTitle);
      await page.fill('[data-testid="target-amount-input"]', '35');
      
      // 저장
      await page.click('[data-testid="save-reward-button"]');
      
      // 수정 확인
      await expectToast(page, '보상이 수정되었습니다');
      
      const editedReward = page.locator(`[data-testid="reward-${newTitle}"]`);
      await expect(editedReward).toBeVisible();
      await expect(editedReward.locator('[data-testid="reward-target"]')).toContainText('35만원');
      
      // 보상 삭제
      await page.click(`[data-testid="delete-reward-${newTitle}"]`);
      
      // 확인 다이얼로그
      await page.click('[data-testid="confirm-delete-reward"]');
      
      // 삭제 확인
      await expectToast(page, '보상이 삭제되었습니다');
      await expect(editedReward).not.toBeVisible();
    });
  });

  test.describe('보상 진행률 및 달성', () => {
    
    test('벌금 누적으로 보상 진행률 업데이트', async () => {
      const rewardTitle = TEST_DATA.rewards[0].title;
      const rewardTarget = TEST_DATA.rewards[0].target;
      
      // 초기 진행률 확인
      await page.goto('/rewards');
      const rewardElement = page.locator(`[data-testid="reward-${rewardTitle}"]`);
      await expect(rewardElement.locator('[data-testid="reward-progress"]')).toContainText('0%');
      
      // 벌금 기록하여 진행률 올리기
      await page.goto('/violations/new');
      await page.click(`[data-testid="rule-option-${TEST_DATA.rules[1].title}"]`);
      
      // 높은 벌금으로 기록 (진행률 상승을 위해)
      await page.fill('[data-testid="violation-amount-input"]', '25');
      await page.click('[data-testid="record-violation-button"]');
      
      // 보상 페이지에서 진행률 업데이트 확인
      await page.goto('/rewards');
      await waitForRealtimeUpdate(
        page, 
        `[data-testid="reward-${rewardTitle}"] [data-testid="reward-progress"]`,
        '50%' // 25/50 = 50%
      );
      
      // 진행률 바 확인
      const progressBar = rewardElement.locator('[data-testid="progress-bar"]');
      await expect(progressBar).toHaveAttribute('style', /width:\s*50%/);
      
      // 남은 금액 표시 확인
      await expect(rewardElement.locator('[data-testid="remaining-amount"]')).toContainText('25만원 남음');
    });

    test('보상 달성 및 알림', async () => {
      const rewardTitle = TEST_DATA.rewards[0].title;
      
      // 추가 벌금으로 보상 달성
      await page.goto('/violations/new');
      await page.click(`[data-testid="rule-option-${TEST_DATA.rules[1].title}"]`);
      await page.fill('[data-testid="violation-amount-input"]', '25');
      await page.click('[data-testid="record-violation-button"]');
      
      // 보상 달성 알림 확인
      await expectToast(page, `🎉 보상 달성! "${rewardTitle}" 보상을 받을 수 있습니다!`);
      
      // 보상 페이지에서 달성 상태 확인
      await page.goto('/rewards');
      
      const achievedReward = page.locator(`[data-testid="reward-${rewardTitle}"]`);
      await expect(achievedReward).toHaveClass(/achieved/);
      await expect(achievedReward.locator('[data-testid="reward-status"]')).toContainText('달성완료');
      await expect(achievedReward.locator('[data-testid="reward-progress"]')).toContainText('100%');
      
      // 보상 받기 버튼 활성화 확인
      await expect(achievedReward.locator('[data-testid="claim-reward-button"]')).toBeEnabled();
    });

    test('보상 받기 및 완료 처리', async () => {
      const rewardTitle = TEST_DATA.rewards[0].title;
      const rewardElement = page.locator(`[data-testid="reward-${rewardTitle}"]`);
      
      // 보상 받기 버튼 클릭
      await rewardElement.locator('[data-testid="claim-reward-button"]').click();
      
      // 보상 받기 확인 모달
      await expect(page.locator('[data-testid="claim-reward-modal"]')).toBeVisible();
      
      // 후기/메모 입력 (선택사항)
      await page.fill('[data-testid="reward-review-input"]', '정말 맛있는 레스토랑이었어요! 다음에도 또 가고 싶네요.');
      
      // 사진 업로드 (시뮬레이션)
      await page.setInputFiles('[data-testid="reward-photo-input"]', []);
      
      // 보상 받기 확정
      await page.click('[data-testid="confirm-claim-button"]');
      
      // 성공 메시지
      await expectToast(page, '보상을 받으셨군요! 축하합니다! 🎉');
      
      // 보상 상태 업데이트 확인
      await expect(rewardElement).toHaveClass(/claimed/);
      await expect(rewardElement.locator('[data-testid="reward-status"]')).toContainText('수령완료');
      
      // 받기 버튼 비활성화
      await expect(rewardElement.locator('[data-testid="claim-reward-button"]')).toBeDisabled();
      
      // 대시보드에서 벌금 리셋 확인
      await page.goto('/');
      await expect(page.locator('[data-testid="total-penalty"]')).toContainText('0만원');
    });
  });

  test.describe('보상 히스토리 및 통계', () => {
    
    test('보상 히스토리 조회', async () => {
      await page.goto('/rewards');
      
      // 히스토리 탭으로 전환
      await page.click('[data-testid="rewards-history-tab"]');
      
      // 수령완료된 보상 확인
      const historySection = page.locator('[data-testid="rewards-history"]');
      await expect(historySection).toBeVisible();
      
      const claimedReward = historySection.locator('[data-testid="claimed-reward"]').first();
      await expect(claimedReward).toBeVisible();
      await expect(claimedReward.locator('[data-testid="reward-title"]')).toContainText(TEST_DATA.rewards[0].title);
      await expect(claimedReward.locator('[data-testid="claimed-date"]')).toBeVisible();
      
      // 후기 확인
      if (await claimedReward.locator('[data-testid="reward-review"]').count() > 0) {
        await expect(claimedReward.locator('[data-testid="reward-review"]')).toContainText('정말 맛있는 레스토랑');
      }
    });

    test('보상 통계 확인', async () => {
      // 통계 탭으로 전환
      await page.click('[data-testid="rewards-stats-tab"]');
      
      const statsSection = page.locator('[data-testid="rewards-stats"]');
      await expect(statsSection).toBeVisible();
      
      // 전체 보상 개수
      await expect(statsSection.locator('[data-testid="total-rewards-count"]')).toContainText('1');
      
      // 달성한 보상 개수
      await expect(statsSection.locator('[data-testid="achieved-rewards-count"]')).toContainText('1');
      
      // 달성률
      await expect(statsSection.locator('[data-testid="achievement-rate"]')).toContainText('100%');
      
      // 총 사용된 벌금
      await expect(statsSection.locator('[data-testid="total-used-penalty"]')).toContainText('50만원');
      
      // 카테고리별 통계
      const categoryStats = statsSection.locator('[data-testid="category-stats"]');
      await expect(categoryStats).toBeVisible();
      await expect(categoryStats.locator('[data-testid="category-date-count"]')).toContainText('1');
    });

    test('보상 필터링 및 정렬', async () => {
      // 활성 보상 탭으로 돌아가기
      await page.click('[data-testid="active-rewards-tab"]');
      
      // 카테고리별 필터링
      await page.selectOption('[data-testid="filter-by-category"]', 'travel');
      
      // 여행 카테고리 보상만 표시되는지 확인
      const visibleRewards = page.locator('[data-testid="reward-item"]:visible');
      const count = await visibleRewards.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          await expect(visibleRewards.nth(i).locator('[data-testid="reward-category"]')).toContainText('여행');
        }
      }
      
      // 진행률별 정렬
      await page.selectOption('[data-testid="sort-by-progress"]', 'desc');
      
      // 정렬 확인 (진행률 높은 순)
      const progressTexts = await page.locator('[data-testid="reward-progress"]').allTextContents();
      for (let i = 0; i < progressTexts.length - 1; i++) {
        const current = parseInt(progressTexts[i].replace('%', ''));
        const next = parseInt(progressTexts[i + 1].replace('%', ''));
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  test.describe('보상 알림 시스템', () => {
    
    test('목표 근접 알림 (90% 달성시)', async () => {
      // 새 보상 추가 (테스트용)
      await page.goto('/rewards');
      await page.click('[data-testid="add-reward-button"]');
      await page.fill('[data-testid="reward-title-input"]', '알림 테스트 보상');
      await page.fill('[data-testid="target-amount-input"]', '10');
      await page.click('[data-testid="save-reward-button"]');
      
      // 9만원 벌금 기록 (90% 달성)
      await page.goto('/violations/new');
      await page.click(`[data-testid="rule-option-${TEST_DATA.rules[1].title}"]`);
      await page.fill('[data-testid="violation-amount-input"]', '9');
      await page.click('[data-testid="record-violation-button"]');
      
      // 90% 근접 알림 확인
      await expectToast(page, '🎯 거의 다 왔어요! "알림 테스트 보상"까지 1만원만 더 모으면 됩니다!');
      
      // 보상 페이지에서 진행률 확인
      await page.goto('/rewards');
      const testReward = page.locator('[data-testid="reward-알림 테스트 보상"]');
      await expect(testReward.locator('[data-testid="reward-progress"]')).toContainText('90%');
      await expect(testReward).toHaveClass(/near-completion/);
    });
  });
});