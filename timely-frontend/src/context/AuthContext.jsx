import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import useWebSocket from "../hooks/useWebSocket.js";

const AuthContext = createContext();

// Helper function to get role-based redirect path
const getRoleBasedPath = (role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'ORGANIZER':
      return '/organizer';
    case 'COACH':
      return '/coach';
    case 'ATHLETE':
      return '/athlete';
    case 'SPECTATOR':
    default:
      return '/';
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // WebSocket for real-time role updates and notifications
  const { lastMessage, wsConnected } = useWebSocket(
    user ? `/ws/user/${user.id}/` : null,
    {
      onMessage: (data) => {
        if (data.type === 'role_update') {
          // Update user role and refresh user data
          setUser(prev => prev ? { ...prev, role: data.role } : null);
          // Navigate to appropriate dashboard based on new role
          const newPath = getRoleBasedPath(data.role);
          navigate(newPath, { replace: true });
          // Optionally refresh full user data
          refreshUser();
        } else if (data.type === 'notification') {
          // Handle notifications (will be implemented with notification system)
          console.log('Received notification:', data);
        } else if (data.type === 'pong') {
          // Handle ping response
          console.log('WebSocket ping response received');
        }
      },
      onError: (error) => {
        console.log('WebSocket connection failed, will fallback to polling');
      }
    }
  );

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for logout events from API service (e.g., 401 responses)
    const handleLogout = (event) => {
      setUser(null);
      setLoading(false);
    };
    
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = api.getStoredToken();

      if (!token) {
        setUser(null);
        return;
      }

      const me = await api.getCurrentUser();
      setUser(me);
    } catch (error) {
      const status = error?.status || error?.response?.status;
      if (status === 401) {
        api.setToken(null);
        setUser(null);
      } else {
        console.log('Auth check failed:', error?.message || error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await api.login(email, password);
      
      // Use user data from login response
      if (data.user) {
        setUser(data.user);
        return data.user;
      }
      
      // Fallback: get user data if not in response
      const userData = await api.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const register = async ({ email, password, password_confirm, first_name = '', last_name = '', role = 'SPECTATOR' }) => {
    try {
      const data = await api.register(email, password, password_confirm, first_name, last_name, role);
      // Auto login after successful registration
      await login(email, password);
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const data = await api.getCurrentUser();
      setUser(data);
      return data;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    refreshUser,
    getRoleBasedPath,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}