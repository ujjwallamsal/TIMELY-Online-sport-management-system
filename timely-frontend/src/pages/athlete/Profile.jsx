import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import Button from '../../components/ui/Button.jsx';

export default function AthleteProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [docs, setDocs] = useState({ loading: true, items: [] });

  useEffect(() => {
    if (user) {
      setForm({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '' });
    }
  }, [user]);

  useEffect(() => {
    // Try to load documents if endpoint exists; otherwise show TODO
    async function loadDocs() {
      try {
        const data = await api.get('/documents/mine/');
        const items = data.results || data.data || [];
        setDocs({ loading: false, items });
      } catch (_) {
        setDocs({ loading: false, items: [] });
      }
    }
    loadDocs();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async () => {
    setSaving(true);
    try {
      await api.patch('/me/', form);
      await refreshUser();
    } catch (_) {
      // noop minimal
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Athlete Profile</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email (read-only)</label>
            <input className="w-full border rounded px-3 py-2 bg-gray-50" value={user?.email || ''} readOnly />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">First name</label>
            <input name="first_name" value={form.first_name} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Last name</label>
            <input name="last_name" value={form.last_name} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={onSave} isLoading={saving}>Save</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        <p className="text-sm text-gray-600 mb-3">Upload ID and medical clearance. Allowed types: PDF/JPG/PNG, up to 5MB.</p>
        <div className="flex items-center gap-3 mb-4">
          <input type="file" disabled className="border rounded px-3 py-2" />
          <Button disabled>Upload (TODO)</Button>
        </div>
        {docs.loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : docs.items.length === 0 ? (
          <div className="text-sm text-gray-500">No documents found. Upload functionality pending backend endpoint.</div>
        ) : (
          <ul className="space-y-2">
            {docs.items.map(d => (
              <li key={d.id} className="border rounded p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.type || 'Document'}</div>
                  <div className="text-gray-500">Uploaded {d.uploaded_at || ''}</div>
                </div>
                {d.url && <a className="text-blue-600 hover:underline" href={d.url} target="_blank" rel="noreferrer">View</a>}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 text-sm text-gray-600">
          Privacy: Organizers can see your submitted documents once you register for an event; otherwise they remain private.
        </div>
      </div>
    </div>
  );
}


