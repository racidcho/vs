/**
 * 🔄 SUPABASE REALTIME 설정 및 테스트 스크립트
 * 브라우저 콘솔에서 실행하여 Supabase 설정 확인 및 수정
 */

// 🎯 메인 함수: 모든 설정 확인 및 적용
async function setupSupabaseRealtime() {
  console.log('🚀 SUPABASE REALTIME SETUP 시작');
  console.log('=====================================');
  
  if (!window.supabase) {
    console.error('❌ Supabase 클라이언트를 찾을 수 없습니다');
    return;
  }
  
  const results = {
    timestamp: new Date().toISOString(),
    steps: {},
    success: true
  };
  
  try {
    // Step 1: 현재 RLS 정책 확인
    console.log('🔍 Step 1: RLS 정책 확인 중...');
    results.steps.rls_check = await checkRLSPolicies();
    
    // Step 2: 테이블 접근 권한 테스트
    console.log('🔍 Step 2: 테이블 접근 권한 테스트 중...');
    results.steps.table_access = await testTableAccess();
    
    // Step 3: Realtime 채널 확인
    console.log('🔍 Step 3: Realtime 채널 확인 중...');
    results.steps.realtime_check = await checkRealtimeChannels();
    
    // Step 4: 필요시 RLS 정책 적용
    if (!results.steps.table_access.allPassed) {
      console.log('🔧 Step 4: RLS 정책 적용 중...');
      results.steps.rls_fix = await applyRLSPolicies();
    }
    
    // Step 5: Realtime 테스트
    console.log('🔍 Step 5: Realtime 연결 테스트 중...');
    results.steps.realtime_test = await testRealtimeConnection();
    
    // 결과 요약
    console.log('📊 설정 완료! 결과 요약:');
    console.table(results.steps);
    
    if (results.success) {
      console.log('🎉 모든 설정이 완료되었습니다!');
      console.log('이제 두 브라우저로 테스트해보세요.');
    } else {
      console.log('⚠️ 일부 설정에 문제가 있습니다. 위 결과를 확인해주세요.');
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 설정 중 오류 발생:', error);
    results.success = false;
    return results;
  }
}

// 🔍 현재 RLS 정책 확인
async function checkRLSPolicies() {
  try {
    const { data: policies, error } = await window.supabase.rpc('debug_rls_policies');
    
    if (error) {
      console.log('⚠️ RLS 정책 확인 함수가 없습니다. 정책을 적용해야 합니다.');
      return { status: 'needs_setup', policies: [] };
    }
    
    console.log('✅ RLS 정책 확인 완료:', policies.length, '개 정책 발견');
    console.table(policies);
    
    return { status: 'ok', policies: policies };
  } catch (error) {
    console.log('⚠️ RLS 정책 확인 실패:', error.message);
    return { status: 'error', error: error.message };
  }
}

// 🔍 테이블 접근 권한 테스트
async function testTableAccess() {
  const tables = ['profiles', 'couples', 'rules', 'violations', 'rewards'];
  const results = {};
  let allPassed = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await window.supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table} 테이블 접근 실패:`, error.message);
        results[table] = { status: 'failed', error: error.message };
        allPassed = false;
      } else {
        console.log(`✅ ${table} 테이블 접근 성공`);
        results[table] = { status: 'ok', count: data?.length || 0 };
      }
    } catch (error) {
      console.log(`💥 ${table} 테이블 테스트 중 예외:`, error.message);
      results[table] = { status: 'exception', error: error.message };
      allPassed = false;
    }
  }
  
  return { allPassed, results };
}

// 🔍 Realtime 채널 확인
async function checkRealtimeChannels() {
  try {
    const channels = window.supabase.realtime?.channels || [];
    
    console.log('📡 활성 Realtime 채널:', channels.length, '개');
    
    const channelInfo = channels.map(ch => ({
      topic: ch.topic,
      state: ch.state,
      joinRef: ch.joinRef
    }));
    
    if (channelInfo.length > 0) {
      console.table(channelInfo);
    }
    
    return {
      status: 'ok',
      channelCount: channels.length,
      channels: channelInfo
    };
  } catch (error) {
    console.log('⚠️ Realtime 채널 확인 실패:', error.message);
    return { status: 'error', error: error.message };
  }
}

// 🔧 RLS 정책 적용
async function applyRLSPolicies() {
  console.log('🔧 RLS 정책 적용을 시작합니다...');
  
  const policies = [
    // Profiles - 모든 인증된 사용자가 조회 가능
    `
    CREATE POLICY IF NOT EXISTS "allow_authenticated_view_profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);
    `,
    
    // Couples - 커플 멤버만 접근
    `
    CREATE POLICY IF NOT EXISTS "allow_couple_members_view_couples"
    ON couples FOR SELECT
    TO authenticated
    USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);
    `,
    
    // Rules - 커플 멤버만 접근
    `
    CREATE POLICY IF NOT EXISTS "allow_couple_members_all_rules"
    ON rules FOR ALL
    TO authenticated
    USING (
      couple_id IN (
        SELECT id FROM couples 
        WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
      )
    )
    WITH CHECK (
      couple_id IN (
        SELECT id FROM couples 
        WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
      )
    );
    `,
    
    // Violations - 커플 멤버만 접근  
    `
    CREATE POLICY IF NOT EXISTS "allow_couple_members_all_violations"
    ON violations FOR ALL
    TO authenticated
    USING (
      couple_id IN (
        SELECT id FROM couples 
        WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
      )
    )
    WITH CHECK (
      couple_id IN (
        SELECT id FROM couples 
        WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
      )
    );
    `,
    
    // Rewards - 커플 멤버만 접근
    `
    CREATE POLICY IF NOT EXISTS "allow_couple_members_all_rewards"
    ON rewards FOR ALL  
    TO authenticated
    USING (
      couple_id IN (
        SELECT id FROM couples 
        WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
      )
    )
    WITH CHECK (
      couple_id IN (
        SELECT id FROM couples 
        WHERE auth.uid() = partner_1_id OR auth.uid() = partner_2_id
      )
    );
    `
  ];
  
  const results = [];
  
  for (let i = 0; i < policies.length; i++) {
    try {
      const { data, error } = await window.supabase.rpc('exec_sql', { 
        sql: policies[i] 
      });
      
      if (error) {
        console.log(`❌ 정책 ${i + 1} 적용 실패:`, error.message);
        results.push({ index: i + 1, status: 'failed', error: error.message });
      } else {
        console.log(`✅ 정책 ${i + 1} 적용 성공`);
        results.push({ index: i + 1, status: 'success' });
      }
    } catch (error) {
      console.log(`💥 정책 ${i + 1} 적용 중 예외:`, error.message);
      results.push({ index: i + 1, status: 'exception', error: error.message });
    }
  }
  
  return { results };
}

// 🔍 Realtime 연결 테스트
async function testRealtimeConnection() {
  return new Promise((resolve) => {
    console.log('📡 Realtime 연결 테스트 중...');
    
    const testChannel = window.supabase
      .channel('test-connection')
      .on('broadcast', { event: 'test' }, (payload) => {
        console.log('✅ Realtime 메시지 수신:', payload);
      })
      .subscribe((status) => {
        console.log('📡 테스트 채널 상태:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime 연결 성공!');
          
          // 테스트 메시지 보내기
          testChannel.send({
            type: 'broadcast',
            event: 'test',
            payload: { message: 'Hello Realtime!' }
          });
          
          setTimeout(() => {
            window.supabase.removeChannel(testChannel);
            resolve({ status: 'success', connected: true });
          }, 2000);
          
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Realtime 연결 실패');
          resolve({ status: 'failed', connected: false });
        }
      });
  });
}

// 🎯 빠른 CRUD 테스트
async function testCRUDOperations() {
  console.log('🧪 CRUD 작업 테스트 시작');
  
  try {
    // 현재 사용자 확인
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.log('❌ 로그인된 사용자 없음');
      return { success: false, error: 'Not logged in' };
    }
    
    // 커플 정보 확인
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('couple_id')
      .eq('id', user.id)
      .single();
    
    if (!profile?.couple_id) {
      console.log('❌ 커플 연결 안됨');
      return { success: false, error: 'No couple connection' };
    }
    
    // 규칙 생성 테스트
    const { data: newRule, error: ruleError } = await window.supabase
      .from('rules')
      .insert({
        couple_id: profile.couple_id,
        title: 'Test Rule ' + Date.now(),
        fine_amount: 1000,
        created_by_user_id: user.id,
        is_active: true
      })
      .select()
      .single();
    
    if (ruleError) {
      console.log('❌ 규칙 생성 실패:', ruleError);
      return { success: false, error: ruleError.message };
    }
    
    console.log('✅ 규칙 생성 성공:', newRule);
    
    // 규칙 삭제 (정리)
    await window.supabase.from('rules').delete().eq('id', newRule.id);
    console.log('🧹 테스트 규칙 삭제 완료');
    
    return { success: true, message: 'CRUD 작업 모두 성공' };
    
  } catch (error) {
    console.log('💥 CRUD 테스트 중 예외:', error);
    return { success: false, error: error.message };
  }
}

// 🎯 전체 상태 확인
async function checkOverallStatus() {
  console.log('📊 전체 상태 확인 중...');
  
  const status = {
    auth: null,
    couple: null,
    tables: null,
    realtime: null,
    overall: 'unknown'
  };
  
  try {
    // 인증 상태
    const { data: { user } } = await window.supabase.auth.getUser();
    status.auth = user ? 'logged_in' : 'not_logged_in';
    
    if (user) {
      // 커플 상태
      const { data: profile } = await window.supabase
        .from('profiles')
        .select('couple_id')
        .eq('id', user.id)
        .single();
      
      status.couple = profile?.couple_id ? 'connected' : 'not_connected';
      
      // 테이블 접근
      const tableTest = await testTableAccess();
      status.tables = tableTest.allPassed ? 'ok' : 'failed';
      
      // Realtime 상태
      const channels = window.supabase.realtime?.channels || [];
      status.realtime = channels.length > 0 ? 'active' : 'inactive';
    }
    
    // 전체 상태 결정
    if (status.auth === 'logged_in' && 
        status.couple === 'connected' && 
        status.tables === 'ok' && 
        status.realtime === 'active') {
      status.overall = 'excellent';
    } else if (status.auth === 'logged_in' && status.tables === 'ok') {
      status.overall = 'good';
    } else {
      status.overall = 'needs_work';
    }
    
    console.log('📊 전체 상태:');
    console.table(status);
    
    return status;
    
  } catch (error) {
    console.log('💥 상태 확인 중 오류:', error);
    status.overall = 'error';
    return status;
  }
}

// 전역 함수로 등록
window.setupSupabaseRealtime = setupSupabaseRealtime;
window.testCRUDOperations = testCRUDOperations;
window.checkOverallStatus = checkOverallStatus;

// 사용법 출력
console.log(`
🎯 SUPABASE REALTIME 설정 스크립트 로드 완료!

📋 사용 가능한 명령어:
- setupSupabaseRealtime()     // 전체 설정 및 테스트
- testCRUDOperations()        // CRUD 작업 테스트
- checkOverallStatus()        // 전체 상태 확인

🚀 빠른 시작:
setupSupabaseRealtime()

이 명령어를 실행하면 자동으로 모든 설정을 확인하고 수정합니다.
`);

// 자동 실행 (옵션)
if (window.location.search.includes('auto=true')) {
  setTimeout(() => {
    setupSupabaseRealtime();
  }, 1000);
}