import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import Button from '../components/ui/Button.jsx';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '' });

  useEffect(() => {
    if (user) {
      setForm({ first_name: user.first_name || '', last_name: user.last_name || '' });
    }
  }, [user]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async () => {
    setSaving(true);
    try {
      await api.patch('/me/', form);
      await refreshUser();
    } catch (_) {
    } finally {
      setSaving(false);
    }
  };

  const onApplyOrganizer = async () => {
    setApplyLoading(true);
    try {
      await api.applyOrganizer();
      await refreshUser();
    } catch (_) {
    } finally {
      setApplyLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input className="w-full border rounded px-3 py-2 bg-gray-50" value={user.email || ''} readOnly />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Role</label>
            <input className="w-full border rounded px-3 py-2 bg-gray-50" value={user.role} readOnly />
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

      {user.role === 'SPECTATOR' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Upgrade your account</h2>
          <p className="text-sm text-gray-600 mb-4">Upgrade to participate or organize events.</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={onApplyOrganizer} isLoading={applyLoading}>Apply to be Organizer</Button>
            <Button disabled title="Contact support to enable athlete access">Become Athlete (Ask Admin)</Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Organizer applications are reviewed by admins. Athlete access can be enabled by an admin.</p>
        </div>
      )}

      {user.role === 'ATHLETE' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Athlete</h2>
          <p className="text-sm text-gray-600">Documents (ID, medical) are managed per registration. Upload prompts will appear when you register for events.</p>
        </div>
      )}

      {user.role === 'ORGANIZER' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Organizer</h2>
          <p className="text-sm text-gray-600">Manage teams, add coaches, and schedule fixtures from the Organizer dashboard.</p>
          <ul className="list-disc pl-5 text-sm text-blue-700">
            <li><a href="/organizer/events" className="hover:underline">My Events</a></li>
            <li><a href="/organizer/registrations" className="hover:underline">Registrations</a></li>
            <li><a href="/organizer/fixtures" className="hover:underline">Fixtures</a></li>
            <li><a href="/organizer/results" className="hover:underline">Results</a></li>
          </ul>
        </div>
      )}

      {user.role === 'COACH' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Coach</h2>
          <p className="text-sm text-gray-600">Your team assignments and schedules appear on your dashboard.</p>
        </div>
      )}
    </div>
  );
}


