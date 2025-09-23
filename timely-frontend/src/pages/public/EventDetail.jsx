import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI, eventFixturesAPI } from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function EventDetail() {
  const { id } = useParams();
  const [active, setActive] = useState('overview');
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState({ loading: false, items: [] });
  const [results, setResults] = useState({ loading: false, items: [] });
  const [leaderboard, setLeaderboard] = useState({ loading: false, items: [] });
  const { push } = useToast();

  useEffect(() => {
    let activeFlag = true;
    setLoading(true);
    publicAPI.getEvent(id)
      .then((data) => { if (activeFlag) setEvent(data); })
      .catch(() => { if (activeFlag) setEvent(null); })
      .finally(() => activeFlag && setLoading(false));
    return () => { activeFlag = false; };
  }, [id]);

  useEffect(() => {
    if (active === 'schedule') {
      setSchedule((s) => ({ ...s, loading: true }));
      eventFixturesAPI.list(id)
        .then((data) => {
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setSchedule({ loading: false, items });
        })
        .catch((err) => {
          setSchedule({ loading: false, items: [] });
          push({ type: 'error', title: 'Failed to load schedule', message: err.message || 'Please try again.' });
        });
    } else if (active === 'results') {
      setResults((s) => ({ ...s, loading: true }));
      eventFixturesAPI.list(id, { status: 'finished' })
        .then((data) => {
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setResults({ loading: false, items });
        })
        .catch((err) => {
          setResults({ loading: false, items: [] });
          push({ type: 'error', title: 'Failed to load results', message: err.message || 'Please try again.' });
        });
    } else if (active === 'leaderboard') {
      setLeaderboard((s) => ({ ...s, loading: true }));
      eventFixturesAPI.leaderboard(id)
        .then((data) => {
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setLeaderboard({ loading: false, items });
        })
        .catch((err) => {
          setLeaderboard({ loading: false, items: [] });
          push({ type: 'error', title: 'Failed to load leaderboard', message: err.message || 'Please try again.' });
        });
    }
  }, [active, id, push]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-2">{loading ? <Skeleton className="h-6 w-48" /> : event?.title || `Event ${id}`}</h1>
      <p className="text-gray-600 mb-4">{loading ? <Skeleton className="h-4 w-64" /> : event?.description || ''}</p>
      <Tabs
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'schedule', label: 'Schedule' },
          { key: 'results', label: 'Results' },
          { key: 'leaderboard', label: 'Leaderboard' },
          { key: 'media', label: 'Media' },
          { key: 'news', label: 'News' },
          { key: 'tickets', label: 'Tickets' },
        ]}
        active={active}
        onChange={setActive}
      />
      <div className="text-sm text-gray-700">
        {active === 'overview' && <div>Event information coming soon.</div>}
        {active === 'schedule' && (
          schedule.loading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i)=>(<Skeleton key={i} className="h-6" />))}</div>
          ) : schedule.items.length === 0 ? (
            <EmptyState title="No fixtures yet" description="Check back later." />
          ) : (
            <ul className="space-y-2 text-sm">
              {schedule.items.map((f) => (
                <li key={f.id} className="bg-white rounded border px-3 py-2 flex justify-between">
                  <span>{f.team_a?.name} vs {f.team_b?.name}</span>
                  <span className="text-gray-600">{f.start_time ? new Date(f.start_time).toLocaleString() : ''}</span>
                </li>
              ))}
            </ul>
          )
        )}
        {active === 'results' && (
          results.loading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i)=>(<Skeleton key={i} className="h-6" />))}</div>
          ) : results.items.length === 0 ? (
            <EmptyState title="No results yet" description="Completed matches will appear here." />
          ) : (
            <ul className="space-y-2 text-sm">
              {results.items.map((r) => (
                <li key={r.id} className="bg-white rounded border px-3 py-2 flex justify-between">
                  <span>{r.team_a?.name} {r.score_a} - {r.score_b} {r.team_b?.name}</span>
                  <span className="text-gray-600">{r.status}</span>
                </li>
              ))}
            </ul>
          )
        )}
        {active === 'leaderboard' && (
          leaderboard.loading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i)=>(<Skeleton key={i} className="h-6" />))}</div>
          ) : leaderboard.items.length === 0 ? (
            <EmptyState title="No leaderboard yet" description="Appears as results are recorded." />
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-3 text-left">Team</th><th className="px-4 py-3 text-left">Points</th></tr></thead>
                <tbody>
                  {leaderboard.items.map((row) => (
                    <tr key={row.team_id} className="border-b">
                      <td className="px-4 py-3">{row.team_name}</td>
                      <td className="px-4 py-3">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {active === 'media' && <div>Media will load from /api/public/media?event={id}</div>}
        {active === 'news' && <div>News will load from /api/content/public/news?event={id}</div>}
        {active === 'tickets' && <div>Tickets UI and checkout</div>}
      </div>
    </div>
  );
}


