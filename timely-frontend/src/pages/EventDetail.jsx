import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getPublicEvent } from "../api"; // <-- import from the folder (index.js)

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleString();
}

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getPublicEvent(id);
        if (!alive) return;
        setEvent(data);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load event");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (!id) return <Navigate to="/events" replace />;

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Event details</h1>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      {event && (
        <div className="border rounded p-4 space-y-2">
          <h2 className="text-xl font-medium">{event.name}</h2>
          <p><span className="font-medium">Sport:</span> {event.sport || "—"}</p>
          <p><span className="font-medium">Venue:</span> {event.venue?.name || "—"}</p>
          <p><span className="font-medium">Start:</span> {fmtDate(event.start_date)}</p>
          <p><span className="font-medium">End:</span> {fmtDate(event.end_date)}</p>
          {event.description && <p className="mt-2">{event.description}</p>}

          <div className="mt-4">
            <Link to="/events" className="underline">← Back to Events</Link>
          </div>
        </div>
      )}
    </div>
  );
}
