import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import type { AuthSession } from '@supabase/supabase-js';
import { isTestMode, getTestUser } from '../utils/testHelper';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<{ error?: string; success?: boolean; message?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'display_name'>>) => Promise<void>;
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

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDebugMode] = useState(() => isTestMode());
  const [isAuthenticating, setIsAuthenticating] = useState(false); // 로그인 중 플래그

  const refreshUser = async () => {

    // 30초 타임아웃 설정 (네트워크 지연 고려)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('사용자 정보 로딩 시간 초과')), 30000);
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
      } else {
        setUser(null);
      }
    }
  };

  const signIn = async (email: string) => {
    setIsLoading(true);

    try {
      // 테스트 모드에서는 OTP 전송 우회
      if (isTestMode()) {
        console.log('🧪 TEST MODE: OTP 전송 우회');
        return { success: true, message: 'TEST MODE: OTP 우회됨. 임의 코드로 진행하세요.' };
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        return { error: error.message };
      }

      return { success: true, message: 'OTP sent! Check your email.' };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    console.log('🔍 verifyOtp 시작:', { email, token, length: token.length });
    setIsLoading(true);
    setIsAuthenticating(true); // 로그인 프로세스 시작

    // **타임아웃 설정**: 전체 인증 프로세스를 15초로 제한
    const overallTimeoutId = setTimeout(() => {
      console.error('⏰ verifyOtp 전체 타임아웃 (15초) - 강제 종료');
      setIsLoading(false);
      setIsAuthenticating(false);
    }, 15000);

    try {
      // 테스트 모드에서 OTP 우회하고 바로 로그인
      if (isTestMode()) {
        console.log('🧪 TEST MODE: OTP 검증 우회, 자동 로그인');
        clearTimeout(overallTimeoutId);
        
        const testUser = getTestUser();
        if (testUser) {
          // 테스트 사용자 정보로 바로 로그인
          const mockUser: User = {
            id: testUser.id,
            email: testUser.email,
            display_name: testUser.display_name,
            created_at: new Date().toISOString(),
            couple_id: '96e3ffc4-fc47-418c-81c5-2a020701a95b' // 실제 생성된 커플 ID
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
          
          console.log('✅ 테스트 모드 로그인 성공');
          return { success: true };
        }
        
        return { error: 'Test user not found' };
      }

      console.log('🔍 Supabase OTP 검증 시작...');
      
      // **OTP 검증에 10초 타임아웃 추가**
      const otpVerificationPromise = supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email'
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('OTP 검증 타임아웃 (10초)'));
        }, 10000);
      });

      console.log('⏰ OTP 검증 타임아웃 설정: 10초');
      const { data, error } = await Promise.race([
        otpVerificationPromise,
        timeoutPromise
      ]);

      console.log('🔍 Supabase OTP 검증 결과:', { data, error });

      if (error) {
        console.error('❌ Supabase OTP 에러:', error);
        return { 
          error: error.message || 'OTP 검증에 실패했습니다.' 
        };
      }

      if (data.session) {
        console.log('✅ 세션 데이터 받음:', data.session.user.email);
        setSession(data.session);
        
        // 세션 토큰을 localStorage에 저장
        localStorage.setItem('sb-auth-token', JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }));

        // **사용자 데이터 새로고침에도 타임아웃 적용**
        console.log('🔄 사용자 데이터 새로고침 중...');
        try {
          const refreshUserPromise = refreshUser();
          const refreshTimeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => {
              reject(new Error('사용자 데이터 새로고침 타임아웃 (5초)'));
            }, 5000);
          });

          await Promise.race([
            refreshUserPromise,
            refreshTimeoutPromise
          ]);

          console.log('✅ 사용자 데이터 새로고침 완료');
        } catch (refreshError) {
          console.warn('⚠️ 사용자 데이터 새로고침 실패 또는 타임아웃:', refreshError);
          // 새로고침 실패해도 로그인은 성공으로 처리 (세션이 있으므로)
        }

        clearTimeout(overallTimeoutId); // 성공 시 전체 타임아웃 해제
        console.log('✅ OTP 인증 성공, 세션 저장 완료');
        return { success: true };
      }

      console.warn('⚠️ 세션이 없음 - OTP 검증 실패');
      return { error: '인증 코드를 다시 확인해주세요.' };
    } catch (error: any) {
      console.error('💥 verifyOtp 예상치 못한 에러:', error);
      
      // **타임아웃 에러인지 확인**
      if (error.message && error.message.includes('타임아웃')) {
        console.error('⏰ 타임아웃 에러 감지:', error.message);
        return { 
          error: `인증 시간이 초과되었습니다. 네트워크를 확인하고 다시 시도해주세요.` 
        };
      }
      
      setIsAuthenticating(false); // 로그인 프로세스 종료
      return { 
        error: `인증 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}` 
      };
    } finally {
      console.log('🔍 verifyOtp finally 블록 실행');
      
      // **모든 타임아웃 정리**
      clearTimeout(overallTimeoutId);
      
      console.log('🔍 verifyOtp 완료 - 로딩 상태 해제');
      setIsLoading(false);
      
      // 로그인 완료 후 약간의 지연을 두고 플래그 해제
      setTimeout(() => {
        setIsAuthenticating(false);
        console.log('🔍 인증 플래그 해제 완료');
      }, 1000);
    }
  };

  const signOut = async () => {
    // 즉시 UI 상태 업데이트 (사용자 경험 개선)
    setUser(null);
    setSession(null);
    
    // localStorage 즉시 정리
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem('lastValidSession');
    
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

  const updateProfile = async (updates: Partial<Pick<User, 'display_name'>>) => {
    if (!user) throw new Error('No user found');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    // Refresh user data
    await refreshUser();
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

    // localStorage에서 세션 복구 시도
    const restoreSession = async () => {
      try {
        const storedSession = localStorage.getItem('sb-auth-token');
        if (storedSession) {
          const { access_token, refresh_token } = JSON.parse(storedSession);
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (data?.session && mounted) {
            console.log('✅ localStorage에서 세션 복구 성공');
            setSession(data.session);
            await refreshUser();
            return true;
          }
        }
      } catch (error) {
        console.error('세션 복구 실패:', error);
      }
      return false;
    };

    // 30초 타임아웃으로 초기화 보호 (네트워크 지연 고려)
    const initTimeout = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 30000);

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
      }).catch((error) => {
        console.error('💥 초기화 중 예외:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
        clearTimeout(initTimeout);
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
          if (!session) {
            // 세션이 없을 때만 재확인
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession && mounted) {
              console.log('✅ USER_UPDATED: 세션 복구됨');
              setSession(currentSession);
              await refreshUser();
            } else if (!currentSession && mounted) {
              console.log('⚠️ USER_UPDATED: 세션 없음 확인');
              // 정말로 세션이 없을 때만 로그아웃
              setSession(null);
              setUser(null);
            }
          } else if (mounted) {
            // 세션이 있으면 조건부 갱신 - 토큰 갱신 중이 아닐 때만
            console.log('✅ USER_UPDATED: 세션 유지하며 조건부 갱신');
            setSession(session);
            if (!isRefreshingSession) {
              console.log('🔄 USER_UPDATED: 사용자 정보 갱신 (토큰 갱신 중 아님)');
              await refreshUser();
            } else {
              console.log('⏳ USER_UPDATED: 토큰 갱신 중이므로 사용자 갱신 스킵');
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
              // 세션 토큰을 localStorage에 저장 (페이지 이동 시 복구용)
              localStorage.setItem('sb-auth-token', JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token
              }));
              
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

    // JWT 토큰 만료 시간 추적 및 자동 갱신
    const checkAndRefreshToken = async () => {
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
          
          // 토큰이 5분 이내에 만료되면 즉시 갱신
          if (timeUntilExpiry < 300) { // 5분 = 300초
            console.log('🔄 토큰 만료 임박 - 즉시 갱신 시작!');
            isRefreshingSession = true; // 갱신 시작 플래그 설정
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('❌ 토큰 갱신 실패:', refreshError.message);
              isRefreshingSession = false; // 갱신 실패 시 플래그 해제
              // 갱신 실패 시 재시도
              setTimeout(async () => {
                if (!mounted) return;
                console.log('🔁 토큰 갱신 재시도...');
                isRefreshingSession = true; // 재시도 시 플래그 다시 설정
                const { data: retryData } = await supabase.auth.refreshSession();
                if (retryData?.session && mounted) {
                  console.log('✅ 재시도 성공!');
                  setSession(retryData.session);
                  await refreshUser();
                }
                isRefreshingSession = false; // 재시도 완료 후 플래그 해제
              }, 2000);
            } else if (refreshData?.session) {
              console.log('✅ 토큰 갱신 성공! 새 만료 시간:', new Date(refreshData.session.expires_at! * 1000).toLocaleTimeString());
              setSession(refreshData.session);
              isRefreshingSession = false; // 갱신 성공 시 플래그 해제
              
              // 갱신된 토큰을 localStorage에 저장
              localStorage.setItem('sb-auth-token', JSON.stringify({
                access_token: refreshData.session.access_token,
                refresh_token: refreshData.session.refresh_token
              }));
              
              // localStorage 백업
              localStorage.setItem('lastValidSession', JSON.stringify({
                userId: refreshData.session.user.id,
                email: refreshData.session.user.email,
                expiresAt: refreshData.session.expires_at,
                timestamp: Date.now()
              }));
            }
          } else if (timeUntilExpiry < 600) { // 10분 이내면 경고
            console.log('⚠️ 토큰 만료 10분 전 - 곧 갱신 예정');
          }
        } else {
          // 세션이 없으면 복구 시도
          console.log('🔍 세션 없음 - 복구 시도...');
          isRefreshingSession = true; // 복구 시도 시 플래그 설정
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session && mounted) {
            console.log('✅ 세션 복구 성공!');
            setSession(refreshData.session);
            await refreshUser();
          }
          isRefreshingSession = false; // 복구 완료 후 플래그 해제
        }
      } catch (err) {
        console.error('💥 토큰 관리 오류:', err);
        isRefreshingSession = false; // 오류 발생 시에도 플래그 해제
      }
    };
    
    // 초기 토큰 체크
    setTimeout(checkAndRefreshToken, 5000);
    
    // 3분마다 토큰 상태 체크 (JWT 만료 전에 미리 갱신)
    const sessionRefreshInterval = setInterval(checkAndRefreshToken, 3 * 60 * 1000);

    // 브라우저 탭이 포커스를 받을 때마다 토큰 상태 즉시 체크
    const handleFocus = async () => {
      if (!mounted || isAuthenticating) return; // 로그인 중에는 실행하지 않음
      
      // 세션이 없으면 복구 시도하지 않음 (초기 로그인 중일 수 있음)
      if (!session) {
        console.log('👀 세션 없음 - 복구 시도 건너뜀');
        return;
      }
      
      console.log('👀 탭 포커스 - 토큰 상태 즉시 확인');
      
      // 먼저 localStorage에서 세션 복구 시도
      try {
        const storedSession = localStorage.getItem('sb-auth-token');
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
            
            // 복구된 세션 다시 저장
            localStorage.setItem('sb-auth-token', JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token
            }));
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
    
    // 모바일 브라우저 특별 처리: pageshow 이벤트
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted && mounted) {
        console.log('📱 페이지 복원 (Back-Forward Cache) - 세션 재확인');
        await handleFocus();
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      mounted = false; // StrictMode 대응 - 언마운트 플래그
      subscription.unsubscribe();
      clearInterval(sessionRefreshInterval);
      clearTimeout(initTimeout);
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
    verifyOtp,
    signOut,
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