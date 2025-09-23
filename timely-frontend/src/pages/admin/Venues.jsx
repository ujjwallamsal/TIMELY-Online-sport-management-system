import React, { useCallback, useMemo, useState } from 'react';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';

export default function AdminVenues() {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', address: '' });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [availability, setAvailability] = useState(null);

  const fetchPage = useCallback(async ({ page, pageSize }) => {
    return await api.getVenues({ page, page_size: pageSize });
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createVenue(form);
      push({ type: 'success', title: 'Venue created', message: form.name });
      setOpen(false);
    } catch (err) {
      push({ type: 'error', title: 'Create failed', message: err.message || 'Please try again.' });
    } finally {
      setCreating(false);
    }
  };

  const viewAvailability = async () => {
    try {
      const res = await api.get('/venues/availability/', { from, to });
      setAvailability(res);
    } catch (err) {
      push({ type: 'error', title: 'Availability error', message: err.message || 'Please try again.' });
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'address', header: 'Address' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Venues</h1>
        <Button onClick={() => setOpen(true)}>Create Venue</Button>
      </div>

      <div className="flex items-end gap-2 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
          <Input type="datetime-local" value={from} onChange={(e)=>setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
          <Input type="datetime-local" value={to} onChange={(e)=>setTo(e.target.value)} />
        </div>
        <Button onClick={viewAvailability}>View Availability</Button>
      </div>

      {availability ? (
        <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto mb-4">{JSON.stringify(availability, null, 2)}</pre>
      ) : null}

      <DataTable columns={columns} fetchPage={fetchPage} />

      <Dialog open={open} onClose={() => setOpen(false)} title="Create Venue">
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <Input value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <Input value={form.address} onChange={(e)=>setForm({...form, address: e.target.value})} />
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


