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

    // 5초 타임아웃 설정
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('사용자 정보 로딩 시간 초과')), 5000);
    });

    // Get current session from Supabase (with timeout)
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      timeoutPromise
    ]).catch(err => {
      console.error('⏰ Session fetch timeout:', err);
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
        console.error('⏰ Profile fetch timeout:', err);
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
          console.error('❌ Failed to create user:', createError);
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
        console.error('❌ Unexpected database error:', error);
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
      console.error('❌ Critical error in refreshUser:', error);
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
        console.error('❌ Supabase OTP error:', error);
        return { error: error.message };
      }

      return { success: true, message: 'OTP sent! Check your email.' };
    } catch (error) {
      console.error('❌ Unexpected error in signIn:', error);
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
        console.error('❌ OTP verification error:', error);
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
      console.error('❌ Unexpected error during OTP verification:', error);
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

    // 5초 타임아웃으로 초기화 보호
    const initTimeout = setTimeout(() => {

      setIsLoading(false);
    }, 5000);

    // Get initial session with error handling
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {

      if (error) {
        console.error('❌ Session check error:', error);
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
          console.error('❌ RefreshUser error during initialization:', refreshError);
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
      console.error('❌ Critical error during session initialization:', error);
      setSession(null);
      setUser(null);
      setIsLoading(false);
      clearTimeout(initTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {

        setSession(session);
        if (session) {
          try {
            await refreshUser();
          } catch (refreshError) {
            console.error('❌ RefreshUser error during auth change:', refreshError);
            // Fallback user creation
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
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
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