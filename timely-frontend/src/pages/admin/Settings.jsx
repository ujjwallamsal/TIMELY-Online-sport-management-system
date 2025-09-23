import React, { useEffect, useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminSettings() {
  const { user, refreshUser } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMe(form);
      await refreshUser();
      push({ type: 'success', title: 'Profile updated' });
    } catch (err) {
      push({ type: 'error', title: 'Update failed', message: err.message || 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Profile Settings</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
          <Input value={form.first_name} onChange={(e)=>setForm({...form, first_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
          <Input value={form.last_name} onChange={(e)=>setForm({...form, last_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <Input type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
        </div>
        <div className="flex items-center justify-end">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>
    </div>
  );
}


