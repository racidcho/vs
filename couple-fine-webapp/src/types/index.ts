// Database Types
export interface User {
  id: string;
  email: string;
  display_name: string;
  couple_id?: string;
  created_at: string;
}

export interface Couple {
  id: string;
  code: string;
  theme: string;
  created_at: string;
}

export interface Rule {
  id: string;
  couple_id: string;
  type: 'word' | 'behavior';
  title: string;
  penalty_amount: number; // 만원 단위
  created_at: string;
  created_by?: string;
  is_active?: boolean;
}

export interface Violation {
  id: string;
  rule_id: string;
  violator_id: string;
  partner_id?: string;
  amount: number; // 만원 단위
  type: 'add' | 'subtract';
  note?: string;
  created_at: string;
  // Relations
  rule?: Rule;
  violator?: User;
  partner?: User;
}

export interface Reward {
  id: string;
  couple_id: string;
  title: string;
  target_amount: number; // 만원 단위
  is_claimed: boolean;
  created_at: string;
}

// Auth Types
export interface AuthSession {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// App State Types
export interface AppState {
  user: User | null;
  couple: Couple | null;
  rules: Rule[];
  violations: Violation[];
  rewards: Reward[];
  theme: 'light' | 'dark';
  isOnline: boolean;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Form Types
export interface LoginForm {
  email: string;
}

export interface CoupleJoinForm {
  code: string;
}

export interface RuleForm {
  type: 'word' | 'behavior';
  title: string;
  penalty_amount: number;
}

export interface ViolationForm {
  rule_id: string;
  amount: number;
  type: 'add' | 'subtract';
  note?: string;
}

export interface RewardForm {
  title: string;
  target_amount: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  has_more: boolean;
}