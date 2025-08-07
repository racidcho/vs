# MVP 아키텍처 가이드 🏗️

## 핵심 원칙

**"개별 함수로 수정에 용이한 구조"**

모든 기능은 독립적인 함수로 구현하여 수정, 테스트, 재사용이 쉽도록 설계합니다.

## 아키텍처 패턴

### 1. 함수형 프로그래밍 접근
```typescript
// ❌ 클래스 기반 복잡한 구조
class ViolationManager {
  private violations: Violation[];
  constructor() { /* ... */ }
  add() { /* ... */ }
  update() { /* ... */ }
  delete() { /* ... */ }
}

// ✅ 개별 순수 함수
export const addViolation = (violation: Violation): Promise<Violation> => { /* ... */ }
export const updateViolation = (id: string, data: Partial<Violation>): Promise<Violation> => { /* ... */ }
export const deleteViolation = (id: string): Promise<void> => { /* ... */ }
export const getViolations = (filters?: ViolationFilter): Promise<Violation[]> => { /* ... */ }
```

### 2. 단일 책임 원칙
각 함수는 하나의 명확한 목적만 수행합니다.

```typescript
// ✅ 좋은 예: 각 함수가 하나의 일만 수행
export const validateEmail = (email: string): boolean => { /* ... */ }
export const sendMagicLink = (email: string): Promise<void> => { /* ... */ }
export const verifyMagicLink = (token: string): Promise<User> => { /* ... */ }

// ❌ 나쁜 예: 여러 책임을 가진 함수
export const handleAuth = (email: string, token?: string) => { 
  // 검증도 하고, 전송도 하고, 확인도 하는 복잡한 함수
}
```

### 3. 커스텀 훅 패턴
React 컴포넌트에서는 커스텀 훅으로 로직을 분리합니다.

```typescript
// hooks/useViolations.ts
export const useViolations = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchViolations = async () => { /* ... */ };
  const addViolation = async (data: ViolationInput) => { /* ... */ };
  const updateViolation = async (id: string, data: Partial<Violation>) => { /* ... */ };
  const deleteViolation = async (id: string) => { /* ... */ };

  return {
    violations,
    loading,
    error,
    fetchViolations,
    addViolation,
    updateViolation,
    deleteViolation
  };
};
```

## 디렉토리 구조

```
src/
├── lib/                    # 비즈니스 로직 (순수 함수)
│   ├── violations.ts       # 벌금 관련 함수들
│   ├── rules.ts           # 규칙 관련 함수들
│   ├── rewards.ts         # 보상 관련 함수들
│   ├── auth.ts            # 인증 관련 함수들
│   ├── couple.ts          # 커플 관련 함수들
│   └── utils.ts           # 유틸리티 함수들
│
├── hooks/                 # React 커스텀 훅
│   ├── useViolations.ts
│   ├── useRules.ts
│   ├── useRewards.ts
│   ├── useAuth.ts
│   └── useCouple.ts
│
├── api/                   # API 통신 함수
│   ├── supabase.ts        # Supabase 클라이언트
│   ├── violations.api.ts  # 벌금 API
│   ├── rules.api.ts       # 규칙 API
│   └── rewards.api.ts     # 보상 API
│
├── utils/                 # 공통 유틸리티
│   ├── validators.ts      # 검증 함수들
│   ├── formatters.ts      # 포맷팅 함수들
│   ├── constants.ts       # 상수 정의
│   └── types.ts          # 타입 정의
│
├── components/           # UI 컴포넌트 (프레젠테이션)
│   ├── common/          # 공통 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   └── features/        # 기능별 컴포넌트
│
└── pages/               # 페이지 컴포넌트 (컨테이너)
```

## 함수 설계 패턴

### 1. 순수 함수 우선
```typescript
// lib/violations.ts
export const calculateTotalFine = (violations: Violation[]): number => {
  return violations.reduce((sum, v) => sum + v.amount, 0);
};

export const filterViolationsByDate = (
  violations: Violation[],
  startDate: Date,
  endDate: Date
): Violation[] => {
  return violations.filter(v => {
    const date = new Date(v.createdAt);
    return date >= startDate && date <= endDate;
  });
};

export const groupViolationsByRule = (
  violations: Violation[]
): Record<string, Violation[]> => {
  return violations.reduce((groups, violation) => {
    const key = violation.ruleId;
    return {
      ...groups,
      [key]: [...(groups[key] || []), violation]
    };
  }, {} as Record<string, Violation[]>);
};
```

