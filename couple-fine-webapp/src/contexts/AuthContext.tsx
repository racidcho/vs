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

// 테스트 모드 감지 - testHelper.ts의 isTestMode 사용

// 테스트 계정 정보 - 실제 존재하는 사용자 ID 사용 (Foreign Key 제약조건 해결)
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

// 디버그 모드에서 사용할 실제 커플 ID
const DEBUG_COUPLE_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const getProfileCacheKey = (email: string) => `cached-profile-${email}`;

const cacheUserProfile = (user: User | null) => {
  if (typeof window === 'undefined' || !user?.email) return;
  try {
    localStorage.setItem(getProfileCacheKey(user.email), JSON.stringify(user));
  } catch (error) {
    console.warn('⚠️ 사용자 프로필 캐시 실패:', error);
  }
};

const loadCachedUserProfile = (email?: string | null): User | null => {
  if (typeof window === 'undefined' || !email) return null;
  try {
    const cached = localStorage.getItem(getProfileCacheKey(email));
    if (!cached) return null;
    return JSON.parse(cached) as User;
  } catch (error) {
    console.warn('⚠️ 사용자 프로필 캐시 로드 실패:', error);
    return null;
  }
};

const clearCachedUserProfile = (email?: string | null) => {
  if (typeof window === 'undefined' || !email) return;
  try {
    localStorage.removeItem(getProfileCacheKey(email));
  } catch (error) {
    console.warn('⚠️ 사용자 프로필 캐시 정리 실패:', error);
  }
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDebugMode] = useState(() => isTestMode());
  const [isAuthenticating, setIsAuthenticating] = useState(false); // 로그인 중 플래그
  const [isRefreshingSession, setIsRefreshingSession] = useState(false); // 토큰 갱신 중 플래그 (전역 관리)

  const refreshUser = async () => {

    // 8초 타임아웃 설정 (모바일 브라우저 고려)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('사용자 정보 로딩 시간 초과')), 8000);
    });

    // Get current session from Supabase (with timeout)
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      timeoutPromise
    ]).catch(err => {
      return { data: { session: null } };
    });

    const { data: { session: currentSession } } = sessionResult as any;

    if (!currentSession?.user) {

      if (typeof window !== 'undefined') {
        const lastEmail = localStorage.getItem('current-user-email');
        clearCachedUserProfile(lastEmail);
      }
      setUser(null);
      return;
    }

    // Update session state
    setSession(currentSession);

    try {
      // First try to get existing user (with timeout)

      const { data: userData, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single(),
        timeoutPromise
      ]).catch(err => {
        return { data: null, error: err };
      }) as any;

      if (userData && !error) {

        setUser(userData);
        cacheUserProfile(userData);
      } else if (error?.code === 'PGRST116') {

        // User doesn't exist in our profiles table, create them
        // For OTP login, email is automatically confirmed
        const newUser: Omit<User, 'id'> = {
          email: currentSession.user.email || '',
          display_name: currentSession.user.user_metadata?.display_name ||
                       currentSession.user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString()
        };

        const { data: createdUser, error: createError } = await supabase
          .from('profiles')
          .insert({ ...newUser, id: currentSession.user.id })
          .select()
          .single();

        if (createdUser && !createError) {

          setUser(createdUser);
          cacheUserProfile(createdUser);
        } else {
          // Even if database creation fails, set a minimal user object
          // This prevents the login loop
          const fallbackUser: User = {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            display_name: currentSession.user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString()
          };

          setUser(fallbackUser);
          cacheUserProfile(fallbackUser);
        }
      } else {
        // Set fallback user to prevent login loop
        const fallbackUser: User = {
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          display_name: currentSession.user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString()
        };

        setUser(fallbackUser);
        cacheUserProfile(fallbackUser);
      }
    } catch (error) {
      // Even on error, if we have a session, set a minimal user
      if (currentSession?.user) {
        const fallbackUser: User = {
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          display_name: currentSession.user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString()
        };

        setUser(fallbackUser);
        cacheUserProfile(fallbackUser);
      } else {
        setUser(null);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      console.log('🔐 로그인 시도:', email);

      // 스토리지 키가 올바르게 생성되도록 먼저 현재 사용자 이메일 저장
      const trimmedEmail = email.trim();
      localStorage.setItem('current-user-email', trimmedEmail);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password
      });

      if (error) {
        console.error('❌ 로그인 실패:', error.message);
        return { error: error.message };
      }

      if (data.session) {
        console.log('✅ 로그인 성공:', data.session.user.email);
        setSession(data.session);
        
        // 세션 토큰을 사용자별 localStorage에 저장
        const tokenKey = `sb-auth-token-${trimmedEmail}`;
        const tokenPayload = JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        localStorage.setItem(tokenKey, tokenPayload);
        // 공유 키도 최신 상태로 유지하여 세션 복구가 끊기지 않도록 함
        localStorage.setItem('sb-auth-token', tokenPayload);

        // 사용자 데이터 새로고침
        try {
          await refreshUser();
        } catch (refreshError) {
          console.warn('⚠️ 사용자 데이터 새로고침 실패:', refreshError);
        }

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
      const trimmedEmail = email.trim();
      localStorage.setItem('current-user-email', trimmedEmail);

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
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
        setSession(data.session);
        
        // 세션 토큰을 사용자별 localStorage에 저장
        const tokenKey = `sb-auth-token-${trimmedEmail}`;
        const tokenPayload = JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        localStorage.setItem(tokenKey, tokenPayload);
        localStorage.setItem('sb-auth-token', tokenPayload);

        // 사용자 데이터 새로고침
        try {
          await refreshUser();
        } catch (refreshError) {
          console.warn('⚠️ 사용자 데이터 새로고침 실패:', refreshError);
        }

        return { success: true, message: '회원가입 성공!' };
      } else if (data.user) {
        // 이메일 확인이 필요한 경우 (Supabase 설정에 따라)
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
      return { success: true, message: '비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.' };
    } catch (error) {
      console.error('💥 비밀번호 재설정 오류:', error);
      return { error: '예상치 못한 오류가 발생했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };


  const signOut = async () => {
    // 즉시 UI 상태 업데이트 (사용자 경험 개선)
    setUser(null);
    setSession(null);
    
    // 현재 사용자의 localStorage 즉시 정리
    const currentUserEmail = localStorage.getItem('current-user-email');
    if (currentUserEmail) {
      const tokenKey = `sb-auth-token-${currentUserEmail}`;
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(`lastValidSession-${currentUserEmail}`);
      clearCachedUserProfile(currentUserEmail);
    }
    // 레거시 키들도 정리 (하위 호환성)
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem('lastValidSession');
    localStorage.removeItem('current-user-email');
    
    // 로딩 상태 설정
    setIsLoading(true);
    
    try {
      // Supabase signOut을 타임아웃과 함께 처리
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );
      
      // 5초 타임아웃 설정
      await Promise.race([signOutPromise, timeoutPromise]).catch(err => {
        console.log('Sign out API call failed or timed out:', err);
        // API 호출이 실패해도 로컬 상태는 이미 정리됨
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // 에러가 발생해도 로컬 상태는 이미 정리됨
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'display_name' | 'avatar_url'>>) => {
    if (!user) throw new Error('No user found');

    // Immediately update local state for instant UI feedback
    setUser(prev => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...updates };
      cacheUserProfile(updatedUser as User);
      return updatedUser;
    });

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      // Revert on error
      await refreshUser();
      throw new Error(error.message);
    }

    // 세션 토큰 재저장하여 세션 유지 (사용자별)
    if (session && user?.email) {
      const tokenKey = `sb-auth-token-${user.email}`;
      localStorage.setItem(tokenKey, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      }));
    }

    // Note: Real-time subscription will handle syncing with DB
  };

  // 디버그 모드 전용 테스트 계정 자동 로그인 - 실제 Supabase 인증 사용
  const debugLogin = async (testAccountNumber: 1 | 2) => {
    if (!isDebugMode) {
      return { error: 'Debug mode not active' };
    }

    setIsLoading(true);
    
    try {
      const testAccount = TEST_ACCOUNTS[testAccountNumber];
      console.log(`🔧 DEBUG: 테스트 계정 ${testAccountNumber} 실제 로그인 시도:`, testAccount.email);
      
      // 디버그 모드 전용: 실제 OTP 인증 시도
      console.log('🔧 DEBUG: 실제 OTP 인증 시도 (테스트용)');
      
      // Step 1: OTP 요청
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: testAccount.email,
        options: {
          shouldCreateUser: true,
          data: {
            display_name: testAccount.display_name
          }
        }
      });
      
      if (otpError) {
        console.error('🔧 DEBUG: OTP 요청 실패:', otpError);
        
        // 만약 이미 존재하는 계정이라면 그대로 진행
        if (otpError.message.includes('already registered')) {
          console.log('🔧 DEBUG: 이미 존재하는 계정, OTP 재요청');
          await supabase.auth.signInWithOtp({ email: testAccount.email });
        } else {
          throw new Error('OTP 요청 실패: ' + otpError.message);
        }
      }
      
      console.log('✅ DEBUG: OTP 요청 성공!');
      console.log('🔧 DEBUG: 실제 이메일을 확인하거나 개발자 도구에서 테스트 토큰 사용');
      
      // 개발 환경에서는 콘솔에 안내 메시지 출력
      console.log('📧 DEBUG: 이메일에서 OTP 코드를 확인하거나, 개발자가 수동으로 verifyOtp를 호출해주세요');
      
      // 임시로 세션 없이 사용자 데이터만 설정 (CRUD는 여전히 실패하지만 UI는 표시됨)
      setSession(null);

      // 테스트 사용자 데이터 생성 - 실제 UUID 사용
      const testUser: User = {
        id: testAccount.id, // 실제 존재하는 사용자 ID
        email: testAccount.email,
        display_name: testAccount.display_name,
        created_at: new Date().toISOString(),
        couple_id: DEBUG_COUPLE_ID
      };

      setUser(testUser);
      cacheUserProfile(testUser);
      
      // 로컬스토리지에 디버그 플래그 설정
      localStorage.setItem('debugMode', 'true');
      localStorage.setItem('debugAccount', testAccountNumber.toString());
      
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
    // StrictMode 대응 - mounted 플래그로 언마운트 후 업데이트 방지
    let mounted = true;
    let isRefreshingSession = false; // 토큰 갱신 중 충돌 방지
    
    // Initialize auth state
    setIsLoading(true);

    // 🚀 PROGRESSIVE AUTHENTICATION - 즉시 토큰 체크 (사용자별)
    const currentUserEmail = localStorage.getItem('current-user-email');
    const tokenKey = currentUserEmail ? `sb-auth-token-${currentUserEmail}` : 'sb-auth-token';
    const storedTokens = localStorage.getItem(tokenKey);
    const hasValidTokens = !!storedTokens;
    let restoredFromCache = false;

    if (hasValidTokens && mounted && currentUserEmail) {
      const cachedUser = loadCachedUserProfile(currentUserEmail);
      if (cachedUser) {
        console.log('✅ Progressive Authentication: 캐시된 사용자 즉시 로드');
        setUser(cachedUser);
        setIsLoading(false);
        restoredFromCache = true;
      }
    }
    
    console.log(`🔍 Progressive Authentication: ${hasValidTokens ? '토큰 발견 ✅' : '토큰 없음 ❌'} (user: ${currentUserEmail || 'unknown'})`);
    
    // 토큰이 있으면 즉시 임시 사용자 상태 설정 (login redirect 방지)
    if (hasValidTokens && mounted && !restoredFromCache) {
      try {
        const { access_token, refresh_token } = JSON.parse(storedTokens);
        if (access_token && refresh_token) {
          // 임시 사용자 설정으로 login redirect 방지
          console.log('🛡️ 임시 사용자 설정 - login redirect 방지');
          const tempUser: User = {
            id: 'session-recovering',
            email: 'recovering@session.temp',
            display_name: '세션 복구중...',
            created_at: new Date().toISOString()
          };
          setUser(tempUser);
        }
      } catch (error) {
        console.error('⚠️ 저장된 토큰 파싱 실패:', error);
      }
    }

    // 강제 로딩 완료 메커니즘 - 토큰 여부에 따라 다른 타임아웃
    const emergencyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        const timeoutDuration = hasValidTokens ? 8 : 3;
        console.log(`🚨 ${timeoutDuration}초 긴급 타임아웃 - 무한 로딩 방지`);
        setIsLoading(false);
        
        // 토큰이 없거나 복구 실패 시에만 null 설정
        if (!hasValidTokens && !session) {
          setUser(null);
          setSession(null);
        }
      }
    }, hasValidTokens ? 8000 : 3000); // 토큰 있으면 8초, 없으면 3초

    // localStorage에서 세션 복구 시도 - Progressive Authentication 지원
    const restoreSession = async () => {
      try {
        const storedSession = localStorage.getItem(tokenKey);
        if (storedSession) {
          const { access_token, refresh_token } = JSON.parse(storedSession);
          console.log('🔄 Progressive Authentication: 세션 복구 시작...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (data?.session && mounted) {
            console.log('✅ Progressive Authentication: 세션 복구 성공!');
            setSession(data.session);
            
            // 임시 사용자를 실제 사용자 데이터로 교체
            try {
              await refreshUser();
              console.log('🎯 Progressive Authentication: 실제 사용자 데이터로 교체 완료');
            } catch (refreshError) {
              console.error('⚠️ 사용자 데이터 로드 실패, fallback 사용자 생성:', refreshError);
              // refreshUser 실패해도 세션이 있으니 기본 사용자 생성
              if (data.session.user) {
                const fallbackUser: User = {
                  id: data.session.user.id,
                  email: data.session.user.email || '',
                  display_name: data.session.user.email?.split('@')[0] || '사용자',
                  created_at: new Date().toISOString()
                };
                setUser(fallbackUser);
                console.log('🔧 Progressive Authentication: fallback 사용자 설정 완료');
              }
            }
            
            clearTimeout(emergencyTimeout); // 복구 성공 시 긴급 타임아웃 클리어
            return true;
          } else if (error) {
            console.error('❌ Progressive Authentication: 세션 복구 실패 -', error.message);
            if (mounted) {
              console.log('🧹 Progressive Authentication: 세션 복구 실패로 캐시 정리');
              clearCachedUserProfile(currentUserEmail);
              setUser(null);
              setSession(null);
            }
          }
        }
      } catch (error) {
        console.error('Progressive Authentication 세션 복구 실패:', error);
        // 복구 실패 시 캐시 및 임시 사용자 정리
        if (mounted) {
          console.log('🧹 Progressive Authentication: 복구 실패한 사용자 캐시 정리');
          clearCachedUserProfile(currentUserEmail);
          setUser(null);
          setSession(null);
        }
      }
      return false;
    };

    // Progressive Authentication 타임아웃 - 토큰 여부에 따라 조정
    const initTimeoutDuration = hasValidTokens ? 10000 : 5000; // 토큰 있으면 10초, 없으면 5초
    const initTimeout = setTimeout(() => {
      if (mounted) {
        console.log(`⏰ ${initTimeoutDuration / 1000}초 타임아웃 - 강제 로딩 완료 (Progressive Auth)`);
        setIsLoading(false);
        
        // 토큰이 있었는데 여전히 임시 사용자면 복구 실패로 간주
        if (hasValidTokens && user?.id === 'session-recovering') {
          console.log('⚠️ Progressive Authentication: 복구 시간 초과, 임시 사용자 정리');
          setUser(null);
          setSession(null);
        }
      }
    }, initTimeoutDuration);

    // 테스트 모드 자동 로그인 시도 (비동기, 일반 인증과 병행)
    const tryTestModeLogin = async () => {
      if (isTestMode() && mounted) {
        console.log('🧪 TEST MODE: 자동 로그인 시도...');
        
        const testUser = getTestUser();
        if (testUser) {
          // 테스트 사용자로 자동 로그인
          const mockUser: User = {
            id: testUser.id,
            email: testUser.email,
            display_name: testUser.display_name,
            created_at: new Date().toISOString(),
            couple_id: '96e3ffc4-fc47-418c-81c5-2a020701a95b' // 실제 생성된 커플 ID
          };

          setUser(mockUser);
          cacheUserProfile(mockUser);
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
          
          console.log('✅ 테스트 모드 자동 로그인 성공');
          setIsLoading(false);
          clearTimeout(initTimeout);
          clearTimeout(emergencyTimeout);
          return true;
        }
      }
      return false;
    };

    // localStorage에서 세션 복구 먼저 시도
    restoreSession().then(async (restored) => {
      if (restored) {
        if (mounted) {
          setIsLoading(false);
        }
        clearTimeout(initTimeout);
        clearTimeout(emergencyTimeout); // 복구 성공 시 긴급 타임아웃도 클리어
        return;
      }
      
      // 테스트 모드 로그인 시도 (백그라운드에서 실행)
      tryTestModeLogin();

      // Get initial session with error handling
      supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return; // StrictMode 대응
      
      if (error) {
        console.error('❌ 초기 세션 가져오기 실패:', error);
        setSession(null);
        setUser(null);
        setIsLoading(false);
        clearTimeout(initTimeout);
        return;
      }

      console.log('✅ 초기 세션 확인:', session ? '세션 있음' : '세션 없음');
      setSession(session);
      if (session) {
        try {
          await refreshUser();
        } catch (refreshError) {
          console.error('⚠️ 초기 사용자 로드 실패:', refreshError);
          // Even if refresh fails, we have a session so set basic user
          if (session.user && mounted) {
            const fallbackUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              display_name: session.user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString()
            };
            setUser(fallbackUser);
          }
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
      clearTimeout(initTimeout);
      clearTimeout(emergencyTimeout);
      }).catch((error) => {
        console.error('💥 초기화 중 예외:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
        clearTimeout(initTimeout);
        clearTimeout(emergencyTimeout);
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return; // StrictMode 대응 - 언마운트 후 업데이트 방지
        
        console.log('🔔 Auth Event:', event, 'Session exists:', !!session);
        
        // undefined 이벤트는 무시 (Supabase 버그)
        if (!event || (event as string) === 'undefined') {
          console.log('🔕 undefined 이벤트 무시 - 세션 상태 유지');
          return;
        }
        
        // USER_UPDATED 이벤트 스마트 처리 - 불필요한 세션 갱신 방지
        if (event === 'USER_UPDATED') {
          console.log('📝 USER_UPDATED 이벤트 - 세션 상태 확인');
          if (isRefreshingSession) {
            console.log('⏳ 토큰 갱신 중 - USER_UPDATED 이벤트 스킵');
            return; // 갱신 중이면 스킵하여 충돌 방지
          }
          
          // 세션이 있으면 유지하고 사용자 정보만 갱신
          if (session && mounted) {
            console.log('✅ USER_UPDATED: 세션 유지, 사용자 정보만 갱신');
            setSession(session);
            // 사용자 정보만 갱신 (세션 무효화 방지)
            try {
              await refreshUser();
            } catch (error) {
              console.log('⚠️ USER_UPDATED: 사용자 정보 갱신 실패, 세션은 유지');
            }
          } else if (!session) {
            // 세션이 없을 때만 재확인
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession && mounted) {
              console.log('✅ USER_UPDATED: 세션 복구됨');
              setSession(currentSession);
              await refreshUser();
            }
          }
          return;
        }
        
        // 명시적 로그아웃 이벤트만 즉시 처리
        if (event === 'SIGNED_OUT') {
          console.log('👋 명시적 로그아웃 - 세션 정리');
          if (mounted) {
            setSession(null);
            setUser(null);
          }
          return;
        }
        
        // 로그인 및 토큰 갱신 이벤트
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          console.log('✅ 로그인/토큰갱신 이벤트 처리:', event);
          if (mounted) {
            setSession(session);
            if (session) {
              // SIGNED_IN 이벤트에서 사용자 정보 새로고침 추가
              await refreshUser();
              // 세션 토큰을 사용자별 localStorage에 저장 (페이지 이동 시 복구용)
              const userEmail = session.user?.email;
              if (userEmail) {
                localStorage.setItem('current-user-email', userEmail);
                const tokenKey = `sb-auth-token-${userEmail}`;
                localStorage.setItem(tokenKey, JSON.stringify({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token
                }));
              }
              
              // 세션 정보를 localStorage에 백업 (복구용)
              localStorage.setItem('lastValidSession', JSON.stringify({
                userId: session.user.id,
                email: session.user.email,
                timestamp: Date.now()
              }));
              
              try {
                await refreshUser();
              } catch (refreshError) {
                console.error('⚠️ refreshUser 실패:', refreshError);
                // 세션이 있으니 fallback 사용자 생성
                if (session.user && mounted) {
                  const fallbackUser: User = {
                    id: session.user.id,
                    email: session.user.email || '',
                    display_name: session.user.email?.split('@')[0] || 'User',
                    created_at: new Date().toISOString()
                  };
                  setUser(fallbackUser);
                }
              }
            }
          }
          return;
        }
        
        // 기타 이벤트 처리
        console.log('📋 기타 이벤트 처리:', event);
        if (mounted) {
          if (session) {
            setSession(session);
            try {
              await refreshUser();
            } catch (refreshError) {
              console.error('⚠️ refreshUser 실패:', refreshError);
              if (session.user && mounted) {
                const fallbackUser: User = {
                  id: session.user.id,
                  email: session.user.email || '',
                  display_name: session.user.email?.split('@')[0] || 'User',
                  created_at: new Date().toISOString()
                };
                setUser(fallbackUser);
              }
            }
          } else {
            // 세션이 없는 경우 한 번만 재확인
            console.log('⚠️ 세션 없음 - 재확인 시도');
            const { data: { session: verifySession } } = await supabase.auth.getSession();
            if (verifySession && mounted) {
              console.log('✅ 세션 재확인 성공');
              setSession(verifySession);
              await refreshUser();
            } else if (!verifySession && mounted) {
              console.log('❌ 세션 없음 확인 - 로그아웃');
              setSession(null);
              setUser(null);
            }
          }
        }
      }
    );

    // JWT 토큰 만료 시간 추적 및 자동 갱신 (강화된 버전)
    const checkAndRefreshToken = async (retryCount = 0) => {
      if (!mounted || isRefreshingSession) return; // 갱신 중이면 스킵
      
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔴 세션 확인 오류:', error.message);
          return;
        }
        
        if (currentSession) {
          // JWT 토큰의 만료 시간 확인
          const expiresAt = currentSession.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt ? expiresAt - now : 0;
          
          console.log(`⏰ 토큰 만료까지 ${Math.floor(timeUntilExpiry / 60)}분 남음`);
          
          // 토큰이 15분 이내에 만료되면 즉시 갱신 (더 여유있게)
          if (timeUntilExpiry < 900) { // 15분 = 900초
            console.log('🔄 토큰 만료 임박 - 즉시 갱신 시작!');
            setIsRefreshingSession(true); // 전역 state로 갱신 시작
            
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('❌ 토큰 갱신 실패:', refreshError.message);
              
              // 최대 3회까지 재시도 (지수적 백오프)
              if (retryCount < 3 && mounted) {
                const delay = Math.min(2000 * Math.pow(2, retryCount), 10000); // 2초, 4초, 8초 최대 10초
                console.log(`🔁 토큰 갱신 재시도 ${retryCount + 1}/3 (${delay}ms 후)...`);
                
                setTimeout(async () => {
                  if (mounted) {
                    setIsRefreshingSession(false); // 재시도 전 플래그 해제
                    await checkAndRefreshToken(retryCount + 1);
                  }
                }, delay);
                return; // 재시도 스케줄링 후 리턴
              } else {
                console.error('💥 토큰 갱신 최대 재시도 횟수 초과 - 세션 유지');
                // 재시도 실패해도 즉시 로그아웃하지 않고 세션 유지
              }
              
              setIsRefreshingSession(false);
            } else if (refreshData?.session) {
              console.log('✅ 토큰 갱신 성공! 새 만료 시간:', new Date(refreshData.session.expires_at! * 1000).toLocaleTimeString());
              setSession(refreshData.session);
              setIsRefreshingSession(false);
              
              // 갱신된 토큰을 사용자별 localStorage에 저장
              const userEmail = refreshData.session.user?.email;
              if (userEmail) {
                localStorage.setItem('current-user-email', userEmail);
                const tokenKey = `sb-auth-token-${userEmail}`;
                localStorage.setItem(tokenKey, JSON.stringify({
                  access_token: refreshData.session.access_token,
                  refresh_token: refreshData.session.refresh_token
                }));
                
                // 사용자별 localStorage 백업
                const sessionKey = `lastValidSession-${userEmail}`;
                localStorage.setItem(sessionKey, JSON.stringify({
                  userId: refreshData.session.user.id,
                  email: refreshData.session.user.email,
                  expiresAt: refreshData.session.expires_at,
                  timestamp: Date.now()
                }));
              }
            }
          } else if (timeUntilExpiry < 1200) { // 20분 이내면 경고
            console.log('⚠️ 토큰 만료 20분 전 - 곧 갱신 예정');
          }
        } else {
          // 세션이 없으면 복구 시도 (관대하게)
          console.log('🔍 세션 없음 - 복구 시도...');
          setIsRefreshingSession(true);
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshData?.session && mounted) {
            console.log('✅ 세션 복구 성공!');
            setSession(refreshData.session);
            await refreshUser();
          } else if (refreshError) {
            console.log('⚠️ 세션 복구 실패, 세션 상태 유지:', refreshError.message);
            // 복구 실패해도 즉시 로그아웃하지 않음
          }
          setIsRefreshingSession(false);
        }
      } catch (err) {
        console.error('💥 토큰 관리 오류:', err);
        setIsRefreshingSession(false);
      }
    };
    
    // 초기 토큰 체크
    setTimeout(checkAndRefreshToken, 5000);
    
    // 2분마다 토큰 상태 체크 (JWT 만료 전에 미리 갱신)
    const sessionRefreshInterval = setInterval(checkAndRefreshToken, 2 * 60 * 1000);

    // 브라우저 탭이 포커스를 받을 때마다 토큰 상태 즉시 체크
    const handleFocus = async () => {
      if (!mounted || isAuthenticating) return; // 로그인 중에는 실행하지 않음
      
      // 세션이 없으면 복구 시도하지 않음 (초기 로그인 중일 수 있음)
      if (!session) {
        console.log('👀 세션 없음 - 복구 시도 건너뜀');
        return;
      }
      
      console.log('👀 탭 포커스 - 토큰 상태 즉시 확인');
      
      // 먼저 localStorage에서 세션 복구 시도 (사용자별)
      try {
        const currentUserEmail = localStorage.getItem('current-user-email');
        const tokenKey = currentUserEmail ? `sb-auth-token-${currentUserEmail}` : 'sb-auth-token';
        const storedSession = localStorage.getItem(tokenKey);
        if (storedSession) {
          const { access_token, refresh_token } = JSON.parse(storedSession);
          console.log('🔄 포커스 시 localStorage 세션 복구 시도...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (data?.session && mounted) {
            console.log('✅ 포커스 시 세션 복구 성공!');
            setSession(data.session);
            await refreshUser();
            
            // 복구된 세션 다시 저장 (사용자별)
            const userEmail = data.session.user?.email;
            if (userEmail) {
              const tokenKey = `sb-auth-token-${userEmail}`;
              localStorage.setItem(tokenKey, JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
              }));
            }
            return;
          } else if (error) {
            console.log('⚠️ localStorage 세션 만료, 새로 갱신 시도...');
          }
        }
      } catch (error) {
        console.error('세션 복구 실패:', error);
      }
      
      // 세션 복구 실패 시 토큰 체크 및 갱신
      await checkAndRefreshToken();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // 페이지가 보이게 될 때도 확인 (모바일 브라우저 대응)
    const handleVisibilityChange = async () => {
      if (!document.hidden && mounted) {
        console.log('📱 페이지 visible - 세션 상태 확인');
        await handleFocus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 모바일 브라우저 특별 처리: pageshow 이벤트 + pull-to-refresh 감지 (Progressive Authentication 지원)
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted && mounted) {
        console.log('📱 페이지 복원 (Back-Forward Cache) - 세션 재확인');
        await handleFocus();
      } else if (mounted) {
        // Pull-to-refresh 감지 (새로고침이지만 persisted가 아닌 경우)
        console.log('📱 Pull-to-refresh 감지 - Progressive Authentication 시작');
        
        // Pull-to-refresh에서 Progressive Authentication 적용 (사용자별)
        const currentUserEmail = localStorage.getItem('current-user-email');
        const tokenKey = currentUserEmail ? `sb-auth-token-${currentUserEmail}` : 'sb-auth-token';
        const storedSession = localStorage.getItem(tokenKey);
        if (storedSession) {
          try {
            const { access_token, refresh_token } = JSON.parse(storedSession);
            
            // 1. 즉시 임시 사용자 설정 (login redirect 방지)
            if (!user || user.id === 'session-recovering') {
              console.log('🛡️ Pull-to-refresh: 즉시 임시 사용자 설정');
              const tempUser: User = {
                id: 'session-recovering',
                email: 'recovering@pullrefresh.temp',
                display_name: '새로고침 복구중...',
                created_at: new Date().toISOString()
              };
              setUser(tempUser);
            }
            
            // 2. 백그라운드에서 세션 복구
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });
            
            if (data?.session) {
              console.log('✅ Pull-to-refresh Progressive Authentication: 세션 복구 성공');
              setSession(data.session);
              setIsLoading(false);
              
              // 실제 사용자 데이터로 교체
              try {
                await refreshUser();
                console.log('🎯 Pull-to-refresh: 실제 사용자 데이터로 교체 완료');
              } catch (refreshError) {
                console.error('⚠️ Pull-to-refresh: 사용자 데이터 로드 실패, fallback 사용', refreshError);
                if (data.session.user) {
                  const fallbackUser: User = {
                    id: data.session.user.id,
                    email: data.session.user.email || '',
                    display_name: data.session.user.email?.split('@')[0] || '사용자',
                    created_at: new Date().toISOString()
                  };
                  setUser(fallbackUser);
                }
              }
            } else {
              console.error('❌ Pull-to-refresh: 세션 복구 실패', error);
              // 복구 실패 시 임시 사용자 정리
              setUser(null);
              setSession(null);
            }
          } catch (error) {
            console.error('Pull-to-refresh Progressive Authentication 실패:', error);
            // 파싱 에러 등으로 실패 시 정리
            setUser(null);
            setSession(null);
          }
        } else {
          console.log('📱 Pull-to-refresh: 저장된 토큰 없음');
        }
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      mounted = false; // StrictMode 대응 - 언마운트 플래그
      subscription.unsubscribe();
      clearInterval(sessionRefreshInterval);
      clearTimeout(initTimeout);
      clearTimeout(emergencyTimeout); // 긴급 타임아웃도 정리
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
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
