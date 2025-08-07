import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Couple, Rule, Violation, Reward } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Action Types
type AppAction =
  | { type: 'SET_COUPLE'; payload: Couple | null }
  | { type: 'SET_RULES'; payload: Rule[] }
  | { type: 'ADD_RULE'; payload: Rule }
  | { type: 'UPDATE_RULE'; payload: Rule }
  | { type: 'DELETE_RULE'; payload: string }
  | { type: 'SET_VIOLATIONS'; payload: Violation[] }
  | { type: 'ADD_VIOLATION'; payload: Violation }
  | { type: 'SET_REWARDS'; payload: Reward[] }
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'UPDATE_REWARD'; payload: Reward }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'RESET_STATE' };

// 개발용 임시 데이터
const mockCouple: Couple = {
  id: 'mock-couple-id',
  code: 'LOVE24',
  theme: 'light',
  created_at: new Date().toISOString()
};

const mockRules: Rule[] = [
  {
    id: '1',
    couple_id: 'mock-couple-id',
    type: 'word',
    title: '욕설 금지',
    penalty_amount: 1,
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: '2',
    couple_id: 'mock-couple-id',
    type: 'behavior',
    title: '늦게 들어오기',
    penalty_amount: 3,
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: '3',
    couple_id: 'mock-couple-id',
    type: 'word',
    title: '거짓말',
    penalty_amount: 5,
    created_at: new Date().toISOString(),
    is_active: true
  }
];

const mockViolations: Violation[] = [
  {
    id: '1',
    rule_id: '1',
    violator_id: 'mock-user-id',
    amount: 1,
    type: 'add',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    note: '실수로 욕을 했어요'
  },
  {
    id: '2',
    rule_id: '2',
    violator_id: 'mock-user-id',
    amount: 3,
    type: 'add',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    note: '회식 때문에 늦었어요'
  },
  {
    id: '3',
    rule_id: '1',
    violator_id: 'mock-user-id',
    amount: 1,
    type: 'subtract',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    note: '사과했어요'
  }
];

const mockRewards: Reward[] = [
  {
    id: '1',
    couple_id: 'mock-couple-id',
    title: '맛있는 저녁 외식',
    target_amount: 10,
    is_claimed: false,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    couple_id: 'mock-couple-id',
    title: '영화 관람',
    target_amount: 5,
    is_claimed: false,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    couple_id: 'mock-couple-id',
    title: '주말 여행',
    target_amount: 30,
    is_claimed: false,
    created_at: new Date().toISOString()
  }
];

// Initial State with mock data
const initialState: AppState = {
  user: null,
  couple: mockCouple,
  rules: mockRules,
  violations: mockViolations,
  rewards: mockRewards,
  theme: 'light',
  isOnline: true
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_COUPLE':
      return { ...state, couple: action.payload };
    case 'SET_RULES':
      return { ...state, rules: action.payload };
    case 'ADD_RULE':
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
      return { ...state, violations: [action.payload, ...state.violations] };
    case 'SET_REWARDS':
      return { ...state, rewards: action.payload };
    case 'ADD_REWARD':
      return { ...state, rewards: [...state.rewards, action.payload] };
    case 'UPDATE_REWARD':
      return {
        ...state,
        rewards: state.rewards.map(reward =>
          reward.id === action.payload.id ? action.payload : reward
        )
      };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  loadCoupleData: () => Promise<void>;
  createCouple: () => Promise<{ code: string } | { error: string }>;
  joinCouple: (code: string) => Promise<{ error?: string }>;
  getUserTotalFines: (userId: string) => number;
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
  const { user, isLoading } = useAuth();

  // Load couple data when user changes
  const loadCoupleData = async () => {
    if (!user?.couple_id) return;

    try {
      // Load couple info
      const { data: coupleData } = await supabase
        .from('couples')
        .select('*')
        .eq('id', user.couple_id)
        .single();

      if (coupleData) {
        dispatch({ type: 'SET_COUPLE', payload: coupleData });
      }

      // Load rules
      const { data: rulesData } = await supabase
        .from('rules')
        .select('*')
        .eq('couple_id', user.couple_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (rulesData) {
        dispatch({ type: 'SET_RULES', payload: rulesData });
      }

      // Load violations with relations
      const { data: violationsData } = await supabase
        .from('violations')
        .select(`
          *,
          rule:rules(*),
          violator:users!violations_violator_id_fkey(*),
          partner:users!violations_partner_id_fkey(*)
        `)
        .eq('rule.couple_id', user.couple_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (violationsData) {
        dispatch({ type: 'SET_VIOLATIONS', payload: violationsData as any });
      }

      // Load rewards
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('couple_id', user.couple_id)
        .order('created_at', { ascending: false });

      if (rewardsData) {
        dispatch({ type: 'SET_REWARDS', payload: rewardsData });
      }
    } catch (error) {
      console.error('Error loading couple data:', error);
    }
  };

  // Create new couple
  const createCouple = async () => {
    if (!user) return { error: 'User not found' };

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('couples')
        .insert({ code, theme: 'light' })
        .select()
        .single();

      if (error) return { error: error.message };

      // Update user with couple_id
      await supabase
        .from('users')
        .update({ couple_id: data.id })
        .eq('id', user.id);

      return { code: data.code };
    } catch (error) {
      return { error: 'Failed to create couple' };
    }
  };

  // Join existing couple
  const joinCouple = async (code: string) => {
    if (!user) return { error: 'User not found' };

    try {
      const { data: coupleData, error } = await supabase
        .from('couples')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !coupleData) {
        return { error: 'Invalid couple code' };
      }

      // Update user with couple_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ couple_id: coupleData.id })
        .eq('id', user.id);

      if (updateError) {
        return { error: updateError.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to join couple' };
    }
  };

  // Calculate user total fines
  const getUserTotalFines = (userId: string): number => {
    return state.violations
      .filter(v => v.violator_id === userId)
      .reduce((total, violation) => {
        return violation.type === 'add' 
          ? total + violation.amount 
          : total - violation.amount;
      }, 0);
  };

  // Load data when user changes
  useEffect(() => {
    if (user && !isLoading) {
      if (user.couple_id) {
        loadCoupleData();
      } else {
        dispatch({ type: 'RESET_STATE' });
      }
    }
  }, [user, isLoading]);

  // Online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: navigator.onLine });
    };

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
    loadCoupleData,
    createCouple,
    joinCouple,
    getUserTotalFines
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};