### 2. API 함수 분리
```typescript
// api/violations.api.ts
import { supabase } from './supabase';

export const fetchViolations = async (userId: string): Promise<Violation[]> => {
  const { data, error } = await supabase
    .from('violations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createViolation = async (violation: ViolationInput): Promise<Violation> => {
  const { data, error } = await supabase
    .from('violations')
    .insert([violation])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateViolation = async (
  id: string,
  updates: Partial<Violation>
): Promise<Violation> => {
  const { data, error } = await supabase
    .from('violations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteViolation = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('violations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
```

### 3. 유틸리티 함수
```typescript
// utils/validators.ts
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPin = (pin: string): boolean => {
  return /^\d{4}$/.test(pin);
};

export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000;
};

// utils/formatters.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
};

export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  if (hours < 48) return '어제';
  if (hours < 168) return `${Math.floor(hours / 24)}일 전`;
  return formatDate(d);
};
```

### 4. 커스텀 훅 패턴
```typescript
// hooks/useViolations.ts
import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/violations.api';
import * as lib from '../lib/violations';

export const useViolations = (userId: string) => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 데이터 가져오기
  const fetchViolations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchViolations(userId);
      setViolations(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 벌금 추가
  const addViolation = useCallback(async (input: ViolationInput) => {
    setLoading(true);
    setError(null);
    try {
      const newViolation = await api.createViolation(input);
      setViolations(prev => [newViolation, ...prev]);
      return newViolation;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 벌금 수정
  const updateViolation = useCallback(async (id: string, updates: Partial<Violation>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateViolation(id, updates);
      setViolations(prev => prev.map(v => v.id === id ? updated : v));
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 벌금 삭제
  const removeViolation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteViolation(id);
      setViolations(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 계산된 값들
  const totalFine = lib.calculateTotalFine(violations);
  const violationsByRule = lib.groupViolationsByRule(violations);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  return {
    violations,
    loading,
    error,
    totalFine,
    violationsByRule,
    fetchViolations,
    addViolation,
    updateViolation,
    removeViolation
  };
};
```

## 컴포넌트 패턴

### 1. 프레젠테이션 컴포넌트
```typescript
// components/features/ViolationList.tsx
interface ViolationListProps {
  violations: Violation[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ViolationList: React.FC<ViolationListProps> = ({
  violations,
  onEdit,
  onDelete
}) => {
  // UI만 담당, 로직 없음
  return (
    <div className="space-y-2">
      {violations.map(violation => (
        <ViolationCard
          key={violation.id}
          violation={violation}
          onEdit={() => onEdit?.(violation.id)}
          onDelete={() => onDelete?.(violation.id)}
        />
      ))}
    </div>
  );
};
```

### 2. 컨테이너 컴포넌트
```typescript
// pages/Violations.tsx
export const ViolationsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    violations,
    loading,
    error,
    totalFine,
    addViolation,
    updateViolation,
    removeViolation
  } = useViolations(user?.id || '');

  const handleAdd = async (data: ViolationInput) => {
    try {
      await addViolation(data);
      toast.success('벌금이 추가되었어요! 💸');
    } catch (err) {
      toast.error('추가하지 못했어요 😢');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <ViolationStats total={totalFine} count={violations.length} />
      <AddViolationForm onSubmit={handleAdd} />
      <ViolationList
        violations={violations}
        onEdit={(id) => /* 수정 모달 열기 */}
        onDelete={removeViolation}
      />
    </div>
  );
};
```

## 테스트 전략

