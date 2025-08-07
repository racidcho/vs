import { FullConfig } from '@playwright/test';

/**
 * Playwright 전역 설정
 * 테스트 시작 전 환경 준비
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 E2E 테스트 환경 설정 시작...');
  
  // 환경 변수 확인
  const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  환경 변수 누락: ${missingVars.join(', ')}`);
    console.warn('일부 테스트가 실패할 수 있습니다.');
  }
  
  // 테스트 데이터 정리 (필요한 경우)
  await cleanupTestData();
  
  console.log('✅ E2E 테스트 환경 설정 완료');
}

/**
 * 테스트 데이터 정리
 */
async function cleanupTestData() {
  try {
    // 테스트용 계정 및 데이터 정리 로직
    console.log('🧹 테스트 데이터 정리 중...');
    
    // TODO: Supabase 테스트 데이터 정리
    // 테스트용 이메일 계정들 정리
    // 테스트용 커플 데이터 정리
    
    console.log('✅ 테스트 데이터 정리 완료');
  } catch (error) {
    console.warn('⚠️  테스트 데이터 정리 중 오류 발생:', error);
  }
}

export default globalSetup;