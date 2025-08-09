import { supabase } from './supabase';
import type { User, Couple, Rule, Violation, Reward, PaginatedResponse } from '../types';

// 🛡️ 스키마 변경 대응을 위한 유연한 API 계층
// 테이블명과 컬럼명 매핑 (향후 변경 시 이곳만 수정)
const SCHEMA_MAP = {
  tables: {
    users: 'profiles',
    couples: 'couples',
    rules: 'rules',
    violations: 'violations',
    rewards: 'rewards',
    activity_logs: 'activity_logs'
  },
  columns: {
    // 공통 컬럼
    id: 'id',
    created_at: 'created_at',
    updated_at: 'updated_at',

    // Users/Profiles 테이블
    user_id: 'id',
    email: 'email',
    display_name: 'display_name',
    couple_id: 'couple_id',
    avatar_url: 'avatar_url',
    pin_hash: 'pin_hash',

    // Couples 테이블
    couple_code: 'couple_code',
    couple_name: 'couple_name',
    partner_1_id: 'partner_1_id',
    partner_2_id: 'partner_2_id',
    total_balance: 'total_balance',
    is_active: 'is_active',

    // Rules 테이블
    title: 'title',
    description: 'description',
    fine_amount: 'fine_amount',
    category: 'category',
    icon_emoji: 'icon_emoji',
    created_by_user_id: 'created_by_user_id',

    // Violations 테이블
    rule_id: 'rule_id',
    violator_user_id: 'violator_user_id',
    recorded_by_user_id: 'recorded_by_user_id',
    amount: 'amount',
    memo: 'memo',
    violation_date: 'violation_date',

    // Rewards 테이블
    target_amount: 'target_amount',
    is_achieved: 'is_achieved',
    achieved_at: 'achieved_at',
    achieved_by_user_id: 'achieved_by_user_id',
    priority: 'priority'
  }
} as const;

// 🔧 유연한 에러 처리
interface ApiError {
  code?: string;
  message: string;
  details?: any;
  hint?: string;
}

const createApiError = (error: any, context: string): ApiError => {
  return {
    code: error?.code,
    message: error?.message || `${context} 작업 중 오류가 발생했습니다`,
    details: error?.details,
    hint: error?.hint
  };
};

const handleSupabaseError = (error: any, context: string = 'Database'): never => {
  console.error(`Supabase API Error (${context}):`, error);
  const apiError = createApiError(error, context);

  // 사용자 친화적 메시지 매핑
  const friendlyMessages: Record<string, string> = {
    'PGRST116': '데이터를 찾을 수 없습니다',
    '23505': '이미 존재하는 데이터입니다',
    '23503': '연관된 데이터가 없습니다',
    '42P01': '데이터베이스 구조가 변경되었습니다. 관리자에게 문의하세요',
    '42703': '데이터베이스 필드가 변경되었습니다. 앱을 새로고침해주세요'
  };

  const userMessage = friendlyMessages[error?.code] || apiError.message;
  throw new Error(userMessage);
};

// 🔍 동적 컬럼 검사 헬퍼 (향후 확장용 - 현재 미사용)
// const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
//   try {
//     const { error } = await supabase
//       .from(tableName)
//       .select(columnName)
//       .limit(1);
//
//     // 컬럼이 존재하지 않으면 42703 에러가 발생
//     return !error || error.code !== '42703';
//   } catch {
//     return false;
//   }
// };

// 📋 동적 쿼리 빌더 (향후 확장용 - 현재 미사용)
// const buildSelectQuery = (baseColumns: string[], optionalColumns: Record<string, string> = {}) => {
//   return async (tableName: string) => {
//     const availableColumns = [...baseColumns];
//
//     // 선택적 컬럼 존재 여부 확인
//     for (const [alias, column] of Object.entries(optionalColumns)) {
//       const exists = await checkColumnExists(tableName, column);
//       if (exists) {
//         availableColumns.push(`${column}:${alias}`);
//       }
//     }
//
//     return availableColumns.join(', ');
//   };
// };

// 🛡️ 안전한 데이터 변환 헬퍼
const safeDataTransform = <T>(data: any, defaultValue: T): T => {
  if (!data) return defaultValue;

  try {
    // 예상치 못한 컬럼이 있어도 안전하게 처리
    return { ...defaultValue, ...data };
  } catch {
    return defaultValue;
  }
};

