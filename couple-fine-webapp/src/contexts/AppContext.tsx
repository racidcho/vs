import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Couple, Rule, Violation, Reward } from '../types';
import { supabase } from '../lib/supabase';
import { updateViolation as updateViolationApi, deleteViolation as deleteViolationApi } from '../lib/supabaseApi';
import { useAuth } from './AuthContext';

// Action Types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_COUPLE'; payload: Couple | null }
  | { type: 'SET_RULES'; payload: Rule[] }
  | { type: 'ADD_RULE'; payload: Rule }
  | { type: 'UPDATE_RULE'; payload: Rule }
  | { type: 'DELETE_RULE'; payload: string }
  | { type: 'SET_VIOLATIONS'; payload: Violation[] }
  | { type: 'ADD_VIOLATION'; payload: Violation }
  | { type: 'UPDATE_VIOLATION'; payload: Violation }
  | { type: 'DELETE_VIOLATION'; payload: string }
  | { type: 'SET_REWARDS'; payload: Reward[] }
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'UPDATE_REWARD'; payload: Reward }
  | { type: 'DELETE_REWARD'; payload: string }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial State - empty by default (NO MOCK DATA)
const initialState: AppState = {
  user: null,
  couple: null,
  rules: [],
  violations: [],
  rewards: [],
  isOnline: true
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_COUPLE':
      return {
        ...state,
        couple: action.payload
      };
    case 'SET_RULES':
      return { ...state, rules: action.payload };
    case 'ADD_RULE':
      // Check if rule already exists to avoid duplicates
      if (state.rules.some(rule => rule.id === action.payload.id)) {
        return state;
      }
      return { ...state, rules: [...state.rules, action.payload] };
    case 'UPDATE_RULE':
      return {
        ...state,
        rules: state.rules.map(rule =>
          rule.id === action.payload.id ? action.payload : rule
        )
      };
    case 'DELETE_RULE':
      return {
        ...state,
        rules: state.rules.filter(rule => rule.id !== action.payload)
      };
    case 'SET_VIOLATIONS':
      return { ...state, violations: action.payload };
    case 'ADD_VIOLATION':
      // Check if violation already exists to avoid duplicates
      if (state.violations.some(violation => violation.id === action.payload.id)) {
        return state;
      }
      return { ...state, violations: [action.payload, ...state.violations] };
    case 'UPDATE_VIOLATION':
      return {
        ...state,
        violations: state.violations.map(violation =>
          violation.id === action.payload.id ? action.payload : violation
        )
      };
    case 'DELETE_VIOLATION':
      return {
        ...state,
        violations: state.violations.filter(violation => violation.id !== action.payload)
      };
    case 'SET_REWARDS':
      return { ...state, rewards: action.payload };
    case 'ADD_REWARD':
      // Check if reward already exists to avoid duplicates
      if (state.rewards.some(reward => reward.id === action.payload.id)) {
        return state;
      }
      return { ...state, rewards: [...state.rewards, action.payload] };
    case 'UPDATE_REWARD':
      return {
        ...state,
        rewards: state.rewards.map(reward =>
          reward.id === action.payload.id ? action.payload : reward
        )
      };
    case 'DELETE_REWARD':
      return {
        ...state,
        rewards: state.rewards.filter(reward => reward.id !== action.payload)
      };
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    case 'RESET_STATE':
      return { ...initialState, user: state.user };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Data loading functions
  loadCoupleData: () => Promise<void>;
  refreshData: () => Promise<void>;
  // Couple management
  createCouple: (coupleName?: string) => Promise<{ code: string; isNewCouple?: boolean } | { error: string }>;
  updateCoupleName: (name: string) => Promise<{ error?: string }>;
  joinCouple: (code: string) => Promise<{ error?: string; success?: boolean }>;
  leaveCouple: () => Promise<{ error?: string; success?: boolean }>;
  getPartnerInfo: () => Promise<{ partner: any; error?: string } | null>;
  // Rule management
  createRule: (rule: Omit<Rule, 'id' | 'couple_id' | 'created_at'>) => Promise<{ error?: string }>;
  updateRule: (id: string, updates: Partial<Rule>) => Promise<{ error?: string }>;
  deleteRule: (id: string) => Promise<{ error?: string }>;
  // Violation management
  createViolation: (violation: Omit<Violation, 'id' | 'created_at'>) => Promise<{ error?: string }>;
  updateViolation: (id: string, updates: Partial<Pick<Violation, 'amount' | 'memo'>>) => Promise<{ error?: string }>;
  deleteViolation: (id: string) => Promise<{ error?: string }>;
  // Reward management
  createReward: (reward: Omit<Reward, 'id' | 'couple_id' | 'created_at'>) => Promise<{ error?: string }>;
  claimReward: (id: string) => Promise<{ error?: string }>;
  deleteReward: (id: string) => Promise<{ error?: string }>;
  // Utility functions
  getUserTotalFines: (userId: string) => number;
  getRewardProgress: (targetAmount: number) => number;
  isRealtimeConnected: boolean;
  validateData: () => Promise<{ isValid: boolean; errors: string[] }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, isLoading, refreshUser } = useAuth();

  // Realtime connection status (will be managed directly in this component)
  const isRealtimeConnected = true; // Placeholder for now

  // Load couple data when user changes with abort signal support
  const loadCoupleData = async (abortSignal?: AbortSignal) => {

    if (!user?.couple_id) {

      dispatch({ type: 'RESET_STATE' });
      return;
    }

    // 5초 타임아웃 설정
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('데이터 로딩 시간 초과')), 5000);
    });

    try {

      // Check abort signal before making API call
      if (abortSignal?.aborted) {

        return;
      }

      // Load couple info with partner details (with timeout)
      const { data: coupleData, error: coupleError } = await Promise.race([
        supabase
          .from('couples')
          .select(`
            *,
            partner_1:profiles!couples_partner_1_id_fkey(*),
            partner_2:profiles!couples_partner_2_id_fkey(*)
          `)
          .eq('id', user.couple_id)
          .single(),
        timeoutPromise
      ]).catch(err => ({ data: null, error: err })) as any;

      if (coupleError) {

        return;
      }

      if (coupleData) {

        // Transform the data to match existing Couple interface
        const transformedCouple = {
          id: coupleData.id,
          code: coupleData.couple_code,
          created_at: coupleData.created_at,
          // Additional fields for internal use
          couple_name: coupleData.couple_name,
          total_balance: coupleData.total_balance,
          partner_1: coupleData.partner_1,
          partner_2: coupleData.partner_2
        };

        dispatch({ type: 'SET_COUPLE', payload: transformedCouple as any });

      }

      // Load rules (with timeout)
      const { data: rulesData, error: rulesError } = await Promise.race([
        supabase
          .from('rules')
          .select('*')
          .eq('couple_id', user.couple_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        timeoutPromise
      ]).catch(err => ({ data: null, error: err })) as any;

      if (rulesError) {

      } else {

        dispatch({ type: 'SET_RULES', payload: rulesData || [] });

      }

      // Load violations with relations
      const { data: violationsData, error: violationsError } = await supabase
        .from('violations')
        .select(`
          *,
          rule:rules(*),
          violator:profiles!violations_violator_user_id_fkey(*),
          recorded_by:profiles!violations_recorded_by_user_id_fkey(*)
        `)
        .eq('couple_id', user.couple_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (violationsError) {

      } else {

        dispatch({ type: 'SET_VIOLATIONS', payload: violationsData as any || [] });

      }

      // Load rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('couple_id', user.couple_id)
        .order('created_at', { ascending: false });

      if (rewardsError) {

      } else {

        dispatch({ type: 'SET_REWARDS', payload: rewardsData || [] });

      }

    } catch (error) {

    }
  };

  // Refresh all data with abort signal support
  const refreshData = async (abortSignal?: AbortSignal) => {

    try {
      await loadCoupleData(abortSignal);

    } catch (error) {
      if (abortSignal?.aborted) {

      } else {
        console.error('💥 APPCONTEXT: refreshData 오류:', error);
      }
    }
  };

  // Create new couple
  const createCouple = async (coupleName = '우리') => {
    if (!user) return { error: 'User not found' };

    // Check if user already has a couple
    if (user.couple_id) {
      return { error: '이미 커플이 연결되어 있어요. 먼저 기존 커플 연결을 해제해주세요 💔' };
    }

    try {
      // Generate unique couple code using DB function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_couple_code');

      if (codeError || !codeData) {
        return { error: 'Failed to generate couple code' };
      }

      // Create couple record
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .insert({
          couple_code: codeData,
          partner_1_id: user.id,
          couple_name: coupleName,
          total_balance: 0,
          is_active: true
        })
        .select()
        .single();

      if (coupleError) return { error: coupleError.message };

      // Update user profile with couple_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ couple_id: coupleData.id })
        .eq('id', user.id);

      if (profileError) return { error: profileError.message };

      // Create default rules and rewards ONLY for new couples
      // Check if rules/rewards already exist first
      const { data: existingRules } = await supabase
        .from('rules')
        .select('id')
        .eq('couple_id', coupleData.id)
        .limit(1);

      const { data: existingRewards } = await supabase
        .from('rewards')
        .select('id')
        .eq('couple_id', coupleData.id)
        .limit(1);

      // Only create defaults if none exist
      if (!existingRules || existingRules.length === 0) {

        await supabase.rpc('create_default_rules', {
          p_couple_id: coupleData.id,
          p_user_id: user.id
        });
      }

      if (!existingRewards || existingRewards.length === 0) {

        await supabase.rpc('create_default_rewards', {
          p_couple_id: coupleData.id,
          p_user_id: user.id
        });
      }

      return { code: coupleData.couple_code, isNewCouple: true };
    } catch (error) {
      console.error('Create couple error:', error);
      return { error: 'Failed to create couple' };
    }
  };

  // Join existing couple
  const joinCouple = async (code: string) => {
    if (!user) return { error: 'User not found' };

    // Check if user already has a couple
    if (user.couple_id) {
      return { error: 'You are already part of a couple. Please leave your current couple first.' };
    }

    try {
      // Find couple by code
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('couple_code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupleError || !coupleData) {
        return { error: '유효하지 않은 커플 코드이거나 커플을 찾을 수 없어요 😢' };
      }

      // Check if couple already has both partners
      if (coupleData.partner_1_id && coupleData.partner_2_id) {
        return { error: '이 커플은 이미 두 명이 연결되어 있어요 👫' };
      }

      // Check if user is not already the first partner
      if (coupleData.partner_1_id === user.id) {
        return { error: '자신이 만든 커플에는 참여할 수 없어요 😅' };
      }

      // Update couple with second partner
      const { error: updateCoupleError } = await supabase
        .from('couples')
        .update({ partner_2_id: user.id })
        .eq('id', coupleData.id);

      if (updateCoupleError) {
        return { error: updateCoupleError.message };
      }

      // Update user profile with couple_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ couple_id: coupleData.id })
        .eq('id', user.id);

      if (profileError) {
        return { error: profileError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Join couple error:', error);
      return { error: 'Failed to join couple' };
    }
  };

  // Leave couple (disconnect)
  const leaveCouple = async () => {

    if (!user?.couple_id) {

      return { error: 'No couple to leave' };
    }

    // Create timeout protection (15 seconds maximum)
    const timeoutPromise = new Promise<{ error: string }>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Operation timed out after 15 seconds'));
      }, 15000);
    });

    try {

      // Wrap the main operation in Promise.race with timeout
      const mainOperation = async () => {
        // Get couple data to determine which partner is leaving
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('id', user.couple_id)
          .single();

        if (coupleError || !coupleData) {

          return { error: 'Couple not found' };
        }

        // If this user is partner_1 and there's a partner_2, make partner_2 the new partner_1
        if (coupleData.partner_1_id === user.id && coupleData.partner_2_id) {

          const { error: updateError } = await supabase
            .from('couples')
            .update({
              partner_1_id: coupleData.partner_2_id,
              partner_2_id: null
            })
            .eq('id', user.couple_id);

          if (updateError) {

            return { error: updateError.message };
          }
        }
        // If this user is partner_2, just remove them
        else if (coupleData.partner_2_id === user.id) {

          const { error: updateError } = await supabase
            .from('couples')
            .update({ partner_2_id: null })
            .eq('id', user.couple_id);

          if (updateError) {

            return { error: updateError.message };
          }
        }
        // If this user is the only partner, deactivate the couple
        else {

          const { error: updateError } = await supabase
            .from('couples')
            .update({ is_active: false })
            .eq('id', user.couple_id);

          if (updateError) {

            return { error: updateError.message };
          }
        }

        // Remove couple_id from user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ couple_id: null })
          .eq('id', user.id);

        if (profileError) {

          return { error: profileError.message };
        }

        // Reset local state first
        dispatch({ type: 'RESET_STATE' });

        // Force refresh AuthContext user data to sync couple_id change
        if (refreshUser) {
          try {
            await refreshUser();

          } catch (refreshError) {
            console.error('⚠️ APPCONTEXT: 사용자 정보 새로고침 실패 (비차단):', refreshError);
            // Don't fail the entire operation if refresh fails
          }
        }

        return { success: true };
      };

      // Race between main operation and timeout
      return await Promise.race([mainOperation(), timeoutPromise]);

    } catch (error) {
      console.error('💥 APPCONTEXT: leaveCouple 예외:', error);

      // Handle timeout specifically
      if (error instanceof Error && error.message.includes('timed out')) {
        return { error: '연결 해제 요청이 시간 초과되었어요. 다시 시도해주세요.' };
      }

      // Handle network errors
      if (error instanceof Error && error.message.includes('network')) {
        return { error: '네트워크 오류로 연결 해제에 실패했어요. 인터넷 연결을 확인해주세요.' };
      }

      // Generic error
      return { error: '연결 해제 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' };
    }
  };

  // Get partner information
  const getPartnerInfo = async (): Promise<{ partner: any; error?: string } | null> => {
    if (!user?.couple_id) return null;

    try {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select(`
          *,
          partner_1:profiles!couples_partner_1_id_fkey(*),
          partner_2:profiles!couples_partner_2_id_fkey(*)
        `)
        .eq('id', user.couple_id)
        .single();

      if (coupleError || !coupleData) {
        return { partner: null, error: 'Couple not found' };
      }

      // Return the partner (the one who is not the current user)
      const partner = coupleData.partner_1_id === user.id
        ? coupleData.partner_2
        : coupleData.partner_1;

      return { partner };
    } catch (error) {
      console.error('Get partner info error:', error);
      return { partner: null, error: 'Failed to get partner info' };
    }
  };

  // Update couple name
  const updateCoupleName = async (name: string) => {
    if (!user?.couple_id) return { error: 'No couple found' };

    try {
      const { error } = await supabase
        .from('couples')
        .update({ couple_name: name.trim() })
        .eq('id', user.couple_id);

      if (error) return { error: error.message };

      // Update local state
      if (state.couple) {
        dispatch({
          type: 'SET_COUPLE',
          payload: { ...state.couple, couple_name: name.trim() } as any
        });
      }

      return {};
    } catch (error) {
      return { error: 'Failed to update couple name' };
    }
  };

  // Create rule
  const createRule = async (rule: Omit<Rule, 'id' | 'couple_id' | 'created_at'>) => {

    if (!user?.couple_id) {

      return { error: 'No couple found' };
    }

    try {

      const { error, data } = await supabase
        .from('rules')
        .insert({
          ...rule,
          couple_id: user.couple_id,
          created_by_user_id: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {

        return { error: error.message };
      }

      // **중요**: 성공 시 로컬 상태 즉시 업데이트
      if (data) {
        dispatch({ type: 'ADD_RULE', payload: data });
      }

      return {};
    } catch (error) {

      return { error: error instanceof Error ? error.message : 'Failed to create rule' };
    }
  };

  // Update rule
  const updateRule = async (id: string, updates: Partial<Rule>) => {

    try {
      const { error, data } = await supabase
        .from('rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {

        return { error: error.message };
      }

      // **중요**: 성공 시 로컬 상태 즉시 업데이트
      if (data) {
        dispatch({ type: 'UPDATE_RULE', payload: data as Rule });
      }

      return {};
    } catch (error) {

      return { error: error instanceof Error ? error.message : 'Failed to update rule' };
    }
  };

  // Delete rule
  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rules')
        .update({ is_active: false })
        .eq('id', id);

      if (error) return { error: error.message };

      // **CRITICAL FIX**: Immediately remove the rule from local state
      dispatch({ type: 'DELETE_RULE', payload: id });

      return {};
    } catch (error) {
      return { error: 'Failed to delete rule' };
    }
  };

  // Create violation
  const createViolation = async (violation: Omit<Violation, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('violations')
        .insert(violation)
        .select()
        .single();

      if (error) return { error: error.message };

      return {};
    } catch (error) {
      return { error: 'Failed to create violation' };
    }
  };

  // Update violation
  const updateViolation = async (id: string, updates: Partial<Pick<Violation, 'amount' | 'memo'>>) => {
    try {
      const updatedViolation = await updateViolationApi(id, updates);
      dispatch({ type: 'UPDATE_VIOLATION', payload: updatedViolation });
      return {};
    } catch (error) {
      console.error('Failed to update violation:', error);
      return { error: error instanceof Error ? error.message : 'Failed to update violation' };
    }
  };

  // Delete violation
  const deleteViolation = async (id: string) => {
    try {
      await deleteViolationApi(id);
      dispatch({ type: 'DELETE_VIOLATION', payload: id });
      return {};
    } catch (error) {
      console.error('Failed to delete violation:', error);
      return { error: error instanceof Error ? error.message : 'Failed to delete violation' };
    }
  };

  // Create reward
  const createReward = async (reward: Omit<Reward, 'id' | 'couple_id' | 'created_at'>) => {

    if (!user?.couple_id) {

      return { error: 'No couple found' };
    }

    try {

      const { error, data } = await supabase
        .from('rewards')
        .insert({
          ...reward,
          couple_id: user.couple_id,
          created_by_user_id: user.id,
          is_achieved: false
        })
        .select()
        .single();

      if (error) {

        return { error: error.message };
      }

      // **중요**: 성공 시 로컬 상태 즉시 업데이트
      if (data) {
        dispatch({ type: 'ADD_REWARD', payload: data as Reward });
      }

      return {};
    } catch (error) {

      return { error: error instanceof Error ? error.message : 'Failed to create reward' };
    }
  };

  // Claim reward
  const claimReward = async (id: string) => {
    try {

      const { error, data } = await supabase
        .from('rewards')
        .update({ is_achieved: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {

        return { error: error.message };
      }

      // **중요**: 성공 시 로컬 상태 즉시 업데이트
      if (data) {
        dispatch({ type: 'UPDATE_REWARD', payload: data as Reward });
      }

      return {};
    } catch (error) {

      return { error: 'Failed to claim reward' };
    }
  };

  // Delete reward
  const deleteReward = async (id: string) => {
    try {

      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);

      if (error) {

        return { error: error.message };
      }

      // **중요**: 성공 시 로컬 상태 즉시 업데이트
      dispatch({ type: 'DELETE_REWARD', payload: id });

      return {};
    } catch (error) {

      return { error: 'Failed to delete reward' };
    }
  };

  // Calculate user total fines
  const getUserTotalFines = (userId: string): number => {
    return state.violations
      .filter(v => v.violator_user_id === userId)
      .reduce((total, violation) => {
        return violation.amount > 0
          ? total + violation.amount
          : total - violation.amount;
      }, 0);
  };

  // Get reward progress (total fines / target amount)
  const getRewardProgress = (targetAmount: number): number => {
    if (!user) return 0;
    const totalFines = getUserTotalFines(user.id);
    return Math.min((totalFines / targetAmount) * 100, 100);
  };

  // Validate data integrity
  const validateData = async (): Promise<{ isValid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    if (!user?.couple_id) {
      errors.push('사용자 커플 정보가 없습니다.');
      return { isValid: false, errors };
    }

    try {
      // Validate couple data
      if (state.couple) {
        const { data: dbCouple, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('id', user.couple_id)
          .single();

        if (coupleError || !dbCouple) {
          errors.push('커플 데이터를 서버에서 찾을 수 없습니다.');
        } else {
          // Check if local data matches server data
          if ((state.couple as any).couple_code !== dbCouple.couple_code) {
            errors.push('커플 코드가 서버와 일치하지 않습니다.');
          }

          if ((state.couple as any)?.total_balance !== dbCouple.total_balance) {
            errors.push('벌금 총액이 서버와 일치하지 않습니다.');
          }
        }
      }

      // Validate violations total against couple balance
      const calculatedTotal = state.violations
        .filter(v => v.rule?.couple_id === user.couple_id)
        .reduce((total, violation) => total + violation.amount, 0);

      const coupleBalance = (state.couple as any)?.total_balance || 0;
      if (Math.abs(calculatedTotal - coupleBalance) > 0.01) {
        errors.push(`계산된 벌금 총액(${calculatedTotal})이 커플 잔액(${coupleBalance})과 일치하지 않습니다.`);
      }

      // Validate active rules
      const inactiveRules = state.rules.filter(rule => !rule.is_active);
      if (inactiveRules.length > 0) {
        errors.push(`${inactiveRules.length}개의 비활성 규칙이 활성 목록에 포함되어 있습니다.`);
      }

      // Check for duplicate violations
      const violationIds = state.violations.map(v => v.id);
      const uniqueIds = new Set(violationIds);
      if (violationIds.length !== uniqueIds.size) {
        errors.push('중복된 위반 기록이 감지되었습니다.');
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      console.error('Data validation error:', error);
      errors.push('데이터 검증 중 오류가 발생했습니다.');
      return { isValid: false, errors };
    }
  };

  // Load data when user changes
  useEffect(() => {

    if (user && !isLoading) {

      if (user.couple_id) {

        loadCoupleData();
      } else {

        dispatch({ type: 'RESET_STATE' });
      }
    } else {

    }
  }, [user, isLoading]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.couple_id) {

      return;
    }

    // Subscribe to couples changes
    const coupleChannel = supabase
      .channel(`couple-${user.couple_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${user.couple_id}`
        },
        (payload) => {

          if (payload.eventType === 'UPDATE' && payload.new) {
            const transformedCouple = {
              id: payload.new.id,
              couple_code: payload.new.couple_code,
              created_at: payload.new.created_at,
              couple_name: payload.new.couple_name,
              total_balance: payload.new.total_balance,
            };
            dispatch({ type: 'SET_COUPLE', payload: transformedCouple as any });
          }
        }
      )
      .subscribe();

    // Subscribe to rules changes
    const rulesChannel = supabase
      .channel(`rules-${user.couple_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rules',
          filter: `couple_id=eq.${user.couple_id}`
        },
        (payload) => {

          // **무한 재실행 방지**: refreshData 대신 직접 상태 업데이트
          if (payload.eventType === 'INSERT' && payload.new) {
            dispatch({ type: 'ADD_RULE', payload: payload.new as Rule });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // **CRITICAL FIX**: Handle rule deactivation (is_active = false) as deletion
            if (payload.new.is_active === false) {
              dispatch({ type: 'DELETE_RULE', payload: payload.new.id });
            } else {
              dispatch({ type: 'UPDATE_RULE', payload: payload.new as Rule });
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            dispatch({ type: 'DELETE_RULE', payload: payload.old.id });
          }
        }
      )
      .subscribe();

    // Subscribe to violations changes
    const violationsChannel = supabase
      .channel(`violations-${user.couple_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'violations',
          filter: `couple_id=eq.${user.couple_id}`
        },
        (payload) => {

          // For violations, we still need to reload due to complex relations
          // But with throttling to prevent excessive calls and avoid memory leaks
          setTimeout(() => {
            try {
              refreshData();
            } catch (error) {

            }
          }, 1000);
        }
      )
      .subscribe();

    // Subscribe to rewards changes
    const rewardsChannel = supabase
      .channel(`rewards-${user.couple_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rewards',
          filter: `couple_id=eq.${user.couple_id}`
        },
        (payload) => {

          // **무한 재실행 방지**: 직접 상태 업데이트
          if (payload.eventType === 'INSERT' && payload.new) {

            dispatch({ type: 'ADD_REWARD', payload: payload.new as Reward });
          } else if (payload.eventType === 'UPDATE' && payload.new) {

            dispatch({ type: 'UPDATE_REWARD', payload: payload.new as Reward });
          } else if (payload.eventType === 'DELETE' && payload.old) {

            dispatch({ type: 'DELETE_REWARD', payload: payload.old.id });
          }
        }
      )
      .subscribe();

    return () => {

      supabase.removeChannel(coupleChannel);
      supabase.removeChannel(rulesChannel);
      supabase.removeChannel(violationsChannel);
      supabase.removeChannel(rewardsChannel);
    };
  }, [user?.couple_id]); // **중요**: refreshData 의존성 제거로 무한 재실행 방지

  // Online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: navigator.onLine });
    };

    // Set initial status
    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const value: AppContextType = {
    state: { ...state, user },
    dispatch,
    // Data loading functions
    loadCoupleData,
    refreshData,
    // Couple management
    createCouple,
    joinCouple,
    leaveCouple,
    updateCoupleName,
    getPartnerInfo,
    // Rule management
    createRule,
    updateRule,
    deleteRule,
    // Violation management
    createViolation,
    updateViolation,
    deleteViolation,
    // Reward management
    createReward,
    claimReward,
    deleteReward,
    // Utility functions
    getUserTotalFines,
    getRewardProgress,
    validateData,
    isRealtimeConnected: isRealtimeConnected || false
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};