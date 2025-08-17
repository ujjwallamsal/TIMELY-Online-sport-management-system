import { useEffect, useState } from "react";
import { axiosPublic } from "../api/axios.js";

export default function Results() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr("");
      try {
        const res = await axiosPublic.get(`/public/results/`); // no qs
        if (alive) setData(res.data);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.detail || e.message || "Failed to load results");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const items = data?.results ?? (Array.isArray(data) ? data : []);

  const title = (r) =>
    r.title || r.event_name || r.match_name || r.event?.name || `Result #${r.id}`;

  const summary = (r) => r.summary || r.description || r.notes || "—";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Results</h1>

      {loading && <div className="animate-pulse">Loading…</div>}
      {err && <div className="text-red-600 mb-4">Error: {err}</div>}

      {items?.length ? (
        <ul className="grid gap-4">
          {items.map(r => (
            <li key={r.id} className="border rounded p-4">
              <div className="font-semibold">{title(r)}</div>
              <div className="text-sm opacity-80">{summary(r)}</div>
            </li>
          ))}
        </ul>
      ) : !loading ? (
        <div className="border rounded p-6 text-center opacity-80">No results found.</div>
      ) : null}
    </div>
  );
}
