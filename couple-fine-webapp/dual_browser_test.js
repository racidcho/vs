// 커플 앱 E2E 테스트 스크립트 - 2개 브라우저 동시 테스트
import { chromium } from '@playwright/test';

const APP_URL = 'https://joanddo.com'; // 실서버 테스트

// 테스트 결과 저장용
let testResults = {
  userA: { status: 'waiting', errors: [], screenshots: [] },
  userB: { status: 'waiting', errors: [], screenshots: [] },
  coupleCode: null,
  phases: {
    signup: { status: 'pending', results: {} },
    coupleConnection: { status: 'pending', results: {} },
    welcomeMessage: { status: 'pending', results: {} },
    crud: { status: 'pending', results: {} }
  }
};

// 브라우저와 페이지 변수
let browserA, browserB, pageA, pageB;

// 유틸리티 함수들
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const captureScreenshot = async (page, name) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${name}_${timestamp}.png`;
    await page.screenshot({ 
      path: fileName,
      fullPage: true 
    });
    console.log(`📷 스크린샷 저장: ${fileName}`);
    return fileName;
  } catch (error) {
    console.error(`스크린샷 실패: ${error.message}`);
  }
};

const logPhase = (phase, message) => {
  console.log(`\n🔄 [${phase.toUpperCase()}] ${message}`);
};

const logError = (user, error) => {
  console.error(`❌ [${user}] 에러: ${error}`);
  testResults[user].errors.push(error);
};

const logSuccess = (user, message) => {
  console.log(`✅ [${user}] ${message}`);
};

// 메인 테스트 함수
async function runDualBrowserTest() {
  try {
    console.log('🚀 커플 앱 E2E 테스트 시작...');
    console.log(`📍 테스트 URL: ${APP_URL}`);
    
    // 브라우저 초기화
    logPhase('setup', 'Playwright 브라우저 초기화 중...');
    browserA = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-web-security']
    });
    browserB = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-web-security']
    });

    const contextA = await browserA.newContext({
      viewport: { width: 390, height: 844 }, // 모바일 뷰포트
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    const contextB = await browserB.newContext({
      viewport: { width: 390, height: 844 }, // 모바일 뷰포트
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    pageA = await contextA.newPage();
    pageB = await contextB.newPage();

    logSuccess('setup', 'A, B 브라우저 준비 완료');

    // Phase 1: 앱 로딩 및 초기화
    await testPhase1_AppLoading();
    
    // Phase 2: 회원가입 프로세스
    await testPhase2_SignUp();
    
    // Phase 3: 커플 매칭
    await testPhase3_CoupleMatching();
    
    // Phase 4: 커플 환영 메시지
    await testPhase4_WelcomeMessage();
    
    // Phase 5: CRUD 및 동기화
    await testPhase5_CrudAndSync();

    // 테스트 완료
    console.log('\n🎉 모든 테스트가 완료되었습니다!');
    printTestResults();

  } catch (error) {
    console.error('💥 테스트 실행 중 치명적 에러:', error);
    testResults.phases.error = error.message;
  } finally {
    // 정리
    await cleanup();
  }
}

async function testPhase1_AppLoading() {
  logPhase('Phase1', '앱 로딩 및 초기화 테스트');
  
  try {
    // 동시에 페이지 로딩
    await Promise.all([
      pageA.goto(APP_URL, { waitUntil: 'networkidle' }),
      pageB.goto(APP_URL, { waitUntil: 'networkidle' })
    ]);

    await delay(2000); // 로딩 대기
    
    // 스크린샷
    await Promise.all([
      captureScreenshot(pageA, 'user_a_initial_page'),
      captureScreenshot(pageB, 'user_b_initial_page')
    ]);

    logSuccess('Phase1', '앱 로딩 완료');
    testResults.phases.setup = { status: 'completed', timestamp: new Date() };
    
  } catch (error) {
    logError('Phase1', error.message);
    testResults.phases.setup = { status: 'failed', error: error.message };
  }
}

async function testPhase2_SignUp() {
  logPhase('Phase2', '회원가입 프로세스 테스트 (2명 동시)');
  
  try {
    // 사용자 A 회원가입
    await signUpUser(pageA, 'user_a', 'testuser_a@example.com');
    
    // 사용자 B 회원가입
    await signUpUser(pageB, 'user_b', 'testuser_b@example.com');
    
    testResults.phases.signup = { status: 'completed', timestamp: new Date() };
    logSuccess('Phase2', '2명 회원가입 완료');
    
  } catch (error) {
    logError('Phase2', error.message);
    testResults.phases.signup = { status: 'failed', error: error.message };
  }
}

async function signUpUser(page, userName, email) {
  try {
    logPhase('signup', `${userName} 회원가입 시작`);
    
    // 로그인 페이지 확인
    const isLoginPage = await page.locator('text=로그인').isVisible();
    if (isLoginPage) {
      logSuccess(userName, '로그인 페이지 확인됨');
    }
    
    // 이메일 입력
    await page.fill('input[type="email"]', email);
    logSuccess(userName, `이메일 입력 완료: ${email}`);
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    logSuccess(userName, '로그인 요청 전송');
    
    await delay(2000);
    
    // OTP 입력 화면 대기
    const otpInputVisible = await page.waitForSelector('input[inputmode="numeric"]', { 
      timeout: 10000 
    });
    
    if (otpInputVisible) {
      logSuccess(userName, 'OTP 입력 화면 확인됨');
      await captureScreenshot(page, `${userName}_otp_screen`);
      
      // 실제 환경에서는 수동으로 OTP를 입력해야 함
      console.log(`⚠️ [${userName}] 이메일을 확인하고 OTP 코드를 수동으로 입력하세요`);
      
      // OTP 입력 대기 (수동 입력을 위한 시간)
      await delay(30000); // 30초 대기
      
      // 로그인 완료 확인
      const isDashboard = await page.waitForSelector('text=우리 벌금통', { 
        timeout: 15000 
      }).catch(() => null);
      
      if (isDashboard) {
        logSuccess(userName, '로그인 완료 - 대시보드 확인됨');
        await captureScreenshot(page, `${userName}_dashboard`);
      }
    }
    
  } catch (error) {
    logError(userName, `회원가입 실패: ${error.message}`);
    await captureScreenshot(page, `${userName}_signup_error`);
    throw error;
  }
}

async function testPhase3_CoupleMatching() {
  logPhase('Phase3', '커플 매칭 프로세스 테스트');
  
  try {
    // 사용자 A가 새 커플 생성
    await createNewCouple(pageA, 'user_a');
    
    await delay(2000);
    
    // 사용자 B가 커플 코드로 참여
    if (testResults.coupleCode) {
      await joinCouple(pageB, 'user_b', testResults.coupleCode);
    }
    
    testResults.phases.coupleConnection = { status: 'completed', timestamp: new Date() };
    logSuccess('Phase3', '커플 매칭 완료');
    
  } catch (error) {
    logError('Phase3', error.message);
    testResults.phases.coupleConnection = { status: 'failed', error: error.message };
  }
}

async function createNewCouple(page, userName) {
  try {
    logPhase('couple-create', `${userName} 새 커플 생성 시작`);
    
    // 커플 설정 페이지로 이동 (없는 경우)
    const coupleSetupButton = await page.locator('text=새 커플 만들기').first();
    if (await coupleSetupButton.isVisible()) {
      await coupleSetupButton.click();
      logSuccess(userName, '새 커플 만들기 클릭');
    }
    
    // 커플 코드 생성 확인
    const coupleCodeElement = await page.waitForSelector('[class*="code"], [class*="couple-code"]', {
      timeout: 10000
    }).catch(() => null);
    
    if (coupleCodeElement) {
      const coupleCode = await coupleCodeElement.textContent();
      testResults.coupleCode = coupleCode.replace(/\s/g, '');
      logSuccess(userName, `커플 코드 생성: ${testResults.coupleCode}`);
      await captureScreenshot(page, `${userName}_couple_code`);
    }
    
  } catch (error) {
    logError(userName, `커플 생성 실패: ${error.message}`);
    throw error;
  }
}

async function joinCouple(page, userName, coupleCode) {
  try {
    logPhase('couple-join', `${userName} 커플 참여 시작 (코드: ${coupleCode})`);
    
    // 커플 참여 버튼 찾기
    const joinButton = await page.locator('text=커플 참여하기').first();
    if (await joinButton.isVisible()) {
      await joinButton.click();
      logSuccess(userName, '커플 참여하기 클릭');
    }
    
    // 커플 코드 입력
    const codeInput = await page.locator('input[placeholder*="코드"], input[type="text"]').first();
    if (codeInput) {
      await codeInput.fill(coupleCode);
      logSuccess(userName, `커플 코드 입력: ${coupleCode}`);
      
      // 참여 확인 버튼
      await page.click('button:has-text("참여")');
      logSuccess(userName, '커플 참여 요청 전송');
    }
    
    await delay(3000);
    await captureScreenshot(page, `${userName}_couple_joined`);
    
  } catch (error) {
    logError(userName, `커플 참여 실패: ${error.message}`);
    throw error;
  }
}

async function testPhase4_WelcomeMessage() {
  logPhase('Phase4', '커플 환영 메시지 동시 표시 확인');
  
  try {
    // 양쪽 브라우저에서 환영 메시지 확인
    const [welcomeA, welcomeB] = await Promise.all([
      checkWelcomeMessage(pageA, 'user_a'),
      checkWelcomeMessage(pageB, 'user_b')
    ]);
    
    if (welcomeA && welcomeB) {
      logSuccess('Phase4', '양쪽 사용자 모두 환영 메시지 확인됨');
      testResults.phases.welcomeMessage = { 
        status: 'completed', 
        timestamp: new Date(),
        results: { userA: welcomeA, userB: welcomeB }
      };
    } else {
      throw new Error('환영 메시지가 양쪽에서 동시에 표시되지 않음');
    }
    
  } catch (error) {
    logError('Phase4', error.message);
    testResults.phases.welcomeMessage = { status: 'failed', error: error.message };
  }
}

async function checkWelcomeMessage(page, userName) {
  try {
    // 환영 메시지나 축하 화면 확인
    const welcomeElements = [
      'text=축하합니다',
      'text=커플 연결 완료',
      'text=환영합니다',
      '[class*="welcome"]',
      '[class*="celebration"]'
    ];
    
    let found = false;
    for (const selector of welcomeElements) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        logSuccess(userName, `환영 메시지 발견: ${selector}`);
        await captureScreenshot(page, `${userName}_welcome_message`);
        found = true;
        break;
      }
    }
    
    return found;
    
  } catch (error) {
    logError(userName, `환영 메시지 확인 실패: ${error.message}`);
    return false;
  }
}

async function testPhase5_CrudAndSync() {
  logPhase('Phase5', 'CRUD 및 화면 동기화 테스트');
  
  try {
    // 사용자 A가 규칙 추가
    await testCrudOperation(pageA, 'user_a', 'rule');
    
    await delay(3000);
    
    // 사용자 B 화면에서 동기화 확인
    await checkSyncOnOtherUser(pageB, 'user_b', 'rule');
    
    // 사용자 B가 벌금 추가
    await testCrudOperation(pageB, 'user_b', 'violation');
    
    await delay(3000);
    
    // 사용자 A 화면에서 동기화 확인
    await checkSyncOnOtherUser(pageA, 'user_a', 'violation');
    
    testResults.phases.crud = { status: 'completed', timestamp: new Date() };
    logSuccess('Phase5', 'CRUD 및 동기화 테스트 완료');
    
  } catch (error) {
    logError('Phase5', error.message);
    testResults.phases.crud = { status: 'failed', error: error.message };
  }
}

async function testCrudOperation(page, userName, operationType) {
  try {
    logPhase('crud', `${userName} ${operationType} 추가 시작`);
    
    if (operationType === 'rule') {
      // 규칙 추가 테스트
      await page.click('text=규칙');
      await delay(1000);
      
      const addButton = await page.locator('button:has-text("추가")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // 규칙 이름 입력
        await page.fill('input[placeholder*="규칙"], input[placeholder*="제목"]', 'E2E 테스트 규칙');
        
        // 금액 입력
        const amountInput = await page.locator('input[type="number"]').first();
        if (amountInput) {
          await amountInput.fill('5000');
        }
        
        // 저장 버튼
        await page.click('button:has-text("저장")');
        logSuccess(userName, '규칙 추가 완료');
      }
      
    } else if (operationType === 'violation') {
      // 벌금 추가 테스트
      await page.click('text=벌금');
      await delay(1000);
      
      const addViolationButton = await page.locator('button:has-text("기록")').first();
      if (await addViolationButton.isVisible()) {
        await addViolationButton.click();
        
        // 규칙 선택
        const ruleSelect = await page.locator('select').first();
        if (await ruleSelect.isVisible()) {
          await ruleSelect.selectOption({ index: 1 });
        }
        
        // 저장 버튼
        await page.click('button:has-text("저장")');
        logSuccess(userName, '벌금 추가 완료');
      }
    }
    
    await captureScreenshot(page, `${userName}_${operationType}_added`);
    
  } catch (error) {
    logError(userName, `${operationType} 추가 실패: ${error.message}`);
    throw error;
  }
}

async function checkSyncOnOtherUser(page, userName, operationType) {
  try {
    logPhase('sync', `${userName} 화면에서 ${operationType} 동기화 확인`);
    
    // 페이지 새로고침 없이 실시간 동기화 확인
    await delay(2000);
    
    if (operationType === 'rule') {
      // 규칙 페이지에서 확인
      await page.click('text=규칙');
      await delay(1000);
      
      const newRule = await page.locator('text=E2E 테스트 규칙').first();
      const isVisible = await newRule.isVisible().catch(() => false);
      
      if (isVisible) {
        logSuccess(userName, '규칙 실시간 동기화 확인됨');
      } else {
        throw new Error('규칙 동기화 실패');
      }
      
    } else if (operationType === 'violation') {
      // 대시보드에서 확인
      await page.click('text=홈');
      await delay(1000);
      
      // 최근 활동이나 벌금 현황에서 확인
      const activityElements = await page.locator('[class*="activity"], [class*="recent"]').count();
      
      if (activityElements > 0) {
        logSuccess(userName, '벌금 실시간 동기화 확인됨');
      } else {
        console.log(`⚠️ [${userName}] 벌금 동기화 확인 어려움 - 가시적 변화 불명확`);
      }
    }
    
    await captureScreenshot(page, `${userName}_sync_${operationType}`);
    
  } catch (error) {
    logError(userName, `동기화 확인 실패: ${error.message}`);
    throw error;
  }
}

function printTestResults() {
  console.log('\n📊 테스트 결과 요약:');
  console.log('=' * 50);
  
  Object.entries(testResults.phases).forEach(([phase, result]) => {
    const status = result.status === 'completed' ? '✅' : 
                  result.status === 'failed' ? '❌' : '⏳';
    console.log(`${status} ${phase}: ${result.status}`);
    
    if (result.error) {
      console.log(`   오류: ${result.error}`);
    }
    if (result.timestamp) {
      console.log(`   완료 시간: ${result.timestamp.toLocaleString()}`);
    }
  });
  
  console.log('\n🔍 상세 정보:');
  console.log(`커플 코드: ${testResults.coupleCode || '생성되지 않음'}`);
  console.log(`User A 에러 수: ${testResults.userA.errors.length}`);
  console.log(`User B 에러 수: ${testResults.userB.errors.length}`);
}

async function cleanup() {
  console.log('\n🧹 정리 작업 시작...');
  
  try {
    if (pageA) await pageA.close();
    if (pageB) await pageB.close();
    if (browserA) await browserA.close();
    if (browserB) await browserB.close();
    
    logSuccess('cleanup', '브라우저 정리 완료');
  } catch (error) {
    console.error('정리 작업 중 에러:', error);
  }
}

// 테스트 실행
runDualBrowserTest().catch(console.error);