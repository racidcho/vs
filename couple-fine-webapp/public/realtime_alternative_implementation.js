// ⚡ 즉시 작동하는 Supabase Realtime Channels 구현
// Early Access 없이 바로 사용 가능한 대안

console.log('🚀 Supabase Realtime Channels Alternative - 즉시 작동');
console.log('📋 테이블별 Realtime 대신 Broadcast + Manual Events 사용');

// ✅ 즉시 실행 가능한 Realtime 구현
class CoupleRealtimeManager {
  constructor() {
    this.supabase = window.supabase;
    this.channels = new Map();
    this.isConnected = false;
    
    // 현재 사용자 정보 가져오기
    this.getCurrentUser();
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser = user;
    console.log('👤 현재 사용자:', user?.email);
  }

  // 🔥 핵심: Broadcast Channel로 실시간 이벤트 구현
  setupBroadcastChannel(coupleId) {
    const channelName = `couple-realtime-${coupleId}`;
    console.log('🔗 Broadcast Channel 설정:', channelName);

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'data-change' }, (payload) => {
        console.log('📡 Broadcast 이벤트 수신:', payload);
        this.handleDataChange(payload.payload);
      })
      .subscribe((status) => {
        console.log('🔌 Channel 상태:', status);
        this.isConnected = status === 'SUBSCRIBED';
        this.updateConnectionStatus();
      });

    this.channels.set(coupleId, channel);
    return channel;
  }

  // 📤 데이터 변경 시 수동으로 이벤트 발송
  async broadcastDataChange(operation, table, data) {
    if (!this.isConnected) {
      console.warn('⚠️ Realtime 연결 없음, 로컬만 업데이트');
      return;
    }

    const payload = {
      operation, // 'INSERT', 'UPDATE', 'DELETE'
      table,
      data,
      timestamp: new Date().toISOString(),
      userId: this.currentUser?.id
    };

    console.log('📤 Broadcasting 데이터 변경:', payload);

    // 모든 커플 채널에 브로드캐스트
    for (const [coupleId, channel] of this.channels) {
      await channel.send({
        type: 'broadcast',
        event: 'data-change',
        payload
      });
    }
  }

  // 📥 데이터 변경 처리
  handleDataChange(payload) {
    const { operation, table, data, userId } = payload;
    
    // 자기가 발송한 이벤트는 무시 (중복 방지)
    if (userId === this.currentUser?.id) {
      console.log('🔄 자기 이벤트 무시:', operation, table);
      return;
    }

    console.log(`🔥 ${table} ${operation} 처리:`, data);

    // 테이블별로 처리
    switch (table) {
      case 'couples':
        this.handleCoupleChange(operation, data);
        break;
      case 'rules':
        this.handleRuleChange(operation, data);
        break;
      case 'violations':
        this.handleViolationChange(operation, data);
        break;
      case 'rewards':
        this.handleRewardChange(operation, data);
        break;
      case 'profiles':
        this.handleProfileChange(operation, data);
        break;
    }
  }

  // 테이블별 핸들러
  handleCoupleChange(operation, data) {
    if (operation === 'UPDATE') {
      console.log('💑 커플 정보 업데이트');
      // AppContext의 SET_COUPLE 액션 호출
      window.dispatchAppAction?.({ type: 'SET_COUPLE', payload: data });
    }
  }

  handleRuleChange(operation, data) {
    console.log('📋 규칙 변경:', operation);
    switch (operation) {
      case 'INSERT':
        window.dispatchAppAction?.({ type: 'ADD_RULE', payload: data });
        break;
      case 'UPDATE':
        if (data.is_active === false) {
          window.dispatchAppAction?.({ type: 'DELETE_RULE', payload: data.id });
        } else {
          window.dispatchAppAction?.({ type: 'UPDATE_RULE', payload: data });
        }
        break;
      case 'DELETE':
        window.dispatchAppAction?.({ type: 'DELETE_RULE', payload: data.id });
        break;
    }
  }

  handleViolationChange(operation, data) {
    console.log('⚖️ 위반 변경:', operation);
    // 위반은 복잡한 관계 때문에 전체 새로고침
    setTimeout(() => {
      window.refreshAppData?.();
    }, 1000);
  }

  handleRewardChange(operation, data) {
    console.log('🎁 보상 변경:', operation);
    switch (operation) {
      case 'INSERT':
        window.dispatchAppAction?.({ type: 'ADD_REWARD', payload: data });
        break;
      case 'UPDATE':
        window.dispatchAppAction?.({ type: 'UPDATE_REWARD', payload: data });
        break;
      case 'DELETE':
        window.dispatchAppAction?.({ type: 'DELETE_REWARD', payload: data.id });
        break;
    }
  }

  handleProfileChange(operation, data) {
    if (operation === 'UPDATE') {
      console.log('👤 프로필 업데이트');
      // 파트너 정보 새로고침
      setTimeout(() => {
        window.loadCoupleData?.();
      }, 500);
    }
  }

  // 연결 상태 표시
  updateConnectionStatus() {
    const statusEl = document.getElementById('realtime-status');
    if (statusEl) {
      statusEl.textContent = this.isConnected ? '🟢 실시간 연결됨' : '🔴 연결 끊김';
      statusEl.className = this.isConnected ? 'text-green-600' : 'text-red-600';
    }
  }

  // 연결 해제
  disconnect() {
    console.log('🧹 Realtime 연결 정리');
    for (const [coupleId, channel] of this.channels) {
      this.supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.isConnected = false;
  }
}

