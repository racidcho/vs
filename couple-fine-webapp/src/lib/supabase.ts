import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { isTestMode } from '../utils/testHelper';

const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                        import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
                        import.meta.env.VITE_SUPABASE_SERVICE_KEY;

  const fallbackUrl = 'https://ywocrwjzjheupewfxssu.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3b2Nyd2p6amhldXBld2Z4c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDkyNzIsImV4cCI6MjA3MDEyNTI3Mn0.zLalJ0ECNVKmXRtSe8gmbwOWDrqAxvOP0oIn9jOhT9U';

  // 테스트 모드에서는 Service Role Key 사용 (RLS 우회)
  if (isTestMode() && serviceRoleKey) {
    console.log('🧪 TEST MODE: Service Role Key 사용으로 RLS 우회');
    return {
      url: envUrl || fallbackUrl,
      key: serviceRoleKey,
      source: 'service-role-test-mode'
    };
  }

  if (!envUrl || !envKey) {
    return {
      url: fallbackUrl,
      key: fallbackKey,
      source: 'fallback'
    };
  }

  if (!envUrl.includes('.supabase.co')) {
    return {
      url: fallbackUrl,
      key: fallbackKey,
      source: 'fallback-invalid-url'
    };
  }

  if (envKey.length < 100) {
    return {
      url: fallbackUrl,
      key: fallbackKey,
      source: 'fallback-invalid-key'
    };
  }

  return { url: envUrl, key: envKey, source: 'environment' };
};

const config = getSupabaseConfig();

const finalUrl = config.url;
const finalKey = config.key;

export const supabase = createClient<Database>(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
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

export const Tables = {
  users: 'profiles',
  couples: 'couples',
  rules: 'rules',
  violations: 'violations',
  rewards: 'rewards'
} as const;

export const getConnectionStatus = () => {
  return {
    isConnected: supabase.realtime.isConnected(),
    channels: supabase.getChannels().map(ch => ch.topic),
    status: supabase.realtime.isConnected() ? 'connected' : 'disconnected'
  };
};

export const onConnectionChange = (callback: (connected: boolean) => void) => {
  const interval = setInterval(() => {
    callback(supabase.realtime.isConnected());
  }, 5000);

  return () => {
    clearInterval(interval);
  };
};

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
    const { error } = await supabase.from('profiles').select('id').limit(1);
    results.database = !error;
  } catch (error) {
    // Silent fail
  }

  try {
    const { error } = await supabase.auth.getSession();
    results.auth = !error;
  } catch (error) {
    // Silent fail
  }

  results.realtime = supabase.realtime.isConnected();

  return results;
};

export const getTable = <T extends keyof typeof Tables>(tableName: T) => {
  return supabase.from(Tables[tableName]);
};

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

export const isSupabaseError = (error: any): error is { message: string; details?: any; hint?: any; code?: string } => {
  return error && typeof error === 'object' && 'message' in error;
};

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