import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types/user'; // Assuming User type might be similar

// TODO: Consider jwt-decode if detailed client-side token inspection is needed.
// For now, we'll rely on API calls to validate token and get user details.
// interface DecodedUser {
//   id: string;
//   email: string;
//   role: UserRole;
//   exp: number;
//   // ... other fields from your JWT payload
// }

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void; // Simplified, can be async if backend logout is added
  fetchCurrentUser: (currentToken: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ensure this matches your actual backend URL, or use environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const storeToken = (tokenToStore: string) => {
    try {
      localStorage.setItem('authToken', tokenToStore);
      setTokenState(tokenToStore);
    } catch (e) {
      console.error("Error storing token in localStorage", e);
    }
  };

  const getToken = (): string | null => {
    try {
      return localStorage.getItem('authToken');
    } catch (e) {
      console.error("Error getting token from localStorage", e);
      return null;
    }
  };

  const removeToken = () => {
    try {
      localStorage.removeItem('authToken');
    } catch (e) {
      console.error("Error removing token from localStorage", e);
    }
    setTokenState(null);
  };

  const fetchCurrentUser = async (currentToken: string): Promise<User | null> => {
    if (!currentToken) {
      // This case should ideally be handled by the caller,
      // but as a safeguard:
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return null;
    }

    setLoading(true); // Ensure loading is true at the start of fetch
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        // Specific handling for auth errors vs server errors
        if (response.status === 401 || response.status === 403) {
          console.warn('Token validation failed or expired during fetchCurrentUser.');
          removeToken(); // Remove invalid token
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // For other errors (e.g., 500), log it but don't necessarily invalidate session immediately
          console.error(`Server error fetching current user: ${response.status}`);
        }
        // throw new Error(`Failed to fetch current user, status: ${response.status}`);
        // Instead of throwing, which might break initialization, return null
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return null;
      }
      const userData: User = await response.json();
      // Ensure role is correctly typed if possible, default if missing
      const finalUserData: User = {
        ...userData,
        role: userData.role || UserRole.VIEWER,
        // Map properties if backend returns 'properties' and frontend User type expects 'propertyNames' or similar
        // For now, assuming direct compatibility or that /api/users/me returns User compatible shape
      };
      setUser(finalUserData);
      setIsAuthenticated(true);
      setLoading(false);
      return finalUserData;
    } catch (error) {
      console.error('Error during fetchCurrentUser:', error);
      removeToken(); // Critical error, assume token or session is bad
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true); // Start with loading true
      const storedToken = getToken();
      if (storedToken) {
        setTokenState(storedToken); // Set token state first
        await fetchCurrentUser(storedToken); // Then fetch user
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false); // Explicitly set loading false if no token
      }
    };
    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json(); // Always parse JSON to get error messages

      if (!response.ok) {
        throw new Error(data.message || `Login failed with status: ${response.status}`);
      }

      if (data.token && data.user) {
        storeToken(data.token);
         const finalUserData: User = {
          ...data.user,
          role: data.user.role || UserRole.VIEWER,
        };
        setUser(finalUserData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Login response missing token or user data.');
      }
    } catch (error) {
      console.error('Login error:', error);
      removeToken(); // Ensure any partial/bad state is cleared
      setUser(null);
      setIsAuthenticated(false);
      throw error; // Re-throw to be caught by UI
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      const data = await response.json(); // Always parse JSON

      if (!response.ok) {
        throw new Error(data.message || `Registration failed with status: ${response.status}`);
      }

      if (data.token && data.user) {
        storeToken(data.token);
        const finalUserData: User = {
          ...data.user,
          role: data.user.role || UserRole.VIEWER,
        };
        setUser(finalUserData);
        setIsAuthenticated(true);
      } else {
         throw new Error('Registration response missing token or user data.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
      throw error; // Re-throw for UI
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
    // No need to redirect here; components using useAuth can handle redirection.
    console.log("User logged out, token removed, user state cleared.");
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    register,
    logout,
    fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Make sure AuthProvider is the default export if this file is named AuthContext.tsx
// and imported as `import AuthProvider from './contexts/AuthContext'` elsewhere.
// If AuthContext is the default, then components would import { AuthProvider } from ...
// Based on original, AuthProvider is likely not the default.
// The last line `export default AuthProvider;` was in the original file, so keeping it.
export default AuthProvider;