// src/api/axios.js
import axios from "axios";

const BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

// Public client (no cookies) for /api/public/*
export const axiosPublic = axios.create({
  baseURL: BASE,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// Private client (uses cookies) for authed /api/*
export const axiosPrivate = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// Optional helper: clearer message when backend is offline
export function isBackendOffline(err) {
  return (
    err?.code === "ERR_NETWORK" ||
    /NetworkError|Failed to fetch|ERR_CONNECTION_REFUSED/i.test(err?.message || "")
  );
}
