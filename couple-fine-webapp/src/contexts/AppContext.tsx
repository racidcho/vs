import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import type { AppState, Couple, Rule, Violation, Reward } from '../types';
import { supabase } from '../lib/supabase';
import { updateViolation as updateViolationApi, deleteViolation as deleteViolationApi } from '../lib/supabaseApi';
import { useAuth } from './AuthContext';
// Debug logging disabled in production
const debugLog = (...args: any[]) => {}

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

// No mock data - using real Supabase data only

// Reducer with enhanced logging
const appReducer = (state: AppState, action: AppAction): AppState => {
  const payloadInfo = 'payload' in action ? 
    (action.type.includes('SET_') ? 
      { count: Array.isArray(action.payload) ? action.payload.length : 1 } :
      { id: (action.payload as any)?.id || action.payload }) :
    null;
    
  console.log('🎯 APPCONTEXT REDUCER:', {
    action: action.type,
    timestamp: new Date().toISOString(),
    payload: payloadInfo
  });

  switch (action.type) {
    case 'SET_COUPLE':
      console.log('💑 Setting couple data:', action.payload ? {
        id: action.payload.id,
        couple_name: action.payload.couple_name,
        partner_1_id: action.payload.partner_1_id,
        partner_2_id: action.payload.partner_2_id,
        total_balance: action.payload.total_balance
      } : null);
      return {
        ...state,
        couple: action.payload
      };
    case 'SET_RULES':
      console.log('📋 Setting rules data:', { count: action.payload.length });
      return { ...state, rules: action.payload };
    case 'ADD_RULE':
      // Check if rule already exists to avoid duplicates
      if (state.rules.some(rule => rule.id === action.payload.id)) {
        console.log('⚠️ Rule already exists, skipping add:', action.payload.id);
        return state;
      }
      console.log('➕ Adding new rule:', action.payload.id);
      return { ...state, rules: [...state.rules, action.payload] };
    case 'UPDATE_RULE':
      console.log('✏️ Updating rule:', action.payload.id);
      return {
        ...state,
        rules: state.rules.map(rule =>
          rule.id === action.payload.id ? action.payload : rule
        )
      };
    case 'DELETE_RULE':
      console.log('🗑️ Deleting rule:', action.payload);
      return {
        ...state,
        rules: state.rules.filter(rule => rule.id !== action.payload)
      };
    case 'SET_VIOLATIONS':
      console.log('⚖️ Setting violations data:', { count: action.payload.length });
      return { ...state, violations: action.payload };
    case 'ADD_VIOLATION':
      // Check if violation already exists to avoid duplicates
      if (state.violations.some(violation => violation.id === action.payload.id)) {
        console.log('⚠️ Violation already exists, skipping add:', action.payload.id);
        return state;
      }
      console.log('➕ Adding new violation:', action.payload.id);
      return { ...state, violations: [action.payload, ...state.violations] };
    case 'UPDATE_VIOLATION':
      console.log('✏️ Updating violation:', action.payload.id);
      return {
        ...state,
        violations: state.violations.map(violation =>
          violation.id === action.payload.id ? action.payload : violation
        )
      };
    case 'DELETE_VIOLATION':
      console.log('🗑️ Deleting violation:', action.payload);
      return {
        ...state,
        violations: state.violations.filter(violation => violation.id !== action.payload)
      };
    case 'SET_REWARDS':
      console.log('🎁 Setting rewards data:', { count: action.payload.length });
      return { ...state, rewards: action.payload };
    case 'ADD_REWARD':
      // Check if reward already exists to avoid duplicates
      if (state.rewards.some(reward => reward.id === action.payload.id)) {
        console.log('⚠️ Reward already exists, skipping add:', action.payload.id);
        return state;
      }
      console.log('➕ Adding new reward:', action.payload.id);
      return { ...state, rewards: [...state.rewards, action.payload] };
    case 'UPDATE_REWARD':
      console.log('✏️ Updating reward:', action.payload.id);
      return {
        ...state,
        rewards: state.rewards.map(reward =>
          reward.id === action.payload.id ? action.payload : reward
        )
      };
    case 'DELETE_REWARD':
      console.log('🗑️ Deleting reward:', action.payload);
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
  loadViolations: () => Promise<void>;
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
  const { user, isLoading, refreshUser, isDebugMode } = useAuth();

  // ⚡ Realtime connection status
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Load couple data when user changes with abort signal support
  const loadCoupleData = async (abortSignal?: AbortSignal) => {
    debugLog('LOAD_DATA', '=== loadCoupleData 시작 ===', {
      userId: user?.id,
      coupleId: user?.couple_id,
      hasAbortSignal: !!abortSignal,
      debugMode: isDebugMode
    }, 'debug');
    
    console.log('🔄 APPCONTEXT: loadCoupleData 시작', {
      userId: user?.id,
      coupleId: user?.couple_id,
      hasAbortSignal: !!abortSignal,
      debugMode: isDebugMode
    });

    // 디버그 모드에서도 실제 Supabase 사용하지만 테스트 데이터 자동 생성
    if (isDebugMode && user?.couple_id) {
      console.log('🔧 DEBUG MODE: 실제 Supabase와 연동하여 테스트 데이터 생성/조회');
      
      // 디버그 테스트 데이터 초기화 (한 번만 실행)
      await initializeDebugData(user.couple_id, user.id);
      
      console.log('✅ DEBUG MODE: 실제 Supabase 연동 완료, 일반 로직으로 진행');
      // 일반 로직으로 진행하여 실제 데이터베이스에서 조회
    }

    if (!user?.couple_id) {
      debugLog('LOAD_DATA', '커플 ID 없음 - 상태 리셋', null, 'warning');
      console.log('❌ APPCONTEXT: 커플 ID 없음 - 상태 리셋');
      dispatch({ type: 'RESET_STATE' });
      return;
    }

    // 60초 타임아웃 설정 (네트워크 지연 고려 - 더 안정적으로)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('데이터 로딩 시간 초과')), 60000);
    });

    try {

      // Check abort signal before making API call
      if (abortSignal?.aborted) {

        return;
      }

      // Load couple info with partner details (with timeout)
      // LEFT JOIN을 사용하여 파트너가 없어도 커플 데이터는 가져오도록 수정
      debugLog('LOAD_DATA', '커플 데이터 조회 시작', { couple_id: user.couple_id }, 'info');
      // Foreign Key 제약조건이 없으므로 별도 쿼리로 분리
      const { data: coupleData, error: coupleError } = await Promise.race([
        supabase
          .from('couples')
          .select('*')
          .eq('id', user.couple_id)
          .single(),
        timeoutPromise
      ]).catch(err => ({ data: null, error: err })) as any;

      if (coupleError) {
        debugLog('LOAD_DATA', '커플 데이터 로드 실패', coupleError, 'error');
        console.error('💥 APPCONTEXT: 커플 데이터 로드 실패:', coupleError);
        return;
      }

      if (coupleData) {
        // 파트너 데이터를 별도로 로드
        let partner_1_data = null;
        let partner_2_data = null;

        if (coupleData.partner_1_id) {
          const { data: p1 } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', coupleData.partner_1_id)
            .single();
          partner_1_data = p1;
        }

        if (coupleData.partner_2_id) {
          const { data: p2 } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', coupleData.partner_2_id)
            .single();
          partner_2_data = p2;
        }

        console.log('📊 APPCONTEXT: 커플 데이터 로드됨:', {
          id: coupleData.id,
          partner_1_id: coupleData.partner_1_id,
          partner_2_id: coupleData.partner_2_id,
          partner_1_data: partner_1_data ? {
            id: partner_1_data.id,
            display_name: partner_1_data.display_name,
            email: partner_1_data.email
          } : null,
          partner_2_data: partner_2_data ? {
            id: partner_2_data.id,
            display_name: partner_2_data.display_name,
            email: partner_2_data.email
          } : null
        });

        // Transform the data to match Couple interface with partner information
        const transformedCouple: Couple = {
          id: coupleData.id,
          couple_code: coupleData.couple_code,
          couple_name: coupleData.couple_name || '',
          partner_1_id: coupleData.partner_1_id,
          partner_2_id: coupleData.partner_2_id,
          total_balance: coupleData.total_balance || 0,
          is_active: coupleData.is_active,
          created_at: coupleData.created_at,
          // Include partner relations for real-time display
          partner_1: partner_1_data,
          partner_2: partner_2_data
        };

        dispatch({ type: 'SET_COUPLE', payload: transformedCouple });
        console.log('✅ APPCONTEXT: 커플 상태 업데이트됨');
      }

      // Load rules (with timeout)
      debugLog('LOAD_DATA', '규칙 데이터 조회 시작', { couple_id: user.couple_id }, 'info');
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
        debugLog('LOAD_DATA', '규칙 데이터 로드 실패', rulesError, 'error');
      } else {
        debugLog('LOAD_DATA', '규칙 데이터 로드 성공', { count: rulesData?.length || 0 }, 'success');
        dispatch({ type: 'SET_RULES', payload: rulesData || [] });
      }

      // Load violations with relations
      debugLog('LOAD_DATA', '벌금 데이터 조회 시작', { couple_id: user.couple_id }, 'info');
      // violations과 violator 정보 함께 로드
      const { data: violationsData, error: violationsError } = await supabase
        .from('violations')
        .select(`
          *,
          violator:profiles!violator_user_id (
            id,
            email,
            display_name,
            created_at
          )
        `)
        .eq('couple_id', user.couple_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (violationsError) {
        debugLog('LOAD_DATA', '벌금 데이터 로드 실패', violationsError, 'error');
      } else {
        debugLog('LOAD_DATA', '벌금 데이터 로드 성공', { count: violationsData?.length || 0 }, 'success');
        dispatch({ type: 'SET_VIOLATIONS', payload: violationsData as any || [] });
      }

      // Load rewards
      debugLog('LOAD_DATA', '보상 데이터 조회 시작', { couple_id: user.couple_id }, 'info');
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('couple_id', user.couple_id)
        .order('created_at', { ascending: false });

      if (rewardsError) {
        debugLog('LOAD_DATA', '보상 데이터 로드 실패', rewardsError, 'error');
      } else {
        debugLog('LOAD_DATA', '보상 데이터 로드 성공', { count: rewardsData?.length || 0 }, 'success');
        dispatch({ type: 'SET_REWARDS', payload: rewardsData || [] });
      }

    } catch (error) {
      console.error('💥 APPCONTEXT: 데이터 로드 실패:', error);
      
      // 인증 오류와 네트워크 오류 구분
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('JWT') || 
          errorMessage.includes('auth') || 
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('Invalid') ||
          errorMessage.includes('token')) {
        console.log('🚨 인증 오류 감지 - 세션 문제로 판단');
        // 인증 오류는 다시 throw해서 AuthContext에서 처리하도록 함
        throw error;
      } else {
        console.log('🌐 네트워크/서버 오류 - 세션 유지하고 상태만 리셋');
        // 네트워크 오류는 앱 상태만 리셋하고 세션은 유지
        dispatch({ type: 'RESET_STATE' });
      }
    }
  };

  // Refresh all data with abort signal support
  const refreshData = async (abortSignal?: AbortSignal) => {
    console.log('🔄 APPCONTEXT: refreshData 호출');
    try {
      await loadCoupleData(abortSignal);
      console.log('✅ APPCONTEXT: refreshData 완료');
    } catch (error) {
      if (abortSignal?.aborted) {
        console.log('🚫 APPCONTEXT: refreshData 취소됨');
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

      // 먼저 user 객체를 새로고침하여 couple_id 업데이트
      console.log('🔄 APPCONTEXT: createCouple 성공 - 사용자 정보 새로고침');
      await refreshUser();
      
      // 그 다음 커플 데이터를 다시 로드하여 화면에 반영
      console.log('🔄 APPCONTEXT: 커플 데이터 새로고침');
      await refreshData();

      return { code: coupleData.couple_code, isNewCouple: true };
    } catch (error) {
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

      // 먼저 user 객체를 새로고침하여 couple_id 업데이트
      console.log('🔄 APPCONTEXT: joinCouple 성공 - 사용자 정보 새로고침');
      await refreshUser();
      
      // 잠시 대기하여 AuthContext가 업데이트되도록 함
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 그 다음 커플 데이터를 다시 로드하여 화면에 반영
      console.log('🔄 APPCONTEXT: 커플 데이터 새로고침');
      await refreshData();
      
      console.log('✅ APPCONTEXT: joinCouple 완료 - couple_id:', coupleData.id);

      return { success: true };
    } catch (error) {
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

  // Get partner information with improved reliability
  const getPartnerInfo = async (): Promise<{ partner: any; error?: string } | null> => {
    console.log('🔍 APPCONTEXT: getPartnerInfo 호출', { 
      userId: user?.id, 
      coupleId: user?.couple_id,
      hasStateCouple: !!state.couple 
    });

    if (!user?.couple_id && !state.couple) {
      console.log('❌ APPCONTEXT: 커플 정보 없음');
      return null;
    }

    try {
      // First try to use existing state.couple data if available
      let coupleData = state.couple;
      
      // If we don't have couple data in state, fetch it
      if (!coupleData) {
        console.log('📡 APPCONTEXT: 상태에 커플 데이터 없음, DB에서 조회');
        // Foreign Key 제약조건이 없으므로 별도 쿼리로 분리
        const { data: fetchedCoupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('id', user.couple_id)
          .single();

        if (coupleError || !fetchedCoupleData) {
          console.log('❌ APPCONTEXT: 커플 데이터 조회 실패:', coupleError?.message);
          return { partner: null, error: 'Couple not found' };
        }
        
        coupleData = fetchedCoupleData;
      }

      console.log('📊 APPCONTEXT: 커플 데이터 확인:', {
        coupleId: coupleData.id,
        partner1Id: coupleData.partner_1_id,
        partner2Id: coupleData.partner_2_id,
        hasPartner1Data: !!(coupleData as any).partner_1,
        hasPartner2Data: !!(coupleData as any).partner_2
      });

      // Determine which partner is the "other" partner
      let partner = null;
      let partnerId = null;
      
      if (coupleData.partner_1_id === user.id) {
        // Current user is partner_1, so partner_2 is the other partner
        partnerId = coupleData.partner_2_id;
        partner = (coupleData as any).partner_2;
        console.log('👫 APPCONTEXT: 현재 사용자는 partner_1, partner_2가 파트너');
      } else if (coupleData.partner_2_id === user.id) {
        // Current user is partner_2, so partner_1 is the other partner
        partnerId = coupleData.partner_1_id;
        partner = (coupleData as any).partner_1;
        console.log('👫 APPCONTEXT: 현재 사용자는 partner_2, partner_1이 파트너');
      } else {
        console.log('⚠️ APPCONTEXT: 현재 사용자가 이 커플의 멤버가 아님');
        return { partner: null, error: 'User is not a member of this couple' };
      }

      // If we don't have partner data from the relation, fetch it separately
      if (!partner && partnerId) {
        console.log('📡 APPCONTEXT: 파트너 데이터 없음, 직접 조회:', partnerId);
        const { data: partnerData, error: partnerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerId)
          .single();

        if (!partnerError && partnerData) {
          partner = partnerData;
          console.log('✅ APPCONTEXT: 파트너 데이터 조회 성공');
        } else {
          console.log('⚠️ APPCONTEXT: 파트너 프로필 조회 실패 또는 없음');
        }
      }

      console.log('✅ APPCONTEXT: 파트너 정보 반환:', {
        partnerId,
        partnerName: partner?.display_name,
        partnerEmail: partner?.email,
        hasPartner: !!partner
      });

      return { partner: partner || null };
    } catch (error) {
      console.error('💥 APPCONTEXT: getPartnerInfo 예외:', error);
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
          payload: { ...state.couple, couple_name: name.trim() }
        });
      }

      return {};
    } catch (error) {
      return { error: 'Failed to update couple name' };
    }
  };

  // ⚡ Enhanced Create rule with Realtime broadcast
  const createRule = async (rule: Omit<Rule, 'id' | 'couple_id' | 'created_at'>) => {
    debugLog('CRUD', '=== createRule 시작 ===', rule, 'debug');
    
    // 디버그 모드에서도 실제 Supabase 사용 (인증만 우회)
    if (isDebugMode) {
      console.log('🔧 DEBUG MODE: createRule 실제 Supabase 사용');
    }
    
    if (!user?.couple_id) {
      debugLog('CRUD', 'createRule 실패: 커플 ID 없음', null, 'error');
      return { error: 'No couple found' };
    }

    try {
      const ruleData = {
        ...rule,
        couple_id: user.couple_id,
        created_by_user_id: user.id,
        is_active: true
      };
      
      debugLog('CRUD', 'createRule 요청 데이터', ruleData, 'info');

      // Direct Supabase CRUD
      const { error, data } = await supabase
        .from('rules')
        .insert(ruleData)
        .select()
        .single();

      if (error) {
        debugLog('CRUD', 'createRule 실패', error, 'error');
        return { error: error.message };
      }

      if (data) {
        debugLog('CRUD', 'createRule 성공', data, 'success');
        dispatch({ type: 'ADD_RULE', payload: data });
      }

      return {};
    } catch (error) {

      return { error: error instanceof Error ? error.message : 'Failed to create rule' };
    }
  };

  // ⚡ Enhanced Update rule with Realtime broadcast
  const updateRule = async (id: string, updates: Partial<Rule>) => {

    try {
      // Direct Supabase CRUD
      const { error, data } = await supabase
        .from('rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {

        return { error: error.message };
      }

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
      // Direct Supabase CRUD
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', id);

      if (error) return { error: error.message };

      dispatch({ type: 'DELETE_RULE', payload: id });

      return {};
    } catch (error) {
      return { error: 'Failed to delete rule' };
    }
  };

  // Load violations function
  const loadViolations = async () => {
    if (!user?.couple_id) return;
    
    try {
      const { data: violationsData, error } = await supabase
        .from('violations')
        .select(`
          *,
          violator:profiles!violator_user_id (
            id,
            email,
            display_name,
            created_at
          )
        `)
        .eq('couple_id', user.couple_id)
        .order('created_at', { ascending: false });
      
      if (!error && violationsData) {
        dispatch({ type: 'SET_VIOLATIONS', payload: violationsData as Violation[] });
      }
    } catch (error) {
      // 오류 발생
    }
  };

  // Create violation
  const createViolation = async (violation: Omit<Violation, 'id' | 'created_at'>) => {
    debugLog('CRUD', '=== createViolation 시작 ===', violation, 'debug');
    
    // 디버그 모드에서도 실제 Supabase 사용 (인증만 우회)
    if (isDebugMode) {
      console.log('🔧 DEBUG MODE: createViolation 실제 Supabase 사용');
    }
    
    try {
      // Direct Supabase CRUD with violator info
      const { error, data } = await supabase
        .from('violations')
        .insert(violation)
        .select(`
          *,
          violator:profiles!violator_user_id (
            id,
            email,
            display_name,
            created_at
          )
        `)
        .single();

      if (error) {
        debugLog('CRUD', 'createViolation 실패', error, 'error');
        return { error: error.message };
      }
      
      if (data) {
        debugLog('CRUD', 'createViolation 성공', data, 'success');
        // ADD_VIOLATION 액션 디스패치 추가 - 즉시 state 업데이트
        dispatch({ type: 'ADD_VIOLATION', payload: data as Violation });
        
        // 모든 violations 다시 로드하여 완전한 동기화
        loadViolations();
      }
      
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
      return { error: error instanceof Error ? error.message : 'Failed to delete violation' };
    }
  };

  // Create reward
  const createReward = async (reward: Omit<Reward, 'id' | 'couple_id' | 'created_at'>) => {
    debugLog('CRUD', '=== createReward 시작 ===', reward, 'debug');
    
    // 디버그 모드에서도 실제 Supabase 사용 (인증만 우회)
    if (isDebugMode) {
      console.log('🔧 DEBUG MODE: createReward 실제 Supabase 사용');
    }
    
    if (!user?.couple_id) {
      debugLog('CRUD', 'createReward 실패: 커플 ID 없음', null, 'error');
      return { error: 'No couple found' };
    }

    try {
      const rewardData = {
        ...reward,
        couple_id: user.couple_id,
        created_by_user_id: user.id,
        is_achieved: false
      };
      
      debugLog('CRUD', 'createReward 요청 데이터', rewardData, 'info');

      // Direct Supabase CRUD
      const { error, data } = await supabase
        .from('rewards')
        .insert(rewardData)
        .select()
        .single();

      if (error) {
        debugLog('CRUD', 'createReward 실패', error, 'error');
        return { error: error.message };
      }

      if (data) {
        debugLog('CRUD', 'createReward 성공', data, 'success');
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
      // Direct Supabase CRUD
      const { error, data } = await supabase
        .from('rewards')
        .update({ is_achieved: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {

        return { error: error.message };
      }

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
          if (state.couple.couple_code !== dbCouple.couple_code) {
            errors.push('커플 코드가 서버와 일치하지 않습니다.');
          }

          if (state.couple.total_balance !== dbCouple.total_balance) {
            errors.push('벌금 총액이 서버와 일치하지 않습니다.');
          }
        }
      }

      // Validate violations total against couple balance
      const calculatedTotal = state.violations
        .filter(v => v.rule?.couple_id === user.couple_id)
        .reduce((total, violation) => total + violation.amount, 0);

      const coupleBalance = state.couple?.total_balance || 0;
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
      errors.push('데이터 검증 중 오류가 발생했습니다.');
      return { isValid: false, errors };
    }
  };

  // ⚡ Enhanced Realtime System Setup - DISABLED for stability
  useEffect(() => {
    // Enhanced Realtime temporarily disabled - using standard Supabase realtime subscriptions
    setIsRealtimeConnected(true); // Assume connected when using standard subscriptions
  }, [user?.couple_id]);

  // Load data when user changes
  useEffect(() => {
    debugLog('USER_CHANGE', '사용자 상태 변경 감지', { 
      userId: user?.id, 
      coupleId: user?.couple_id,
      isLoading 
    }, 'info');
    
    if (user && !isLoading) {
      if (user.couple_id) {
        debugLog('USER_CHANGE', '커플 데이터 로드 시작', null, 'info');
        loadCoupleData();
      } else {
        debugLog('USER_CHANGE', '커플 ID 없음 - 상태 리셋', null, 'warning');
        dispatch({ type: 'RESET_STATE' });
      }
    }
  }, [user, isLoading]);

  // Real-time subscriptions (Legacy - RESTORED for proper state management)
  useEffect(() => {
    if (!user?.couple_id) {
      console.log('🚫 APPCONTEXT REALTIME: No couple_id, skipping legacy subscriptions');
      return;
    }

    console.log('🔗 APPCONTEXT REALTIME: Setting up legacy subscriptions for couple:', user.couple_id);
    debugLog('REALTIME', '=== 실시간 구독 설정 시작 ===', { couple_id: user.couple_id }, 'debug');

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
        async (payload) => {
          console.log('🔄 APPCONTEXT REALTIME [COUPLES]:', payload.eventType, payload);

          if (payload.eventType === 'UPDATE' && payload.new) {
            console.log('💑 APPCONTEXT REALTIME: Couple updated, reloading data to get partner info');
            
            // partner_2_id가 추가되었는지 확인 (두 번째 사용자가 연결됨)
            const oldCouple = payload.old as any;
            const newCouple = payload.new as any;
            
            // 파트너가 새로 연결된 경우 (첫 번째 사용자를 위한 감지)
            if (!oldCouple?.partner_2_id && newCouple?.partner_2_id) {
              console.log('🎉 파트너가 연결되었습니다! 전체 데이터 새로고침');
              
              // 파트너 정보를 포함한 커플 데이터 즉시 업데이트
              const { data: partnerData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newCouple.partner_2_id)
                .single();
              
              if (partnerData) {
                // 즉시 커플 상태 업데이트 (파트너 정보 포함)
                const updatedCouple: Couple = {
                  ...newCouple,
                  partner_2: partnerData
                };
                dispatch({ type: 'SET_COUPLE', payload: updatedCouple });
                console.log('✅ APPCONTEXT REALTIME: 파트너 정보 포함하여 커플 상태 즉시 업데이트');
              }
              
              // 전체 데이터도 새로고침
              setTimeout(() => {
                refreshData();
              }, 500);
              
              // 파트너 연결 알림
              const partnerName = partnerData?.display_name || partnerData?.email?.split('@')[0] || '파트너';
              console.log(`🎊 ${partnerName}님이 연결되었습니다!`);
              
              // Toast 알림 (react-hot-toast가 없으면 console로 대체)
              try {
                const toast = await import('react-hot-toast');
                toast.default.success(`🎉 ${partnerName}님이 연결되었습니다! 축하해요!`, {
                  duration: 5000,
                  position: 'top-center'
                });
              } catch {
                console.log('Toast 알림을 표시할 수 없습니다');
              }
            } else {
              // 일반적인 커플 업데이트 (이름 변경 등)
              setTimeout(() => {
                refreshData();
              }, 500);
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔌 APPCONTEXT REALTIME [COUPLES]: Channel status:', status);
        if (err) {
          debugLog('REALTIME', 'Couples 채널 구독 실패', err, 'error');
        } else {
          debugLog('REALTIME', 'Couples 채널 구독 상태', status, status === 'SUBSCRIBED' ? 'success' : 'warning');
        }
      });

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
          console.log('🔄 APPCONTEXT REALTIME [RULES]:', payload.eventType, payload);

          if (payload.eventType === 'INSERT' && payload.new) {
            console.log('📋 APPCONTEXT REALTIME: Adding rule via legacy subscription');
            dispatch({ type: 'ADD_RULE', payload: payload.new as Rule });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Handle rule deactivation (is_active = false) as deletion
            if (payload.new.is_active === false) {
              console.log('📋 APPCONTEXT REALTIME: Deactivating rule via legacy subscription');
              dispatch({ type: 'DELETE_RULE', payload: payload.new.id });
            } else {
              console.log('📋 APPCONTEXT REALTIME: Updating rule via legacy subscription');
              dispatch({ type: 'UPDATE_RULE', payload: payload.new as Rule });
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            console.log('📋 APPCONTEXT REALTIME: Deleting rule via legacy subscription');
            dispatch({ type: 'DELETE_RULE', payload: payload.old.id });
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔌 APPCONTEXT REALTIME [RULES]: Channel status:', status);
        if (err) {
          debugLog('REALTIME', 'Rules 채널 구독 실패', err, 'error');
        } else {
          debugLog('REALTIME', 'Rules 채널 구독 상태', status, status === 'SUBSCRIBED' ? 'success' : 'warning');
        }
      });

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
          console.log('🔄 APPCONTEXT REALTIME [VIOLATIONS]:', payload.eventType, payload);

          // For violations, we still need to reload due to complex relations
          // But with throttling to prevent excessive calls and avoid memory leaks
          console.log('⚖️ APPCONTEXT REALTIME: Refreshing data due to violation change (throttled)');
          setTimeout(() => {
            try {
              refreshData();
            } catch (error) {
              console.error('💥 APPCONTEXT REALTIME: Error refreshing data after violation change:', error);
            }
          }, 1000);
        }
      )
      .subscribe((status, err) => {
        console.log('🔌 APPCONTEXT REALTIME [VIOLATIONS]: Channel status:', status);
        if (err) {
          debugLog('REALTIME', 'Violations 채널 구독 실패', err, 'error');
        } else {
          debugLog('REALTIME', 'Violations 채널 구독 상태', status, status === 'SUBSCRIBED' ? 'success' : 'warning');
        }
      });

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
          console.log('🔄 APPCONTEXT REALTIME [REWARDS]:', payload.eventType, payload);

          if (payload.eventType === 'INSERT' && payload.new) {
            console.log('🎁 APPCONTEXT REALTIME: Adding reward via legacy subscription');
            dispatch({ type: 'ADD_REWARD', payload: payload.new as Reward });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            console.log('🎁 APPCONTEXT REALTIME: Updating reward via legacy subscription');
            dispatch({ type: 'UPDATE_REWARD', payload: payload.new as Reward });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            console.log('🎁 APPCONTEXT REALTIME: Deleting reward via legacy subscription');
            dispatch({ type: 'DELETE_REWARD', payload: payload.old.id });
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔌 APPCONTEXT REALTIME [REWARDS]: Channel status:', status);
        if (err) {
          debugLog('REALTIME', 'Rewards 채널 구독 실패', err, 'error');
        } else {
          debugLog('REALTIME', 'Rewards 채널 구독 상태', status, status === 'SUBSCRIBED' ? 'success' : 'warning');
        }
      });

    // Subscribe to profiles changes (for partner name updates)
    const profilesChannel = supabase
      .channel(`profiles-${user.couple_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `couple_id=eq.${user.couple_id}`
        },
        (payload) => {
          console.log('🔄 APPCONTEXT REALTIME [PROFILES]:', payload.eventType, payload);
          
          // When partner updates their profile, refresh couple data
          if (payload.new && payload.new.id !== user.id) {
            console.log('👤 APPCONTEXT REALTIME: Partner profile updated, refreshing couple data');
            // Refresh couple data to get updated partner info
            setTimeout(() => {
              loadCoupleData();
            }, 500);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔌 APPCONTEXT REALTIME [PROFILES]: Channel status:', status);
        if (err) {
          debugLog('REALTIME', 'Profiles 채널 구독 실패', err, 'error');
        } else {
          debugLog('REALTIME', 'Profiles 채널 구독 상태', status, status === 'SUBSCRIBED' ? 'success' : 'warning');
        }
      });

    return () => {
      console.log('🧹 APPCONTEXT REALTIME: Cleaning up legacy subscriptions');
      supabase.removeChannel(coupleChannel);
      supabase.removeChannel(rulesChannel);
      supabase.removeChannel(violationsChannel);
      supabase.removeChannel(rewardsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user?.couple_id, refreshData, loadCoupleData]);

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
    loadViolations,
    // Reward management
    createReward,
    claimReward,
    deleteReward,
    // Utility functions
    getUserTotalFines,
    getRewardProgress,
    validateData,
    isRealtimeConnected
  };

  // 디버그 모드 전용 - 실제 Supabase에 테스트 데이터 생성
  const initializeDebugData = async (coupleId: string, userId: string) => {
    console.log('🔧 DEBUG: 테스트 데이터 초기화 시작', { coupleId, userId });
    
    try {
      // 실제 존재하는 사용자 ID들 사용 (Foreign Key 제약조건 해결)
      const realUserIds = [
        'd35ee66f-edef-440d-ace1-acf089a34381', // racidcho@gmail.com
        '10969e2b-35e8-40c7-9a38-598159ff47e8'  // racidcho@naver.com
      ];
      
      console.log('✅ DEBUG: 실제 존재하는 사용자 ID들 사용:', realUserIds);
      
      // 2. 테스트 커플이 존재하는지 확인하고 생성
      const { data: existingCouple } = await supabase
        .from('couples')
        .select('id')
        .eq('id', coupleId)
        .single();
        
      if (!existingCouple) {
        const testCouple = {
          id: coupleId,
          couple_code: 'TEST01',
          couple_name: '테스트 커플',
          partner_1_id: realUserIds[0], // 실제 존재하는 사용자 ID
          partner_2_id: realUserIds[1], // 실제 존재하는 사용자 ID
          total_balance: 0,
          is_active: true,
          created_at: new Date().toISOString()
        };
        
        const { error: coupleError } = await supabase.from('couples').insert(testCouple);
        if (coupleError) {
          console.error('❌ DEBUG: 테스트 커플 생성 실패:', coupleError);
        } else {
          console.log('✅ DEBUG: 테스트 커플 생성');
        }
        
        // 3. 기본 규칙들 생성
        const testRules = [
          {
            id: crypto.randomUUID(),
            title: '욕설 금지',
            category: 'word' as const,
            fine_amount: 10000,  // 10000원 (원 단위로 저장)
            icon_emoji: '💬',
            is_active: true,
            couple_id: coupleId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: '데이트 약속 늦기',
            category: 'behavior' as const,
            fine_amount: 20000,  // 20000원 (원 단위로 저장)
            icon_emoji: '⏰',
            is_active: true,
            couple_id: coupleId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        const { error: rulesError } = await supabase.from('rules').insert(testRules);
        if (rulesError) {
          console.error('❌ DEBUG: 테스트 규칙들 생성 실패:', rulesError);
        } else {
          console.log('✅ DEBUG: 테스트 규칙들 생성');
        }
        
        // 4. 샘플 벌금 기록들 생성
        const testViolations = [
          {
            id: crypto.randomUUID(),
            violator_user_id: realUserIds[0], // 실제 존재하는 사용자 ID
            rule_id: testRules[0].id,
            amount: 10000,  // 10000원 (원 단위로 저장)
            memo: '테스트 벌금 기록 1',
            couple_id: coupleId,
            violation_date: new Date().toISOString().split('T')[0], // DATE 형식으로
            recorded_by_user_id: realUserIds[1] // 실제 존재하는 사용자 ID
          },
          {
            id: crypto.randomUUID(),
            violator_user_id: realUserIds[1], // 실제 존재하는 사용자 ID
            rule_id: testRules[1].id,
            amount: 20000,  // 20000원 (원 단위로 저장)
            memo: '테스트 벌금 기록 2',
            couple_id: coupleId,
            violation_date: new Date().toISOString().split('T')[0], // DATE 형식으로
            recorded_by_user_id: realUserIds[0] // 실제 존재하는 사용자 ID
          }
        ];
        
        const { error: violationsError } = await supabase.from('violations').insert(testViolations);
        if (violationsError) {
          console.error('❌ DEBUG: 테스트 벌금 기록들 생성 실패:', violationsError);
        } else {
          console.log('✅ DEBUG: 테스트 벌금 기록들 생성');
        }
        
        // 5. 샘플 보상들 생성
        const testRewards = [
          {
            id: crypto.randomUUID(),
            title: '맛있는 저녁식사',
            target_amount: 50000,
            description: '좋은 레스토랑에서 저녁식사',
            icon_emoji: '🍽️',
            is_achieved: false,
            couple_id: coupleId,
            created_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: '영화 데이트',
            target_amount: 30000,
            description: '함께 보고 싶던 영화 보기',
            icon_emoji: '🎬',
            is_achieved: false,
            couple_id: coupleId,
            created_at: new Date().toISOString()
          }
        ];
        
        const { error: rewardsError } = await supabase.from('rewards').insert(testRewards);
        if (rewardsError) {
          console.error('❌ DEBUG: 테스트 보상들 생성 실패:', rewardsError);
        } else {
          console.log('✅ DEBUG: 테스트 보상들 생성');
        }
      }
      
      console.log('🎉 DEBUG: 테스트 데이터 초기화 완료');
    } catch (error) {
      console.error('❌ DEBUG: 테스트 데이터 초기화 실패:', error);
    }
  };

  // Debug mode removed for production

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};