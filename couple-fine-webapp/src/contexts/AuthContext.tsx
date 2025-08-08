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
    if (!session?.user) {
      setUser(null);
      return;
    }

    // CRITICAL: Only refresh user if email is confirmed
    if (!session.user.email_confirmed_at) {
      setUser(null);
      setSession(null);
      return;
    }

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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Only accept valid sessions with confirmed emails
        if (initialSession && initialSession.access_token && initialSession.user?.email_confirmed_at) {
          setSession(initialSession);
          await refreshUser();
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        // Only accept valid sessions with proper authentication
        if (session && session.access_token && session.user?.email_confirmed_at) {
          setSession(session);
          await refreshUser();
        } else if (session && !session.user?.email_confirmed_at) {
          setSession(null);
          setUser(null);
        } else {
          setSession(null);
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