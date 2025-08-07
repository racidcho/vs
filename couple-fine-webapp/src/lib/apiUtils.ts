// 🛡️ API 유틸리티 - 스키마 변경에 대응하는 안전한 헬퍼 함수들
import { supabase } from './supabase';

/**
 * 안전한 API 호출 래퍼
 * 스키마 변경, 네트워크 오류, 권한 문제 등을 포괄적으로 처리
 */
export const safeApiCall = async <T>(
  apiFunction: () => Promise<T>,
  fallbackValue: T,
  context: string = '데이터 처리'
): Promise<T> => {
  try {
    return await apiFunction();
  } catch (error: any) {
    console.warn(`${context} 중 오류:`, error.message);
    
    // 스키마 변경 관련 오류
    if (error.message?.includes('42P01') || error.message?.includes('42703')) {
      console.error(`⚠️ 데이터베이스 스키마가 변경되었습니다. 관리자에게 문의하세요.`);
      throw new Error('앱이 업데이트되었습니다. 새로고침해주세요.');
    }
    
    // 네트워크 연결 문제
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('네트워크 연결을 확인해주세요.');
    }
    
    // 권한 문제
    if (error.message?.includes('RLS') || error.message?.includes('permission')) {
      throw new Error('접근 권한이 없습니다. 다시 로그인해주세요.');
    }
    
    // 일반적인 오류는 기본값 반환
    return fallbackValue;
  }
};

/**
 * 배치 API 호출 헬퍼
 * 여러 API 호출을 안전하게 병렬 처리
 */
export const safeBatchApiCall = async <T>(
  apiCalls: Array<() => Promise<T>>,
  fallbackValues: T[],
  context: string = '배치 처리'
): Promise<T[]> => {
  const promises = apiCalls.map(async (apiCall, index) => {
    try {
      return await apiCall();
    } catch (error: any) {
      console.warn(`${context}[${index}] 오류:`, error.message);
      return fallbackValues[index];
    }
  });

  try {
    return await Promise.all(promises);
  } catch (error) {
    console.error(`${context} 전체 실패:`, error);
    return fallbackValues;
  }
};

/**
 * 재시도 로직이 있는 API 호출
 * 일시적인 오류에 대해 자동 재시도
 */
export const retryApiCall = async <T>(
  apiFunction: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context: string = 'API 호출'
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error: any) {
      lastError = error;
      
      // 재시도하지 않아야 할 오류들
      const nonRetryableErrors = ['42P01', '42703', 'PGRST116', '23505'];
      if (nonRetryableErrors.some(code => error.message?.includes(code))) {
        throw error;
      }
      
      if (attempt === maxRetries) break;
      
      console.warn(`${context} 시도 ${attempt}/${maxRetries} 실패:`, error.message);
      
      // 지수 백오프로 대기
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError;
};

/**
 * 데이터 유효성 검사 헬퍼
 * 스키마 변경으로 인한 필드 누락 대응
 */
export const validateAndSanitizeData = <T extends Record<string, any>>(
  data: any,
  requiredFields: (keyof T)[],
  defaultValues: Partial<T> = {}
): T => {
  if (!data || typeof data !== 'object') {
    throw new Error('유효하지 않은 데이터 형식입니다');
  }

  const sanitizedData = { ...data };

  // 필수 필드 검사 및 기본값 설정
  requiredFields.forEach(field => {
    if (sanitizedData[field] === undefined || sanitizedData[field] === null) {
      if (defaultValues[field] !== undefined) {
        sanitizedData[field] = defaultValues[field];
      } else {
        throw new Error(`필수 필드가 누락되었습니다: ${String(field)}`);
      }
    }
  });

  return sanitizedData as T;
};

/**
 * API 응답 캐시 헬퍼
 * 동일한 요청의 중복 호출 방지
 */
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // TTL 체크
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const apiCache = new ApiCache();

/**
 * 캐시가 적용된 안전한 API 호출
 */
