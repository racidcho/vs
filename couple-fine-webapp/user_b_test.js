import { chromium } from '@playwright/test';

const APP_URL = 'https://joanddo.com';
const COUPLE_CODE = 'SH6QR7'; // User A에서 생성된 커플 코드

let browser, page;

async function userBTest() {
  try {
    console.log('👥 User B 테스트 시작...');
    
    // 브라우저 초기화
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-web-security']
    });

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    page = await context.newPage();

    // 1. 사이트 접속
    console.log('🌐 사이트 접속 중...');
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await delay(2000);
    
    await captureScreenshot('user_b_initial');
    console.log('✅ 사이트 접속 완료');

    // 2. 회원가입 진행
    console.log('📝 회원가입 진행 중...');
    await page.click('text=회원가입');
    await delay(1000);
    
    await page.fill('input[type="email"]', 'testuser_b@example.com');
    await page.fill('#password', 'testpassword456');
    await page.fill('#confirmPassword', 'testpassword456');
    
    await captureScreenshot('user_b_before_signup');
    
    await page.click('button[type="submit"]');
    await delay(3000);
    
    await captureScreenshot('user_b_after_signup');
    console.log('✅ 회원가입 완료');

    // 3. 커플 참여하기
    console.log('💕 커플 참여 중...');
    
    // 커플 설정 페이지 확인
    const coupleSetupVisible = await page.locator('text=기존 커플 참여').isVisible();
    if (coupleSetupVisible) {
      await page.click('text=기존 커플 참여');
      await delay(1000);
      
      // 커플 코드 입력
      await page.fill('input[placeholder*="커플 코드"], input[placeholder*="코드"]', COUPLE_CODE);
      await captureScreenshot('user_b_code_entered');
      
      await page.click('button:has-text("참여하기"), button:has-text("참여")');
      await delay(3000);
      
      await captureScreenshot('user_b_couple_joined');
      console.log('✅ 커플 참여 완료');
    }

    // 4. 이름 설정
    console.log('👨 이름 설정 중...');
    const nameInput = await page.locator('input[placeholder*="이름"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('정훈');
      await page.click('button:has-text("시작하기")');
      await delay(3000);
      
      await captureScreenshot('user_b_name_set');
      console.log('✅ 이름 설정 완료');
    }

    // 5. 최종 상태 확인
    await captureScreenshot('user_b_final_state');
    const finalText = await page.textContent('body');
    console.log('📊 User B 최종 상태:', finalText.includes('우리 벌금통') ? '대시보드 접근 성공' : '상태 불명');

    // 6. 환영 메시지 확인
    const welcomeElements = [
      'text=축하합니다',
      'text=커플 연결 완료', 
      'text=환영합니다',
      '[class*="celebration"]'
    ];
    
    let welcomeFound = false;
    for (const selector of welcomeElements) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        console.log('🎉 환영 메시지 확인됨:', selector);
        await captureScreenshot('user_b_welcome_message');
        welcomeFound = true;
        break;
      }
    }
    
    if (!welcomeFound) {
      console.log('⚠️ 환영 메시지 찾을 수 없음');
    }

    console.log('🎉 User B 테스트 완료!');

  } catch (error) {
    console.error('❌ User B 테스트 실패:', error.message);
    await captureScreenshot('user_b_error');
  } finally {
    // 정리 작업 - 브라우저 닫지 않고 유지
    console.log('🔄 User B 브라우저는 테스트를 위해 열린 상태로 유지됩니다');
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const captureScreenshot = async (name) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${name}_${timestamp}.png`;
    await page.screenshot({ 
      path: fileName,
      fullPage: true 
    });
    console.log(`📷 스크린샷 저장: ${fileName}`);
  } catch (error) {
    console.error(`스크린샷 실패: ${error.message}`);
  }
};

// 테스트 실행
userBTest().catch(console.error);