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
    // StrictMode 대응 - mounted 플래그로 언마운트 후 업데이트 방지
    let mounted = true;
    
    // Initialize auth state
    setIsLoading(true);

    // 30초 타임아웃으로 초기화 보호 (네트워크 지연 고려)
    const initTimeout = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 30000);

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
        
        // USER_UPDATED 이벤트 스마트 처리 - 세션이 있으면 유지, 없을 때만 재확인
        if (event === 'USER_UPDATED') {
          console.log('📝 USER_UPDATED 이벤트 - 세션 상태 확인');
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
            // 세션이 있으면 갱신만
            console.log('✅ USER_UPDATED: 세션 유지 및 갱신');
            setSession(session);
            await refreshUser();
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
      if (!mounted) return;
      
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
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('❌ 토큰 갱신 실패:', refreshError.message);
              // 갱신 실패 시 재시도
              setTimeout(async () => {
                if (!mounted) return;
                console.log('🔁 토큰 갱신 재시도...');
                const { data: retryData } = await supabase.auth.refreshSession();
                if (retryData?.session && mounted) {
                  console.log('✅ 재시도 성공!');
                  setSession(retryData.session);
                  await refreshUser();
                }
              }, 2000);
            } else if (refreshData?.session) {
              console.log('✅ 토큰 갱신 성공! 새 만료 시간:', new Date(refreshData.session.expires_at! * 1000).toLocaleTimeString());
              setSession(refreshData.session);
              
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
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session && mounted) {
            console.log('✅ 세션 복구 성공!');
            setSession(refreshData.session);
            await refreshUser();
          }
        }
      } catch (err) {
        console.error('💥 토큰 관리 오류:', err);
      }
    };
    
    // 초기 토큰 체크
    setTimeout(checkAndRefreshToken, 5000);
    
    // 3분마다 토큰 상태 체크 (JWT 만료 전에 미리 갱신)
    const sessionRefreshInterval = setInterval(checkAndRefreshToken, 3 * 60 * 1000);

    // 브라우저 탭이 포커스를 받을 때마다 토큰 상태 즉시 체크
    const handleFocus = async () => {
      if (!mounted) return;
      console.log('👀 탭 포커스 - 토큰 상태 즉시 확인');
      // 포커스 시 즉시 토큰 체크
      await checkAndRefreshToken();
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
      mounted = false; // StrictMode 대응 - 언마운트 플래그
      subscription.unsubscribe();
      clearInterval(sessionRefreshInterval);
      clearTimeout(initTimeout);
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