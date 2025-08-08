import { useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel, type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Rule, Violation, Reward, Couple } from '../types';
import { useApp } from '../contexts/AppContext';

type DatabaseChange<T extends Record<string, any>> = RealtimePostgresChangesPayload<T>;

interface RealtimeOptions {
  coupleId?: string;
  userId?: string;
}

export const useRealtime = ({ coupleId, userId }: RealtimeOptions) => {
  const { dispatch } = useApp();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Handle rules changes
  const handleRuleChange = useCallback((payload: DatabaseChange<Rule>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord && newRecord.couple_id === coupleId) {
          dispatch({ type: 'ADD_RULE', payload: newRecord });
        }
        break;
      case 'UPDATE':
        if (newRecord && newRecord.couple_id === coupleId) {
          // Handle rule deactivation (is_active = false) as deletion
          if (newRecord.is_active === false) {
            dispatch({ type: 'DELETE_RULE', payload: newRecord.id });
          } else {
            dispatch({ type: 'UPDATE_RULE', payload: newRecord });
          }
        }
        break;
      case 'DELETE':
        if (oldRecord?.id) {
          dispatch({ type: 'DELETE_RULE', payload: oldRecord.id });
        }
        break;
    }
  }, [coupleId, dispatch]);

  // Handle violation changes
  const handleViolationChange = useCallback(async (payload: DatabaseChange<Violation>) => {
    const { eventType, new: newRecord, old: _ } = payload;
    
    if (eventType === 'INSERT' && newRecord) {
      // Fetch the complete violation data with relations
      const { data: violationWithRelations, error } = await supabase
        .from('violations')
        .select(`
          *,
          rule:rules(*),
          violator:users!violations_violator_id_fkey(*),
          partner:users!violations_partner_id_fkey(*)
        `)
        .eq('id', newRecord.id)
        .single();

      if (!error && violationWithRelations) {
        // Only add if it belongs to our couple
        if (violationWithRelations.rule?.couple_id === coupleId) {
          dispatch({ type: 'ADD_VIOLATION', payload: violationWithRelations as any });
        }
      }
    }
  }, [coupleId, dispatch]);

  // Handle reward changes
  const handleRewardChange = useCallback((payload: DatabaseChange<Reward>) => {
    const { eventType, new: newRecord, old: _ } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord && newRecord.couple_id === coupleId) {
          dispatch({ type: 'ADD_REWARD', payload: newRecord });
        }
        break;
      case 'UPDATE':
        if (newRecord && newRecord.couple_id === coupleId) {
          dispatch({ type: 'UPDATE_REWARD', payload: newRecord });
        }
        break;
    }
  }, [coupleId, dispatch]);

  // Handle couple changes
  const handleCoupleChange = useCallback((payload: DatabaseChange<Couple>) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'UPDATE' && newRecord && newRecord.id === coupleId) {
      dispatch({ type: 'SET_COUPLE', payload: newRecord });
    }
  }, [coupleId, dispatch]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!coupleId) return;

    // Create a unique channel for this couple
    const channel = supabase.channel(`couple-${coupleId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId }
      }
    });

    // Subscribe to rules changes
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
    channel.on<Violation>('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'violations'
      },
      handleViolationChange
    );

    // Subscribe to rewards changes
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
    channel.on<Couple>('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'couples',
        filter: `id=eq.${coupleId}`
      },
      handleCoupleChange
    );

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Realtime subscribed for couple: ${coupleId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime subscription error');
      } else if (status === 'TIMED_OUT') {
        console.warn('⏰ Realtime subscription timed out');
      } else if (status === 'CLOSED') {
        console.log('🔌 Realtime subscription closed');
      }
    });

    // Store channel reference
    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
        console.log(`🔌 Unsubscribed from realtime for couple: ${coupleId}`);
      }
    };
  }, [coupleId, userId, handleRuleChange, handleViolationChange, handleRewardChange, handleCoupleChange]);

  // Return channel status
  const isConnected = channelRef.current?.state === 'joined';

  return {
    isConnected,
    channel: channelRef.current
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
      console.log('👥 Presence sync:', newState);
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('👋 User joined:', key, newPresences);
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('👋 User left:', key, leftPresences);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track our presence
        const presenceTrackStatus = await channel.track({
          user_id: supabase.auth.getUser(),
          online_at: new Date().toISOString(),
        });
        console.log('👤 Presence track status:', presenceTrackStatus);
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