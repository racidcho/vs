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
    console.log('🔄 refreshUser called');
    
    // Get current session from Supabase
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession?.user) {
      console.log('❌ No session found, setting user to null');
      setUser(null);
      return;
    }
    
    console.log('✅ Session found:', currentSession.user.email);
    // Update session state
    setSession(currentSession);

    try {
      // First try to get existing user
      console.log('🔍 Checking if user exists in profiles table...');
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
      
      if (userData && !error) {
        console.log('✅ User found in database:', userData);
        setUser(userData);
      } else if (error?.code === 'PGRST116') {
        console.log('⚠️ User not found in database, creating new user...');
        // User doesn't exist in our users table, create them
        // For OTP login, email is automatically confirmed
        const newUser: Omit<User, 'id'> = {
          email: currentSession.user.email || '',
          display_name: currentSession.user.user_metadata?.display_name || 
                       currentSession.user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString()
        };

        console.log('📝 Creating user with data:', newUser);
        const { data: createdUser, error: createError } = await supabase
          .from('profiles')
          .insert({ ...newUser, id: currentSession.user.id })
          .select()
          .single();

        if (createdUser && !createError) {
          console.log('✅ User created successfully:', createdUser);
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
          console.log('⚠️ Using fallback user object:', fallbackUser);
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
        console.log('⚠️ Using fallback user object due to error:', fallbackUser);
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
        console.log('⚠️ Using fallback user object after error:', fallbackUser);
        setUser(fallbackUser);
      } else {
        setUser(null);
      }
    }
  };

  const signIn = async (email: string) => {
    console.log('🔑 signIn called with email:', email);
    setIsLoading(true);
    
    try {
      console.log('📤 Calling Supabase signInWithOtp...');
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true
        }
      });
      
      console.log('📥 Supabase response - data:', data, 'error:', error);
      
      if (error) {
        console.error('❌ Supabase OTP error:', error);
        return { error: error.message };
      }
      
      console.log('✅ OTP request successful');
      return { success: true, message: 'OTP sent! Check your email.' };
    } catch (error) {
      console.error('❌ Unexpected error in signIn:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    console.log('🔐 Starting OTP verification for:', email);
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
        console.log('✅ OTP verified, session created:', data.session.user.email);
        setSession(data.session);
        
        // Force refresh user data
        await refreshUser();
        
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Double check user was set
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          console.log('✅ Session confirmed, user should be logged in');
          console.log('📊 Current user state after verification:', user);
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
    console.log('🚀 AuthContext initializing...');
    // Initialize auth state
    setIsLoading(true);
    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('📍 Initial session check:', session?.user?.email || 'No session');
      setSession(session);
      if (session) {
        await refreshUser();
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('🔔 Auth state changed:', _event, session?.user?.email || 'No session');
        setSession(session);
        if (session) {
          await refreshUser();
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