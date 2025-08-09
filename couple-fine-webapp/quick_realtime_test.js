/**
 * 🚀 빠른 실시간 동기화 테스트 스크립트
 * 브라우저 개발자 콘솔에서 복사 & 붙여넣기로 즉시 실행
 */

console.log('🔄 SUPABASE REALTIME 빠른 테스트 시작');

// 🎯 메인 테스트 함수
async function quickRealtimeTest() {
  if (!window.supabase) {
    console.error('❌ Supabase 클라이언트 없음');
    return;
  }

  console.log('1️⃣ 현재 사용자 확인...');
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    console.error('❌ 로그인 필요');
    return;
  }
  console.log('✅ 로그인됨:', user.email);

  console.log('2️⃣ 테이블 접근 권한 확인...');
  try {
    // Profiles 테이블 테스트
    const { data: profiles, error: profilesError } = await window.supabase
      .from('profiles').select('*').limit(1);
    console.log(profilesError ? '❌ profiles 접근 실패:' : '✅ profiles 접근 성공:', 
                profilesError?.message || profiles?.length);

    // Rules 테이블 테스트
    const { data: rules, error: rulesError } = await window.supabase
      .from('rules').select('*').limit(1);
    console.log(rulesError ? '❌ rules 접근 실패:' : '✅ rules 접근 성공:', 
                rulesError?.message || rules?.length);

  } catch (error) {
    console.error('💥 테이블 접근 테스트 실패:', error);
  }

  console.log('3️⃣ Realtime 채널 확인...');
  const channels = window.supabase.realtime?.channels || [];
  console.log(`📡 활성 채널 수: ${channels.length}`);
  channels.forEach((ch, i) => {
    console.log(`  채널 ${i+1}: ${ch.topic} (${ch.state})`);
  });

  console.log('4️⃣ 실시간 테스트 채널 생성...');
  const testChannel = window.supabase
    .channel('quick-test-' + Date.now())
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'rules'
    }, (payload) => {
      console.log('🔔 Rules 테이블 변경 감지:', payload);
    })
    .subscribe((status) => {
      console.log('📡 테스트 채널 상태:', status);
    });

  // 5초 후 채널 정리
  setTimeout(() => {
    window.supabase.removeChannel(testChannel);
    console.log('🧹 테스트 채널 정리 완료');
  }, 5000);

  console.log('✅ 빠른 테스트 완료! 5초 후 자동 정리됩니다.');
}

// 🧪 CRUD 테스트
async function testCRUD() {
  console.log('🧪 CRUD 테스트 시작...');
  
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) return console.error('❌ 로그인 필요');

  const { data: profile } = await window.supabase
    .from('profiles').select('couple_id').eq('id', user.id).single();
  
  if (!profile?.couple_id) {
    return console.error('❌ 커플 연결 필요');
  }

  // 규칙 생성 테스트
  const testRule = {
    couple_id: profile.couple_id,
    title: '테스트 규칙 ' + new Date().toLocaleTimeString(),
    fine_amount: 1000,
    created_by_user_id: user.id,
    is_active: true
  };

  const { data: newRule, error } = await window.supabase
    .from('rules').insert(testRule).select().single();

  if (error) {
    console.error('❌ 규칙 생성 실패:', error.message);
  } else {
    console.log('✅ 규칙 생성 성공:', newRule.title);
    
    // 1초 후 삭제
    setTimeout(async () => {
      await window.supabase.from('rules').delete().eq('id', newRule.id);
      console.log('🧹 테스트 규칙 삭제 완료');
    }, 1000);
  }
}

// 📊 현재 상태 요약
function statusSummary() {
  console.log('📊 현재 상태 요약:');
  console.log(`🔐 인증: ${window.supabase ? '✅' : '❌'}`);
  console.log(`📡 채널: ${window.supabase?.realtime?.channels?.length || 0}개`);
  console.log(`🌐 온라인: ${navigator.onLine ? '✅' : '❌'}`);
}

// 전역 함수로 등록
window.quickRealtimeTest = quickRealtimeTest;
window.testCRUD = testCRUD;
window.statusSummary = statusSummary;

// 사용법 안내
console.log(`
🎯 빠른 실시간 테스트 스크립트 준비 완료!

📋 사용 방법:
quickRealtimeTest()    // 전체 실시간 테스트
testCRUD()             // CRUD 작업 테스트  
statusSummary()        // 현재 상태 요약

🚀 지금 바로 실행:
quickRealtimeTest()
`);

// 자동 실행
quickRealtimeTest();