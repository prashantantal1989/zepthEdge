import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUser = async (supabaseUser: SupabaseUser) => {
    // Get user's role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    // Get user's properties
    const { data: propertyUsers } = await supabase
      .from('property_users')
      .select('properties:property_id(name)')
      .eq('user_id', supabaseUser.id);

    const properties = propertyUsers 
      ? propertyUsers.map(pu => pu.properties?.name).filter(Boolean) as string[]
      : [];

    setUser({
      id: supabaseUser.id,
      name: supabaseUser.user_metadata.full_name || 'User',
      email: supabaseUser.email || '',
      role: profile?.role || 'viewer', // Default to viewer if no profile found
      avatar: supabaseUser.user_metadata.avatar_url,
      properties,
      status: supabaseUser.confirmed_at ? 'active' : 'pending'
    });
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Use Supabase auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    isAuthenticated: !!user,
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;