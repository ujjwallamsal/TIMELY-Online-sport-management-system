import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data } = await api.get('/accounts/users/me/');
      setUser(data);
    } catch (error) {
      console.log('Auth check failed:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    const payload = /@/.test(emailOrUsername) ? { email: emailOrUsername, password } : { username: emailOrUsername, password };
    console.log('Login attempt with payload:', payload);
    try {
      // First, get a CSRF token if we don't have one
      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      if (!csrfToken) {
        console.log('No CSRF token found, getting one from backend...');
        try {
          // Make a GET request to get the CSRF token
          await api.get('/');
          csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
          console.log('CSRF token obtained:', csrfToken ? 'Yes' : 'No');
        } catch (error) {
          console.warn('Failed to get CSRF token:', error);
        }
      }
      
      const { data } = await api.post('/accounts/auth/login/', payload);
      console.log('Login successful:', data);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // First, get a CSRF token if we don't have one
      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      if (!csrfToken) {
        console.log('No CSRF token found for logout, getting one from backend...');
        try {
          // Make a GET request to get the CSRF token
          await api.get('/');
          csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
          console.log('CSRF token obtained for logout:', csrfToken ? 'Yes' : 'No');
        } catch (error) {
          console.warn('Failed to get CSRF token for logout:', error);
        }
      }
      
      window.__LOGGED_OUT__ = true;
      await api.post('/accounts/auth/logout/');
    } finally {
      setUser(null);
    }
  };

  const signup = async ({ email, password, password_confirm, first_name = '', last_name = '', role = 'SPECTATOR' }) => {
    // First, get a CSRF token if we don't have one
    let csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    if (!csrfToken) {
      console.log('No CSRF token found for signup, getting one from backend...');
      try {
        // Make a GET request to get the CSRF token
        await api.get('/');
        csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1];
        console.log('CSRF token obtained for signup:', csrfToken ? 'Yes' : 'No');
      } catch (error) {
        console.warn('Failed to get CSRF token for signup:', error);
      }
    }
    
    const { data } = await api.post('/accounts/auth/register/', { email, password, password_confirm, first_name, last_name, role });
    // auto login
    await login(email, password);
    return data;
  };

  const refreshUser = async () => {
    const { data } = await api.get('/accounts/users/me/');
    setUser(data);
    return data;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signup,
    refreshUser,
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
