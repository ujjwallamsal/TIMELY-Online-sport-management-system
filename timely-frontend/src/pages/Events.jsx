import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { axiosPublic, isBackendOffline } from "../api/axios.js";

function fmt(s) { try { return new Intl.DateTimeFormat(undefined,{year:"numeric",month:"short",day:"2-digit"}).format(new Date(s)); } catch { return s || ""; } }

export default function Events() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const page = Number(params.get("page") || 1);
  const search = params.get("q") || "";
  const ordering = params.get("sort") || "-start_date";
  const pageSize = 10;

  const qs = useMemo(() => {
    const p = new URLSearchParams({ page, page_size: pageSize, ordering });
    if (search) p.set("search", search);
    return p.toString();
  }, [page, pageSize, ordering, search]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr("");
      try {
        const res = await axiosPublic.get(`/public/events/?${qs}`);
        if (alive) setData(res.data);
      } catch (e) {
        if (isBackendOffline(e)) setErr("Backend is offline (127.0.0.1:8000). Start Django.");
        else setErr(e?.response?.data?.detail || e.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [qs]);

  const items = data?.results ?? (Array.isArray(data) ? data : []);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Events</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q")?.toString().trim() || "";
          const next = new URLSearchParams(params);
          if (q) next.set("q", q); else next.delete("q");
          next.set("page", "1");
          setParams(next, { replace: true });
        }}
        className="mb-4 flex gap-2"
      >
        <input name="q" defaultValue={search} placeholder="Search…" className="border rounded px-3 py-2 w-full" />
        <select
          value={ordering}
          onChange={(e) => { const next = new URLSearchParams(params); next.set("sort", e.target.value); next.set("page", "1"); setParams(next, { replace: true }); }}
          className="border rounded px-2 py-2"
        >
          <option value="-start_date">Upcoming first</option>
          <option value="start_date">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="-name">Name Z–A</option>
        </select>
        <button className="border rounded px-4 py-2">Search</button>
      </form>

      {loading && <div className="animate-pulse">Loading…</div>}
      {err && <div className="text-red-600 mb-4">Error: {err}</div>}

      {!loading && !err && (items?.length ? (
        <ul className="grid gap-4">
          {items.map((e) => (
            <li key={e.id} className="border rounded p-4">
              <div className="text-lg font-semibold">{e.name}</div>
              <div className="text-sm opacity-80">
                {e.sport_type} • {e?.venue_detail?.name || e?.venue?.name || "TBA"} • {e.city || "—"}
              </div>
              <div className="text-sm">{fmt(e.start_date)} → {fmt(e.end_date)}</div>
              <Link className="inline-block mt-2 underline" to={`/events/${e.id}`}>View details</Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border rounded p-6 text-center opacity-80">No events found{search ? ` for “${search}”` : ""}.</div>
      ))}
    </div>
  );
}
