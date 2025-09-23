import React, { useEffect, useMemo, useState } from 'react';
import Select from '../../components/ui/Select.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';

export default function AdminRegistrations() {
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    let active = true;
    api.getEvents({ page_size: 100 })
      .then(({ data }) => { if (active) setEvents(data); })
      .catch(() => { if (active) setEvents([]); });
    return () => { active = false; };
  }, []);

  const fetchPage = useMemo(() => {
    return async ({ page, pageSize }) => {
      if (!eventId) return { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };
      const resp = await api.get(`/events/${eventId}/registrations/`, { page, page_size: pageSize });
      const data = resp.results || resp.data || [];
      return {
        data,
        pagination: {
          page: resp.page || page,
          pageSize,
          total: resp.count || data.length,
          totalPages: Math.ceil((resp.count || data.length) / pageSize)
        }
      };
    };
  }, [eventId]);

  const approve = async (id) => {
    try {
      await api.patch(`/registrations/${id}/`, { status: 'approved' });
      push({ type: 'success', title: 'Approved' });
    } catch (err) {
      push({ type: 'error', title: 'Approve failed', message: err.message || 'Please try again.' });
    }
  };

  const reject = async (id) => {
    try {
      await api.patch(`/registrations/${id}/`, { status: 'rejected' });
      push({ type: 'success', title: 'Rejected' });
    } catch (err) {
      push({ type: 'error', title: 'Reject failed', message: err.message || 'Please try again.' });
    }
  };

  const columns = [
    { key: 'applicant_name', header: 'Applicant' },
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Created' },
    { key: 'id', header: 'Actions', render: (_v, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => approve(row.id)} className="text-xs text-green-700">Approve</button>
        <button onClick={() => reject(row.id)} className="text-xs text-red-700">Reject</button>
      </div>
    ) }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Registrations</h1>
        <div className="w-64">
          <Select value={eventId} onChange={(e)=>setEventId(e.target.value)}>
            <option value="">Select event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </Select>
        </div>
      </div>

      <DataTable columns={columns} fetchPage={fetchPage} />
    </div>
  );
}


