/**
 * 🔄 SUPABASE REALTIME 완전 구현 가이드
 * joanddo.com에서 브라우저 콘솔로 즉시 테스트 가능
 */

// 🎯 1. Postgres Changes 구독 (DB 변경 감지)
function setupRealtimeSubscription() {
  console.log('🔄 Realtime 구독 설정 중...');
  
  const channel = window.supabase
    .channel('db-changes') // 채널 이름
    .on(
      'postgres_changes', // 이벤트 타입
      {
        event: '*',          // INSERT, UPDATE, DELETE 모두
        schema: 'public',    // public 스키마
        table: 'rules'       // rules 테이블 감지
      },
      (payload) => {
        console.log('📋 Rules 변경 감지!', {
          eventType: payload.eventType,  // INSERT/UPDATE/DELETE
          new: payload.new,              // 새 데이터
          old: payload.old,              // 기존 데이터
          table: payload.table
        });
        
        // UI 업데이트 로직
        if (payload.eventType === 'INSERT') {
          console.log('➕ 새 규칙 추가됨:', payload.new.title);
        } else if (payload.eventType === 'UPDATE') {
          console.log('✏️ 규칙 수정됨:', payload.new.title);
        } else if (payload.eventType === 'DELETE') {
          console.log('🗑️ 규칙 삭제됨:', payload.old.title);
        }
      }
    )
    .subscribe((status) => {
      console.log('📡 Realtime 연결 상태:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime 구독 성공!');
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ Realtime 연결 실패');
      }
    });
  
  // 전역으로 저장 (나중에 정리용)
  window.realtimeChannel = channel;
  
  return channel;
}

// 🎯 2. 여러 테이블 동시 구독
function setupMultiTableRealtime() {
  console.log('🔄 다중 테이블 Realtime 설정...');
  
  const multiChannel = window.supabase
    .channel('all-changes')
    // Rules 테이블
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'rules'
    }, (payload) => {
      console.log('📋 Rules:', payload.eventType, payload.new || payload.old);
    })
    // Violations 테이블
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'violations'
    }, (payload) => {
      console.log('⚖️ Violations:', payload.eventType, payload.new || payload.old);
    })
    // Rewards 테이블
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'rewards'
    }, (payload) => {
      console.log('🎁 Rewards:', payload.eventType, payload.new || payload.old);
    })
    // Profiles 테이블 (파트너 이름 변경)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles'
    }, (payload) => {
      console.log('👤 Profile Updated:', payload.new?.display_name);
    })
    .subscribe((status) => {
      console.log('📡 다중 테이블 Realtime 상태:', status);
    });
  
  window.multiRealtimeChannel = multiChannel;
  return multiChannel;
}

// 🎯 3. Broadcast 메시징 (실시간 메시지)
function setupBroadcastMessaging() {
  console.log('📢 Broadcast 메시징 설정...');
  
  const broadcastChannel = window.supabase
    .channel('couple-messages')
    .on('broadcast', { event: 'partner-action' }, (payload) => {
      console.log('📢 파트너 액션:', payload);
      // 예: "파트너가 새 규칙을 추가했습니다"
    })
    .subscribe();
  
  // 메시지 보내기 함수
  window.sendToPartner = (action, data) => {
    broadcastChannel.send({
      type: 'broadcast',
      event: 'partner-action',
      payload: { action, data, timestamp: new Date().toISOString() }
    });
  };
  
  window.broadcastChannel = broadcastChannel;
  return broadcastChannel;
}

// 🎯 4. Presence (온라인 상태 추적)
function setupPresenceTracking() {
  console.log('👥 Presence 추적 설정...');
  
  const presenceChannel = window.supabase
    .channel('couple-presence')
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      console.log('👥 온라인 사용자:', Object.keys(state));
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('✅ 사용자 접속:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('❌ 사용자 나감:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // 자신의 온라인 상태 등록
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user) {
          await presenceChannel.track({
            user_id: user.id,
            email: user.email,
            online_at: new Date().toISOString()
          });
        }
      }
    });
  
  window.presenceChannel = presenceChannel;
  return presenceChannel;
}