// === User Profile Management ===
export const createProfile = async (userId: string, email: string, displayName: string): Promise<User> => {
  const tableName = SCHEMA_MAP.tables.users;

  try {
    const { data, error } = await supabase
      .from(tableName)
      .insert({
        [SCHEMA_MAP.columns.user_id]: userId,
        [SCHEMA_MAP.columns.email]: email,
        [SCHEMA_MAP.columns.display_name]: displayName
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, '프로필 생성');

    return safeDataTransform(data, {
      id: userId,
      email,
      display_name: displayName,
      couple_id: null,
      avatar_url: null,
      created_at: new Date().toISOString()
    } as User);
  } catch (error: any) {
    if (error.message?.includes('데이터베이스 구조')) {
      // 스키마 변경 시 대체 방법 시도

      return {
        id: userId,
        email,
        display_name: displayName,
        couple_id: null,
        avatar_url: null,
        created_at: new Date().toISOString()
      } as User;
    }
    throw error;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Pick<User, 'display_name' | 'couple_id'>>): Promise<User> => {
  const tableName = SCHEMA_MAP.tables.users;

  try {
    // 스키마 변경 대응을 위한 안전한 updates 객체 생성
    const safeUpdates: Record<string, any> = {};

    if (updates.display_name !== undefined) {
      safeUpdates[SCHEMA_MAP.columns.display_name] = updates.display_name;
    }
    if (updates.couple_id !== undefined) {
      safeUpdates[SCHEMA_MAP.columns.couple_id] = updates.couple_id;
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(safeUpdates)
      .eq(SCHEMA_MAP.columns.user_id, userId)
      .select()
      .single();

    if (error) handleSupabaseError(error, '프로필 업데이트');

    return safeDataTransform(data, {
      id: userId,
      email: '',
      display_name: updates.display_name || '',
      couple_id: updates.couple_id || null,
      avatar_url: null,
      created_at: new Date().toISOString()
    } as User);
  } catch (error: any) {
    if (error.message?.includes('데이터베이스')) {
      throw new Error('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
    throw error;
  }
};

export const getProfile = async (userId: string): Promise<User | null> => {
  const tableName = SCHEMA_MAP.tables.users;

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(SCHEMA_MAP.columns.user_id, userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error, '프로필 조회');
    }

    return data ? safeDataTransform(data, null) : null;
  } catch (error: any) {

    return null;
  }
};

// === Couple Management ===
export const createCouple = async (coupleName: string = '우리'): Promise<Couple> => {
  const tableName = SCHEMA_MAP.tables.couples;

  try {
    // 현재 로그인한 사용자 가져오기
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('로그인이 필요합니다');
    }

    // 고유한 6자리 커플 코드 생성
    const coupleCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from(tableName)
      .insert({
        [SCHEMA_MAP.columns.couple_code]: coupleCode,
        [SCHEMA_MAP.columns.couple_name]: coupleName,
        [SCHEMA_MAP.columns.partner_1_id]: user.id,
        [SCHEMA_MAP.columns.total_balance]: 0,
        [SCHEMA_MAP.columns.is_active]: true
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, '커플 생성');

    return safeDataTransform(data, {
      id: '',
      couple_code: coupleCode,
      couple_name: coupleName,
      partner_1_id: user.id,
      partner_2_id: null,
      total_balance: 0,
      is_active: true,
      created_at: new Date().toISOString()
    });
  } catch (error: any) {
    if (error.message?.includes('데이터베이스')) {
      throw new Error('커플 생성에 실패했습니다. 다시 시도해주세요.');
    }
    throw error;
  }
};

export const connectCouple = async (userId: string, coupleCode: string): Promise<Couple> => {
  const tableName = SCHEMA_MAP.tables.couples;
  const usersTable = SCHEMA_MAP.tables.users;

  try {
    // 1. 커플 코드 검증
    const { data: couple, error: coupleError } = await supabase
      .from(tableName)
      .select('*')
      .eq(SCHEMA_MAP.columns.couple_code, coupleCode.toUpperCase())
      .single();

    if (coupleError || !couple) {
      throw new Error('유효하지 않은 커플 코드입니다');
    }

    // 2. 커플에 두 번째 파트너로 추가
    const { data: updatedCouple, error: updateCoupleError } = await supabase
      .from(tableName)
      .update({ [SCHEMA_MAP.columns.partner_2_id]: userId })
      .eq(SCHEMA_MAP.columns.id, couple.id)
      .select()
      .single();

    if (updateCoupleError) {
      throw new Error('커플 연결에 실패했습니다');
    }

    // 3. 사용자 프로필에 couple_id 업데이트
    await updateProfile(userId, { couple_id: couple.id });

    return safeDataTransform(updatedCouple, couple);
  } catch (error: any) {
    if (error.message?.includes('데이터베이스')) {
      throw new Error('커플 연결에 실패했습니다. 코드를 확인해주세요.');
    }
    throw error;
  }
};

export const getCouple = async (coupleId: string): Promise<Couple | null> => {
  const tableName = SCHEMA_MAP.tables.couples;

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(SCHEMA_MAP.columns.id, coupleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error, '커플 정보 조회');
    }

    return data ? safeDataTransform(data, null) : null;
  } catch (error: any) {

    return null;
  }
};

export const getCoupleMembers = async (coupleId: string): Promise<User[]> => {
  const tableName = SCHEMA_MAP.tables.users;

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(SCHEMA_MAP.columns.couple_id, coupleId);

    if (error) handleSupabaseError(error, '커플 멤버 조회');

    return (data || []).map(user => safeDataTransform(user, {
      id: '',
      email: '',
      display_name: '',
      couple_id: coupleId,
      avatar_url: null,
      created_at: new Date().toISOString()
    } as User));
  } catch (error: any) {

    return [];
  }
};

