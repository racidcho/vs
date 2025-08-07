# API 레퍼런스 📚

> **우리 벌금통 (Couple Fine WebApp) API 완전 가이드**  
> Supabase 기반 실시간 API와 클라이언트 함수 문서

## 📋 목차

1. [Supabase 설정](#supabase-설정)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [인증 API](#인증-api)
4. [커플 시스템 API](#커플-시스템-api)
5. [규칙 관리 API](#규칙-관리-api)
6. [벌금 시스템 API](#벌금-시스템-api)
7. [보상 시스템 API](#보상-시스템-api)
8. [실시간 구독](#실시간-구독)
9. [보안 정책 (RLS)](#보안-정책-rls)
10. [에러 처리](#에러-처리)

---

## 🚀 Supabase 설정

### 환경 변수
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 클라이언트 초기화
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

---

## 🗄️ 데이터베이스 스키마

### 테이블 구조

#### 1. `profiles` - 사용자 프로필
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  pin TEXT, -- 4자리 PIN (암호화 저장)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `couples` - 커플 연결
```sql
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 6자리 커플 코드
  user1_id UUID REFERENCES profiles(id),
  user2_id UUID REFERENCES profiles(id),
  total_fine_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `rules` - 규칙 관리
```sql
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- 'general', 'health', 'lifestyle'
  fine_amount DECIMAL(8,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `violations` - 벌금 기록
```sql
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES rules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(8,2) NOT NULL,
  type TEXT DEFAULT 'fine', -- 'fine', 'deduction'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. `rewards` - 보상 시스템
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(8,2) NOT NULL,
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. `activity_logs` - 활동 로그
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 인증 API

### 매직 링크 로그인
```typescript
// 이메일로 매직 링크 전송
export const signInWithMagicLink = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) throw new Error(`로그인 실패: ${error.message}`);
};

// 사용 예시
await signInWithMagicLink('user@example.com');
```

### 로그아웃
```typescript
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`로그아웃 실패: ${error.message}`);
};
```

### 현재 사용자 정보
```typescript
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(`사용자 정보 로드 실패: ${error.message}`);
  return user;
};
```

---

## 💑 커플 시스템 API

### 새 커플 생성
```typescript
export const createCouple = async (userId: string) => {
  // 6자리 랜덤 코드 생성
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { data, error } = await supabase
    .from('couples')
    .insert([{
      code,
      user1_id: userId,
      total_fine_amount: 0
    }])
    .select()
    .single();
    
  if (error) throw new Error(`커플 생성 실패: ${error.message}`);
  
  // 기본 규칙과 보상 생성
  await createDefaultRulesAndRewards(data.id);
  
  return data;
};
```

### 커플 코드로 연결
```typescript
export const joinCoupleByCode = async (code: string, userId: string) => {
  // 커플 찾기
  const { data: couple, error: findError } = await supabase
    .from('couples')
    .select('*')
    .eq('code', code)
    .is('user2_id', null)
    .single();
    
  if (findError) throw new Error('커플 코드를 찾을 수 없습니다');
  
  // 두 번째 사용자로 연결
  const { data, error } = await supabase
    .from('couples')
    .update({ user2_id: userId })
    .eq('id', couple.id)
    .select()
    .single();
    
  if (error) throw new Error(`커플 연결 실패: ${error.message}`);
  return data;
};
```

### 사용자의 커플 정보 조회
```typescript
export const getUserCouple = async (userId: string) => {
  const { data, error } = await supabase
    .from('couples')
    .select(`
      *,
      user1:profiles!couples_user1_id_fkey(id, name, email),
      user2:profiles!couples_user2_id_fkey(id, name, email)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    throw new Error(`커플 정보 로드 실패: ${error.message}`);
  }
  
  return data;
};
```

---

## 📋 규칙 관리 API

### 규칙 목록 조회
```typescript
export const getRules = async (coupleId: string) => {
  const { data, error } = await supabase
    .from('rules')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(`규칙 목록 로드 실패: ${error.message}`);
  return data || [];
};
```

### 규칙 추가
```typescript
interface CreateRuleData {
  title: string;
  description?: string;
  category: 'general' | 'health' | 'lifestyle';
  fine_amount: number;
}

export const createRule = async (coupleId: string, ruleData: CreateRuleData) => {
  const { data, error } = await supabase
    .from('rules')
    .insert([{
      couple_id: coupleId,
      ...ruleData,
      is_active: true
    }])
    .select()
    .single();
    
  if (error) throw new Error(`규칙 추가 실패: ${error.message}`);
  return data;
};
```

### 규칙 수정
```typescript
export const updateRule = async (ruleId: string, updates: Partial<CreateRuleData & { is_active: boolean }>) => {
  const { data, error } = await supabase
    .from('rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .select()
    .single();
    
  if (error) throw new Error(`규칙 수정 실패: ${error.message}`);
  return data;
};
```

### 규칙 삭제
```typescript
export const deleteRule = async (ruleId: string) => {
  const { error } = await supabase
    .from('rules')
    .delete()
    .eq('id', ruleId);
    
  if (error) throw new Error(`규칙 삭제 실패: ${error.message}`);
};
```

---

## 💰 벌금 시스템 API

### 벌금 기록 목록 조회
```typescript
export const getViolations = async (coupleId: string) => {
  const { data, error } = await supabase
    .from('violations')
    .select(`
      *,
      rule:rules(id, title, category),
      user:profiles(id, name)
    `)
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(`벌금 기록 로드 실패: ${error.message}`);
  return data || [];
};
```

### 벌금 기록 추가
```typescript
interface CreateViolationData {
  rule_id: string;
  amount: number;
  type: 'fine' | 'deduction';
  description?: string;
}

export const createViolation = async (
  coupleId: string, 
  userId: string, 
  violationData: CreateViolationData
) => {
  const { data, error } = await supabase
    .from('violations')
    .insert([{
      couple_id: coupleId,
      user_id: userId,
      ...violationData
    }])
    .select(`
      *,
      rule:rules(id, title, category),
      user:profiles(id, name)
    `)
    .single();
    
  if (error) throw new Error(`벌금 기록 실패: ${error.message}`);
  return data;
};
```

### 월별 벌금 통계
```typescript
export const getMonthlyViolationStats = async (coupleId: string, year: number, month: number) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('violations')
    .select('*')
    .eq('couple_id', coupleId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);
    
  if (error) throw new Error(`월별 통계 로드 실패: ${error.message}`);
  
  // 일별 통계 계산
  const dailyStats = data.reduce((acc, violation) => {
    const day = new Date(violation.created_at).getDate();
    if (!acc[day]) acc[day] = { fine: 0, deduction: 0, count: 0 };
    
    if (violation.type === 'fine') {
      acc[day].fine += violation.amount;
    } else {
      acc[day].deduction += violation.amount;
    }
    acc[day].count++;
    
    return acc;
  }, {} as Record<number, { fine: number; deduction: number; count: number }>);
  
  return { data, dailyStats };
};
```

---

## 🎁 보상 시스템 API

### 보상 목록 조회
```typescript
export const getRewards = async (coupleId: string) => {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(`보상 목록 로드 실패: ${error.message}`);
  return data || [];
};
```

### 보상 추가
```typescript
interface CreateRewardData {
  title: string;
  description?: string;
  target_amount: number;
}

export const createReward = async (coupleId: string, rewardData: CreateRewardData) => {
  const { data, error } = await supabase
    .from('rewards')
    .insert([{
      couple_id: coupleId,
      ...rewardData,
      is_achieved: false
    }])
    .select()
    .single();
    
  if (error) throw new Error(`보상 추가 실패: ${error.message}`);
  return data;
};
```

### 보상 달성 처리
```typescript
export const achieveReward = async (rewardId: string, coupleId: string) => {
  // 트랜잭션으로 보상 달성 처리 및 벌금 차감
  const { data: reward } = await supabase
    .from('rewards')
    .select('target_amount')
    .eq('id', rewardId)
    .single();
    
  if (!reward) throw new Error('보상을 찾을 수 없습니다');
  
  // 보상 달성 처리
  const { data, error } = await supabase
    .from('rewards')
    .update({
      is_achieved: true,
      achieved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', rewardId)
    .select()
    .single();
    
  if (error) throw new Error(`보상 달성 처리 실패: ${error.message}`);
  
  // 커플 잔액에서 차감
  await supabase
    .from('couples')
    .update({
      total_fine_amount: supabase.sql`total_fine_amount - ${reward.target_amount}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', coupleId);
    
  return data;
};
```

---

## ⚡ 실시간 구독

### 벌금 기록 실시간 구독
```typescript
export const subscribeToViolations = (
  coupleId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`violations:${coupleId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'violations',
        filter: `couple_id=eq.${coupleId}`
      },
      (payload) => {
        console.log('Violation change:', payload);
        callback(payload);
      }
    )
    .subscribe();
};

// 사용 예시
const subscription = subscribeToViolations(coupleId, (payload) => {
  if (payload.eventType === 'INSERT') {
    // 새 벌금 기록 처리
  } else if (payload.eventType === 'UPDATE') {
    // 벌금 기록 수정 처리
  }
});

// 구독 해제
subscription.unsubscribe();
```

### 커플 잔액 실시간 구독
```typescript
export const subscribeToCoupleBalance = (
  coupleId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`couple:${coupleId}`)
    .on('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'couples',
        filter: `id=eq.${coupleId}`
      },
      (payload) => {
        console.log('Couple balance updated:', payload.new.total_fine_amount);
        callback(payload);
      }
    )
    .subscribe();
};
```

### 활동 피드 실시간 구독
```typescript
export const subscribeToActivityLogs = (
  coupleId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`activity:${coupleId}`)
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs',
        filter: `couple_id=eq.${coupleId}`
      },
      (payload) => {
        console.log('New activity:', payload.new);
        callback(payload);
      }
    )
    .subscribe();
};
```

---

## 🔒 보안 정책 (RLS)

### 테이블별 RLS 정책

#### profiles 테이블
```sql
-- 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### couples 테이블
```sql
-- 커플 멤버만 조회 가능
CREATE POLICY "Couple members can view couple" ON couples
  FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- 커플 생성자 또는 멤버만 수정 가능
CREATE POLICY "Couple members can update couple" ON couples
  FOR UPDATE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );
```

#### rules, violations, rewards, activity_logs 테이블
```sql
-- 커플 멤버만 접근 가능 (각 테이블에 동일한 패턴)
CREATE POLICY "Couple members can access data" ON [table_name]
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM couples 
      WHERE auth.uid() = user1_id OR auth.uid() = user2_id
    )
  );
```

---

## ❌ 에러 처리

### 일반적인 에러 타입
```typescript
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Supabase 에러 변환
export const handleSupabaseError = (error: any): ApiError => {
  if (error.code === 'PGRST116') {
    return {
      code: 'NOT_FOUND',
      message: '데이터를 찾을 수 없습니다'
    };
  }
  
  if (error.code === '23505') {
    return {
      code: 'DUPLICATE_KEY',
      message: '이미 존재하는 데이터입니다'
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || '알 수 없는 오류가 발생했습니다',
    details: error
  };
};
```

### 커스텀 에러 처리 훅
```typescript
import { useState } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState<ApiError | null>(null);
  
  const handleError = (err: any) => {
    const apiError = handleSupabaseError(err);
    setError(apiError);
    
    // 토스트 알림 표시
    console.error('API Error:', apiError);
  };
  
  const clearError = () => setError(null);
  
  return { error, handleError, clearError };
};
```

---

## 📊 실시간 이벤트 타입

### 이벤트 타입 정의
```typescript
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T = any> {
  eventType: RealtimeEventType;
  new: T;
  old: T;
  schema: string;
  table: string;
}

// 벌금 기록 이벤트
export interface ViolationRealtimeEvent {
  type: 'violation_added' | 'violation_updated' | 'violation_deleted';
  payload: RealtimePayload<Violation>;
}

// 보상 달성 이벤트
export interface RewardRealtimeEvent {
  type: 'reward_achieved' | 'reward_added';
  payload: RealtimePayload<Reward>;
}

// 활동 로그 이벤트
export interface ActivityRealtimeEvent {
  type: 'activity_logged';
  payload: RealtimePayload<ActivityLog>;
}
```

---

## 🚀 코드 예제

### 완전한 벌금 기록 추가 플로우
```typescript
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export const useAddViolation = () => {
  const { user } = useAuth();
  const { couple, dispatch } = useApp();
  
  const addViolation = async (data: CreateViolationData) => {
    if (!user || !couple) {
      throw new Error('사용자 또는 커플 정보가 없습니다');
    }
    
    try {
      // 1. 벌금 기록 추가
      const violation = await createViolation(couple.id, user.id, data);
      
      // 2. 로컬 상태 업데이트
      dispatch({ type: 'ADD_VIOLATION', payload: violation });
      
      // 3. 활동 로그 생성
      await createActivityLog(couple.id, user.id, 'violation_added', {
        rule_title: violation.rule.title,
        amount: violation.amount,
        type: violation.type
      });
      
      return violation;
    } catch (error) {
      throw handleSupabaseError(error);
    }
  };
  
  return { addViolation };
};
```

### 실시간 구독 관리 훅
```typescript
import { useEffect } from 'react';

export const useRealtimeSubscription = (coupleId: string) => {
  const { dispatch } = useApp();
  
  useEffect(() => {
    if (!coupleId) return;
    
    // 여러 테이블 동시 구독
    const subscriptions = [
      subscribeToViolations(coupleId, (payload) => {
        if (payload.eventType === 'INSERT') {
          dispatch({ type: 'ADD_VIOLATION', payload: payload.new });
        }
      }),
      
      subscribeToCoupleBalance(coupleId, (payload) => {
        dispatch({ 
          type: 'UPDATE_COUPLE_BALANCE', 
          payload: payload.new.total_fine_amount 
        });
      }),
      
      subscribeToActivityLogs(coupleId, (payload) => {
        dispatch({ type: 'ADD_ACTIVITY', payload: payload.new });
      })
    ];
    
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [coupleId, dispatch]);
};
```

---

## 📈 성능 최적화

### 데이터 캐싱 전략
```typescript
// React Query를 사용한 데이터 캐싱 (향후 도입 시)
export const useViolationsQuery = (coupleId: string) => {
  return useQuery({
    queryKey: ['violations', coupleId],
    queryFn: () => getViolations(coupleId),
    staleTime: 2 * 60 * 1000, // 2분
    cacheTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
  });
};
```

### 배치 작업
```typescript
// 여러 작업을 배치로 처리
export const batchUpdateViolations = async (
  updates: Array<{ id: string; data: Partial<Violation> }>
) => {
  const promises = updates.map(({ id, data }) => 
    updateViolation(id, data)
  );
  
  return await Promise.all(promises);
};
```

---

*API 레퍼런스 마지막 업데이트: 2025-08-07*  
*완성된 우리 벌금통 API 가이드* ✨