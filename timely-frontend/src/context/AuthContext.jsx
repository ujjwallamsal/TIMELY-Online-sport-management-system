import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

// Helper function to get role-based redirect path
const getRoleBasedPath = (role) => {
  switch (role) {
    case 'ADMIN':
    case 'ORGANIZER':
      return '/admin';
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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // With cookie-based auth, we don't need to check localStorage
      // The cookies are sent automatically with withCredentials: true
      const { data } = await api.get('me');
      setUser(data);
    } catch (error) {
      // Don't log 401 errors as they're expected for unauthenticated users
      if (error.response?.status !== 401) {
        console.log('Auth check failed:', error.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const payload = { email, password };
    console.log('Login attempt with payload:', payload);
    try {
      const { data } = await api.post('auth/login', payload);
      console.log('Login successful:', data);
      
      // Store tokens if provided
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      
      // Get user data after successful login
      const { data: userData } = await api.get('me');
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('accounts/auth/logout/');
    } finally {
      // With cookie-based auth, cookies are cleared by the backend
      // Just clear the user state
      setUser(null);
    }
  };

  const signup = async ({ email, password, password_confirm, first_name = '', last_name = '', role = 'SPECTATOR' }) => {
    try {
      const { data } = await api.post('accounts/auth/register/', { 
        email, 
        password, 
        password_confirm, 
        first_name, 
        last_name, 
        role 
      });
      // Auto login after successful registration
      await login(email, password);
      return data;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('me');
      setUser(data);
      return data;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  // Remove duplicate getMe function - use refreshUser instead
  const value = {
    user,
    loading,
    login,
    logout,
    signup,
    refreshUser,
    getMe: refreshUser, // Alias to prevent breaking existing code
    getRoleBasedPath: (role) => getRoleBasedPath(role),
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
