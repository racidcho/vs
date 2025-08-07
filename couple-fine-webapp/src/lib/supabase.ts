import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// 환경변수 검증 및 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Production 환경에서는 환경변수가 필수
if (import.meta.env.PROD && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('❌ Supabase environment variables are required in production');
}

// 개발 환경에서 환경변수가 없을 때 경고
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing. Using placeholder values for development.');
  console.warn('📝 Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// 안전한 기본값 설정
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

// TypeScript 지원과 함께 Supabase 클라이언트 생성
export const supabase = createClient<Database>(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 2 // Rate limiting
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000), // Exponential backoff with max 30s
    timeout: 20000
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application': 'couple-fine-webapp'
    }
  }
});

// Database table helpers with type safety
export const Tables = {
  users: 'users',
  couples: 'couples', 
  rules: 'rules',
  violations: 'violations',
  rewards: 'rewards'
} as const;

// 연결 상태 모니터링
export const getConnectionStatus = () => {
  return {
    isConnected: supabase.realtime.isConnected(),
    channels: supabase.getChannels().map(ch => ch.topic),
    status: supabase.realtime.isConnected() ? 'connected' : 'disconnected'
  };
};

// 연결 이벤트 리스너
export const onConnectionChange = (callback: (connected: boolean) => void) => {
  // Monitor connection status via periodic checking
  const interval = setInterval(() => {
    callback(supabase.realtime.isConnected());
  }, 5000);
  
  // Cleanup function
  return () => {
    clearInterval(interval);
  };
};

// Health check function
export const healthCheck = async (): Promise<{
  database: boolean;
  realtime: boolean;
  auth: boolean;
}> => {
  const results = {
    database: false,
    realtime: false,
    auth: false
  };

  try {
    // Database health check
    const { error } = await supabase.from('users').select('id').limit(1);
    results.database = !error;
  } catch (error) {
    console.warn('Database health check failed:', error);
  }

  try {
    // Auth health check
    const { error } = await supabase.auth.getSession();
    results.auth = !error;
  } catch (error) {
    console.warn('Auth health check failed:', error);
  }

  // Realtime health check
  results.realtime = supabase.realtime.isConnected();

  return results;
};

// Type-safe table reference helper
export const getTable = <T extends keyof typeof Tables>(tableName: T) => {
  return supabase.from(Tables[tableName]);
};

// Supabase realtime channel helpers with enhanced configuration
export const createRealtimeChannel = (channelName: string, options?: {
  broadcast?: { self?: boolean; ack?: boolean };
  presence?: { key?: string };
}) => {
  return supabase.channel(channelName, {
    config: {
      broadcast: { self: true, ack: true, ...options?.broadcast },
      presence: { key: 'user_id', ...options?.presence }
    }
  });
};

// Error handling helper
export const isSupabaseError = (error: any): error is { message: string; details?: any; hint?: any; code?: string } => {
  return error && typeof error === 'object' && 'message' in error;
};

// Batch operation helper
export const executeBatch = async <T>(operations: Promise<T>[]): Promise<{
  results: (T | null)[];
  errors: (Error | null)[];
  successCount: number;
}> => {
  const settled = await Promise.allSettled(operations);
  
  const results: (T | null)[] = [];
  const errors: (Error | null)[] = [];
  let successCount = 0;

  settled.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
      errors.push(null);
      successCount++;
    } else {
      results.push(null);
      errors.push(result.reason);
    }
  });

  return { results, errors, successCount };
};