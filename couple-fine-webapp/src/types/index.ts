// Database Types - 실제 Supabase 스키마와 일치
export interface User {
  id: string;
  email: string;
  display_name: string;
  couple_id?: string | null;
  avatar_url?: string | null;
  pin_hash?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Couple {
  id: string;
  couple_code: string; // 실제 DB 컬럼명
  couple_name: string; // 실제 DB 컬럼명
  partner_1_id: string | null;
  partner_2_id: string | null;
  total_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Rule {
  id: string;
  couple_id: string;
  created_by_user_id?: string | null;
  title: string;
  description?: string | null;
  fine_amount: number; // 실제 DB 컬럼명
  is_active: boolean;
  category: string;
  icon_emoji: string;
  created_at: string;
  updated_at?: string;
}

export interface Violation {
  id: string;
  couple_id: string;
  rule_id: string | null;
  violator_user_id: string; // 실제 DB 컬럼명
  recorded_by_user_id: string; // 실제 DB 컬럼명
  amount: number;
  memo?: string | null; // 실제 DB 컬럼명
  violation_date: string; // 실제 DB 컬럼명 (DATE 타입)
  created_at: string;
  // Relations
  rule?: Rule;
  violator?: User;
  partner?: User;
}

export interface Reward {
  id: string;
  couple_id: string;
  created_by_user_id?: string | null;
  title: string;
  description?: string | null;
  target_amount: number;
  is_achieved: boolean; // 실제 DB 컬럼명
  achieved_at?: string | null;
  achieved_by_user_id?: string | null;
  category: string;
  icon_emoji: string;
  priority: number;
  created_at: string;
  updated_at?: string;
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
  title: string;
  description?: string;
  fine_amount: number;
  category?: string;
  icon_emoji?: string;
}

export interface ViolationForm {
  rule_id: string;
  violator_user_id: string;
  amount: number;
  memo?: string;
  violation_date?: string;
}

export interface RewardForm {
  title: string;
  target_amount: number;
}

// (Note: ApiResponse is defined below with enhanced structure)

// Realtime Types
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeEvent<T = any> {
  eventType: RealtimeEventType;
  table: string;
  new?: T;
  old?: T;
  errors?: any;
}

export interface RealtimeNotification {
  type: 'violation_added' | 'rule_created' | 'reward_achieved' | 'couple_joined';
  title: string;
  message: string;
  data?: any;
  timestamp?: string;
}

export interface PresenceState {
  user_id: string;
  online_at: string;
  status: 'online' | 'away' | 'offline';
  metadata?: Record<string, any>;
}

// Database Response Types
export interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface SupabaseQueryResponse<T> {
  data: T[] | null;
  error: any;
  count?: number | null;
}

// Enhanced API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    request_id?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  has_more: boolean;
  next_offset?: number;
}

// Dashboard Stats Type
export interface DashboardStats {
  totalBalance: number;
  activeRules: number;
  thisMonthViolations: number;
  availableRewards: number;
  recentActivity: Violation[];
}

// Subscription Management Types
export interface SubscriptionCallbacks {
  onRuleChange?: (rule: Rule, eventType: RealtimeEventType) => void;
  onViolationChange?: (violation: Violation, eventType: RealtimeEventType) => void;
  onRewardChange?: (reward: Reward, eventType: RealtimeEventType) => void;
  onUserChange?: (user: User, eventType: RealtimeEventType) => void;
  onNotification?: (notification: RealtimeNotification) => void;
}

export interface RealtimeConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected?: Date;
  activeChannels: string[];
}

// Enhanced Form Types with Validation
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidatedFormData<T> {
  data: T;
  validation: FormValidationResult;
}

// File Upload Types
export interface FileUploadOptions {
  maxSize?: number; // bytes
  allowedTypes?: string[];
  path?: string;
}

export interface FileUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type AsyncOperationState<T> = {
  state: LoadingState;
  data?: T;
  error?: string;
};

// Query Options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Storage Types
export type StorageBucket = 'avatars' | 'attachments';

export interface StorageUploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File;
  options?: {
    cacheControl?: string;
    upsert?: boolean;
    contentType?: string;
  };
}