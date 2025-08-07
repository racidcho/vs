import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// 🔧 프로덕션 환경 변수 fallback 시스템 - CRUD 문제 완전 해결
const PROD_SUPABASE_URL = 'https://ywocrwjzjheupewfxssu.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3b2Nyd2p6amhldXBld2Z4c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDkyNzIsImV4cCI6MjA3MDEyNTI3Mn0.-zJYOl8UfL-FdVGXNm-ZlgxWQu-uxvOa_Hge1WUDuOo';

// 스마트 환경 변수 감지 및 fallback
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // 환경 변수가 있고 유효한 경우 사용
  if (envUrl && envKey && envUrl.includes('.supabase.co') && envKey.length > 100) {
    console.log('✅ SUPABASE: 환경 변수 사용');
    return { url: envUrl, key: envKey, source: 'environment' };
  }
  
  // fallback to hardcoded values
  console.log('🔄 SUPABASE: Fallback 설정 사용 (환경 변수 없음)');
  return { url: PROD_SUPABASE_URL, key: PROD_SUPABASE_ANON_KEY, source: 'fallback' };
};

const config = getSupabaseConfig();

// 환경변수 상세 디버깅
console.log('🔍 SUPABASE: Environment Debug:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'Missing',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Found' : 'Missing',
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  NODE_ENV: import.meta.env.NODE_ENV,
  configSource: config.source,
  finalUrl: config.url,
  finalKeyLength: config.key.length,
  urlValid: config.url.includes('.supabase.co'),
  keyValid: config.key.length > 100
});

const finalUrl = config.url;
const finalKey = config.key;

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

// 고급 연결 테스트 및 자동 복구 시스템
if (typeof window !== 'undefined') {
  console.log('🌐 SUPABASE: 브라우저 환경에서 고급 연결 테스트 시작');
  
  const testConnection = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryCount + 1); // 1s, 2s, 3s
    
    try {
      console.log(`🔄 SUPABASE: 연결 시도 ${retryCount + 1}/${maxRetries + 1}`);
      
      const startTime = performance.now();
      const { error, count } = await supabase
        .from('rules')
        .select('count', { count: 'exact', head: true });
      
      const duration = Math.round(performance.now() - startTime);
      
      if (error) {
        console.error('❌ SUPABASE: 연결 실패 상세 정보:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          duration: `${duration}ms`,
          attempt: retryCount + 1,
          configSource: config.source
        });
        
        // 재시도 로직
        if (retryCount < maxRetries) {
          console.log(`⏳ SUPABASE: ${retryDelay}ms 후 재시도...`);
          setTimeout(() => testConnection(retryCount + 1), retryDelay);
        } else {
          console.error('💥 SUPABASE: 최대 재시도 횟수 초과, 연결 실패');
          // 사용자에게 알림
          if (window.location.pathname !== '/login') {
            console.log('🔄 SUPABASE: 로그인 페이지로 리디렉션 권장');
          }
        }
      } else {
        console.log('✅ SUPABASE: 연결 테스트 성공!', {
          rulesCount: count,
          duration: `${duration}ms`,
          attempt: retryCount + 1,
          configSource: config.source,
          url: config.url.substring(0, 30) + '...',
          timestamp: new Date().toISOString()
        });
      }
    } catch (networkError) {
      console.error('🚨 SUPABASE: 네트워크 오류:', {
        error: networkError,
        type: networkError?.name,
        message: networkError?.message,
        stack: networkError?.stack?.substring(0, 200),
        attempt: retryCount + 1,
        configSource: config.source
      });
      
      if (retryCount < maxRetries) {
        console.log(`⏳ SUPABASE: 네트워크 오류 후 ${retryDelay}ms 후 재시도...`);
        setTimeout(() => testConnection(retryCount + 1), retryDelay);
      }
    }
  };
  
  // 즉시 실행
  testConnection();
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