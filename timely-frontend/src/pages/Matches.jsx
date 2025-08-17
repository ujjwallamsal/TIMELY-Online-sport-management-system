import { useEffect, useState } from "react";
import { axiosPublic } from "../api/axios.js";

function fmt(d) {
  try { return new Intl.DateTimeFormat(undefined,{year:"numeric",month:"short",day:"2-digit"}).format(new Date(d)); }
  catch { return d || ""; }
}

export default function Matches() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr("");
      try {
        // no query params — some backends 500 on unknown params
        const res = await axiosPublic.get(`/public/matches/`);
        if (alive) setData(res.data);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.detail || e.message || "Failed to load matches");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const items = data?.results ?? (Array.isArray(data) ? data : []);

  const name = (m) =>
    m.title
    || (m.home_team?.name && m.away_team?.name && `${m.home_team.name} vs ${m.away_team.name}`)
    || (m.home_team_name && m.away_team_name && `${m.home_team_name} vs ${m.away_team_name}`)
    || (m.home && m.away && `${m.home} vs ${m.away}`)
    || `Match #${m.id}`;

  const date = (m) => m.start_time || m.scheduled_at || m.date || m.kickoff;

  const venue = (m) =>
    m.venue_name || m?.venue?.name || m?.venue_detail?.name || "Seed Venue";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Matches</h1>

      {loading && <div className="animate-pulse">Loading…</div>}
      {err && <div className="text-red-600 mb-4">Error: {err}</div>}

      {items?.length ? (
        <ul className="grid gap-4">
          {items.map(m => (
            <li key={m.id} className="border rounded p-4">
              <div className="font-semibold">{name(m)}</div>
              <div className="text-sm opacity-80">
                {fmt(date(m))} • {venue(m)}
              </div>
            </li>
          ))}
        </ul>
      ) : !loading ? (
        <div className="border rounded p-6 text-center opacity-80">No matches found.</div>
      ) : null}
    </div>
  );
}
