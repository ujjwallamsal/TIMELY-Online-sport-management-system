import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function Media() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/public/media/')
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setItems(list);
      })
      .catch((err) => {
        push({ type: 'error', title: 'Failed to load media', message: err.message || 'Please try again.' });
        setItems([]);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [push]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Media</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No media found" description="Check back later." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => (
            <div key={m.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {m.thumbnail_url ? (
                <img src={m.thumbnail_url} alt={m.title || 'Media'} className="w-full h-40 object-cover" />
              ) : (
                <div className="h-40 bg-gray-100" />
              )}
              <div className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900 line-clamp-1">{m.title || 'Untitled'}</div>
                <div className="text-xs text-gray-600 line-clamp-2">{m.description || ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


