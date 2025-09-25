import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getStoredToken, getStoredRefreshToken, setStoredTokens, clearStoredTokens } from '../api/client';

// Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  is_active: boolean;
  profile?: {
    phone?: string;
    date_of_birth?: string;
    address?: string;
    emergency_contact?: string;
  };
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  hasRole: (roleOrArray: string | string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'ATHLETE' | 'SPECTATOR' | 'COACH' | 'ORGANIZER' | 'ADMIN';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedAccessToken = getStoredToken();
      const storedRefreshToken = getStoredRefreshToken();

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);

        try {
          // Verify token and get user data
          const response = await api.get('/accounts/users/me/');
          setUser(response.data);
        } catch (error) {
          // Token is invalid, clear storage
          clearStoredTokens();
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/accounts/auth/login/', {
        email,
        password,
      });

      const { access, refresh, user: userData } = response.data;
      
      setStoredTokens(access, refresh);
      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(userData);
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      await api.post('/accounts/auth/register/', data);
    } catch (error) {
      throw new Error('Registration failed. Please try again.');
    }
  };

  const logout = (): void => {
    clearStoredTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const refresh = async (): Promise<void> => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post('/accounts/auth/refresh/', {
        refresh: refreshToken,
      });

      const { access, refresh: newRefresh } = response.data;
      
      setStoredTokens(access, newRefresh);
      setAccessToken(access);
      setRefreshToken(newRefresh);
    } catch (error) {
      // Refresh failed, logout user
      logout();
      throw new Error('Session expired. Please login again.');
    }
  };

  const hasRole = (roleOrArray: string | string[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(roleOrArray) ? roleOrArray : [roleOrArray];
    return roles.some(role => user.roles.includes(role));
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return hasRole(roles);
  };

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refresh,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
