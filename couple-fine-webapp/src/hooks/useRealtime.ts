import { useEffect, useCallback, useRef, useState } from 'react';
import { RealtimeChannel, type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Rule, Violation, Reward, Couple } from '../types';
import { useApp } from '../contexts/AppContext';

type DatabaseChange<T extends Record<string, any>> = RealtimePostgresChangesPayload<T>;

interface RealtimeOptions {
  coupleId?: string;
  userId?: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  lastError?: string;
  reconnectAttempts: number;
  subscriptionStatus?: string;
}

export const useRealtime = ({ coupleId, userId }: RealtimeOptions) => {
  const { dispatch } = useApp();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    reconnectAttempts: 0
  });

  // Enhanced logging and error recovery
  const logRealtimeEvent = useCallback((eventType: string, table: string, data?: any) => {
    console.log(`🔄 REALTIME [${table.toUpperCase()}]:`, {
      event: eventType,
      coupleId,
      userId,
      timestamp: new Date().toISOString(),
      data: data ? {
        id: data.id,
        couple_id: data.couple_id,
        ...Object.fromEntries(
          Object.entries(data).filter(([key]) => !['created_at', 'updated_at'].includes(key))
        )
      } : null
    });
  }, [coupleId, userId]);

  // Handle rules changes
  const handleRuleChange = useCallback((payload: DatabaseChange<Rule>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    logRealtimeEvent(eventType, 'rules', newRecord || oldRecord);

    try {
      switch (eventType) {
        case 'INSERT':
          if (newRecord && newRecord.couple_id === coupleId) {
            console.log('➕ Adding rule to state:', newRecord.id);
            dispatch({ type: 'ADD_RULE', payload: newRecord });
          }
          break;
        case 'UPDATE':
          if (newRecord && newRecord.couple_id === coupleId) {
            // Handle rule deactivation (is_active = false) as deletion
            if (newRecord.is_active === false) {
              console.log('❌ Deactivating rule (removing from state):', newRecord.id);
              dispatch({ type: 'DELETE_RULE', payload: newRecord.id });
            } else {
              console.log('✏️ Updating rule in state:', newRecord.id);
              dispatch({ type: 'UPDATE_RULE', payload: newRecord });
            }
          }
          break;
        case 'DELETE':
          if (oldRecord?.id) {
            console.log('🗑️ Removing rule from state:', oldRecord.id);
            dispatch({ type: 'DELETE_RULE', payload: oldRecord.id });
          }
          break;
      }
    } catch (error) {
      console.error('💥 REALTIME: Error handling rule change:', error, payload);
    }
  }, [coupleId, dispatch, logRealtimeEvent]);

  // Handle violation changes
  const handleViolationChange = useCallback(async (payload: DatabaseChange<Violation>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    logRealtimeEvent(eventType, 'violations', newRecord || oldRecord);

    try {
      switch (eventType) {
        case 'INSERT':
          if (newRecord) {
            console.log('📝 Fetching complete violation data for:', newRecord.id);
            // Fetch the complete violation data with relations
            // Foreign Key 제약조건이 없으므로 별도 쿼리로 분리
            const { data: violationWithRelations, error } = await supabase
              .from('violations')
              .select('*')
              .eq('id', newRecord.id)
              .single();

            if (error) {
              console.error('❌ REALTIME: Failed to fetch violation relations:', error);
            } else if (violationWithRelations) {
              // Only add if it belongs to our couple
              if (violationWithRelations.rule?.couple_id === coupleId) {
                console.log('➕ Adding violation to state:', violationWithRelations.id);
                dispatch({ type: 'ADD_VIOLATION', payload: violationWithRelations as any });
              } else {
                console.log('🚫 Violation not for our couple, ignoring');
              }
            }
          }
          break;
        case 'UPDATE':
          if (newRecord && newRecord.couple_id === coupleId) {
            console.log('✏️ Updating violation in state:', newRecord.id);
            dispatch({ type: 'UPDATE_VIOLATION', payload: newRecord as any });
          }
          break;
        case 'DELETE':
          if (oldRecord?.id) {
            console.log('🗑️ Removing violation from state:', oldRecord.id);
            dispatch({ type: 'DELETE_VIOLATION', payload: oldRecord.id });
          }
          break;
      }
    } catch (error) {
      console.error('💥 REALTIME: Error handling violation change:', error, payload);
    }
  }, [coupleId, dispatch, logRealtimeEvent]);

  // Handle reward changes
  const handleRewardChange = useCallback((payload: DatabaseChange<Reward>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    logRealtimeEvent(eventType, 'rewards', newRecord || oldRecord);

    try {
      switch (eventType) {
        case 'INSERT':
          if (newRecord && newRecord.couple_id === coupleId) {
            console.log('➕ Adding reward to state:', newRecord.id);
            dispatch({ type: 'ADD_REWARD', payload: newRecord });
          }
          break;
        case 'UPDATE':
          if (newRecord && newRecord.couple_id === coupleId) {
            console.log('✏️ Updating reward in state:', newRecord.id);
            dispatch({ type: 'UPDATE_REWARD', payload: newRecord });
          }
          break;
        case 'DELETE':
          if (oldRecord?.id) {
            console.log('🗑️ Removing reward from state:', oldRecord.id);
            dispatch({ type: 'DELETE_REWARD', payload: oldRecord.id });
          }
          break;
      }
    } catch (error) {
      console.error('💥 REALTIME: Error handling reward change:', error, payload);
    }
  }, [coupleId, dispatch, logRealtimeEvent]);

  // Handle couple changes
  const handleCoupleChange = useCallback((payload: DatabaseChange<Couple>) => {
    const { eventType, new: newRecord } = payload;
    logRealtimeEvent(eventType, 'couples', newRecord);

    try {
      if (eventType === 'UPDATE' && newRecord && newRecord.id === coupleId) {
        console.log('✏️ Updating couple in state:', newRecord.id);
        dispatch({ type: 'SET_COUPLE', payload: newRecord });
      }
    } catch (error) {
      console.error('💥 REALTIME: Error handling couple change:', error, payload);
    }
  }, [coupleId, dispatch, logRealtimeEvent]);

  // Reconnection logic
  const attemptReconnection = useCallback(() => {
    if (!coupleId || reconnectTimeoutRef.current) return;

    const currentAttempts = connectionStatus.reconnectAttempts + 1;
    const maxAttempts = 5;
    const backoffDelay = Math.min(1000 * Math.pow(2, currentAttempts - 1), 30000); // Exponential backoff, max 30s

    if (currentAttempts > maxAttempts) {
      console.error('🚨 REALTIME: Max reconnection attempts reached');
      setConnectionStatus(prev => ({
        ...prev,
        lastError: 'Max reconnection attempts reached',
        reconnectAttempts: currentAttempts
      }));
      return;
    }

    console.log(`🔄 REALTIME: Attempting reconnection ${currentAttempts}/${maxAttempts} in ${backoffDelay}ms`);
    
    setConnectionStatus(prev => ({
      ...prev,
      reconnectAttempts: currentAttempts
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      
      // Clean up existing channel
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Force re-subscription by updating component state
      setConnectionStatus(prev => ({ ...prev, isConnected: false }));
    }, backoffDelay);
  }, [coupleId, connectionStatus.reconnectAttempts]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!coupleId) {
      console.log('🚫 REALTIME: No coupleId, skipping subscription');
      return;
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log('🚀 REALTIME: Setting up subscriptions for couple:', coupleId);

    // Create a unique channel for this couple
    const channel = supabase.channel(`couple-${coupleId}-${Date.now()}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId || 'anonymous' }
      }
    });

    // Subscribe to rules changes
    console.log('📋 REALTIME: Subscribing to rules changes');
    channel.on<Rule>('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rules',
        filter: `couple_id=eq.${coupleId}`
      },
      handleRuleChange
    );

    // Subscribe to violations changes (listen to all violations and filter in handler)
    console.log('⚖️ REALTIME: Subscribing to violations changes');
    channel.on<Violation>('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'violations'
      },
      handleViolationChange
    );

    // Subscribe to rewards changes
    console.log('🎁 REALTIME: Subscribing to rewards changes');
    channel.on<Reward>('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rewards',
        filter: `couple_id=eq.${coupleId}`
      },
      handleRewardChange
    );

    // Subscribe to couple changes
    console.log('💑 REALTIME: Subscribing to couple changes');
    channel.on<Couple>('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'couples',
        filter: `id=eq.${coupleId}`
      },
      handleCoupleChange
    );

    // Subscribe to profiles changes (for partner name updates)
    console.log('👤 REALTIME: Subscribing to profile changes');
    channel.on('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      },
      (payload: any) => {
        // When partner updates their profile, refresh couple data to get updated info
        if (payload.eventType === 'UPDATE' && payload.new) {
          console.log('👤 Profile updated:', payload.new);
          logRealtimeEvent('UPDATE', 'profiles', payload.new);
          // Force refresh of couple data to get updated partner info
          // This will trigger a re-render in components that use partner data
        }
      }
    );

    // Subscribe to the channel with comprehensive status handling
    channel.subscribe((status) => {
      console.log('🔌 REALTIME: Channel status changed:', status);
      
      const newConnectionStatus: Partial<ConnectionStatus> = {
        subscriptionStatus: status,
        lastError: undefined
      };

      switch (status) {
        case 'SUBSCRIBED':
          console.log('✅ REALTIME: Successfully subscribed to all changes');
          newConnectionStatus.isConnected = true;
          newConnectionStatus.reconnectAttempts = 0;
          break;
        
        case 'CHANNEL_ERROR':
          console.error('❌ REALTIME: Channel error - attempting reconnection');
          newConnectionStatus.isConnected = false;
          newConnectionStatus.lastError = 'Channel error';
          // Attempt reconnection after a short delay
          setTimeout(() => attemptReconnection(), 2000);
          break;
        
        case 'TIMED_OUT':
          console.warn('⏰ REALTIME: Connection timed out - attempting reconnection');
          newConnectionStatus.isConnected = false;
          newConnectionStatus.lastError = 'Connection timeout';
          setTimeout(() => attemptReconnection(), 1000);
          break;
        
        case 'CLOSED':
          console.warn('🔐 REALTIME: Channel closed - will attempt reconnection');
          newConnectionStatus.isConnected = false;
          newConnectionStatus.lastError = 'Channel closed';
          setTimeout(() => attemptReconnection(), 3000);
          break;
        
        default:
          console.log('🔄 REALTIME: Channel status:', status);
          newConnectionStatus.isConnected = false;
          break;
      }

      setConnectionStatus(prev => ({ ...prev, ...newConnectionStatus }));
    });

    // Store channel reference
    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('🧹 REALTIME: Cleaning up subscriptions');
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      setConnectionStatus({
        isConnected: false,
        reconnectAttempts: 0
      });
    };
  }, [coupleId, userId, handleRuleChange, handleViolationChange, handleRewardChange, handleCoupleChange, attemptReconnection]);

  // Return comprehensive connection status
  return {
    isConnected: connectionStatus.isConnected,
    channel: channelRef.current,
    connectionStatus,
    reconnect: attemptReconnection
  };
};

// Additional hook for presence (online users)
export const usePresence = (coupleId?: string) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase.channel(`presence-${coupleId}`, {
      config: {
        presence: { key: 'user_id' }
      }
    });

    // Track presence
    channel.on('presence', { event: 'sync' }, () => {
      const newState = channel.presenceState();

    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {

    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {

    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track our presence
        const presenceTrackStatus = await channel.track({
          user_id: supabase.auth.getUser(),
          online_at: new Date().toISOString(),
        });

      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [coupleId]);

  return {
    channel: channelRef.current
  };
};