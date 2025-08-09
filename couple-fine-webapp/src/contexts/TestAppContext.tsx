import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import type { AppState, Couple, Rule, Violation, Reward } from '../types';
import { supabase } from '../lib/supabase';
import { updateViolation as updateViolationApi, deleteViolation as deleteViolationApi } from '../lib/supabaseApi';
import { useTestAuth } from './TestAuthContext';

// BroadcastChannel for cross-tab communication
const TEST_SYNC_CHANNEL = 'test-couple-sync';

type SyncMessage = {
  type: 'RULE_CREATED' | 'RULE_DELETED' | 'VIOLATION_CREATED' | 'REWARD_CREATED' | 'REWARD_CLAIMED' | 'REWARD_DELETED';
  payload: any;
  timestamp: string;
};

// AppContext와 동일한 Action Types 재사용
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

// Initial State
const initialState: AppState = {
  user: null,
  couple: null,
  rules: [],
  violations: [],
  rewards: [],
  isOnline: true
};

// Reducer (AppContext와 동일)
const appReducer = (state: AppState, action: AppAction): AppState => {
  const payloadInfo = 'payload' in action ? 
    (action.type.includes('SET_') ? 
      { count: Array.isArray(action.payload) ? action.payload.length : 1 } :
      { id: (action.payload as any)?.id || action.payload }) :
    null;
    
  console.log('🧪 TEST APPCONTEXT REDUCER:', {
    action: action.type,
    timestamp: new Date().toISOString(),
    payload: payloadInfo
  });

  switch (action.type) {
    case 'SET_COUPLE':
      console.log('💑 TEST: Setting couple data:', action.payload ? {
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
      console.log('📋 TEST: Setting rules data:', { count: action.payload.length });
      return { ...state, rules: action.payload };
    case 'ADD_RULE':
      if (state.rules.some(rule => rule.id === action.payload.id)) {
        console.log('⚠️ TEST: Rule already exists, skipping add:', action.payload.id);
        return state;
      }
      console.log('➕ TEST: Adding new rule:', action.payload.id);
      return { ...state, rules: [...state.rules, action.payload] };
    case 'UPDATE_RULE':
      console.log('✏️ TEST: Updating rule:', action.payload.id);
      return {
        ...state,
        rules: state.rules.map(rule =>
          rule.id === action.payload.id ? action.payload : rule
        )
      };
    case 'DELETE_RULE':
      console.log('🗑️ TEST: Deleting rule:', action.payload);
      return {
        ...state,
        rules: state.rules.filter(rule => rule.id !== action.payload)
      };
    case 'SET_VIOLATIONS':
      console.log('⚖️ TEST: Setting violations data:', { count: action.payload.length });
      return { ...state, violations: action.payload };
    case 'ADD_VIOLATION':
      if (state.violations.some(violation => violation.id === action.payload.id)) {
        console.log('⚠️ TEST: Violation already exists, skipping add:', action.payload.id);
        return state;
      }
      console.log('➕ TEST: Adding new violation:', action.payload.id);
      return { ...state, violations: [action.payload, ...state.violations] };
    case 'UPDATE_VIOLATION':
      console.log('✏️ TEST: Updating violation:', action.payload.id);
      return {
        ...state,
        violations: state.violations.map(violation =>
          violation.id === action.payload.id ? action.payload : violation
        )
      };
    case 'DELETE_VIOLATION':
      console.log('🗑️ TEST: Deleting violation:', action.payload);
      return {
        ...state,
        violations: state.violations.filter(violation => violation.id !== action.payload)
      };
    case 'SET_REWARDS':
      console.log('🎁 TEST: Setting rewards data:', { count: action.payload.length });
      return { ...state, rewards: action.payload };
    case 'ADD_REWARD':
      if (state.rewards.some(reward => reward.id === action.payload.id)) {
        console.log('⚠️ TEST: Reward already exists, skipping add:', action.payload.id);
        return state;
      }
      console.log('➕ TEST: Adding new reward:', action.payload.id);
      return { ...state, rewards: [...state.rewards, action.payload] };
    case 'UPDATE_REWARD':
      console.log('✏️ TEST: Updating reward:', action.payload.id);
      return {
        ...state,
        rewards: state.rewards.map(reward =>
          reward.id === action.payload.id ? action.payload : reward
        )
      };
    case 'DELETE_REWARD':
      console.log('🗑️ TEST: Deleting reward:', action.payload);
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

interface TestAppContextType {
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

const TestAppContext = createContext<TestAppContextType | undefined>(undefined);

export const useTestApp = () => {
  const context = useContext(TestAppContext);
  if (!context) {
    throw new Error('useTestApp must be used within a TestAppProvider');
  }
  return context;
};

interface TestAppProviderProps {
  children: React.ReactNode;
}

export const TestAppProvider: React.FC<TestAppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, isLoading, refreshUser } = useTestAuth(); // 테스트 Auth 사용

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Test data persistence keys
  const TEST_RULES_KEY = 'test-app-rules';
  const TEST_VIOLATIONS_KEY = 'test-app-violations';
  const TEST_REWARDS_KEY = 'test-app-rewards';

  // 테스트용 데이터 로드 함수 (localStorage 지원)
  const loadCoupleData = async () => {
    console.log('🧪 TEST: loadCoupleData 호출 - localStorage에서 데이터 복원 시도');
    console.log('👤 TEST: 사용자 정보:', { userId: user?.id, coupleId: user?.couple_id });
    
    if (!user?.couple_id) {
      console.log('❌ TEST: 커플 ID 없음 - 상태 리셋');
      dispatch({ type: 'RESET_STATE' });
      return;
    }

    // 테스트용 기본 데이터 설정
    try {
      const testCouple: Couple = {
        id: 'test-couple-123',
        couple_code: 'TEST01',
        couple_name: '테스트커플',
        partner_1_id: 'test-user-abc-123',
        partner_2_id: 'test-user-ddd-456',
        total_balance: 0,
        is_active: true,
        created_at: new Date().toISOString()
      };

      dispatch({ type: 'SET_COUPLE', payload: testCouple });

      // localStorage에서 기존 데이터 복원 시도
      try {
        const storedRules = localStorage.getItem(TEST_RULES_KEY);
        const storedViolations = localStorage.getItem(TEST_VIOLATIONS_KEY);
        const storedRewards = localStorage.getItem(TEST_REWARDS_KEY);

        if (storedRules) {
          const rules = JSON.parse(storedRules);
          console.log('📋 TEST: localStorage에서 규칙 복원:', rules.length, '개');
          dispatch({ type: 'SET_RULES', payload: rules });
        } else {
          // 기본 테스트 규칙 생성
          const testRules: Rule[] = [
            {
              id: 'test-rule-1',
              couple_id: 'test-couple-123',
              title: '지각 금지',
              description: '약속 시간에 늦으면 벌금',
              fine_amount: 5000,
              created_by_user_id: 'test-user-abc-123',
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];
          dispatch({ type: 'SET_RULES', payload: testRules });
          localStorage.setItem(TEST_RULES_KEY, JSON.stringify(testRules));
        }

        if (storedViolations) {
          const violations = JSON.parse(storedViolations);
          console.log('💰 TEST: localStorage에서 벌금 복원:', violations.length, '개');
          dispatch({ type: 'SET_VIOLATIONS', payload: violations });
        }

        if (storedRewards) {
          const rewards = JSON.parse(storedRewards);
          console.log('🎁 TEST: localStorage에서 보상 복원:', rewards.length, '개');
          dispatch({ type: 'SET_REWARDS', payload: rewards });
        }

      } catch (error) {
        console.warn('⚠️ TEST: localStorage 데이터 복원 실패:', error);
        // 기본 규칙만 설정
        const testRules: Rule[] = [
          {
            id: 'test-rule-1',
            couple_id: 'test-couple-123',
            title: '지각 금지',
            description: '약속 시간에 늦으면 벌금',
            fine_amount: 5000,
            created_by_user_id: 'test-user-abc-123',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ];
        dispatch({ type: 'SET_RULES', payload: testRules });
      }

      console.log('✅ TEST: 테스트 데이터 로드 완료 (localStorage 지원)');
    } catch (error) {
      console.error('💥 TEST: 데이터 로드 실패:', error);
    }
  };

  const refreshData = async () => {
    console.log('🔄 TEST: refreshData');
    await loadCoupleData();
  };

  // 기본 구현들 (실제 구현은 원본 AppContext와 동일하게 유지)
  const createCouple = async (coupleName = '우리') => {
    console.log('🧪 TEST: createCouple:', coupleName);
    return { code: 'TEST01', isNewCouple: true };
  };

  const joinCouple = async (code: string) => {
    console.log('🧪 TEST: joinCouple:', code);
    return { success: true };
  };

  const leaveCouple = async () => {
    console.log('🧪 TEST: leaveCouple');
    return { success: true };
  };

  const updateCoupleName = async (name: string) => {
    console.log('🧪 TEST: updateCoupleName:', name);
    return {};
  };

  const getPartnerInfo = async () => {
    console.log('🧪 TEST: getPartnerInfo');
    return { 
      partner: {
        id: 'test-partner',
        email: 'partner@test.com',
        display_name: '테스트파트너'
      }
    };
  };

  // CRUD 함수들 (기본 구현)
  const createRule = async (rule: Omit<Rule, 'id' | 'couple_id' | 'created_at'>) => {
    console.log('🧪 TEST: createRule:', rule.title);
    const newRule: Rule = {
      ...rule,
      id: 'test-rule-' + Date.now(),
      couple_id: 'test-couple-123',
      created_at: new Date().toISOString()
    };
    dispatch({ type: 'ADD_RULE', payload: newRule });

    // BroadcastChannel을 통해 다른 탭에 알림
    try {
      const channel = new BroadcastChannel(TEST_SYNC_CHANNEL);
      const message: SyncMessage = {
        type: 'RULE_CREATED',
        payload: newRule,
        timestamp: new Date().toISOString()
      };
      channel.postMessage(message);
      channel.close();
      console.log('📡 TEST: 규칙 생성 메시지 전송됨:', newRule.title);
    } catch (error) {
      console.error('💥 TEST: BroadcastChannel 메시지 전송 실패:', error);
    }

    return {};
  };

  const updateRule = async (id: string, updates: Partial<Rule>) => {
    console.log('🧪 TEST: updateRule:', id);
    return {};
  };

  const deleteRule = async (id: string) => {
    console.log('🧪 TEST: deleteRule:', id);
    dispatch({ type: 'DELETE_RULE', payload: id });

    // BroadcastChannel을 통해 다른 탭에 알림
    try {
      const channel = new BroadcastChannel(TEST_SYNC_CHANNEL);
      const message: SyncMessage = {
        type: 'RULE_DELETED',
        payload: id,
        timestamp: new Date().toISOString()
      };
      channel.postMessage(message);
      channel.close();
      console.log('📡 TEST: 규칙 삭제 메시지 전송됨:', id);
    } catch (error) {
      console.error('💥 TEST: BroadcastChannel 메시지 전송 실패:', error);
    }

    return {};
  };

  const createViolation = async (violationData: any) => {
    console.log('🧪 TEST: createViolation:', violationData);
    console.log('🧪 TEST: Raw amount received:', violationData.amount, typeof violationData.amount);
    
    // TestNewViolation에서 오는 데이터를 Violation 타입에 맞게 변환
    const amount = Number(violationData.amount) || 0;
    console.log('🧪 TEST: Converted amount:', amount);
    
    const newViolation: Violation = {
      id: 'test-violation-' + Date.now(),
      couple_id: violationData.couple_id || 'test-couple-123',
      rule_id: violationData.rule_id,
      violator_user_id: violationData.fine_recipient_id, // 벌금 받을 사람
      recorded_by_user_id: violationData.created_by_user_id, // 기록한 사람
      amount: violationData.type === 'deduction' ? -amount : amount,
      memo: violationData.memo || null,
      violation_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      created_at: new Date().toISOString()
    };
    
    console.log('🧪 TEST: Final violation created:', newViolation);
    
    dispatch({ type: 'ADD_VIOLATION', payload: newViolation });

    // localStorage에 저장
    try {
      const currentViolations = [...state.violations, newViolation];
      localStorage.setItem(TEST_VIOLATIONS_KEY, JSON.stringify(currentViolations));
      console.log('💾 TEST: 벌금 데이터 localStorage에 저장됨');
    } catch (error) {
      console.warn('⚠️ TEST: localStorage 저장 실패:', error);
    }

    // BroadcastChannel을 통해 다른 탭에 알림
    try {
      const channel = new BroadcastChannel(TEST_SYNC_CHANNEL);
      const message: SyncMessage = {
        type: 'VIOLATION_CREATED',
        payload: newViolation,
        timestamp: new Date().toISOString()
      };
      channel.postMessage(message);
      channel.close();
      console.log('📡 TEST: 벌금 생성 메시지 전송됨:', newViolation.amount);
    } catch (error) {
      console.error('💥 TEST: BroadcastChannel 메시지 전송 실패:', error);
    }

    return {};
  };

  const updateViolation = async (id: string, updates: Partial<Pick<Violation, 'amount' | 'memo'>>) => {
    console.log('🧪 TEST: updateViolation:', id);
    return {};
  };

  const deleteViolation = async (id: string) => {
    console.log('🧪 TEST: deleteViolation:', id);
    return {};
  };

  const createReward = async (reward: Omit<Reward, 'id' | 'couple_id' | 'created_at'>) => {
    console.log('🧪 TEST: createReward:', reward.title);
    const newReward: Reward = {
      ...reward,
      id: 'test-reward-' + Date.now(),
      couple_id: 'test-couple-123',
      created_at: new Date().toISOString()
    };
    dispatch({ type: 'ADD_REWARD', payload: newReward });

    // localStorage에 저장
    try {
      const currentRewards = [...state.rewards, newReward];
      localStorage.setItem(TEST_REWARDS_KEY, JSON.stringify(currentRewards));
      console.log('💾 TEST: 보상 데이터 localStorage에 저장됨');
    } catch (error) {
      console.warn('⚠️ TEST: localStorage 저장 실패:', error);
    }

    // BroadcastChannel을 통해 다른 탭에 알림
    try {
      const channel = new BroadcastChannel(TEST_SYNC_CHANNEL);
      const message: SyncMessage = {
        type: 'REWARD_CREATED',
        payload: newReward,
        timestamp: new Date().toISOString()
      };
      channel.postMessage(message);
      channel.close();
      console.log('📡 TEST: 보상 생성 메시지 전송됨:', newReward.title);
    } catch (error) {
      console.error('💥 TEST: BroadcastChannel 메시지 전송 실패:', error);
    }

    return {};
  };

  const claimReward = async (id: string) => {
    console.log('🧪 TEST: claimReward:', id);
    
    // 보상을 달성 상태로 업데이트
    const updatedReward = state.rewards.find(r => r.id === id);
    if (updatedReward) {
      const claimedReward = { ...updatedReward, is_achieved: true };
      dispatch({ type: 'UPDATE_REWARD', payload: claimedReward });

      // localStorage에 업데이트된 보상 저장
      try {
        const updatedRewards = state.rewards.map(r => r.id === id ? claimedReward : r);
        localStorage.setItem(TEST_REWARDS_KEY, JSON.stringify(updatedRewards));
        console.log('💾 TEST: 보상 달성 데이터 localStorage에 저장됨');
      } catch (error) {
        console.warn('⚠️ TEST: localStorage 저장 실패:', error);
      }

      // BroadcastChannel을 통해 다른 탭에 알림
      try {
        const channel = new BroadcastChannel(TEST_SYNC_CHANNEL);
        const message: SyncMessage = {
          type: 'REWARD_CLAIMED',
          payload: claimedReward,
          timestamp: new Date().toISOString()
        };
        channel.postMessage(message);
        channel.close();
        console.log('📡 TEST: 보상 달성 메시지 전송됨:', claimedReward.title);
      } catch (error) {
        console.error('💥 TEST: BroadcastChannel 메시지 전송 실패:', error);
      }
    }

    return {};
  };

  const deleteReward = async (id: string) => {
    console.log('🧪 TEST: deleteReward:', id);
    dispatch({ type: 'DELETE_REWARD', payload: id });
    return {};
  };

  const getUserTotalFines = (userId: string): number => {
    return state.violations
      .filter(v => v.violator_user_id === userId)
      .reduce((total, violation) => total + violation.amount, 0);
  };

  const getRewardProgress = (targetAmount: number): number => {
    if (!user) return 0;
    const totalFines = getUserTotalFines(user.id);
    return Math.min((totalFines / targetAmount) * 100, 100);
  };

  const validateData = async (): Promise<{ isValid: boolean; errors: string[] }> => {
    console.log('🧪 TEST: validateData');
    return { isValid: true, errors: [] };
  };

  // 사용자 변경 시 데이터 로드
  useEffect(() => {
    console.log('🧪 TEST: User effect triggered:', user?.email);
    if (user && !isLoading) {
      loadCoupleData();
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [user, isLoading]);

  // BroadcastChannel for cross-tab synchronization
  useEffect(() => {
    if (!user?.couple_id) return;
    
    const channel = new BroadcastChannel(TEST_SYNC_CHANNEL);
    console.log('📡 TEST: BroadcastChannel 초기화됨:', TEST_SYNC_CHANNEL);

    const handleMessage = (event: MessageEvent<SyncMessage>) => {
      const { type, payload, timestamp } = event.data;
      console.log('📨 TEST: BroadcastChannel 메시지 수신:', { type, timestamp });

      switch (type) {
        case 'RULE_CREATED':
          console.log('➕ TEST: 다른 탭에서 규칙 생성됨:', payload.title);
          dispatch({ type: 'ADD_RULE', payload });
          break;
        case 'RULE_DELETED':
          console.log('🗑️ TEST: 다른 탭에서 규칙 삭제됨:', payload);
          dispatch({ type: 'DELETE_RULE', payload });
          break;
        case 'VIOLATION_CREATED':
          console.log('💰 TEST: 다른 탭에서 벌금 생성됨');
          dispatch({ type: 'ADD_VIOLATION', payload });
          break;
        case 'REWARD_CREATED':
          console.log('🎁 TEST: 다른 탭에서 보상 생성됨:', payload.title);
          dispatch({ type: 'ADD_REWARD', payload });
          break;
        case 'REWARD_CLAIMED':
          console.log('🏆 TEST: 다른 탭에서 보상 달성됨:', payload.id);
          dispatch({ type: 'UPDATE_REWARD', payload });
          break;
        case 'REWARD_DELETED':
          console.log('🗑️ TEST: 다른 탭에서 보상 삭제됨:', payload);
          dispatch({ type: 'DELETE_REWARD', payload });
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      console.log('📡 TEST: BroadcastChannel 정리됨');
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [user?.couple_id]);

  const value: TestAppContextType = {
    state: { ...state, user },
    dispatch,
    loadCoupleData,
    refreshData,
    createCouple,
    joinCouple,
    leaveCouple,
    updateCoupleName,
    getPartnerInfo,
    createRule,
    updateRule,
    deleteRule,
    createViolation,
    updateViolation,
    deleteViolation,
    createReward,
    claimReward,
    deleteReward,
    getUserTotalFines,
    getRewardProgress,
    validateData,
    isRealtimeConnected
  };

  return (
    <TestAppContext.Provider value={value}>
      {children}
    </TestAppContext.Provider>
  );
};