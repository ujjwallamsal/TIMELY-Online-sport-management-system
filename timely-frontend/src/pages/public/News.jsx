import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/content/public/news/')
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setItems(list);
      })
      .catch((err) => {
        push({ type: 'error', title: 'Failed to load news', message: err.message || 'Please try again.' });
        setItems([]);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [push]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">News</h1>
      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No news found" description="Check back later." />
      ) : (
        <div className="space-y-4">
          {items.map((n) => (
            <div key={n.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-900">{n.title}</div>
              <div className="text-xs text-gray-600">{n.summary || ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