// === Rules Management ===
export const addRule = async (rule: Omit<Rule, 'id' | 'created_at'>): Promise<Rule> => {
  const tableName = SCHEMA_MAP.tables.rules;

  try {
    // 스키마 변경 대응을 위한 안전한 insert 객체 생성
    const safeRule: Record<string, any> = {
      [SCHEMA_MAP.columns.couple_id]: rule.couple_id,
      [SCHEMA_MAP.columns.title]: rule.title,
      [SCHEMA_MAP.columns.fine_amount]: rule.fine_amount,
      [SCHEMA_MAP.columns.is_active]: true
    };

    // 선택적 필드 추가
    if (rule.description) safeRule[SCHEMA_MAP.columns.description] = rule.description;
    if (rule.category) safeRule[SCHEMA_MAP.columns.category] = rule.category;
    if (rule.icon_emoji) safeRule[SCHEMA_MAP.columns.icon_emoji] = rule.icon_emoji;
    if (rule.created_by_user_id) safeRule[SCHEMA_MAP.columns.created_by_user_id] = rule.created_by_user_id;

    const { data, error } = await supabase
      .from(tableName)
      .insert(safeRule)
      .select()
      .single();

    if (error) handleSupabaseError(error, '규칙 생성');

    return safeDataTransform(data, {
      id: '',
      couple_id: rule.couple_id,
      title: rule.title,
      description: rule.description || null,
      fine_amount: rule.fine_amount,
      is_active: true,
      category: rule.category || 'general',
      icon_emoji: rule.icon_emoji || '📝',
      created_by_user_id: rule.created_by_user_id || null,
      created_at: new Date().toISOString()
    } as Rule);
  } catch (error: any) {
    if (error.message?.includes('데이터베이스')) {
      throw new Error('규칙 생성에 실패했습니다. 다시 시도해주세요.');
    }
    throw error;
  }
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
  const tableName = SCHEMA_MAP.tables.rules;

  try {
    let query = supabase
      .from(tableName)
      .select('*')
      .eq(SCHEMA_MAP.columns.couple_id, coupleId);

    if (activeOnly) {
      query = query.eq(SCHEMA_MAP.columns.is_active, true);
    }

    const { data, error } = await query.order(SCHEMA_MAP.columns.created_at, { ascending: false });

    if (error) handleSupabaseError(error, '규칙 목록 조회');

    return (data || []).map(rule => safeDataTransform(rule, {
      id: '',
      couple_id: coupleId,
      title: '',
      description: null,
      fine_amount: 1000,
      is_active: true,
      category: 'general',
      icon_emoji: '📝',
      created_by_user_id: null,
      created_at: new Date().toISOString()
    } as Rule));
  } catch (error: any) {

    return [];
  }
};

