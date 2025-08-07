import { supabase } from './supabase';
import type { User, Rule, Violation, Reward } from '../types';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// 실시간 이벤트 타입
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeEvent<T = any> {
  eventType: RealtimeEventType;
  table: string;
  new?: T;
  old?: T;
  errors?: any;
}

// 콜백 함수 타입
export type RealtimeCallback<T> = (event: RealtimeEvent<T>) => void;

// 구독 관리자 클래스
export class RealtimeSubscriptionManager {
  private channels = new Map<string, RealtimeChannel>();
  private isConnected = false;

  constructor() {
    this.setupConnectionListener();
  }

  private setupConnectionListener() {
    // 연결 상태 모니터링
    this.isConnected = supabase.realtime.isConnected();
    console.log('🔗 Realtime connection initialized:', this.isConnected);
  }

  // 채널 생성 또는 기존 채널 반환
  private getOrCreateChannel(channelName: string): RealtimeChannel {
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true, ack: true },
        presence: { key: 'user_id' }
      }
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  // 커플 전체 데이터 변경 구독
  subscribeToCouple(coupleId: string, callbacks: {
    onRuleChange?: RealtimeCallback<Rule>;
    onViolationChange?: RealtimeCallback<Violation>;
    onRewardChange?: RealtimeCallback<Reward>;
    onUserChange?: RealtimeCallback<User>;
  }): () => void {
    const channelName = `couple-${coupleId}`;
    const channel = this.getOrCreateChannel(channelName);

    // Rules 변경 구독
    if (callbacks.onRuleChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rules',
          filter: `couple_id=eq.${coupleId}`
        },
        (payload: RealtimePostgresChangesPayload<Rule>) => {
          callbacks.onRuleChange!({
            eventType: payload.eventType,
            table: 'rules',
            new: payload.new as Rule,
            old: payload.old as Rule,
            errors: payload.errors
          });
        }
      );
    }

    // Violations 변경 구독
    if (callbacks.onViolationChange) {
      // 조인된 데이터와 함께 violations 구독
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'violations'
        },
        async (payload: RealtimePostgresChangesPayload<Violation>) => {
          // 조인된 데이터를 가져오기 위한 추가 쿼리
          let enhancedPayload = { ...payload };

          if (payload.new && 'rule_id' in payload.new && payload.new.rule_id) {
            // Rule 데이터를 가져와서 couple_id 확인
            const { data: ruleData } = await supabase
              .from('rules')
              .select('couple_id')
              .eq('id', payload.new.rule_id)
              .single();

            // 현재 커플의 violation인지 확인
            if (ruleData && ruleData.couple_id === coupleId) {
              // 완전한 데이터 가져오기
              const { data: fullViolationData } = await supabase
                .from('violations')
                .select(`
                  *,
                  rule:rules(*),
                  violator:users!violator_id(*),
                  partner:users!partner_id(*)
                `)
                .eq('id', (payload.new as Violation).id)
                .single();

              enhancedPayload.new = fullViolationData || payload.new;

              callbacks.onViolationChange!({
                eventType: payload.eventType,
                table: 'violations',
                new: enhancedPayload.new as Violation,
                old: payload.old as Violation,
                errors: payload.errors
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // DELETE 이벤트는 old 데이터로 처리
            callbacks.onViolationChange!({
              eventType: payload.eventType,
              table: 'violations',
              new: payload.new as Violation,
              old: payload.old as Violation,
              errors: payload.errors
            });
          }
        }
      );
    }

    // Rewards 변경 구독
    if (callbacks.onRewardChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rewards',
          filter: `couple_id=eq.${coupleId}`
        },
        (payload: RealtimePostgresChangesPayload<Reward>) => {
          callbacks.onRewardChange!({
            eventType: payload.eventType,
            table: 'rewards',
            new: payload.new as Reward,
            old: payload.old as Reward,
            errors: payload.errors
          });
        }
      );
    }

    // Users 변경 구독 (커플 멤버만)
    if (callbacks.onUserChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `couple_id=eq.${coupleId}`
        },
        (payload: RealtimePostgresChangesPayload<User>) => {
          callbacks.onUserChange!({
            eventType: payload.eventType,
            table: 'users',
            new: payload.new as User,
            old: payload.old as User,
            errors: payload.errors
          });
        }
      );
    }

    // 구독 시작
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to couple-${coupleId} updates`);
      } else if (status === 'CLOSED') {
        console.log(`📴 Unsubscribed from couple-${coupleId} updates`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Subscription error for couple-${coupleId}:`, error);
      }
    });

    // 구독 해제 함수 반환
    return () => {
      this.unsubscribeFromChannel(channelName);
    };
  }

  // 특정 테이블 변경 구독
  subscribeToTable<T extends Record<string, any>>(
    table: string, 
    callback: RealtimeCallback<T>,
    filter?: string
  ): () => void {
    const channelName = `table-${table}`;
    const channel = this.getOrCreateChannel(channelName);

    const config: any = {
      event: '*',
      schema: 'public',
      table
    };

    if (filter) {
      config.filter = filter;
    }

    channel.on('postgres_changes', config, (payload: RealtimePostgresChangesPayload<T>) => {
      callback({
        eventType: payload.eventType,
        table,
        new: payload.new as T,
        old: payload.old as T,
        errors: payload.errors
      });
    });

    channel.subscribe();

    return () => {
      this.unsubscribeFromChannel(channelName);
    };
  }

  // 브로드캐스트 메시지 전송
  broadcastMessage(channelName: string, event: string, payload: any): Promise<'ok' | 'error' | 'timed_out'> {
    const channel = this.getOrCreateChannel(channelName);
    return channel.send({
      type: 'broadcast',
      event,
      payload
    }).then(response => {
      // Handle the actual response format from Supabase
      return response === 'timed out' ? 'timed_out' : response as 'ok' | 'error';
    });
  }

  // 브로드캐스트 메시지 수신
  subscribeToBroadcast(
    channelName: string, 
    event: string, 
    callback: (payload: any) => void
  ): () => void {
    const channel = this.getOrCreateChannel(channelName);

    channel.on('broadcast', { event }, ({ payload }) => {
      callback(payload);
    });

    channel.subscribe();

    return () => {
      this.unsubscribeFromChannel(channelName);
    };
  }

  // 사용자 프레즌스 추적
  trackPresence(channelName: string, userId: string, metadata?: any): () => void {
    const channel = this.getOrCreateChannel(channelName);

    const presenceData = {
      user_id: userId,
      online_at: new Date().toISOString(),
      ...metadata
    };

    channel.track(presenceData);

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('👥 Presence sync:', state);
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('👋 User joined:', key, newPresences);
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('👋 User left:', key, leftPresences);
    });

    channel.subscribe();

    return () => {
      channel.untrack();
      this.unsubscribeFromChannel(channelName);
    };
  }

  // 채널 구독 해제
  unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      console.log(`📴 Unsubscribed from ${channelName}`);
    }
  }

  // 모든 구독 해제
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      channel.unsubscribe();
      console.log(`📴 Unsubscribed from ${channelName}`);
    });
    this.channels.clear();
  }

  // 연결 상태 확인
  isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  // 활성 채널 목록
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// 싱글톤 인스턴스
export const realtimeManager = new RealtimeSubscriptionManager();

