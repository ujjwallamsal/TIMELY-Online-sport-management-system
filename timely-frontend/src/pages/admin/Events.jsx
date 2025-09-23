import React, { useCallback, useState } from 'react';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api, { cancelEvent } from '../../services/api.js';

export default function AdminEvents() {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_date: '' });

  const fetchPage = useCallback(async ({ page, pageSize }) => {
    return await api.getEvents({ page, page_size: pageSize });
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createEvent(form);
      push({ type: 'success', title: 'Event created', message: form.title });
      setOpen(false);
    } catch (err) {
      push({ type: 'error', title: 'Create failed', message: err.message || 'Please try again.' });
    } finally {
      setCreating(false);
    }
  };

  const onCancel = async (id) => {
    try {
      await cancelEvent(id);
      push({ type: 'success', title: 'Event canceled' });
    } catch (err) {
      push({ type: 'error', title: 'Cancel failed', message: err.message || 'Please try again.' });
    }
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'status', header: 'Status' },
    { key: 'start_date', header: 'Start' },
    { key: 'id', header: 'Actions', render: (_v, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => onCancel(row.id)} className="text-xs text-red-600">Cancel</button>
      </div>
    )}
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Manage Events</h1>
        <Button onClick={() => setOpen(true)}>Create Event</Button>
      </div>
      <DataTable columns={columns} fetchPage={fetchPage} />

      <Dialog open={open} onClose={() => setOpen(false)} title="Create Event">
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <Input value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <Input value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <Input type="datetime-local" value={form.start_date} onChange={(e)=>setForm({...form, start_date: e.target.value})} />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="text-sm" onClick={()=>setOpen(false)}>Cancel</button>
            <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}


