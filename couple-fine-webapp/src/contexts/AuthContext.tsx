import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import type { AuthSession } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<{ error?: string; success?: boolean; message?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'display_name'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        // User doesn't exist in our users table, create them
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

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email'
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {

        setSession(data.session);

        // Force refresh user data
        await refreshUser();

        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 100));

        // Double check user was set
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {

        }

        return { success: true };
      }

      return { error: 'Failed to verify OTP' };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
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

  useEffect(() => {

    // Initialize auth state
    setIsLoading(true);

    // 30초 타임아웃으로 초기화 보호 (네트워크 지연 고려)
    const initTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 30000);

    // Get initial session with error handling
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {

      if (error) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        clearTimeout(initTimeout);
        return;
      }

      setSession(session);
      if (session) {
        try {
          await refreshUser();
        } catch (refreshError) {
          // Even if refresh fails, we have a session so set basic user
          if (session.user) {
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
      setIsLoading(false);
      clearTimeout(initTimeout);
    }).catch((error) => {
      setSession(null);
      setUser(null);
      setIsLoading(false);
      clearTimeout(initTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth Event:', event, 'Session exists:', !!session);
        
        // undefined 이벤트는 무시 (Supabase 버그)
        if (!event || event === 'undefined') {
          console.log('🔕 undefined 이벤트 무시 - 세션 상태 유지');
          return;
        }
        
        // USER_UPDATED 이벤트는 세션 상태와 관계없이 무시
        if (event === 'USER_UPDATED') {
          console.log('📝 USER_UPDATED 이벤트 감지 - 완전히 무시');
          return; // 아무것도 하지 않음
        }
        
        // 명시적 로그아웃 이벤트만 즉시 처리
        if (event === 'SIGNED_OUT') {
          console.log('👋 명시적 로그아웃 - 세션 정리');
          setSession(null);
          setUser(null);
          return;
        }
        
        // 로그인 및 토큰 갱신 이벤트
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('✅ 로그인/토큰갱신 이벤트 처리');
          setSession(session);
          if (session) {
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
              if (session.user) {
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
          return;
        }
        
        // 기타 이벤트에서 세션이 null인 경우 재확인 (더 강력하게)
        if (!session) {
          console.log('⚠️ 예상치 못한 null 세션 - 이벤트:', event);
          
          // 재확인 전에 잠시 대기 (네트워크 지연 고려)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            const { data: { session: reconfirmSession }, error } = await supabase.auth.getSession();
            if (error) {
              console.error('❌ 세션 재확인 중 오류:', error);
              // 오류가 있어도 바로 로그아웃하지 않고 한 번 더 시도
              await new Promise(resolve => setTimeout(resolve, 2000));
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession) {
                console.log('✅ 재시도 성공 - 세션 유지');
                setSession(retrySession);
                await refreshUser();
                return;
              }
              // 재시도도 실패하면 로그아웃
              setSession(null);
              setUser(null);
              return;
            }
            
            if (reconfirmSession) {
              console.log('✅ 세션 재확인 성공 - 로그인 상태 유지');
              setSession(reconfirmSession);
              await refreshUser();
            } else {
              console.log('⚠️ 세션이 없지만 현재 사용자 상태 확인');
              // 현재 사용자 상태도 한 번 더 확인
              if (user) {
                console.log('👤 사용자 정보 있음 - 세션 복구 시도');
                const { data: { session: recoverySession } } = await supabase.auth.refreshSession();
                if (recoverySession) {
                  console.log('✅ 세션 복구 성공');
                  setSession(recoverySession);
                  return;
                }
              }
              console.log('❌ 세션 재확인 완전 실패 - 실제 로그아웃');
              setSession(null);
              setUser(null);
            }
          } catch (reconfirmError) {
            console.error('💥 세션 재확인 중 예외:', reconfirmError);
            setSession(null);
            setUser(null);
          }
        } else {
          // 세션이 있는 경우 정상 처리
          setSession(session);
          if (session) {
            try {
              await refreshUser();
            } catch (refreshError) {
              console.error('⚠️ refreshUser 실패:', refreshError);
              // 세션이 있으니 fallback 사용자 생성
              if (session.user) {
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
      }
    );

    // 세션 자동 갱신 - 매우 자주 체크하고 갱신
    const sessionRefreshInterval = setInterval(async () => {
      try {
        console.log('🔍 세션 상태 확인 중...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('🔄 세션 확인 오류:', error.message);
          // 오류 시에도 refreshSession 시도
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            console.log('✅ 오류 후 세션 복구 성공');
            setSession(refreshData.session);
          }
          return;
        }
        
        if (currentSession) {
          // 세션이 있으면 무조건 갱신 (더 공격적으로)
          console.log('🔄 세션 강제 갱신 시도...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('❌ 세션 갱신 실패:', refreshError.message);
            // 실패해도 현재 세션 유지
            if (currentSession) {
              setSession(currentSession);
            }
          } else if (refreshData.session) {
            console.log('✅ 세션 갱신 성공');
            setSession(refreshData.session);
            // localStorage에도 백업
            localStorage.setItem('lastValidSession', JSON.stringify({
              userId: refreshData.session.user.id,
              email: refreshData.session.user.email,
              timestamp: Date.now()
            }));
          }
        } else {
          // 세션이 없으면 localStorage에서 복구 시도
          console.log('⚠️ 세션 없음 - 복구 시도');
          const lastSession = localStorage.getItem('lastValidSession');
          if (lastSession) {
            const sessionData = JSON.parse(lastSession);
            // 24시간 이내의 세션만 복구 시도
            if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
              console.log('📦 localStorage에서 세션 복구 시도');
              const { data: refreshData } = await supabase.auth.refreshSession();
              if (refreshData?.session) {
                console.log('✅ 세션 복구 성공');
                setSession(refreshData.session);
              }
            }
          }
        }
      } catch (err) {
        console.error('💥 세션 관리 오류:', err);
      }
    }, 1 * 60 * 1000); // 1분마다 실행 (매우 자주 체크)

    // 브라우저 탭이 포커스를 받을 때마다 세션 확인
    const handleFocus = async () => {
      console.log('👀 탭 포커스 - 세션 확인');
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          console.log('⚠️ 포커스 시 세션 없음 - 복구 시도');
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session) {
            console.log('✅ 포커스 시 세션 복구 성공');
            setSession(refreshData.session);
            await refreshUser();
          }
        } else {
          // 세션이 있어도 갱신
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session) {
            console.log('✅ 포커스 시 세션 갱신');
            setSession(refreshData.session);
          }
        }
      } catch (error) {
        console.error('💥 포커스 시 세션 확인 오류:', error);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // 페이지가 보이게 될 때도 확인
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionRefreshInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};