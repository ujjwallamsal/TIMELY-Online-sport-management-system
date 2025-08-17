import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api.js";

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

  useEffect(() => { check(); }, []);

  function openLogin() {
    // adds ?next=/api/ so you don’t hit /accounts/profile/ even if settings aren’t changed
    window.open(api.loginUrl("/api/"), "_blank", "noopener,noreferrer");
  }

  async function doLogout() {
    await api.logout();   // POST with CSRF
    await check();        // refresh flag
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