// === 편의 함수들 ===

// 커플 데이터 실시간 구독 (React Hook에서 사용하기 편함)
export const subscribeToCouple = (
  coupleId: string,
  callbacks: {
    onRuleChange?: (rule: Rule, eventType: RealtimeEventType) => void;
    onViolationChange?: (violation: Violation, eventType: RealtimeEventType) => void;
    onRewardChange?: (reward: Reward, eventType: RealtimeEventType) => void;
    onUserChange?: (user: User, eventType: RealtimeEventType) => void;
  }
) => {
  return realtimeManager.subscribeToCouple(coupleId, {
    onRuleChange: callbacks.onRuleChange 
      ? (event) => callbacks.onRuleChange!(event.new || event.old!, event.eventType)
      : undefined,
    onViolationChange: callbacks.onViolationChange
      ? (event) => callbacks.onViolationChange!(event.new || event.old!, event.eventType)
      : undefined,
    onRewardChange: callbacks.onRewardChange
      ? (event) => callbacks.onRewardChange!(event.new || event.old!, event.eventType)
      : undefined,
    onUserChange: callbacks.onUserChange
      ? (event) => callbacks.onUserChange!(event.new || event.old!, event.eventType)
      : undefined
  });
};

// 실시간 알림 시스템
export const sendNotification = (coupleId: string, notification: {
  type: 'violation_added' | 'rule_created' | 'reward_achieved' | 'couple_joined';
  title: string;
  message: string;
  data?: any;
}) => {
  return realtimeManager.broadcastMessage(
    `couple-${coupleId}`, 
    'notification', 
    notification
  );
};

// 실시간 알림 수신
export const subscribeToNotifications = (
  coupleId: string,
  onNotification: (notification: any) => void
) => {
  return realtimeManager.subscribeToBroadcast(
    `couple-${coupleId}`,
    'notification',
    onNotification
  );
};

// 온라인 상태 추적
export const trackOnlineStatus = (coupleId: string, userId: string) => {
  return realtimeManager.trackPresence(`couple-${coupleId}`, userId, {
    status: 'online'
  });
};

// === React Hook 지원을 위한 유틸리티 ===
export const createRealtimeEffect = (
  coupleId: string | null,
  dependencies: any[] = []
) => {
  return {
    subscribe: (callbacks: Parameters<typeof subscribeToCouple>[1]) => {
      if (!coupleId) return () => {};
      return subscribeToCouple(coupleId, callbacks);
    },
    dependencies: [coupleId, ...dependencies]
  };
};