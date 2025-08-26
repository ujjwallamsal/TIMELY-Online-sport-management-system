import React, { createContext, useContext, useEffect, useState } from "react";
import * as api from "../lib/api"; // uses your src/lib/api.js

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  async function refreshAuth() {
    try {
      // ping cookie session and load /me
      await api.pingAuth();
      const me = await api.getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = () => {
    // open Django login, user returns and clicks “I’m logged in”
    window.open(api.urls.login, "_blank", "noopener,noreferrer");
  };

  const confirmLoggedIn = async () => {
    await refreshAuth();
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthCtx.Provider value={{ user, initializing, login, confirmLoggedIn, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
