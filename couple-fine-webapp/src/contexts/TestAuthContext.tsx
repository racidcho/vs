import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import type { AuthSession } from '@supabase/supabase-js';

// 테스트용 AuthContext - 이메일 인증 우회
interface TestAuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  signInDirectly: (email: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'display_name'>>) => Promise<void>;
}

const TestAuthContext = createContext<TestAuthContextType | undefined>(undefined);

export const useTestAuth = () => {
  const context = useContext(TestAuthContext);
  if (!context) {
    throw new Error('useTestAuth must be used within a TestAuthProvider');
  }
  return context;
};

interface TestAuthProviderProps {
  children: React.ReactNode;
}

// 테스트 사용자 데이터
const TEST_USERS = {
  'ABC@NAVER.COM': {
    id: 'test-user-abc-123',
    email: 'ABC@NAVER.COM',
    display_name: '테스트사용자A'
  },
  'DDD@GMAIL.COM': {
    id: 'test-user-ddd-456', 
    email: 'DDD@GMAIL.COM',
    display_name: '테스트사용자B'
  }
};

export const TestAuthProvider: React.FC<TestAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading to check session

  // Session persistence keys
  const SESSION_STORAGE_KEY = 'test-auth-session';
  const USER_STORAGE_KEY = 'test-auth-user';

  const refreshUser = async () => {
    console.log('🔄 TEST: refreshUser 호출');
    if (!session?.user) {
      console.log('❌ TEST: 세션 없음');
      setUser(null);
      return;
    }

    try {
      // 테스트 사용자 데이터에서 가져오기
      const testUserEmail = session.user.email?.toUpperCase();
      const testUserData = testUserEmail ? TEST_USERS[testUserEmail as keyof typeof TEST_USERS] : null;
      
      if (testUserData) {
        console.log('✅ TEST: 테스트 사용자 데이터 사용:', testUserData.email);
        
        // 데이터베이스에서 실제 사용자 정보 조회 시도
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', testUserData.email)
          .single();

        if (userData && !error) {
          console.log('✅ TEST: DB에서 사용자 정보 로드됨');
          setUser(userData);
        } else {
          console.log('⚠️ TEST: DB에 사용자 없음, 테스트 사용자로 설정');
          const testUser: User = {
            id: testUserData.id,
            email: testUserData.email,
            display_name: testUserData.display_name,
            created_at: new Date().toISOString()
          };
          setUser(testUser);
        }
      } else {
        console.log('❌ TEST: 알 수 없는 테스트 사용자');
        setUser(null);
      }
    } catch (error) {
      console.error('💥 TEST: refreshUser 오류:', error);
      setUser(null);
    }
  };

  // 직접 로그인 (이메일 인증 우회)
  const signInDirectly = async (email: string) => {
    console.log('🚀 TEST: 직접 로그인 시도:', email);
    setIsLoading(true);

    try {
      const normalizedEmail = email.toUpperCase();
      const testUserData = TEST_USERS[normalizedEmail as keyof typeof TEST_USERS];

      if (!testUserData) {
        return { error: '허용된 테스트 사용자가 아닙니다. ABC@NAVER.COM 또는 DDD@GMAIL.COM을 사용하세요.' };
      }

      // 가짜 세션 생성
      const fakeSession: AuthSession = {
        access_token: `test-token-${testUserData.id}`,
        refresh_token: `test-refresh-${testUserData.id}`,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: testUserData.id,
          email: testUserData.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: {
            display_name: testUserData.display_name
          },
          identities: []
        }
      };

      console.log('✅ TEST: 가짜 세션 생성:', fakeSession.user.email);
      setSession(fakeSession);
      
      // 직접 사용자 설정 (세션 업데이트 대기 안함)
      const testUser: User = {
        id: testUserData.id,
        email: testUserData.email,
        display_name: testUserData.display_name,
        created_at: new Date().toISOString(),
        couple_id: 'test-couple-123' // 테스트용 커플 ID 미리 설정
      };
      setUser(testUser);
      console.log('✅ TEST: 사용자 직접 설정:', testUser.email);
      
      // 세션과 사용자 정보 localStorage에 저장
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fakeSession));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(testUser));
        console.log('💾 TEST: 세션 정보 localStorage에 저장됨');
      } catch (error) {
        console.warn('⚠️ TEST: localStorage 저장 실패:', error);
      }
      
      return { success: true };
    } catch (error) {
      console.error('💥 TEST: 로그인 오류:', error);
      return { error: '로그인 중 오류가 발생했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('👋 TEST: 로그아웃');
    setUser(null);
    setSession(null);
    
    // localStorage에서 세션 정보 제거
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      console.log('🗑️ TEST: localStorage에서 세션 정보 제거됨');
    } catch (error) {
      console.warn('⚠️ TEST: localStorage 제거 실패:', error);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'display_name'>>) => {
    if (!user) throw new Error('사용자가 없습니다.');

    console.log('📝 TEST: 프로필 업데이트:', updates);

    // 실제 데이터베이스 업데이트 시도
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.warn('⚠️ TEST: DB 업데이트 실패, 로컬만 업데이트:', error);
      }

      // 로컬 사용자 정보 업데이트
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.warn('⚠️ TEST: 프로필 업데이트 오류:', error);
      // 로컬만 업데이트
      setUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // 컴포넌트 마운트 시 localStorage에서 세션 복원
  useEffect(() => {
    const restoreSession = async () => {
      console.log('🔄 TEST: 세션 복원 시도');
      try {
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        
        if (storedSession && storedUser) {
          const parsedSession: AuthSession = JSON.parse(storedSession);
          const parsedUser: User = JSON.parse(storedUser);
          
          // 세션 유효성 검사 (만료 시간 확인)
          if (parsedSession.expires_at && parsedSession.expires_at > Math.floor(Date.now() / 1000)) {
            console.log('✅ TEST: 저장된 세션 복원됨:', parsedUser.email);
            setSession(parsedSession);
            setUser(parsedUser);
          } else {
            console.log('⚠️ TEST: 저장된 세션 만료됨');
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
          }
        } else {
          console.log('ℹ️ TEST: 저장된 세션 없음');
        }
      } catch (error) {
        console.warn('⚠️ TEST: 세션 복원 실패:', error);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const value: TestAuthContextType = {
    user,
    session,
    isLoading,
    signInDirectly,
    signOut,
    refreshUser,
    updateProfile
  };

  return (
    <TestAuthContext.Provider value={value}>
      {children}
    </TestAuthContext.Provider>
  );
};