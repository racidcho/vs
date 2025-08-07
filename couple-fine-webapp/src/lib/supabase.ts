import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// 🔧 임시 하드코딩 테스트 - PRODUCTION CRUD 문제 해결용
const supabaseUrl = 'https://ywocrwjzjheupewfxssu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3b2Nyd2p6amhldXBld2Z4c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDkyNzIsImV4cCI6MjA3MDEyNTI3Mn0.zLalJ0ECNVKmXRtSe8gmbwOWDrqAxvOP0oIn9jOhT9U';

// 환경변수 디버깅
console.log('🔍 SUPABASE: Environment Debug:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Found' : 'Missing',
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  finalUrl: supabaseUrl,
  finalKeyLength: supabaseAnonKey.length
});

console.log('🔐 SUPABASE: 하드코딩된 값 사용:', {
  url: supabaseUrl,
  keyPreview: supabaseAnonKey.substring(0, 20) + '...'
});

// 환경변수 상태 확인
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  if (import.meta.env.MODE === 'production') {
    console.info('🔐 Using production Supabase configuration');
  } else {
    console.warn('⚠️ Supabase environment variables not found, using defaults');
  }
}

// 안전한 기본값 설정 (실제 Supabase 프로젝트 값 사용)
const finalUrl = supabaseUrl;
const finalKey = supabaseAnonKey;

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

console.log('✅ SUPABASE: 클라이언트 생성 완료');
console.log('🔗 SUPABASE: 클라이언트 객체:', supabase);

// 간단한 연결 테스트
if (typeof window !== 'undefined') {
  console.log('🌐 SUPABASE: 브라우저 환경에서 연결 테스트 시작');
  supabase.from('rules').select('count', { count: 'exact', head: true }).then(
    ({ error, count }) => {
      if (error) {
        console.log('❌ SUPABASE: 연결 테스트 실패:', error);
      } else {
        console.log('✅ SUPABASE: 연결 테스트 성공, rules 테이블 count:', count);
      }
    }
  );
}

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