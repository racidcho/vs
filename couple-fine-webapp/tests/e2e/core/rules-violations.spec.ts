import { test, expect, Page, BrowserContext } from '@playwright/test';
import { 
  waitForPageLoad, 
  loginUser, 
  addRule,
  recordViolation,
  expectToast,
  expectCurrentUrl,
  waitForRealtimeUpdate,
  TEST_DATA 
} from '../utils/test-helpers';

/**
 * 규칙 및 위반 시스템 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 규칙 추가 → 위반 기록 → 실시간 업데이트 확인
 * 2. 다양한 규칙 타입 테스트 (언어/행동 규칙)
 * 3. 벌금 계산 및 누적 확인
 * 4. 규칙 편집/삭제 기능
 * 5. 실시간 동기화 테스트
 */

test.describe('규칙 및 위반 시스템 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    // 로그인 후 규칙 페이지로 이동
    await loginUser(page, TEST_DATA.users.user1.email);
    await page.goto('/rules');
    await waitForPageLoad(page);
  });

  test('언어 규칙 추가 및 기본 기능 테스트', async ({ page }) => {
    // 새 규칙 버튼 클릭
    await page.click('[data-testid="add-rule-button"]');
    
    // 규칙 추가 모달 확인
    await expect(page.locator('[data-testid="add-rule-modal"]')).toBeVisible();
    
    // 언어 규칙 추가
    const wordRule = TEST_DATA.rules[0];
    await page.click(`[data-testid="rule-type-${wordRule.type}"]`);
    
    // 규칙 세부 설정
    await page.fill('[data-testid="rule-title-input"]', wordRule.title);
    await page.fill('[data-testid="penalty-amount-input"]', wordRule.penalty.toString());
    
    // 언어 규칙 특화 설정
    await page.fill('[data-testid="forbidden-words-input"]', '욕설,바보,멍청이');
    await page.check('[data-testid="case-sensitive-checkbox"]');
    
    // 저장 버튼 클릭
    await page.click('[data-testid="save-rule-button"]');
    
    // 성공 메시지 확인
    await expectToast(page, '규칙이 추가되었습니다!');
    
    // 모달 닫힘 확인
    await expect(page.locator('[data-testid="add-rule-modal"]')).not.toBeVisible();
    
    // 규칙 목록에서 확인
    const ruleItem = page.locator(`[data-testid="rule-item-${wordRule.title}"]`);
    await expect(ruleItem).toBeVisible();
    await expect(ruleItem.locator('[data-testid="rule-penalty"]')).toContainText(`${wordRule.penalty}원`);
    await expect(ruleItem.locator('[data-testid="rule-type-badge"]')).toContainText('언어');
    
    // 규칙 세부 정보 확인
    await ruleItem.click();
    await expect(page.locator('[data-testid="rule-detail-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="forbidden-words-list"]')).toContainText('욕설, 바보, 멍청이');
  });

  test('행동 규칙 추가 및 특화 옵션 테스트', async ({ page }) => {
    const behaviorRule = TEST_DATA.rules[1];
    
    await page.click('[data-testid="add-rule-button"]');
    
    // 행동 규칙 선택
    await page.click(`[data-testid="rule-type-${behaviorRule.type}"]`);
    await page.fill('[data-testid="rule-title-input"]', behaviorRule.title);
    await page.fill('[data-testid="penalty-amount-input"]', behaviorRule.penalty.toString());
    
    // 행동 규칙 특화 설정
    await page.fill('[data-testid="rule-description-input"]', '약속 시간에 늦으면 안 됩니다.');
    await page.check('[data-testid="allow-self-report-checkbox"]');
    await page.check('[data-testid="require-evidence-checkbox"]');
    
    // 반복 설정
    await page.selectOption('[data-testid="recurrence-select"]', 'daily');
    
    await page.click('[data-testid="save-rule-button"]');
    
    await expectToast(page, '규칙이 추가되었습니다!');
    
    // 규칙 설정 확인
    const ruleItem = page.locator(`[data-testid="rule-item-${behaviorRule.title}"]`);
    await expect(ruleItem).toBeVisible();
    await expect(ruleItem.locator('[data-testid="rule-type-badge"]')).toContainText('행동');
    await expect(ruleItem.locator('[data-testid="self-report-badge"]')).toBeVisible();
    await expect(ruleItem.locator('[data-testid="evidence-required-badge"]')).toBeVisible();
    await expect(ruleItem.locator('[data-testid="daily-badge"]')).toBeVisible();
  });

  test('위반 기록 기본 플로우 테스트', async ({ page }) => {
    // 먼저 규칙 추가
    await addRule(page, TEST_DATA.rules[0]);
    
    // 위반 기록 페이지로 이동
    await page.goto('/violations/new');
    await waitForPageLoad(page);
    
    // 규칙 선택 옵션들 확인
    const ruleOptions = page.locator('[data-testid^="rule-option-"]');
    await expect(ruleOptions).toHaveCount(1); // 방금 추가한 규칙 1개
    
    // 규칙 선택
    const ruleTitle = TEST_DATA.rules[0].title;
    await page.click(`[data-testid="rule-option-${ruleTitle}"]`);
    
    // 선택된 규칙 정보 확인
    await expect(page.locator('[data-testid="selected-rule-title"]')).toContainText(ruleTitle);
    
    // 기본 벌금 자동 설정 확인
    const amountInput = page.locator('[data-testid="violation-amount-input"]');
    await expect(amountInput).toHaveValue(TEST_DATA.rules[0].penalty.toString());
    
    // 위반 세부 정보 입력
    await page.fill('[data-testid="violation-memo-input"]', '테스트 위반 기록입니다.');
    
    // 현재 시간 확인 (자동 설정)
    const timeInput = page.locator('[data-testid="violation-time-input"]');
    const currentTime = await timeInput.inputValue();
    expect(currentTime).toBeTruthy();
    
    // 기록 버튼 클릭
    await page.click('[data-testid="record-violation-button"]');
    
    // 로딩 상태 확인
    await expect(page.locator('[data-testid="recording-spinner"]')).toBeVisible();
    
    // 성공 메시지
    await expectToast(page, '위반이 기록되었습니다.');
    
    // 대시보드로 자동 이동 확인
    await expectCurrentUrl(page, '/');
  });

  test('대시보드 실시간 통계 업데이트 확인', async ({ page }) => {
    // 초기 상태 기록
    await page.goto('/');
    await waitForPageLoad(page);
    
    const initialBalance = await page.locator('[data-testid="current-balance"]').textContent();
    const initialViolationCount = await page.locator('[data-testid="total-violations"]').textContent();
    
    // 규칙 추가
    await addRule(page, TEST_DATA.rules[0]);
    
    // 위반 기록
    await recordViolation(page, TEST_DATA.rules[0].title);
    
    // 대시보드 복귀 후 실시간 업데이트 확인
    await page.goto('/');
    await waitForPageLoad(page);
    
    // 잔액 변화 확인 (실시간 업데이트 대기)
    await waitForRealtimeUpdate(
      page, 
      '[data-testid="current-balance"]', 
      TEST_DATA.rules[0].penalty.toString()
    );
    
    const newBalance = await page.locator('[data-testid="current-balance"]').textContent();
    expect(newBalance).not.toBe(initialBalance);
    
    // 위반 횟수 증가 확인
    const newViolationCount = await page.locator('[data-testid="total-violations"]').textContent();
    expect(newViolationCount).not.toBe(initialViolationCount);
    
    // 최근 위반 목록에서 확인
    const recentViolations = page.locator('[data-testid="recent-violations-list"]');
    await expect(recentViolations.locator('li').first()).toContainText(TEST_DATA.rules[0].title);
    
    // 통계 카드들 업데이트 확인
    await expect(page.locator('[data-testid="today-violations"]')).toContainText('1');
    await expect(page.locator('[data-testid="week-violations"]')).toContainText('1');
  });

  test('벌금 수정 및 커스텀 금액 테스트', async ({ page }) => {
    await addRule(page, TEST_DATA.rules[0]);
    
    // 위반 기록 시 벌금 수정
    await page.goto('/violations/new');
    await page.click(`[data-testid="rule-option-${TEST_DATA.rules[0].title}"]`);
    
    // 벌금 변경
    const modifiedAmount = TEST_DATA.rules[0].penalty + 5;
    await page.fill('[data-testid="violation-amount-input"]', modifiedAmount.toString());
    
    // 수정 사유 입력 (선택사항)
    await page.fill('[data-testid="amount-modification-reason"]', '특별히 심한 위반');
    
    await page.click('[data-testid="record-violation-button"]');
    
    await expectToast(page, '위반이 기록되었습니다.');
    
    // 대시보드에서 수정된 금액 반영 확인
    await page.goto('/');
    await waitForRealtimeUpdate(
      page,
      '[data-testid="current-balance"]',
      modifiedAmount.toString()
    );
    
    // 위반 내역에서 수정된 금액 확인
    await page.goto('/violations');
    const latestViolation = page.locator('[data-testid="violation-list"] li').first();
    await expect(latestViolation.locator('[data-testid="violation-amount"]')).toContainText(`${modifiedAmount}원`);
    await expect(latestViolation.locator('[data-testid="amount-modified-badge"]')).toBeVisible();
  });

  test('규칙 편집 기능 테스트', async ({ page }) => {
    await addRule(page, TEST_DATA.rules[0]);
    
    // 규칙 편집
    await page.goto('/rules');
    const ruleItem = page.locator(`[data-testid="rule-item-${TEST_DATA.rules[0].title}"]`);
    
    // 설정 메뉴 열기
    await ruleItem.locator('[data-testid="rule-menu-button"]').click();
    await page.click('[data-testid="edit-rule-option"]');
    
    // 편집 모달 확인
    await expect(page.locator('[data-testid="edit-rule-modal"]')).toBeVisible();
    
    // 제목 수정
    const newTitle = TEST_DATA.rules[0].title + ' (수정됨)';
    await page.fill('[data-testid="rule-title-input"]', newTitle);
    
    // 벌금 수정
    const newPenalty = TEST_DATA.rules[0].penalty + 10;
    await page.fill('[data-testid="penalty-amount-input"]', newPenalty.toString());
    
    // 설명 추가
    await page.fill('[data-testid="rule-description-input"]', '수정된 규칙 설명입니다.');
    
    // 저장
    await page.click('[data-testid="save-changes-button"]');
    await expectToast(page, '규칙이 수정되었습니다.');
    
    // 수정된 내용 확인
    await expect(page.locator(`[data-testid="rule-item-${newTitle}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="rule-item-${newTitle}"]`)
      .locator('[data-testid="rule-penalty"]')).toContainText(`${newPenalty}원`);
    
    // 기존 제목의 규칙은 더 이상 존재하지 않아야 함
    await expect(page.locator(`[data-testid="rule-item-${TEST_DATA.rules[0].title}"]`)).not.toBeVisible();
  });

  test('규칙 삭제 기능 및 확인 테스트', async ({ page }) => {
    await addRule(page, TEST_DATA.rules[0]);
    
    await page.goto('/rules');
    const ruleItem = page.locator(`[data-testid="rule-item-${TEST_DATA.rules[0].title}"]`);
    
    // 규칙 메뉴에서 삭제 선택
    await ruleItem.locator('[data-testid="rule-menu-button"]').click();
    await page.click('[data-testid="delete-rule-option"]');
    
    // 삭제 확인 다이얼로그
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="deletion-warning-text"]'))
      .toContainText('이 규칙과 관련된 모든 위반 기록도 함께 삭제됩니다.');
    
    // 취소 버튼 테스트
    await page.click('[data-testid="cancel-delete-button"]');
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible();
    await expect(ruleItem).toBeVisible(); // 규칙이 여전히 존재해야 함
    
    // 다시 삭제 시도
    await ruleItem.locator('[data-testid="rule-menu-button"]').click();
    await page.click('[data-testid="delete-rule-option"]');
    
    // 확인 버튼 클릭
    await page.click('[data-testid="confirm-delete-button"]');
    
    await expectToast(page, '규칙이 삭제되었습니다.');
    
    // 규칙이 목록에서 제거되었는지 확인
    await expect(page.locator(`[data-testid="rule-item-${TEST_DATA.rules[0].title}"]`)).not.toBeVisible();
    
    // 빈 상태 메시지 확인
    await expect(page.locator('[data-testid="no-rules-message"]')).toBeVisible();
  });

  test('규칙 입력 유효성 검사 테스트', async ({ page }) => {
    await page.click('[data-testid="add-rule-button"]');
    
    // 규칙 타입 선택 없이 진행
    await page.click('[data-testid="save-rule-button"]');
    await expectToast(page, '규칙 타입을 선택해주세요.', 'error');
    
    // 타입 선택 후 빈 제목으로 저장 시도
    await page.click(`[data-testid="rule-type-word"]`);
    await page.click('[data-testid="save-rule-button"]');
    await expectToast(page, '규칙 제목을 입력해주세요.', 'error');
    
    // 제목만 입력하고 벌금 없이 저장 시도
    await page.fill('[data-testid="rule-title-input"]', '테스트 규칙');
    await page.click('[data-testid="save-rule-button"]');
    await expectToast(page, '벌금을 입력해주세요.', 'error');
    
    // 음수 벌금 입력 시도
    await page.fill('[data-testid="penalty-amount-input"]', '-10');
    await page.click('[data-testid="save-rule-button"]');
    await expectToast(page, '벌금은 0원 이상이어야 합니다.', 'error');
    
    // 너무 큰 금액 입력 시도
    await page.fill('[data-testid="penalty-amount-input"]', '999999999');
    await page.click('[data-testid="save-rule-button"]');
    await expectToast(page, '벌금은 100만원 이하로 설정해주세요.', 'error');
    
    // 올바른 값 입력
    await page.fill('[data-testid="penalty-amount-input"]', '1000');
    await page.click('[data-testid="save-rule-button"]');
    
    await expectToast(page, '규칙이 추가되었습니다!');
  });

  test('중복 규칙 방지 테스트', async ({ page }) => {
    // 첫 번째 규칙 추가
    await addRule(page, TEST_DATA.rules[0]);
    
    // 같은 제목의 규칙 추가 시도
    await page.click('[data-testid="add-rule-button"]');
    await page.click(`[data-testid="rule-type-${TEST_DATA.rules[0].type}"]`);
    await page.fill('[data-testid="rule-title-input"]', TEST_DATA.rules[0].title);
    await page.fill('[data-testid="penalty-amount-input"]', '2000');
    
    await page.click('[data-testid="save-rule-button"]');
    
    // 중복 오류 메시지
    await expectToast(page, '이미 같은 이름의 규칙이 존재합니다.', 'error');
    
    // 모달이 닫히지 않아야 함
    await expect(page.locator('[data-testid="add-rule-modal"]')).toBeVisible();
  });
});