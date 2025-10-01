import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMe, useLogout } from '../api/queries';
import { type User } from '../api/queries';
import { getStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  roles: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refetchUser: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (roleOrArray: string | string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
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
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: user, isLoading, refetch, error } = useMe();
  const logoutMutation = useLogout();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (user || !isLoading || error) {
      setIsInitialized(true);
      if (user?.role) {
        localStorage.setItem('timely_user_roles', JSON.stringify([user.role]));
      }
    }
  }, [user, isLoading, error]);

  const logout = () => {
    logoutMutation.mutate();
  };

  const refetchUser = () => {
    refetch();
  };

  const refreshUser = async () => {
    await refetch();
  };

  const userRoles = user?.role ? [user.role as string] : [];

  const hasRole = (roleOrArray: string | string[]): boolean => {
    if (!user || userRoles.length === 0) return false;
    const targetRoles = Array.isArray(roleOrArray) ? roleOrArray : [roleOrArray];
    return targetRoles.some(role => userRoles.includes(role));
  };

  const hasAnyRole = (targetRoles: string[]): boolean => {
    return hasRole(targetRoles);
  };

  const value: AuthContextType = {
    user: user || null,
    roles: userRoles,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: !!getStoredToken() && !!user,
    logout,
    refetchUser,
    refreshUser,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
