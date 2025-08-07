import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import type { AuthSession } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<{ error?: string }>;
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
  // 개발 환경에서 임시 사용자 데이터
  // const mockUser: User = {
  //   id: 'mock-user-id',
  //   email: 'demo@couplefine.com',
  //   display_name: '데모 사용자',
  //   couple_id: 'mock-couple-id',
  //   created_at: new Date().toISOString()
  // };
  
  const [user, setUser] = useState<User | null>(null); // 로그인 화면 보기 위해 null로 설정
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(false); // 로딩 false로 변경

  const refreshUser = async () => {
    if (session?.user) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userData && !error) {
        setUser(userData);
      }
    }
  };

  const signIn = async (email: string) => {
    // 개발 환경: 아무 이메일이나 입력하면 바로 로그인
    try {
      // 임시로 바로 로그인 처리
      const tempUser: User = {
        id: 'mock-user-id',
        email: email,
        display_name: email.split('@')[0],
        couple_id: 'mock-couple-id',
        created_at: new Date().toISOString()
      };
      
      // 잠시 딜레이를 주어 로딩 효과 보여주기
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 사용자 설정
      setUser(tempUser);
      
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
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
      .from('users')
      .update(updates)
      .eq('id', user.id);
      
    if (error) {
      throw new Error(error.message);
    }
    
    // Refresh user data
    await refreshUser();
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      
      if (initialSession?.user) {
        await refreshUser();
      }
      
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        
        if (session?.user) {
          await refreshUser();
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
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