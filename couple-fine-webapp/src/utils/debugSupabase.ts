// Supabase 디버깅 유틸리티
import { supabase } from '../lib/supabase';
import type { User } from '../types';

// 색상 코드 정의
const colors = {
  success: 'background: #10b981; color: white; padding: 2px 6px; border-radius: 3px',
  error: 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px',
  warning: 'background: #f59e0b; color: white; padding: 2px 6px; border-radius: 3px',
  info: 'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px',
  debug: 'background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 3px'
};

// 디버깅 플래그 (개발 환경에서만 활성화)
export const DEBUG_MODE = import.meta.env.DEV;

// 디버깅 로그 함수
export const debugLog = (category: string, message: string, data?: any, type: 'success' | 'error' | 'warning' | 'info' | 'debug' = 'info') => {
  if (!DEBUG_MODE) return;
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(
    `%c[${timestamp}] ${category}%c ${message}`,
    colors[type],
    'color: inherit',
    data || ''
  );
};

// 1. Supabase 연결 상태 확인
export const checkSupabaseConnection = async () => {
  debugLog('CONNECTION', '=== Supabase 연결 테스트 시작 ===', null, 'debug');
  
  try {
    // 환경변수 확인
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    debugLog('ENV', 'Supabase URL', url ? `${url.substring(0, 30)}...` : 'NOT SET', url ? 'success' : 'error');
    debugLog('ENV', 'Anon Key', anonKey ? `${anonKey.substring(0, 20)}...` : 'NOT SET', anonKey ? 'success' : 'error');
    
    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      debugLog('CONNECTION', 'Supabase 연결 실패', error, 'error');
      return false;
    }
    
    debugLog('CONNECTION', 'Supabase 연결 성공', data, 'success');
    return true;
  } catch (err) {
    debugLog('CONNECTION', '예외 발생', err, 'error');
    return false;
  }
};

// 2. 인증 상태 확인
export const checkAuthStatus = async () => {
  debugLog('AUTH', '=== 인증 상태 확인 시작 ===', null, 'debug');
  
  try {
    // 현재 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      debugLog('AUTH', '세션 조회 실패', sessionError, 'error');
      return null;
    }
    
    if (!session) {
      debugLog('AUTH', '세션 없음 (로그인 필요)', null, 'warning');
      return null;
    }
    
    debugLog('AUTH', '세션 발견', {
      user_id: session.user.id,
      email: session.user.email,
      expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
      role: session.user.role
    }, 'success');
    
    // 사용자 프로필 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      debugLog('AUTH', '프로필 조회 실패', profileError, 'error');
    } else {
      debugLog('AUTH', '프로필 정보', profile, 'success');
    }
    
    return session.user;
  } catch (err) {
    debugLog('AUTH', '인증 확인 중 예외', err, 'error');
    return null;
  }
};

// 3. RLS 정책 테스트
export const testRLSPolicies = async (userId: string, coupleId?: string) => {
  debugLog('RLS', '=== RLS 정책 테스트 시작 ===', null, 'debug');
  
  const tests = [
    {
      name: 'profiles SELECT',
      query: () => supabase.from('profiles').select('*').eq('id', userId)
    },
    {
      name: 'couples SELECT',
      query: () => supabase.from('couples').select('*')
    },
    {
      name: 'rules SELECT',
      query: () => supabase.from('rules').select('*')
    },
    {
      name: 'violations SELECT',
      query: () => supabase.from('violations').select('*')
    },
    {
      name: 'rewards SELECT',
      query: () => supabase.from('rewards').select('*')
    }
  ];
  
  for (const test of tests) {
    try {
      const { data, error } = await test.query();
      
      if (error) {
        debugLog('RLS', `❌ ${test.name}`, error.message, 'error');
      } else {
        debugLog('RLS', `✅ ${test.name}`, `${data?.length || 0}개 조회됨`, 'success');
      }
    } catch (err) {
      debugLog('RLS', `💥 ${test.name} 예외`, err, 'error');
    }
  }
};

// 4. Realtime 구독 테스트
export const testRealtimeSubscription = (tableName: string = 'rules') => {
  debugLog('REALTIME', `=== ${tableName} 테이블 Realtime 테스트 시작 ===`, null, 'debug');
  
  const channel = supabase
    .channel(`test-${tableName}-${Date.now()}`)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: tableName 
      },
      (payload) => {
        debugLog('REALTIME', `📨 이벤트 수신: ${payload.eventType}`, payload, 'success');
      }
    )
    .on('subscribe', (status) => {
      if (status === 'SUBSCRIBED') {
        debugLog('REALTIME', `✅ ${tableName} 구독 성공`, null, 'success');
      } else {
        debugLog('REALTIME', `구독 상태: ${status}`, null, 'info');
      }
    })
    .on('error', (error) => {
      debugLog('REALTIME', '구독 에러', error, 'error');
    })
    .subscribe((status, err) => {
      if (err) {
        debugLog('REALTIME', '구독 실패', err, 'error');
      } else {
        debugLog('REALTIME', `구독 완료: ${status}`, null, 'success');
      }
    });
  
  // 연결 상태 확인
  setTimeout(() => {
    const state = channel.state;
    debugLog('REALTIME', `채널 상태 (3초 후): ${state}`, null, state === 'joined' ? 'success' : 'warning');
    
    // WebSocket 상태 확인
    const allChannels = supabase.getChannels();
    debugLog('REALTIME', '모든 채널', allChannels.map(ch => ({
      topic: ch.topic,
      state: ch.state
    })), 'info');
  }, 3000);
  
  return channel;
};

