import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.js";

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
    const payload = { email, password };
    console.log('Login attempt with payload:', payload);
    try {
      const data = await api.login(email, password);
      console.log('Login successful:', data);
      
      // Get user data after successful login
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
      // Clear the user state
      setUser(null);
    }
  };

  const signup = async ({ email, password, password_confirm, first_name = '', last_name = '', role = 'SPECTATOR' }) => {
    try {
      const data = await api.post('/auth/register', { 
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
      const data = await api.getCurrentUser();
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
