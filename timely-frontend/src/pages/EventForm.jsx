// src/pages/EventForm.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { axiosPrivate } from "../api/axios.js";

export default function EventForm({ mode }) {
  const isEdit = mode === "edit";
  const { id } = useParams();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    name: "", sport_type: "",
    start_date: "", end_date: "",
    status: "", notes: ""
  });
  const [loading, setLoading] = useState(isEdit);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    (async () => {
      try {
        // READ may use public detail (no creds)
        const base = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
        const res = await fetch(`${base}/public/events/${id}/`, { headers:{Accept:"application/json"}});
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const j = await res.json();
        if (alive) setValues({
          name: j.name || "", sport_type: j.sport_type || "",
          start_date: j.start_date || "", end_date: j.end_date || "",
          status: j.status || "", notes: j.notes || ""
        });
      } catch (e) { if (alive) setErr(e.message || "Failed to load"); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id, isEdit]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (isEdit) {
        await axiosPrivate.put(`/events/${id}/`, values);    // PUT /api/events/:id/
      } else {
        await axiosPrivate.post(`/events/`, values);         // POST /api/events/
      }
      navigate("/events");
    } catch (e2) {
      setErr(e2?.response?.data?.detail || e2.message || "Failed to save");
    }
  }

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? "Edit" : "Create"} Event</h1>
      {err && <div className="text-red-600 mb-4">Error: {err}</div>}
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1">
          <span>Name</span>
          <input className="border rounded px-3 py-2" value={values.name}
                 onChange={(e)=>setValues(v=>({...v,name:e.target.value}))} required/>
        </label>
        <label className="grid gap-1">
          <span>Sport type</span>
          <input className="border rounded px-3 py-2" value={values.sport_type}
                 onChange={(e)=>setValues(v=>({...v,sport_type:e.target.value}))} required/>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span>Start date</span>
            <input type="date" className="border rounded px-3 py-2" value={values.start_date}
                   onChange={(e)=>setValues(v=>({...v,start_date:e.target.value}))} required/>
          </label>
          <label className="grid gap-1">
            <span>End date</span>
            <input type="date" className="border rounded px-3 py-2" value={values.end_date}
                   onChange={(e)=>setValues(v=>({...v,end_date:e.target.value}))} required/>
          </label>
        </div>
        <label className="grid gap-1">
          <span>Status</span>
          <input className="border rounded px-3 py-2" value={values.status}
                 onChange={(e)=>setValues(v=>({...v,status:e.target.value}))}/>
        </label>
        <label className="grid gap-1">
          <span>Notes</span>
          <textarea className="border rounded px-3 py-2" rows={4} value={values.notes}
                    onChange={(e)=>setValues(v=>({...v,notes:e.target.value}))}/>
        </label>
        <div className="flex gap-3">
          <button className="border rounded px-4 py-2" type="submit">
            {isEdit ? "Save changes" : "Create event"}
          </button>
          <button className="border rounded px-4 py-2" type="button" onClick={()=>history.back()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