// === Violations Management ===
export const addViolation = async (violation: Omit<Violation, 'id' | 'created_at'>): Promise<Violation> => {
  const tableName = SCHEMA_MAP.tables.violations;

  try {
    // 스키마 변경 대응을 위한 안전한 insert 객체
    const safeViolation: Record<string, any> = {
      [SCHEMA_MAP.columns.couple_id]: violation.couple_id,
      [SCHEMA_MAP.columns.rule_id]: violation.rule_id,
      [SCHEMA_MAP.columns.violator_user_id]: violation.violator_user_id,
      [SCHEMA_MAP.columns.recorded_by_user_id]: violation.recorded_by_user_id,
      [SCHEMA_MAP.columns.amount]: violation.amount
    };

    // 선택적 필드
    if (violation.memo) safeViolation[SCHEMA_MAP.columns.memo] = violation.memo;
    if (violation.violation_date) safeViolation[SCHEMA_MAP.columns.violation_date] = violation.violation_date;

    const { data, error } = await supabase
      .from(tableName)
      .insert(safeViolation)
      .select()
      .single();

    if (error) handleSupabaseError(error, '벨금 기록 생성');

    return safeDataTransform(data, {
      id: '',
      couple_id: violation.couple_id,
      rule_id: violation.rule_id,
      violator_user_id: violation.violator_user_id,
      recorded_by_user_id: violation.recorded_by_user_id,
      amount: violation.amount,
      memo: violation.memo || null,
      violation_date: violation.violation_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    } as Violation);
  } catch (error: any) {
    if (error.message?.includes('데이터베이스')) {
      throw new Error('벨금 기록에 실패했습니다. 다시 시도해주세요.');
    }
    throw error;
  }
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
  const tableName = SCHEMA_MAP.tables.violations;

  try {
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .eq(SCHEMA_MAP.columns.couple_id, coupleId);

    // 필터 조건 추가
    if (options?.userId) {
      query = query.eq(SCHEMA_MAP.columns.violator_user_id, options.userId);
    }

    if (options?.ruleId) {
      query = query.eq(SCHEMA_MAP.columns.rule_id, options.ruleId);
    }

    // 페이지네이션
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    // 최신순 정렬
    query = query.order(SCHEMA_MAP.columns.created_at, { ascending: false });

    const { data, error, count } = await query;

    if (error) handleSupabaseError(error, '벨금 기록 조회');

    return {
      data: (data || []).map(violation => safeDataTransform(violation, {
        id: '',
        couple_id: coupleId,
        rule_id: '',
        violator_user_id: '',
        recorded_by_user_id: '',
        amount: 0,
        memo: null,
        violation_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      } as Violation)),
      count: count || 0,
      has_more: (data?.length || 0) === (options?.limit || 10)
    };
  } catch (error: any) {

    return {
      data: [],
      count: 0,
      has_more: false
    };
  }
};

