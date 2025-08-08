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
    // Get current session from Supabase
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession?.user) {
      setUser(null);
      return;
    }
    
    // Update session state
    setSession(currentSession);

    try {
      // First try to get existing user
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
      
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
          .from('users')
          .insert({ ...newUser, id: currentSession.user.id })
          .select()
          .single();

        if (createdUser && !createError) {
          setUser(createdUser);
        } else {
            }
      } else {
        }
    } catch (error) {
      setUser(null);
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
        console.error('OTP verification error:', error);
        return { error: error.message };
      }
      
      if (data.session) {
        console.log('OTP verified, session created:', data.session.user.email);
        setSession(data.session);
        
        // Force refresh user data
        await refreshUser();
        
        // Double check user was set
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          console.log('Session confirmed, user should be logged in');
        }
        
        return { success: true };
      }
      
      return { error: 'Failed to verify OTP' };
    } catch (error) {
      console.error('Unexpected error during OTP verification:', error);
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
    // Initialize auth state
    setIsLoading(true);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      if (session) {
        refreshUser();
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email);
        setSession(session);
        if (session) {
          refreshUser();
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