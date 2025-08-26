import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createEvent, getEvent, updateEvent } from "../lib/api";

export default function EventForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const editing = !!id;

  const [f, setF] = useState({
    name: "",
    sport: "",
    description: "",
    start_date: "",
    end_date: "",
    venue_id: "",
    capacity: 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!editing) return;
    getEvent(id)
      .then((d) => setF({
        name: d.name || "",
        sport: d.sport || "",
        description: d.description || "",
        start_date: d.start_date || "",
        end_date: d.end_date || "",
        venue_id: d.venue_id || "",
        capacity: d.capacity || 0,
      }))
      .catch(setErr);
  }, [editing, id]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      if (editing) await updateEvent(id, f);
      else await createEvent(f);
      nav("/dashboard");
    } catch (e2) {
      setErr(e2);
    } finally {
      setSaving(false);
    }
  }

  function upd(k, v) { setF((s) => ({ ...s, [k]: v })); }

  return (
    <main className="container stack">
      <h1>{editing ? "Edit event" : "Create event"}</h1>
      {err && <div className="alert">{String(err.data?.detail || err.message)}</div>}
      <form className="form card stack" onSubmit={onSubmit}>
        <label> Name <input value={f.name} onChange={e=>upd("name", e.target.value)} required/> </label>
        <label> Sport <input value={f.sport} onChange={e=>upd("sport", e.target.value)} required/> </label>
        <label> Description <textarea value={f.description} onChange={e=>upd("description", e.target.value)} /> </label>
        <div className="row">
          <label> Start <input type="date" value={f.start_date} onChange={e=>upd("start_date", e.target.value)} required/> </label>
          <label> End <input type="date" value={f.end_date} onChange={e=>upd("end_date", e.target.value)} required/> </label>
        </div>
        <div className="row">
          <label> Venue ID <input value={f.venue_id} onChange={e=>upd("venue_id", e.target.value)} /> </label>
          <label> Capacity <input type="number" min="0" value={f.capacity} onChange={e=>upd("capacity", Number(e.target.value))} /> </label>
        </div>
        <div className="row">
          <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </main>
  );
}
