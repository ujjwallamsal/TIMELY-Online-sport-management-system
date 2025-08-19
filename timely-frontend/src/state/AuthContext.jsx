import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api.js";

/**
 * AuthProvider
 * - Detects if a Django session is active (via api.pingAuth())
 * - Opens DRF login page in a new tab when you call openLogin()
 * - Logs out with proper CSRF when you call doLogout()
 */
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  async function check() {
    setChecking(true);
    const r = await api.pingAuth();
    setAuthed(!!r.ok);
    setChecking(false);
    return r.ok;
  }

  useEffect(() => {
    check();
  }, []);

  function openLogin() {
    // DRF login (session) — after login it redirects to /api/
    window.open(api.loginUrl("/api/"), "_blank", "noopener,noreferrer");
  }

  async function doLogout() {
    await api.logout();   // POST + CSRF handled inside api.js
    await check();
  }

  return (
    <AuthCtx.Provider value={{ authed, checking, check, openLogin, doLogout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
