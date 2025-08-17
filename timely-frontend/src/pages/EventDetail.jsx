import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { axiosPublic } from "../api/axios.js";
import { formatDate } from "../lib/format.js";

export default function EventDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr("");
      try {
        const res = await axiosPublic.get(`/public/events/${id}/`);
        if (alive) setData(res.data);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.detail || e.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="container mx-auto max-w-3xl px-4 py-8">Loading…</div>;
  if (err) return <div className="container mx-auto max-w-3xl px-4 py-8 text-red-600">Error: {err}</div>;
  if (!data) return null;

  const v = data.venue_detail || data.venue;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link to="/events" className="underline">&larr; Back to events</Link>
      <h1 className="text-3xl font-bold mt-4">{data.name}</h1>
      <div className="opacity-80">{data.sport_type} • {data.status}</div>
      <div className="mt-2">{formatDate(data.start_date)} → {formatDate(data.end_date)}</div>

      <div className="mt-6">
        <h2 className="font-semibold">Venue</h2>
        <div>{v?.name}</div>
        <div>{v?.address} {v?.city} {v?.state} {v?.postcode}</div>
        <div>Capacity: {v?.capacity}</div>
      </div>

      {data.notes && (
        <div className="mt-6">
          <h2 className="font-semibold">Notes</h2>
          <p>{data.notes}</p>
        </div>
      )}
    </div>
  );
}
