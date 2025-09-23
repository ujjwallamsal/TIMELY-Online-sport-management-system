import React, { useEffect, useMemo, useState } from 'react';
import Select from '../../components/ui/Select.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api, { eventFixturesAPI } from '../../services/api.js';

export default function AdminFixtures() {
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [mode, setMode] = useState('rr');

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
      const resp = await eventFixturesAPI.list(eventId, { page, page_size: pageSize });
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

  const generate = async () => {
    if (!eventId) return;
    try {
      await eventFixturesAPI.generate(eventId, mode);
      push({ type: 'success', title: 'Fixtures generated' });
    } catch (err) {
      push({ type: 'error', title: 'Generation failed', message: err.message || 'Please try again.' });
    }
  };

  const updateStatus = async (fixtureId, status) => {
    try {
      await eventFixturesAPI.patchFixture(fixtureId, { status });
      push({ type: 'success', title: 'Fixture updated' });
    } catch (err) {
      push({ type: 'error', title: 'Update failed', message: err.message || 'Please try again.' });
    }
  };

  const submitResult = async (fixtureId) => {
    try {
      await eventFixturesAPI.submitResult(fixtureId, { score_a: 0, score_b: 0 });
      push({ type: 'success', title: 'Result submitted' });
    } catch (err) {
      push({ type: 'error', title: 'Submit failed', message: err.message || 'Please try again.' });
    }
  };

  const columns = [
    { key: 'team_a.name', header: 'Team A', render: (_v, row) => row.team_a?.name },
    { key: 'team_b.name', header: 'Team B', render: (_v, row) => row.team_b?.name },
    { key: 'start_time', header: 'Start' },
    { key: 'status', header: 'Status' },
    { key: 'id', header: 'Actions', render: (_v, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => updateStatus(row.id, 'rescheduled')} className="text-xs">Reschedule</button>
        <button onClick={() => submitResult(row.id)} className="text-xs text-green-700">Submit Result</button>
      </div>
    )}
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-xl font-semibold">Fixtures</h1>
        <div className="flex items-center gap-2">
          <Select value={eventId} onChange={(e)=>setEventId(e.target.value)} className="w-56">
            <option value="">Select event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </Select>
          <Select value={mode} onChange={(e)=>setMode(e.target.value)} className="w-32">
            <option value="rr">Round-robin</option>
            <option value="ko">Knockout</option>
          </Select>
          <Button onClick={generate} disabled={!eventId}>Generate</Button>
        </div>
      </div>

      <DataTable columns={columns} fetchPage={fetchPage} />
    </div>
  );
}


