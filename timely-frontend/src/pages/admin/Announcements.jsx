import React, { useEffect, useState } from 'react';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';

export default function AdminAnnouncements() {
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [message, setMessage] = useState('');
  const [list, setList] = useState([]);

  useEffect(() => {
    let active = true;
    api.getEvents({ page_size: 100 }).then(({ data }) => active && setEvents(data));
    api.list().then((data) => {
      const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      if (active) setList(items);
    }).catch(() => active && setList([]));
    return () => { active = false; };
  }, []);

  const send = async () => {
    if (!eventId || !message) return;
    try {
      await api.announceEvent(eventId, { message });
      push({ type: 'success', title: 'Announcement sent' });
      setMessage('');
    } catch (err) {
      push({ type: 'error', title: 'Send failed', message: err.message || 'Please try again.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Announcements</h1>
      <div className="flex items-start gap-3 mb-6">
        <Select value={eventId} onChange={(e)=>setEventId(e.target.value)} className="w-64">
          <option value="">Select event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </Select>
        <Textarea value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Write announcement…" className="flex-1" />
        <Button onClick={send} disabled={!eventId || !message}>Send</Button>
      </div>

      <div className="space-y-3">
        {list.map((a) => (
          <div key={a.id} className="bg-white rounded-lg border p-3 text-sm">
            <div className="font-medium text-gray-900">{a.event?.title || 'Event'}</div>
            <div className="text-gray-700">{a.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


