import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// 환경 변수에서 Supabase 설정 가져오기 (폴백 지원)
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // 폴백 값 (프로덕션용 - 보안상 좋지 않지만 임시 해결책)
  const fallbackUrl = 'https://ywocrwjzjheupewfxssu.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3b2Nyd2p6amhldXBld2Z4c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDkyNzIsImV4cCI6MjA3MDEyNTI3Mn0.zLalJ0ECNVKmXRtSe8gmbwOWDrqAxvOP0oIn9jOhT9U';
  
  // 환경 변수가 없으면 폴백 사용
  if (!envUrl || !envKey) {
    console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. 폴백 값 사용');
    console.warn('⚠️ 이것은 임시 해결책입니다. Vercel에서 환경변수를 설정해주세요.');
    return { 
      url: fallbackUrl, 
      key: fallbackKey, 
      source: 'fallback' 
    };
  }
  
  // 환경 변수 검증
  if (!envUrl.includes('.supabase.co')) {
    console.error('⚠️ 잘못된 Supabase URL:', envUrl, '폴백 사용');
    return { 
      url: fallbackUrl, 
      key: fallbackKey, 
      source: 'fallback-invalid-url' 
    };
  }
  
  if (envKey.length < 100) {
    console.error('⚠️ 잘못된 Supabase Anon Key, 폴백 사용');
    return { 
      url: fallbackUrl, 
      key: fallbackKey, 
      source: 'fallback-invalid-key' 
    };
  }
  
  console.log('✅ Supabase 환경 변수 로드 성공');
  return { url: envUrl, key: envKey, source: 'environment' };
};

const config = getSupabaseConfig();

const finalUrl = config.url;
const finalKey = config.key;

// 디버깅용 로그 (프로덕션에서는 제거 권장)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config:', {
    url: finalUrl,
    keyPreview: finalKey.substring(finalKey.length - 10),
    source: config.source
  });
}

// TypeScript 지원과 함께 Supabase 클라이언트 생성
export const supabase = createClient<Database>(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
    // flowType: 'pkce' 제거 - 매직링크와 충돌
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
  users: 'profiles', // Updated to match actual DB schema
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
    const { error } = await supabase.from('profiles').select('id').limit(1);
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