### 1. 단위 테스트 (순수 함수)
```typescript
// lib/__tests__/violations.test.ts
import { calculateTotalFine, filterViolationsByDate } from '../violations';

describe('calculateTotalFine', () => {
  it('should calculate total correctly', () => {
    const violations = [
      { id: '1', amount: 1000 },
      { id: '2', amount: 2000 },
      { id: '3', amount: 3000 }
    ];
    expect(calculateTotalFine(violations)).toBe(6000);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotalFine([])).toBe(0);
  });
});
```

### 2. 훅 테스트
```typescript
// hooks/__tests__/useViolations.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useViolations } from '../useViolations';

describe('useViolations', () => {
  it('should fetch violations on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useViolations('user-123')
    );
    
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.violations).toHaveLength(3);
  });
});
```

## 에러 처리 패턴

### 1. 에러 타입 정의
```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const handleError = (error: unknown): string => {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다';
};
```

### 2. 에러 처리 함수
```typescript
// lib/errorHandlers.ts
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  errorMessage: string = '작업 중 오류가 발생했습니다'
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);
    throw new AppError(errorMessage, 'OPERATION_FAILED');
  }
};

// 사용 예
const result = await withErrorHandling(
  () => api.createViolation(data),
  '벌금을 추가하지 못했습니다'
);
```

## 성능 최적화 패턴

### 1. 메모이제이션
```typescript
// hooks/useOptimizedViolations.ts
import { useMemo } from 'react';

export const useOptimizedViolations = (violations: Violation[]) => {
  // 비용이 큰 계산은 메모이제이션
  const stats = useMemo(() => ({
    total: calculateTotalFine(violations),
    byRule: groupViolationsByRule(violations),
    byMonth: groupViolationsByMonth(violations)
  }), [violations]);

  return stats;
};
```

### 2. 지연 로딩
```typescript
// utils/lazyImports.ts
import { lazy } from 'react';

export const LazyCalendar = lazy(() => 
  import('../pages/Calendar').then(module => ({
    default: module.CalendarPage
  }))
);
```

## 상태 관리 패턴

### 1. 로컬 상태 (useState)
```typescript
// 단순한 UI 상태
const [isModalOpen, setIsModalOpen] = useState(false);
```

### 2. 컨텍스트 (복잡한 공유 상태)
```typescript
// contexts/AppContext.tsx
interface AppState {
  violations: Violation[];
  rules: Rule[];
  rewards: Reward[];
}

const AppContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppContext not found');
  return context;
};
```

### 3. 서버 상태 (React Query 또는 SWR 추천)
```typescript
// 향후 도입 시
import { useQuery, useMutation } from '@tanstack/react-query';

export const useViolationsQuery = (userId: string) => {
  return useQuery({
    queryKey: ['violations', userId],
    queryFn: () => api.fetchViolations(userId),
    staleTime: 5 * 60 * 1000, // 5분
  });
};
```

## 개발 가이드라인

### 1. 함수 작성 규칙
- 함수는 하나의 일만 수행
- 함수명은 동사로 시작 (get, set, create, update, delete, calculate, format, validate)
- 순수 함수 우선
- 부수 효과가 있는 함수는 명확히 표시

### 2. 파일 구성 규칙
- 한 파일에 관련된 함수들만 모음
- 파일당 200줄 이하 유지
- export는 파일 끝에 모아서

### 3. 타입 정의 규칙
- interface는 객체 타입에 사용
- type은 유니온 타입, 유틸리티 타입에 사용
- 공통 타입은 types.ts에 정의

### 4. 네이밍 컨벤션
- 함수: camelCase
- 컴포넌트: PascalCase
- 상수: UPPER_SNAKE_CASE
- 파일명: 컴포넌트는 PascalCase, 그 외는 camelCase

## 향후 확장 계획

### Phase 1 (현재)
- 기본 CRUD 함수 구현
- 로컬 상태 관리
- 테스트 모드

### Phase 2
- Supabase 실제 연동
- 에러 처리 강화
- 로딩 상태 개선

### Phase 3
- React Query 도입
- 성능 최적화
- 테스트 커버리지 80%

### Phase 4
- 실시간 동기화
- 오프라인 지원
- 푸시 알림

---

*최종 업데이트: 2025-08-07*
*이 문서는 프로젝트의 핵심 개발 가이드라인입니다.*