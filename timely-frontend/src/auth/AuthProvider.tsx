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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: user, isLoading, refetch } = useMe();
  const logoutMutation = useLogout();
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (user || !isLoading) {
      setIsInitialized(true);
      // Store user roles in localStorage for quick access
      if (user?.role) {
        localStorage.setItem('timely_user_roles', JSON.stringify([user.role]));
      }
    }
  }, [user, isLoading]);

  // Minimal realtime: connect to user websocket; handle role_update and notification
  useEffect(() => {
    if (!user) {
      if (ws) {
        ws.close();
        setWs(null);
      }
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.host;
      const socket = new WebSocket(`${protocol}://${host}/ws/user/`);
      socket.onopen = () => {
        // no-op
      };
      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const type = msg.type || msg.event || '';
          if (type === 'role_update') {
            refetch();
            // Redirect based on new role
            const role = msg.role as string | undefined;
            if (typeof window !== 'undefined') {
              if (role === 'ORGANIZER') window.location.assign('/organizer');
              else if (role === 'ATHLETE') window.location.assign('/athlete');
              else if (role === 'COACH') window.location.assign('/coach');
              else window.location.assign('/dashboard');
            }
          }
          // notifications are displayed elsewhere; ignore here to keep minimal
        } catch {}
      };
      socket.onerror = () => {
        // fail silently per minimal realtime requirement
      };
      socket.onclose = () => {
        setWs(null);
      };
      setWs(socket);
      return () => {
        socket.close();
      };
    } catch {
      // do nothing if WS fails
    }
  }, [user]);

  const logout = () => {
    logoutMutation.mutate();
  };

  const refetchUser = () => {
    refetch();
  };

  // Extract roles from user data
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
    isAuthenticated: !!getStoredToken(),
    logout,
    refetchUser,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