// 🌟 CRUD 작업에 자동 브로드캐스트 추가
class EnhancedCRUD {
  constructor(realtimeManager) {
    this.realtime = realtimeManager;
    this.supabase = window.supabase;
  }

  // 규칙 생성 (실시간 브로드캐스트 포함)
  async createRule(ruleData) {
    console.log('📋 규칙 생성 with Realtime');
    
    const { data, error } = await this.supabase
      .from('rules')
      .insert(ruleData)
      .select()
      .single();

    if (error) throw error;

    // 🔥 즉시 브로드캐스트
    await this.realtime.broadcastDataChange('INSERT', 'rules', data);
    console.log('✅ 규칙 생성 + 브로드캐스트 완료');
    return data;
  }

  // 규칙 수정
  async updateRule(id, updates) {
    console.log('📋 규칙 수정 with Realtime');
    
    const { data, error } = await this.supabase
      .from('rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.realtime.broadcastDataChange('UPDATE', 'rules', data);
    console.log('✅ 규칙 수정 + 브로드캐스트 완료');
    return data;
  }

  // 규칙 삭제
  async deleteRule(id) {
    console.log('📋 규칙 삭제 with Realtime');
    
    const { error } = await this.supabase
      .from('rules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.realtime.broadcastDataChange('DELETE', 'rules', { id });
    console.log('✅ 규칙 삭제 + 브로드캐스트 완료');
  }

  // 위반 기록
  async createViolation(violationData) {
    console.log('⚖️ 위반 기록 with Realtime');
    
    const { data, error } = await this.supabase
      .from('violations')
      .insert(violationData)
      .select()
      .single();

    if (error) throw error;

    await this.realtime.broadcastDataChange('INSERT', 'violations', data);
    console.log('✅ 위반 기록 + 브로드캐스트 완료');
    return data;
  }

  // 보상 생성
  async createReward(rewardData) {
    console.log('🎁 보상 생성 with Realtime');
    
    const { data, error } = await this.supabase
      .from('rewards')
      .insert(rewardData)
      .select()
      .single();

    if (error) throw error;

    await this.realtime.broadcastDataChange('INSERT', 'rewards', data);
    console.log('✅ 보상 생성 + 브로드캐스트 완료');
    return data;
  }

  // 보상 달성
  async claimReward(id) {
    console.log('🎁 보상 달성 with Realtime');
    
    const { data, error } = await this.supabase
      .from('rewards')
      .update({ is_achieved: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.realtime.broadcastDataChange('UPDATE', 'rewards', data);
    console.log('✅ 보상 달성 + 브로드캐스트 완료');
    return data;
  }
}

// 🚀 전역 변수로 접근 가능하도록 설정
window.CoupleRealtimeManager = CoupleRealtimeManager;
window.EnhancedCRUD = EnhancedCRUD;

// 🎯 사용 예제
console.log(`
🎯 사용 방법:

1. Realtime Manager 초기화:
   const realtimeManager = new CoupleRealtimeManager();
   realtimeManager.setupBroadcastChannel('your-couple-id');

2. Enhanced CRUD 사용:
   const crud = new EnhancedCRUD(realtimeManager);
   await crud.createRule({ title: '테스트', amount: 5000 });

3. 연결 상태 확인:
   console.log('연결됨:', realtimeManager.isConnected);

⚡ 이 방법은 Early Access 없이 즉시 작동합니다!
📡 Broadcast Channels로 실시간 동기화 구현
🔥 수동 이벤트 발송으로 테이블별 Realtime 대체
`);