export const cachedApiCall = async <T>(
  key: string,
  apiFunction: () => Promise<T>,
  fallbackValue: T,
  ttl: number = 5 * 60 * 1000,
  context: string = '캐시된 API 호출'
): Promise<T> => {
  // 캐시에서 먼저 확인
  const cachedResult = apiCache.get<T>(key);
  if (cachedResult !== null) {
    return cachedResult;
  }

  try {
    const result = await safeApiCall(apiFunction, fallbackValue, context);
    
    // 성공적인 결과만 캐시
    if (result !== fallbackValue) {
      apiCache.set(key, result, ttl);
    }
    
    return result;
  } catch (error) {
    // API 호출 실패시 캐시된 만료된 데이터라도 반환 시도
    const expiredCached = (apiCache as any).cache.get(key);
    if (expiredCached) {
      console.warn(`${context}: 만료된 캐시 데이터 사용`);
      return expiredCached.data as T;
    }
    
    throw error;
  }
};

/**
 * 오류 로깅 및 분석을 위한 헬퍼
 */
export const logApiError = (
  context: string,
  error: any,
  additionalData?: Record<string, any>
) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack,
    },
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...additionalData
  };

  // 개발 환경에서는 콘솔에 출력
  if (import.meta.env.DEV) {
    console.error('API Error Details:', errorInfo);
  }

  // 프로덕션에서는 외부 로깅 서비스로 전송 (예: Sentry, LogRocket 등)
  // sendToLoggingService(errorInfo);
};

/**
 * 스키마 호환성 체크
 * 새로운 필드가 추가되거나 기존 필드가 변경되었는지 확인
 */
export const checkSchemaCompatibility = async (
  tableName: string,
  expectedColumns: string[]
): Promise<{ compatible: boolean; missing: string[]; extra: string[] }> => {
  try {
    // 실제 테이블 구조 확인을 위한 더미 쿼리
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      return { compatible: false, missing: expectedColumns, extra: [] };
    }

    if (!data || data.length === 0) {
      // 데이터가 없어도 스키마는 확인 가능하다고 가정
      return { compatible: true, missing: [], extra: [] };
    }

    const actualColumns = Object.keys(data[0]);
    const missing = expectedColumns.filter(col => !actualColumns.includes(col));
    const extra = actualColumns.filter(col => !expectedColumns.includes(col));

    return {
      compatible: missing.length === 0,
      missing,
      extra
    };
  } catch (error) {
    return { compatible: false, missing: expectedColumns, extra: [] };
  }
};

// 타입스크립트 타입 가드 헬퍼들
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isPositiveNumber = (value: any): value is number => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

/**
 * 사용자 친화적 오류 메시지 변환
 */
export const getFriendlyErrorMessage = (error: any): string => {
  const errorCode = error?.code;
  const errorMessage = error?.message || '';

  const friendlyMessages: Record<string, string> = {
    'PGRST116': '데이터를 찾을 수 없습니다',
    '23505': '이미 존재하는 데이터입니다',
    '23503': '관련된 데이터가 없습니다',
    '42P01': '데이터베이스가 업데이트되었습니다. 페이지를 새로고침해주세요',
    '42703': '데이터 구조가 변경되었습니다. 앱을 새로고침해주세요',
    'auth/invalid-email': '올바른 이메일 주소를 입력해주세요',
    'auth/user-not-found': '등록되지 않은 이메일입니다',
    'auth/too-many-requests': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
    'network-error': '네트워크 연결을 확인해주세요',
    'timeout': '요청 시간이 초과되었습니다. 다시 시도해주세요'
  };

  // 에러 코드가 있으면 해당 메시지 반환
  if (errorCode && friendlyMessages[errorCode]) {
    return friendlyMessages[errorCode];
  }

  // 에러 메시지에서 패턴 매칭
  for (const [pattern, message] of Object.entries(friendlyMessages)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // 기본 메시지
  return '오류가 발생했습니다. 다시 시도해주세요';
};