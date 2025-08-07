import { createClient } from '@supabase/supabase-js';

// 개발 환경에서 임시로 사용할 더미 값
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// 환경변수가 없을 때 경고만 표시
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase environment variables are missing. Using placeholder values.');
  console.warn('📝 Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: () => 5000
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

// Supabase realtime channel helpers
export const createRealtimeChannel = (channelName: string) => {
  return supabase.channel(channelName);
};