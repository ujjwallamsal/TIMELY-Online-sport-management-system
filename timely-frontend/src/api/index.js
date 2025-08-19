// Simple API layer for the public (no-auth) endpoints

const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

// helper to add qs params safely
function qs(params = {}) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") s.append(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : "";
}

// ---- Public Events ----
export async function listPublicEvents({ page = 1, page_size = 10, ordering = "-start_date" } = {}) {
  const res = await fetch(`${BASE}/public/events/${qs({ page, page_size, ordering })}`);
  if (!res.ok) throw new Error(`listPublicEvents failed: ${res.status}`);
  return res.json();
}

export async function getPublicEvent(id) {
  if (!id) throw new Error("getPublicEvent: id is required");
  const res = await fetch(`${BASE}/public/events/${id}/`);
  if (!res.ok) throw new Error(`getPublicEvent failed: ${res.status}`);
  return res.json();
}

// ---- Public Matches / Results / News (used elsewhere) ----
export async function listPublicMatches() {
  const res = await fetch(`${BASE}/public/matches/`);
  if (!res.ok) throw new Error(`listPublicMatches failed: ${res.status}`);
  return res.json();
}

export async function listPublicResults() {
  const res = await fetch(`${BASE}/public/results/`);
  if (!res.ok) throw new Error(`listPublicResults failed: ${res.status}`);
  return res.json();
}

export async function listNews({ page = 1, page_size = 10 } = {}) {
  const res = await fetch(`${BASE}/public/news/${qs({ page, page_size })}`);
  if (!res.ok) throw new Error(`listNews failed: ${res.status}`);
  return res.json();
}
