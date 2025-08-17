import { useEffect, useState } from "react";
import { axiosPublic, isBackendOffline } from "../api/axios.js";

export default function News() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr("");
      try {
        const res = await axiosPublic.get(`/public/news/`); // no params (your backend crashed on filters earlier)
        if (alive) setData(res.data);
      } catch (e) {
        if (isBackendOffline(e)) setErr("Backend is offline (127.0.0.1:8000). Start Django.");
        else setErr(e?.response?.data?.detail || e.message || "Failed to load announcements");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const items = data?.results ?? (Array.isArray(data) ? data : []);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Announcements</h1>

      {loading && <div className="animate-pulse">Loading…</div>}
      {err && <div className="text-red-600 mb-4">Error: {err}</div>}

      {items?.length ? (
        <ul className="grid gap-4">
          {items.map(n => (
            <li key={n.id} className="border rounded p-4">
              <div className="font-semibold">{n.title || `Announcement #${n.id}`}</div>
              <div className="text-sm opacity-80">{n.published_at || n.created_at || ""}</div>
              <p className="mt-2 whitespace-pre-wrap">{n.body || n.summary || "—"}</p>
            </li>
          ))}
        </ul>
      ) : !loading ? (
        <div className="border rounded p-6 text-center opacity-80">No announcements yet.</div>
      ) : null}
    </div>
  );
}
