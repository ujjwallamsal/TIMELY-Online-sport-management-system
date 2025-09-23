import React, { useEffect, useState } from 'react';
import { ticketsAPI } from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function Tickets() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    ticketsAPI.myTickets()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setItems(list);
      })
      .catch((err) => {
        push({ type: 'error', title: 'Failed to load tickets', message: err.message || 'Please try again.' });
        setItems([]);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [push]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">My Tickets</h1>
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No tickets" description="Buy tickets from events to see them here." />
      ) : (
        <div className="space-y-4">
          {items.map((t) => (
            <div key={t.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium text-gray-900">{t.event?.title || 'Event'}</div>
                <div className="text-xs text-gray-600">Type: {t.type?.name || t.type || 'General'}</div>
              </div>
              <a href={`/api/tickets/${t.id}/qr/`} className="text-blue-600 text-sm">View QR</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


