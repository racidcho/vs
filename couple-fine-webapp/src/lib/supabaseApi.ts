import { supabase } from './supabase';
import type { User, Couple, Rule, Violation, Reward, PaginatedResponse } from '../types';

// 에러 처리 헬퍼
const handleSupabaseError = (error: any): never => {
  console.error('Supabase API Error:', error);
  throw new Error(error.message || 'Database operation failed');
};

// === User Profile Management ===
export const createProfile = async (userId: string, email: string, displayName: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      display_name: displayName
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Pick<User, 'display_name' | 'couple_id'>>): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const getProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') handleSupabaseError(error);
  return data || null;
};

// === Couple Management ===
export const createCouple = async (theme: string = 'cute'): Promise<{ couple: Couple; code: string }> => {
  // 고유한 6자리 커플 코드 생성
  const generateCoupleCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  let coupleCode = generateCoupleCode();
  let attempts = 0;
  const maxAttempts = 10;

  // 중복 코드 방지를 위한 재시도
  while (attempts < maxAttempts) {
    const { data: existingCouple } = await supabase
      .from('couples')
      .select('id')
      .eq('code', coupleCode)
      .single();

    if (!existingCouple) break;
    
    coupleCode = generateCoupleCode();
    attempts++;
  }

  const { data, error } = await supabase
    .from('couples')
    .insert({
      code: coupleCode,
      theme
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return { couple: data, code: coupleCode };
};

export const connectCouple = async (userId: string, coupleCode: string): Promise<Couple> => {
  // 1. 커플 코드 검증
  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .select('*')
    .eq('code', coupleCode.toUpperCase())
    .single();

  if (coupleError || !couple) {
    throw new Error('유효하지 않은 커플 코드입니다');
  }

  // 2. 사용자 프로필에 couple_id 업데이트
  const { error: updateError } = await supabase
    .from('users')
    .update({ couple_id: couple.id })
    .eq('id', userId);

  if (updateError) handleSupabaseError(updateError);

  return couple;
};

export const getCouple = async (coupleId: string): Promise<Couple | null> => {
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId)
    .single();

  if (error && error.code !== 'PGRST116') handleSupabaseError(error);
  return data || null;
};

export const getCoupleMembers = async (coupleId: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('couple_id', coupleId);

  if (error) handleSupabaseError(error);
  return data || [];
};

// === Rules Management ===
export const addRule = async (rule: Omit<Rule, 'id' | 'created_at'>): Promise<Rule> => {
  const { data, error } = await supabase
    .from('rules')
    .insert({
      ...rule,
      is_active: true
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const updateRule = async (ruleId: string, updates: Partial<Rule>): Promise<Rule> => {
  const { data, error } = await supabase
    .from('rules')
    .update(updates)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const deleteRule = async (ruleId: string): Promise<void> => {
  const { error } = await supabase
    .from('rules')
    .delete()
    .eq('id', ruleId);

  if (error) handleSupabaseError(error);
};

export const getRules = async (coupleId: string, activeOnly: boolean = true): Promise<Rule[]> => {
  let query = supabase
    .from('rules')
    .select('*')
    .eq('couple_id', coupleId);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data || [];
};

// === Violations Management ===
export const addViolation = async (violation: Omit<Violation, 'id' | 'created_at'>): Promise<Violation> => {
  const { data, error } = await supabase
    .from('violations')
    .insert(violation)
    .select(`
      *,
      rule:rules(*),
      violator:users!violator_id(*),
      partner:users!partner_id(*)
    `)
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const getViolations = async (
  coupleId: string, 
  options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    ruleId?: string;
  }
): Promise<PaginatedResponse<Violation>> => {
  let query = supabase
    .from('violations')
    .select(`
      *,
      rule:rules!inner(*),
      violator:users!violator_id(*),
      partner:users!partner_id(*)
    `, { count: 'exact' })
    .eq('rule.couple_id', coupleId);

  // 필터 조건 추가
  if (options?.userId) {
    query = query.eq('violator_id', options.userId);
  }
  
  if (options?.ruleId) {
    query = query.eq('rule_id', options.ruleId);
  }

  // 페이지네이션
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
  }

  // 최신순 정렬
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) handleSupabaseError(error);

  return {
    data: data || [],
    count: count || 0,
    has_more: (data?.length || 0) === (options?.limit || 10)
  };
};

export const updateViolation = async (violationId: string, updates: Partial<Pick<Violation, 'amount' | 'note'>>): Promise<Violation> => {
  const { data, error } = await supabase
    .from('violations')
    .update(updates)
    .eq('id', violationId)
    .select(`
      *,
      rule:rules(*),
      violator:users!violator_id(*),
      partner:users!partner_id(*)
    `)
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const deleteViolation = async (violationId: string): Promise<void> => {
  const { error } = await supabase
    .from('violations')
    .delete()
    .eq('id', violationId);

  if (error) handleSupabaseError(error);
};

// === Rewards Management ===
export const addReward = async (reward: Omit<Reward, 'id' | 'created_at'>): Promise<Reward> => {
  const { data, error } = await supabase
    .from('rewards')
    .insert({
      ...reward,
      is_claimed: false
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const updateReward = async (rewardId: string, updates: Partial<Reward>): Promise<Reward> => {
  const { data, error } = await supabase
    .from('rewards')
    .update(updates)
    .eq('id', rewardId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const achieveReward = async (rewardId: string): Promise<Reward> => {
  const { data, error } = await supabase
    .from('rewards')
    .update({ is_claimed: true })
    .eq('id', rewardId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const getRewards = async (coupleId: string, includesClaimed: boolean = true): Promise<Reward[]> => {
  let query = supabase
    .from('rewards')
    .select('*')
    .eq('couple_id', coupleId);

  if (!includesClaimed) {
    query = query.eq('is_claimed', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data || [];
};

export const deleteReward = async (rewardId: string): Promise<void> => {
  const { error } = await supabase
    .from('rewards')
    .delete()
    .eq('id', rewardId);

  if (error) handleSupabaseError(error);
};

// === Activity Logs & Dashboard ===
export const getActivityLogs = async (
  coupleId: string, 
  options?: { limit?: number; offset?: number }
): Promise<PaginatedResponse<Violation>> => {
  // 활동 로그는 위반 기록을 최신순으로 가져옴
  return getViolations(coupleId, {
    limit: options?.limit || 20,
    offset: options?.offset || 0
  });
};

export const getDashboardStats = async (coupleId: string): Promise<{
  totalBalance: number;
  activeRules: number;
  thisMonthViolations: number;
  availableRewards: number;
  recentActivity: Violation[];
}> => {
  try {
    // 1. 활성 규칙 수
    const { count: activeRulesCount } = await supabase
      .from('rules')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', coupleId)
      .eq('is_active', true);

    // 2. 이번 달 위반 수와 총 잔고
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonthCount } = await supabase
      .from('violations')
      .select(`
        amount, type,
        rule:rules!inner(couple_id)
      `, { count: 'exact' })
      .eq('rule.couple_id', coupleId)
      .gte('created_at', startOfMonth.toISOString());

    // 총 잔고 계산 (모든 위반 기록)
    const { data: allViolationsData } = await supabase
      .from('violations')
      .select(`
        amount, type,
        rule:rules!inner(couple_id)
      `)
      .eq('rule.couple_id', coupleId);

    const totalBalance = (allViolationsData || []).reduce((sum, violation) => {
      return violation.type === 'add' 
        ? sum + violation.amount 
        : sum - violation.amount;
    }, 0);

    // 3. 사용 가능한 리워드 수
    const { count: availableRewardsCount } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', coupleId)
      .eq('is_claimed', false);

    // 4. 최근 활동 (최근 5개)
    const { data: recentActivity } = await supabase
      .from('violations')
      .select(`
        *,
        rule:rules!inner(*),
        violator:users!violator_id(*),
        partner:users!partner_id(*)
      `)
      .eq('rule.couple_id', coupleId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      totalBalance,
      activeRules: activeRulesCount || 0,
      thisMonthViolations: thisMonthCount || 0,
      availableRewards: availableRewardsCount || 0,
      recentActivity: recentActivity || []
    };

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return {
      totalBalance: 0,
      activeRules: 0,
      thisMonthViolations: 0,
      availableRewards: 0,
      recentActivity: []
    };
  }
};

// === Auth Helpers ===
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) return null;

  return getProfile(user.id);
};

export const signInWithOTP = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  });

  if (error) handleSupabaseError(error);
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) handleSupabaseError(error);
};

// === Utility Functions ===
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) handleSupabaseError(uploadError);

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const getAvatarUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);
  
  return data.publicUrl;
};