// 🎯 5. 실제 사용 예시 - 규칙 추가 시 파트너에게 알림
async function addRuleWithRealtime() {
  console.log('📋 실시간 규칙 추가 테스트...');
  
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) return console.error('❌ 로그인 필요');
  
  const { data: profile } = await window.supabase
    .from('profiles').select('couple_id').eq('id', user.id).single();
  
  if (!profile?.couple_id) return console.error('❌ 커플 연결 필요');
  
  // 1. 규칙 추가 (자동으로 Realtime 이벤트 발생)
  const { data: newRule, error } = await window.supabase
    .from('rules')
    .insert({
      couple_id: profile.couple_id,
      title: '실시간 테스트 규칙 ' + new Date().toLocaleTimeString(),
      fine_amount: 2000,
      created_by_user_id: user.id,
      is_active: true
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ 규칙 생성 실패:', error);
    return;
  }
  
  console.log('✅ 규칙 생성 성공:', newRule);
  
  // 2. 파트너에게 브로드캐스트 메시지
  if (window.sendToPartner) {
    window.sendToPartner('rule-added', {
      title: newRule.title,
      amount: newRule.fine_amount,
      creator: user.email
    });
  }
  
  // 3. 3초 후 삭제 (테스트 정리)
  setTimeout(async () => {
    await window.supabase.from('rules').delete().eq('id', newRule.id);
    console.log('🧹 테스트 규칙 삭제됨');
    
    if (window.sendToPartner) {
      window.sendToPartner('rule-deleted', {
        title: newRule.title
      });
    }
  }, 3000);
}

// 🎯 6. 채널 정리 함수
function cleanupRealtime() {
  console.log('🧹 Realtime 채널 정리 중...');
  
  if (window.realtimeChannel) {
    window.supabase.removeChannel(window.realtimeChannel);
    console.log('✅ 기본 채널 정리됨');
  }
  
  if (window.multiRealtimeChannel) {
    window.supabase.removeChannel(window.multiRealtimeChannel);
    console.log('✅ 다중 채널 정리됨');
  }
  
  if (window.broadcastChannel) {
    window.supabase.removeChannel(window.broadcastChannel);
    console.log('✅ 브로드캐스트 채널 정리됨');
  }
  
  if (window.presenceChannel) {
    window.supabase.removeChannel(window.presenceChannel);
    console.log('✅ Presence 채널 정리됨');
  }
  
  console.log('🎉 모든 Realtime 채널 정리 완료');
}

// 🎯 7. 현재 Realtime 상태 확인
function checkRealtimeStatus() {
  console.log('📊 현재 Realtime 상태:');
  
  const channels = window.supabase.realtime?.channels || [];
  console.log(`📡 활성 채널 수: ${channels.length}`);
  
  channels.forEach((ch, i) => {
    console.log(`  ${i+1}. ${ch.topic} (${ch.state})`);
  });
  
  if (channels.length === 0) {
    console.log('⚠️ 활성 Realtime 채널이 없습니다');
  }
  
  return {
    channelCount: channels.length,
    channels: channels.map(ch => ({ topic: ch.topic, state: ch.state }))
  };
}

// 전역 함수 등록
window.setupRealtimeSubscription = setupRealtimeSubscription;
window.setupMultiTableRealtime = setupMultiTableRealtime;
window.setupBroadcastMessaging = setupBroadcastMessaging;
window.setupPresenceTracking = setupPresenceTracking;
window.addRuleWithRealtime = addRuleWithRealtime;
window.cleanupRealtime = cleanupRealtime;
window.checkRealtimeStatus = checkRealtimeStatus;

// 사용법 출력
console.log(`
🔄 SUPABASE REALTIME 완전 구현 준비됨!

📋 사용 방법:
1. setupRealtimeSubscription()     // 기본 DB 변경 감지
2. setupMultiTableRealtime()       // 모든 테이블 감지
3. setupBroadcastMessaging()       // 실시간 메시징
4. setupPresenceTracking()         // 온라인 상태 추적
5. addRuleWithRealtime()           // 실시간 규칙 추가 테스트
6. checkRealtimeStatus()           // 현재 상태 확인
7. cleanupRealtime()               // 모든 채널 정리

🚀 지금 바로 테스트:
setupMultiTableRealtime()

💡 두 브라우저에서 실행하면 실시간 동기화 확인 가능!
`);

// 자동으로 다중 테이블 Realtime 설정
console.log('🔄 자동으로 다중 테이블 Realtime 설정 중...');
setupMultiTableRealtime();
setupBroadcastMessaging();