export const updateViolation = async (violationId: string, updates: Partial<Pick<Violation, 'amount' | 'memo'>>): Promise<Violation> => {
  const { data, error } = await supabase
    .from('violations')
    .update(updates)
    .eq('id', violationId)
    .select('*, rule:rules(*)')
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
  const tableName = SCHEMA_MAP.tables.rewards;

  try {
    const safeReward: Record<string, any> = {
      [SCHEMA_MAP.columns.couple_id]: reward.couple_id,
      [SCHEMA_MAP.columns.title]: reward.title,
      [SCHEMA_MAP.columns.target_amount]: reward.target_amount,
      [SCHEMA_MAP.columns.is_achieved]: false
    };

    // 선택적 필드
    if (reward.description) safeReward[SCHEMA_MAP.columns.description] = reward.description;
    if (reward.category) safeReward[SCHEMA_MAP.columns.category] = reward.category;
    if (reward.icon_emoji) safeReward[SCHEMA_MAP.columns.icon_emoji] = reward.icon_emoji;
    if (reward.priority) safeReward[SCHEMA_MAP.columns.priority] = reward.priority;
    if (reward.created_by_user_id) safeReward[SCHEMA_MAP.columns.created_by_user_id] = reward.created_by_user_id;

    const { data, error } = await supabase
      .from(tableName)
      .insert(safeReward)
      .select()
      .single();

    if (error) handleSupabaseError(error, '보상 생성');

    return safeDataTransform(data, {
      id: '',
      couple_id: reward.couple_id,
      title: reward.title,
      description: reward.description || null,
      target_amount: reward.target_amount,
      is_achieved: false,
      achieved_at: null,
      achieved_by_user_id: null,
      category: reward.category || 'date',
      icon_emoji: reward.icon_emoji || '🎁',
      priority: reward.priority || 0,
      created_by_user_id: reward.created_by_user_id || null,
      created_at: new Date().toISOString()
    } as Reward);
  } catch (error: any) {
    if (error.message?.includes('데이터베이스')) {
      throw new Error('보상 생성에 실패했습니다. 다시 시도해주세요.');
    }
    throw error;
  }
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
    .update({ is_achieved: true })
    .eq('id', rewardId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
};

export const getRewards = async (coupleId: string, includesAchieved: boolean = true): Promise<Reward[]> => {
  const tableName = SCHEMA_MAP.tables.rewards;

  try {
    let query = supabase
      .from(tableName)
      .select('*')
      .eq(SCHEMA_MAP.columns.couple_id, coupleId);

    if (!includesAchieved) {
      query = query.eq(SCHEMA_MAP.columns.is_achieved, false);
    }

    const { data, error } = await query.order(SCHEMA_MAP.columns.created_at, { ascending: false });

    if (error) handleSupabaseError(error, '보상 목록 조회');

    return (data || []).map(reward => safeDataTransform(reward, {
      id: '',
      couple_id: coupleId,
      title: '',
      description: null,
      target_amount: 0,
      is_achieved: false,
      achieved_at: null,
      achieved_by_user_id: null,
      category: 'date',
      icon_emoji: '🎁',
      priority: 0,
      created_by_user_id: null,
      created_at: new Date().toISOString()
    } as Reward));
  } catch (error: any) {

    return [];
  }
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
  // 🛡️ 스키마 변경에 강건한 대시보드 통계
  try {
    const rulesTable = SCHEMA_MAP.tables.rules;
    const violationsTable = SCHEMA_MAP.tables.violations;
    const rewardsTable = SCHEMA_MAP.tables.rewards;

    // 1. 활성 규칙 수 (안전한 카운팅)
    let activeRulesCount = 0;
    try {
      const { count } = await supabase
        .from(rulesTable)
        .select('*', { count: 'exact', head: true })
        .eq(SCHEMA_MAP.columns.couple_id, coupleId)
        .eq(SCHEMA_MAP.columns.is_active, true);
      activeRulesCount = count || 0;
    } catch (error: any) {

    }

    // 2. 이번 달 위반 수와 총 잔고 (안전한 계산)
    let thisMonthCount = 0;
    let totalBalance = 0;

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // 이번 달 위반 수 - amount 기준으로 계산
      const { data: thisMonthViolationsData } = await supabase
        .from(violationsTable)
        .select(SCHEMA_MAP.columns.amount)
        .eq(SCHEMA_MAP.columns.couple_id, coupleId)
        .gte(SCHEMA_MAP.columns.created_at, startOfMonth.toISOString());

      // amount 값에 따라 위반 수 계산: 양수는 증가, 음수는 감소 (최소값 0 보장)
      thisMonthCount = (thisMonthViolationsData || []).reduce((count, violation) => {
        const amount = violation[SCHEMA_MAP.columns.amount] || 0;
        if (amount > 0) {
          return count + 1; // 위반 추가
        } else if (amount < 0) {
          return Math.max(0, count - 1); // 위반 감소 (0 미만 방지)
        }
        return count; // amount가 0인 경우 변화 없음
      }, 0);

      // 총 잔고 계산 (벌금의 경우 amount가 양수이면 추가, 음수이면 차감)
      const { data: allViolationsData } = await supabase
        .from(violationsTable)
        .select(SCHEMA_MAP.columns.amount)
        .eq(SCHEMA_MAP.columns.couple_id, coupleId);

      totalBalance = (allViolationsData || []).reduce((sum, violation) => {
        const amount = violation[SCHEMA_MAP.columns.amount] || 0;
        return sum + amount; // amount 값에 따라 자동으로 추가/차감
      }, 0);
    } catch (error: any) {

    }

    // 3. 사용 가능한 보상 수
    let availableRewardsCount = 0;
    try {
      const { count } = await supabase
        .from(rewardsTable)
        .select('*', { count: 'exact', head: true })
        .eq(SCHEMA_MAP.columns.couple_id, coupleId)
        .eq(SCHEMA_MAP.columns.is_achieved, false);
      availableRewardsCount = count || 0;
    } catch (error: any) {

    }

    // 4. 최근 활동 (최근 5개) - 실패해도 빈 배열 반환
    let recentActivity: Violation[] = [];
    try {
      const violationsResponse = await getViolations(coupleId, { limit: 5 });
      recentActivity = violationsResponse.data;
    } catch (error: any) {

    }

    return {
      totalBalance: Math.max(0, totalBalance), // 음수 방지
      activeRules: activeRulesCount,
      thisMonthViolations: thisMonthCount,
      availableRewards: availableRewardsCount,
      recentActivity
    };

  } catch (error) {
    console.error('Dashboard stats 전체 오류:', error);
    // 스키마 변경이나 다른 오류시 기본값 반환
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
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    return await getProfile(user.id);
  } catch (error: any) {

    return null;
  }
};

export const signInWithOTP = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) handleSupabaseError(error, '로그인');
  } catch (error: any) {
    if (error.message?.includes('데이터베이스')) {
      throw new Error('로그인 서비스에 연결할 수 없습니다. 다시 시도해주세요.');
    }
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) handleSupabaseError(error, '로그아웃');
  } catch (error: any) {
    // 로그아웃은 실패해도 사용자에게 심각한 문제가 아님

  }
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