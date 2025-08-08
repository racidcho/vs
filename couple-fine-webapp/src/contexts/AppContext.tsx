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
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial State - empty by default (NO MOCK DATA)
const initialState: AppState = {
  user: null,
  couple: null,
  rules: [],
  violations: [],
  rewards: [],
  theme: 'light',
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
    case 'SET_THEME':
      return { ...state, theme: action.payload };
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
  updateCoupleTheme: (theme: 'light' | 'dark') => Promise<void>;
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

  // Initialize theme from localStorage on app start
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null;
    if (savedTheme && savedTheme !== state.theme) {
      dispatch({ type: 'SET_THEME', payload: savedTheme });
    }
  }, []);

  // Load couple data when user changes
  const loadCoupleData = async () => {
    console.log('🔄 APPCONTEXT: loadCoupleData 시작');
    console.log('👤 APPCONTEXT: 현재 사용자 정보:', {
      id: user?.id,
      email: user?.email,
      display_name: user?.display_name,
      couple_id: user?.couple_id,
      created_at: user?.created_at
    });

    if (!user?.couple_id) {
      console.log('❌ APPCONTEXT: 사용자에게 커플 ID가 없음 - 상태 리셋');
      dispatch({ type: 'RESET_STATE' });
      return;
    }

    console.log('🏁 APPCONTEXT: 커플 데이터 로드 시작, 커플 ID:', user.couple_id);

    try {
      console.log('📊 APPCONTEXT: 커플 정보 쿼리 시작...');

      // Load couple info with partner details
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select(`
          *,
          partner_1:profiles!couples_partner_1_id_fkey(*),
          partner_2:profiles!couples_partner_2_id_fkey(*)
        `)
        .eq('id', user.couple_id)
        .single();

      console.log('💑 APPCONTEXT: 커플 데이터 쿼리 결과:', {
        data: coupleData,
        error: coupleError
      });

      if (coupleError) {
        console.log('❌ APPCONTEXT: 커플 데이터 로드 실패:', coupleError);
        return;
      }

      if (coupleData) {
        console.log('📝 APPCONTEXT: 커플 데이터 변환 중...');
        console.log('🔍 APPCONTEXT: 원본 커플 데이터:', coupleData);
        
        // Transform the data to match existing Couple interface
        const transformedCouple = {
          id: coupleData.id,
          code: coupleData.couple_code,
          theme: 'light', // Default theme, you might want to add this to DB
          created_at: coupleData.created_at,
          // Additional fields for internal use
          couple_name: coupleData.couple_name,
          total_balance: coupleData.total_balance,
          partner_1: coupleData.partner_1,
          partner_2: coupleData.partner_2
        };
        
        console.log('✅ APPCONTEXT: 변환된 커플 데이터:', transformedCouple);
        console.log('📦 APPCONTEXT: 커플 상태 업데이트 중...');
        dispatch({ type: 'SET_COUPLE', payload: transformedCouple as any });
        console.log('✅ APPCONTEXT: 커플 상태 업데이트 완료');
      }

      console.log('📋 APPCONTEXT: 규칙 데이터 로드 시작...');

      // Load rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('rules')
        .select('*')
        .eq('couple_id', user.couple_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('📋 APPCONTEXT: 규칙 데이터 쿼리 결과:', {
        count: rulesData?.length || 0,
        data: rulesData,
        error: rulesError
      });

      if (rulesError) {
        console.log('❌ APPCONTEXT: 규칙 데이터 로드 실패:', rulesError);
      } else {
        console.log('✅ APPCONTEXT: 규칙 상태 업데이트 중...');
        dispatch({ type: 'SET_RULES', payload: rulesData || [] });
        console.log('✅ APPCONTEXT: 규칙 상태 업데이트 완료');
      }

      console.log('⚠️ APPCONTEXT: 위반 기록 데이터 로드 시작...');

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

      console.log('⚠️ APPCONTEXT: 위반 기록 쿼리 결과:', {
        count: violationsData?.length || 0,
        data: violationsData,
        error: violationsError
      });

      if (violationsError) {
        console.log('❌ APPCONTEXT: 위반 기록 로드 실패:', violationsError);
      } else {
        console.log('✅ APPCONTEXT: 위반 기록 상태 업데이트 중...');
        dispatch({ type: 'SET_VIOLATIONS', payload: violationsData as any || [] });
        console.log('✅ APPCONTEXT: 위반 기록 상태 업데이트 완료');
      }

      console.log('🎁 APPCONTEXT: 보상 데이터 로드 시작...');

      // Load rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('couple_id', user.couple_id)
        .order('created_at', { ascending: false });

      console.log('🎁 APPCONTEXT: 보상 데이터 쿼리 결과:', {
        count: rewardsData?.length || 0,
        data: rewardsData,
        error: rewardsError
      });

      if (rewardsError) {
        console.log('❌ APPCONTEXT: 보상 데이터 로드 실패:', rewardsError);
      } else {
        console.log('✅ APPCONTEXT: 보상 상태 업데이트 중...');
        dispatch({ type: 'SET_REWARDS', payload: rewardsData || [] });
        console.log('✅ APPCONTEXT: 보상 상태 업데이트 완료');
      }

      console.log('🎉 APPCONTEXT: loadCoupleData 완료');
    } catch (error) {
      console.log('💥 APPCONTEXT: loadCoupleData 예외 발생:', error);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    console.log('🔄 APPCONTEXT: refreshData 호출 - 모든 데이터 새로고침');
    await loadCoupleData();
    console.log('✅ APPCONTEXT: refreshData 완료');
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

      // Create default rules and rewards using DB functions
      await supabase.rpc('create_default_rules', {
        p_couple_id: coupleData.id,
        p_user_id: user.id
      });
      
      await supabase.rpc('create_default_rewards', {
        p_couple_id: coupleData.id,
        p_user_id: user.id
      });

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
    console.log('🔄 APPCONTEXT: leaveCouple 시작');
    
    if (!user?.couple_id) {
      console.log('❌ APPCONTEXT: 커플 ID 없음');
      return { error: 'No couple to leave' };
    }

    try {
      console.log('📊 APPCONTEXT: 커플 데이터 조회 중...');
      
      // Get couple data to determine which partner is leaving
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('id', user.couple_id)
        .single();

      if (coupleError || !coupleData) {
        console.log('❌ APPCONTEXT: 커플 데이터 조회 실패:', coupleError);
        return { error: 'Couple not found' };
      }

      console.log('📝 APPCONTEXT: 커플 데이터 업데이트 중...');

      // If this user is partner_1 and there's a partner_2, make partner_2 the new partner_1
      if (coupleData.partner_1_id === user.id && coupleData.partner_2_id) {
        console.log('👥 APPCONTEXT: partner_1이 떠남, partner_2를 partner_1로 변경');
        const { error: updateError } = await supabase
          .from('couples')
          .update({
            partner_1_id: coupleData.partner_2_id,
            partner_2_id: null
          })
          .eq('id', user.couple_id);
        
        if (updateError) {
          console.log('❌ APPCONTEXT: 커플 업데이트 실패:', updateError);
          return { error: updateError.message };
        }
      }
      // If this user is partner_2, just remove them
      else if (coupleData.partner_2_id === user.id) {
        console.log('👤 APPCONTEXT: partner_2 제거');
        const { error: updateError } = await supabase
          .from('couples')
          .update({ partner_2_id: null })
          .eq('id', user.couple_id);
        
        if (updateError) {
          console.log('❌ APPCONTEXT: 커플 업데이트 실패:', updateError);
          return { error: updateError.message };
        }
      }
      // If this user is the only partner, deactivate the couple
      else {
        console.log('🚫 APPCONTEXT: 유일한 파트너, 커플 비활성화');
        const { error: updateError } = await supabase
          .from('couples')
          .update({ is_active: false })
          .eq('id', user.couple_id);
        
        if (updateError) {
          console.log('❌ APPCONTEXT: 커플 비활성화 실패:', updateError);
          return { error: updateError.message };
        }
      }

      console.log('👤 APPCONTEXT: 사용자 프로필 업데이트 중...');

      // Remove couple_id from user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ couple_id: null })
        .eq('id', user.id);

      if (profileError) {
        console.log('❌ APPCONTEXT: 프로필 업데이트 실패:', profileError);
        return { error: profileError.message };
      }

      console.log('🧹 APPCONTEXT: 로컬 상태 리셋');

      // Reset local state first
      dispatch({ type: 'RESET_STATE' });

      console.log('🔄 APPCONTEXT: AuthContext 사용자 정보 새로고침');

      // Force refresh AuthContext user data to sync couple_id change
      if (refreshUser) {
        try {
          await refreshUser();
          console.log('✅ APPCONTEXT: 사용자 정보 새로고침 성공');
        } catch (refreshError) {
          console.error('⚠️ APPCONTEXT: 사용자 정보 새로고침 실패 (비차단):', refreshError);
          // Don't fail the entire operation if refresh fails
        }
      }

      console.log('🎉 APPCONTEXT: leaveCouple 성공');
      return { success: true };
    } catch (error) {
      console.error('💥 APPCONTEXT: leaveCouple 예외:', error);
      return { error: 'Failed to leave couple' };
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

  // Update couple theme
  const updateCoupleTheme = async (theme: 'light' | 'dark') => {
    try {
      // Save theme to localStorage immediately for instant UI feedback
      localStorage.setItem('app-theme', theme);
      
      // Update local state immediately
      dispatch({ type: 'SET_THEME', payload: theme });
      
      // Apply theme to body immediately
      if (theme === 'dark') {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      }

      // Update couple theme in database if user is part of a couple
      if (user?.couple_id) {
        const { error } = await supabase
          .from('couples')
          .update({ theme })
          .eq('id', user.couple_id);

        if (error) {
          console.error('Error updating theme in database:', error);
          // Don't revert UI changes even if DB update fails
        }
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      // Don't revert UI changes even if there's an error
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
    console.log('🏗️ APPCONTEXT: createRule 호출됨');
    console.log('📝 APPCONTEXT: 입력된 rule 데이터:', rule);
    console.log('👤 APPCONTEXT: 현재 사용자:', user);
    console.log('💑 APPCONTEXT: 커플 ID:', user?.couple_id);
    
    if (!user?.couple_id) {
      console.log('❌ APPCONTEXT: 커플 정보 없음');
      return { error: 'No couple found' };
    }

    try {
      console.log('🔐 APPCONTEXT: Supabase 연결 상태:', !!supabase);
      console.log('📊 APPCONTEXT: 삽입할 데이터:', {
        ...rule,
        couple_id: user.couple_id,
        created_by: user.id,
        is_active: true
      });
      
      const { error, data } = await supabase
        .from('rules')
        .insert({
          ...rule,
          couple_id: user.couple_id,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      console.log('🔄 APPCONTEXT: Supabase 응답:', { data, error });

      if (error) {
        console.log('❌ APPCONTEXT: Supabase 에러:', error);
        return { error: error.message };
      }

      console.log('✅ APPCONTEXT: 규칙 생성 성공, 로컬 상태 업데이트:', data);
      
      // **중요**: 성공 시 로컬 상태 즉시 업데이트
      if (data) {
        dispatch({ type: 'ADD_RULE', payload: data });
      }
      
      return {};
    } catch (error) {
      console.log('💥 APPCONTEXT: 예외 발생:', error);
      return { error: error instanceof Error ? error.message : 'Failed to create rule' };
    }
  };

  // Update rule
  const updateRule = async (id: string, updates: Partial<Rule>) => {
    try {
      const { error } = await supabase
        .from('rules')
        .update(updates)
        .eq('id', id);

      if (error) return { error: error.message };

      return {};
    } catch (error) {
      return { error: 'Failed to update rule' };
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
    if (!user?.couple_id) return { error: 'No couple found' };

    try {
      const { error } = await supabase
        .from('rewards')
        .insert({
          ...reward,
          couple_id: user.couple_id,
          is_claimed: false
        })
        .select()
        .single();

      if (error) return { error: error.message };

      return {};
    } catch (error) {
      return { error: 'Failed to create reward' };
    }
  };

  // Claim reward
  const claimReward = async (id: string) => {
    try {
      console.log('🎉 APPCONTEXT: claimReward 시작, ID:', id);
      
      const { error, data } = await supabase
        .from('rewards')
        .update({ is_achieved: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.log('❌ APPCONTEXT: 보상 획득 실패:', error);
        return { error: error.message };
      }

      console.log('✅ APPCONTEXT: 보상 획득 성공, 로컬 상태 업데이트:', data);
      // **중요**: 성공 시 로컬 상태 즉시 업데이트
      if (data) {
        dispatch({ type: 'UPDATE_REWARD', payload: data as Reward });
      }

      return {};
    } catch (error) {
      console.log('💥 APPCONTEXT: claimReward 예외 발생:', error);
      return { error: 'Failed to claim reward' };
    }
  };

  // Delete reward
  const deleteReward = async (id: string) => {
    try {
      console.log('🗑️ APPCONTEXT: deleteReward 시작, ID:', id);
      
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);

      if (error) {
        console.log('❌ APPCONTEXT: 보상 삭제 실패:', error);
        return { error: error.message };
      }

      console.log('✅ APPCONTEXT: 보상 삭제 성공, 로컬 상태 업데이트');
      // **중요**: 성공 시 로컬 상태 즉시 업데이트
      dispatch({ type: 'DELETE_REWARD', payload: id });

      return {};
    } catch (error) {
      console.log('💥 APPCONTEXT: deleteReward 예외 발생:', error);
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
    console.log('🔧 APPCONTEXT: useEffect 트리거 - 사용자 변경 감지');
    console.log('👤 APPCONTEXT: 사용자 상태:', {
      user: user ? {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        couple_id: user.couple_id
      } : null,
      isLoading: isLoading
    });

    if (user && !isLoading) {
      console.log('✅ APPCONTEXT: 사용자 로드 완료, 커플 데이터 확인 중...');
      if (user.couple_id) {
        console.log('🚀 APPCONTEXT: 커플 ID 존재 - loadCoupleData 호출');
        loadCoupleData();
      } else {
        console.log('🧹 APPCONTEXT: 커플 ID 없음 - 상태 리셋');
        dispatch({ type: 'RESET_STATE' });
      }
    } else {
      console.log('⏳ APPCONTEXT: 사용자 로딩 중이거나 사용자 없음 - 대기');
    }
  }, [user, isLoading]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.couple_id) {
      console.log('📡 APPCONTEXT: 커플 ID 없음, 실시간 구독 건너뜀');
      return;
    }

    console.log('📡 APPCONTEXT: 실시간 구독 설정 시작:', user.couple_id);

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
          console.log('💑 APPCONTEXT: 커플 데이터 실시간 변경:', payload.eventType);
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
          console.log('📋 APPCONTEXT: 규칙 실시간 변경:', payload.eventType);
          // **무한 재실행 방지**: refreshData 대신 직접 상태 업데이트
          if (payload.eventType === 'INSERT' && payload.new) {
            dispatch({ type: 'ADD_RULE', payload: payload.new as Rule });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            dispatch({ type: 'UPDATE_RULE', payload: payload.new as Rule });
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
          console.log('⚠️ APPCONTEXT: 위반 기록 실시간 변경:', payload.eventType);
          // For violations, we still need to reload due to complex relations
          // But with throttling to prevent excessive calls
          setTimeout(() => refreshData(), 1000);
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
          console.log('🎁 APPCONTEXT: 보상 실시간 변경:', payload.eventType, payload);
          // **무한 재실행 방지**: 직접 상태 업데이트
          if (payload.eventType === 'INSERT' && payload.new) {
            console.log('➕ APPCONTEXT: 보상 INSERT 실시간 이벤트:', payload.new);
            dispatch({ type: 'ADD_REWARD', payload: payload.new as Reward });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            console.log('📝 APPCONTEXT: 보상 UPDATE 실시간 이벤트:', payload.new);
            dispatch({ type: 'UPDATE_REWARD', payload: payload.new as Reward });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            console.log('🗑️ APPCONTEXT: 보상 DELETE 실시간 이벤트:', payload.old.id);
            dispatch({ type: 'DELETE_REWARD', payload: payload.old.id });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 APPCONTEXT: 실시간 구독 정리');
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

  // Update theme when couple theme changes
  useEffect(() => {
    const coupleTheme = (state.couple as any)?.theme;
    if (coupleTheme && coupleTheme !== state.theme) {
      dispatch({ type: 'SET_THEME', payload: coupleTheme as 'light' | 'dark' });
    }
  }, [(state.couple as any)?.theme, state.theme]);

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
    updateCoupleTheme,
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