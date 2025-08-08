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
        .eq('id', session.user.id)
        .single();
      
      if (userData && !error) {
        setUser(userData);
      } else if (error?.code === 'PGRST116') {
        // User doesn't exist in our users table, create them
        // BUT ONLY IF EMAIL IS CONFIRMED
        if (!session.user.email_confirmed_at) {
              setUser(null);
          return;
        }

        const newUser: Omit<User, 'id'> = {
          email: session.user.email || '',
          display_name: session.user.user_metadata?.display_name || 
                       session.user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString()
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert({ ...newUser, id: session.user.id })
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
      
      const redirectUrl = import.meta.env.PROD 
        ? 'https://joanddo.com'
        : window.location.origin;
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        return { error: error.message };
      }
      
      // Check if OTP was actually sent
      if (!data || !data.user) {
        return { success: true, message: 'Magic link sent! Check your email.' };
      }
      
      // This should not happen - user should not be returned immediately
      return { success: true };
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