// 5. CRUD 작업 테스트
export const testCRUDOperations = async (userId: string, coupleId: string) => {
  debugLog('CRUD', '=== CRUD 작업 테스트 시작 ===', null, 'debug');
  
  // CREATE 테스트 - 규칙 생성
  debugLog('CRUD', '규칙 생성 테스트', null, 'info');
  const testRule = {
    couple_id: coupleId,
    title: `테스트 규칙 ${Date.now()}`,
    description: '디버깅용 테스트 규칙',
    fine_amount: 1000,
    created_by_user_id: userId,
    is_active: true
  };
  
  const { data: createdRule, error: createError } = await supabase
    .from('rules')
    .insert([testRule])
    .select()
    .single();
  
  if (createError) {
    debugLog('CRUD', 'CREATE 실패', createError, 'error');
    debugLog('CRUD', 'CREATE 요청 데이터', testRule, 'debug');
  } else {
    debugLog('CRUD', 'CREATE 성공', createdRule, 'success');
    
    // UPDATE 테스트
    if (createdRule) {
      const { data: updatedRule, error: updateError } = await supabase
        .from('rules')
        .update({ fine_amount: 2000 })
        .eq('id', createdRule.id)
        .select()
        .single();
      
      if (updateError) {
        debugLog('CRUD', 'UPDATE 실패', updateError, 'error');
      } else {
        debugLog('CRUD', 'UPDATE 성공', updatedRule, 'success');
      }
      
      // DELETE 테스트
      const { error: deleteError } = await supabase
        .from('rules')
        .delete()
        .eq('id', createdRule.id);
      
      if (deleteError) {
        debugLog('CRUD', 'DELETE 실패', deleteError, 'error');
      } else {
        debugLog('CRUD', 'DELETE 성공', null, 'success');
      }
    }
  }
};

// 6. 커플 연결 상태 확인
export const checkCoupleConnection = async (userId: string) => {
  debugLog('COUPLE', '=== 커플 연결 상태 확인 ===', null, 'debug');
  
  try {
    // 사용자의 couple_id 확인
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('couple_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      debugLog('COUPLE', '프로필 조회 실패', profileError, 'error');
      return null;
    }
    
    if (!userProfile?.couple_id) {
      debugLog('COUPLE', '커플 연결 안됨', null, 'warning');
      return null;
    }
    
    debugLog('COUPLE', '커플 ID 발견', userProfile.couple_id, 'success');
    
    // 커플 정보 조회
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('*')
      .eq('id', userProfile.couple_id)
      .single();
    
    if (coupleError) {
      debugLog('COUPLE', '커플 정보 조회 실패', coupleError, 'error');
      return null;
    }
    
    debugLog('COUPLE', '커플 정보', couple, 'success');
    
    // 파트너 정보 조회
    const partnerId = couple.partner_1_id === userId ? couple.partner_2_id : couple.partner_1_id;
    
    const { data: partner, error: partnerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single();
    
    if (partnerError) {
      debugLog('COUPLE', '파트너 정보 조회 실패', partnerError, 'error');
    } else {
      debugLog('COUPLE', '파트너 정보', partner, 'success');
    }
    
    return couple;
  } catch (err) {
    debugLog('COUPLE', '커플 확인 중 예외', err, 'error');
    return null;
  }
};

// 7. 전체 진단 실행
export const runFullDiagnostics = async () => {
  console.clear();
  console.log('%c🔍 Supabase 전체 진단 시작', 'font-size: 20px; font-weight: bold; color: #3b82f6');
  console.log('='.repeat(60));
  
  // 1. 연결 확인
  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    debugLog('DIAGNOSTIC', '연결 실패로 진단 중단', null, 'error');
    return;
  }
  
  // 2. 인증 확인
  const user = await checkAuthStatus();
  if (!user) {
    debugLog('DIAGNOSTIC', '인증 필요 - 로그인 후 다시 시도하세요', null, 'warning');
    return;
  }
  
  // 3. 커플 연결 확인
  const couple = await checkCoupleConnection(user.id);
  
  // 4. RLS 테스트
  await testRLSPolicies(user.id, couple?.id);
  
  // 5. CRUD 테스트 (커플이 있는 경우만)
  if (couple) {
    await testCRUDOperations(user.id, couple.id);
  }
  
  // 6. Realtime 테스트
  const channels = ['rules', 'violations', 'rewards'];
  channels.forEach(table => testRealtimeSubscription(table));
  
  console.log('='.repeat(60));
  console.log('%c✅ 진단 완료 - 위 로그를 확인하세요', 'font-size: 16px; font-weight: bold; color: #10b981');
};

// 브라우저 콘솔에서 사용할 수 있도록 전역 노출
if (DEBUG_MODE) {
  (window as any).supabaseDebug = {
    runFullDiagnostics,
    checkConnection: checkSupabaseConnection,
    checkAuth: checkAuthStatus,
    testRLS: testRLSPolicies,
    testRealtime: testRealtimeSubscription,
    testCRUD: testCRUDOperations,
    checkCouple: checkCoupleConnection
  };
  
  console.log('%c🔧 Supabase 디버깅 도구 활성화됨', 'color: #10b981; font-weight: bold');
  console.log('콘솔에서 다음 명령어를 사용하세요:');
  console.log('- supabaseDebug.runFullDiagnostics() : 전체 진단 실행');
  console.log('- supabaseDebug.checkConnection() : 연결 확인');
  console.log('- supabaseDebug.checkAuth() : 인증 상태 확인');
  console.log('- supabaseDebug.testRealtime("rules") : 실시간 테스트');
}