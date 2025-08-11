import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import type { AuthSession } from '@supabase/supabase-js';
import { isTestMode, getTestUser } from '../utils/testHelper';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; success?: boolean; message?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; success?: boolean; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'display_name' | 'avatar_url'>>) => Promise<void>;
  isDebugMode: boolean;
  debugLogin: (testAccountNumber: 1 | 2) => Promise<{ error?: string; success?: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 테스트 계정 정보
const TEST_ACCOUNTS = {
  1: {
    id: 'd35ee66f-edef-440d-ace1-acf089a34381',
    email: 'racidcho@gmail.com',
    display_name: '테스트 사용자 1',
    couple_code: 'TEST01'
  },
  2: {
    id: '10969e2b-35e8-40c7-9a38-598159ff47e8',
    email: 'racidcho@naver.com', 
    display_name: '테스트 사용자 2',
    couple_code: 'TEST01'
  }
} as const;

const DEBUG_COUPLE_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDebugMode] = useState(() => isTestMode());
  const [initialized, setInitialized] = useState(false);

  // 사용자 정보 새로고침 함수
  const refreshUser = async (currentSession?: AuthSession | null) => {
    const sessionToUse = currentSession || session;
    console.log('🔄 refreshUser 시작 - session 체크:', !!sessionToUse, sessionToUse?.user?.id);
    
    if (!sessionToUse?.user) {
      console.log('❌ refreshUser: 세션 또는 사용자 없음');
      setUser(null);
      return;
    }

    try {
      console.log('🔄 사용자 정보 새로고침 시작... 사용자 ID:', sessionToUse.user.id);
      
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionToUse.user.id)
        .single();

      console.log('📊 Supabase 조회 결과:', { userData, error });

      if (userData && !error) {
        console.log('✅ 사용자 정보 로드 성공, setUser 호출:', userData.email);
        setUser(userData);
        console.log('✅ setUser 완료');
      } else if (error?.code === 'PGRST116') {
        console.log('⚠️ 사용자 프로필 없음, 새로 생성 시도...');
        // 사용자가 profiles 테이블에 없음 - 새로 생성
        const newUser: Omit<User, 'id'> = {
          email: sessionToUse.user.email || '',
          display_name: sessionToUse.user.user_metadata?.display_name ||
                       sessionToUse.user.email?.split('@')[0] || '사용자',
          created_at: new Date().toISOString()
        };

        const { data: createdUser, error: createError } = await supabase
          .from('profiles')
          .insert({ ...newUser, id: sessionToUse.user.id })
          .select()
          .single();

        console.log('📊 사용자 생성 결과:', { createdUser, createError });

        if (createdUser && !createError) {
          console.log('✅ 새 사용자 생성 완료, setUser 호출:', createdUser.email);
          setUser(createdUser);
          console.log('✅ 새 사용자 setUser 완료');
        } else {
          console.log('⚠️ DB 생성 실패, fallback 사용자 생성:', createError);
          // DB 생성 실패 시 fallback 사용자 설정
          const fallbackUser: User = {
            id: sessionToUse.user.id,
            email: sessionToUse.user.email || '',
            display_name: sessionToUse.user.email?.split('@')[0] || '사용자',
            created_at: new Date().toISOString()
          };
          console.log('🔧 fallback 사용자 setUser 호출:', fallbackUser.email);
          setUser(fallbackUser);
          console.log('✅ fallback setUser 완료');
        }
      } else {
        console.log('⚠️ 사용자 조회 실패, 다른 에러:', error);
        // 기타 에러 - fallback 사용자 설정
        const fallbackUser: User = {
          id: sessionToUse.user.id,
          email: sessionToUse.user.email || '',
          display_name: sessionToUse.user.email?.split('@')[0] || '사용자',
          created_at: new Date().toISOString()
        };
        console.log('🔧 기타 에러 fallback 사용자 setUser 호출:', fallbackUser.email);
        setUser(fallbackUser);
        console.log('✅ 기타 에러 fallback setUser 완료');
      }
    } catch (error) {
      console.error('❌ 사용자 정보 새로고침 실패:', error);
      
      // 에러 발생 시에도 세션이 있으면 기본 사용자 설정
      if (sessionToUse?.user) {
        console.log('🔧 에러 발생 시 fallback 사용자 생성 시도...');
        const fallbackUser: User = {
          id: sessionToUse.user.id,
          email: sessionToUse.user.email || '',
          display_name: sessionToUse.user.email?.split('@')[0] || '사용자',
          created_at: new Date().toISOString()
        };
        console.log('🔧 에러 발생 시 fallback setUser 호출:', fallbackUser.email);
        setUser(fallbackUser);
        console.log('✅ 에러 발생 시 fallback setUser 완료');
      } else {
        console.log('❌ 에러 발생 시 세션도 없음');
      }
    }
    console.log('🏁 refreshUser 완료');
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      console.log('🔐 로그인 시도:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('❌ 로그인 실패:', error.message);
        return { error: error.message };
      }

      if (data.session) {
        console.log('✅ 로그인 성공:', data.session.user.email);
        // setSession과 refreshUser는 onAuthStateChange에서 자동 처리됨
        return { success: true, message: '로그인 성공!' };
      }

      return { error: '로그인에 실패했습니다.' };
    } catch (error) {
      console.error('💥 로그인 오류:', error);
      return { error: '예상치 못한 오류가 발생했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      console.log('🎉 회원가입 시도:', email);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('❌ 회원가입 실패:', error.message);
        return { error: error.message };
      }

      if (data.session) {
        console.log('✅ 회원가입 및 자동 로그인 성공!');
        // setSession과 refreshUser는 onAuthStateChange에서 자동 처리됨
        return { success: true, message: '회원가입 성공!' };
      } else if (data.user) {
        console.log('📧 이메일 확인 필요');
        return { success: true, message: '회원가입 성공! 이메일을 확인해주세요.' };
      }

      return { error: '회원가입에 실패했습니다.' };
    } catch (error) {
      console.error('💥 회원가입 오류:', error);
      return { error: '예상치 못한 오류가 발생했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);

    try {
      console.log('🔑 비밀번호 재설정 요청:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('❌ 비밀번호 재설정 실패:', error.message);
        return { error: error.message };
      }

      console.log('✅ 비밀번호 재설정 이메일 발송 성공');
      return { success: true, message: '비밀번호 재설정 이메일을 발송했습니다.' };
    } catch (error) {
      console.error('💥 비밀번호 재설정 오류:', error);
      return { error: '예상치 못한 오류가 발생했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    console.log('👋 로그아웃 시작...');
    
    try {
      await supabase.auth.signOut();
      // 세션과 사용자 정리는 onAuthStateChange에서 자동 처리됨
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
      // 오류가 발생해도 로컬 상태 정리
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'display_name' | 'avatar_url'>>) => {
    if (!user) throw new Error('No user found');

    // 즉시 로컬 상태 업데이트 (UI 반응성)
    setUser(prev => prev ? { ...prev, ...updates } : prev);

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      // 에러 시 롤백
      await refreshUser();
      throw new Error(error.message);
    }
  };

  // 디버그 모드 전용 테스트 로그인
  const debugLogin = async (testAccountNumber: 1 | 2) => {
    if (!isDebugMode) {
      return { error: 'Debug mode not active' };
    }

    setIsLoading(true);
    
    try {
      const testAccount = TEST_ACCOUNTS[testAccountNumber];
      console.log(`🔧 DEBUG: 테스트 계정 ${testAccountNumber} 로그인:`, testAccount.email);
      
      const testUser: User = {
        id: testAccount.id,
        email: testAccount.email,
        display_name: testAccount.display_name,
        created_at: new Date().toISOString(),
        couple_id: DEBUG_COUPLE_ID
      };

      setUser(testUser);
      setSession({
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: testAccount.id,
          email: testAccount.email,
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: { display_name: testAccount.display_name },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
      
      console.log(`✅ DEBUG: 테스트 계정 ${testAccountNumber} 로그인 성공!`);
      return { success: true };
    } catch (error) {
      console.error('❌ DEBUG: 테스트 계정 로그인 실패:', error);
      return { error: 'Debug login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 초기화 함수
    const initializeAuth = async () => {
      console.log('🚀 인증 초기화 시작...');
      
      try {
        // 테스트 모드 확인
        if (isTestMode() && mounted) {
          const testUser = getTestUser();
          if (testUser) {
            const mockUser: User = {
              id: testUser.id,
              email: testUser.email,
              display_name: testUser.display_name,
              created_at: new Date().toISOString(),
              couple_id: '96e3ffc4-fc47-418c-81c5-2a020701a95b'
            };

            setUser(mockUser);
            setSession({
              access_token: 'test-token',
              refresh_token: 'test-refresh-token',
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'bearer',
              user: {
                id: testUser.id,
                email: testUser.email,
                aud: 'authenticated',
                role: 'authenticated',
                app_metadata: {},
                user_metadata: { display_name: testUser.display_name },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            });
            
            console.log('✅ 테스트 모드 자동 로그인 완료');
            if (mounted) {
              setIsLoading(false);
              setInitialized(true);
            }
            return;
          }
        }

        // 현재 세션 확인 - Supabase가 자동으로 localStorage에서 복구함
        console.log('📡 Supabase getSession 호출...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ 초기 세션 확인 실패:', error);
        } else {
          console.log('🔍 초기 세션 상태:', session ? '세션 있음' : '세션 없음');
          console.log('📊 세션 상세:', session ? {
            user_id: session.user?.id,
            email: session.user?.email,
            expires_at: session.expires_at
          } : 'null');
          
          if (session && mounted) {
            console.log('🔄 setSession 호출...');
            setSession(session);
            console.log('🔄 refreshUser 호출 시작 (세션 직접 전달)...');
            await refreshUser(session);
            console.log('✅ 초기 세션 복구 완료');
          }
        }
      } catch (error) {
        console.error('💥 인증 초기화 실패:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setInitialized(true);
        }
      }
    };

    // 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || !initialized) return;
        
        console.log('🔔 Auth Event:', event, 'Session:', !!session);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            setSession(session);
            await refreshUser(session);
            console.log('✅ 로그인/토큰 갱신 처리 완료');
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          console.log('👋 로그아웃 처리 완료');
        }
      }
    );

    // 초기화 실행
    initializeAuth();

    // 정리 함수
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUser,
    updateProfile,
    isDebugMode,
    debugLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};