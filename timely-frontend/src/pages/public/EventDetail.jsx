import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI, eventFixturesAPI, ticketsAPI } from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import useLiveChannel from '../../hooks/useLiveChannel.js';
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements.jsx';

export default function EventDetail() {
  const { id } = useParams();
  const [active, setActive] = useState('overview');
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState({ loading: false, items: [] });
  const [results, setResults] = useState({ loading: false, items: [] });
  const [leaderboard, setLeaderboard] = useState({ loading: false, items: [] });
  const [tickets, setTickets] = useState({ loading: false, items: [] });
  const [media, setMedia] = useState({ loading: false, items: [] });
  const [news, setNews] = useState({ loading: false, items: [] });
  const { push } = useToast();

  useEffect(() => {
    let activeFlag = true;
    setLoading(true);
    publicAPI.getEvent(id)
      .then((data) => { if (activeFlag) setEvent(data); })
      .catch((err) => { 
        if (activeFlag) {
          setEvent(null);
          push({ type: 'error', title: 'Failed to load event', message: err.message || 'Event not found.' });
        }
      })
      .finally(() => activeFlag && setLoading(false));
    return () => { activeFlag = false; };
  }, [id, push]);

  useEffect(() => {
    if (active === 'schedule') {
      setSchedule((s) => ({ ...s, loading: true }));
      // Use public fixtures endpoint
      publicAPI.getEventFixtures(id)
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
      // Use public results endpoint
      publicAPI.getEventResults(id)
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
      // Use public leaderboard endpoint
      publicAPI.getEventLeaderboard(id)
        .then((data) => {
          const items = Array.isArray(data?.leaderboard) ? data.leaderboard : (Array.isArray(data) ? data : []);
          setLeaderboard({ loading: false, items });
        })
        .catch((err) => {
          setLeaderboard({ loading: false, items: [] });
          push({ type: 'error', title: 'Failed to load leaderboard', message: err.message || 'Please try again.' });
        });
    } else if (active === 'tickets') {
      setTickets((s) => ({ ...s, loading: true }));
      // Fetch ticket types for this event
      ticketsAPI.getTicketTypes(id)
        .then((data) => {
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setTickets({ loading: false, items });
        })
        .catch((err) => {
          setTickets({ loading: false, items: [] });
          push({ type: 'error', title: 'Failed to load ticket types', message: err.message || 'Please try again.' });
        });
    } else if (active === 'media') {
      setMedia((s) => ({ ...s, loading: true }));
      // Fetch media for this event
      publicAPI.getMedia({ event: id })
        .then((data) => {
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setMedia({ loading: false, items });
        })
        .catch((err) => {
          setMedia({ loading: false, items: [] });
          push({ type: 'error', title: 'Failed to load media', message: err.message || 'Please try again.' });
        });
    } else if (active === 'news') {
      setNews((s) => ({ ...s, loading: true }));
      // Fetch news for this event
      publicAPI.getNews({ event: id })
        .then((data) => {
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setNews({ loading: false, items });
        })
        .catch((err) => {
          setNews({ loading: false, items: [] });
          push({ type: 'error', title: 'Failed to load news', message: err.message || 'Please try again.' });
        });
    }
  }, [active, id, push]);

  const handleBuyTickets = async (priceCents, ticketTypeName) => {
    try {
      // Use the real tickets API for checkout
      const response = await ticketsAPI.checkout({
        event_id: parseInt(id),
        amount: priceCents,
        currency: 'USD',
        ticket_type_name: ticketTypeName
      });
      
      if (response.client_secret) {
        // In a real implementation, this would redirect to Stripe checkout
        // For now, show success message
        push({ 
          type: 'success', 
          title: 'Checkout Created', 
          message: `Redirecting to checkout for ${ticketTypeName} ticket...` 
        });
        
        // TODO: Implement Stripe Elements integration
        console.log('Stripe client_secret:', response.client_secret);
      }
    } catch (error) {
      push({ 
        type: 'error', 
        title: 'Purchase Failed', 
        message: error.message || 'Failed to create checkout. Please try again.' 
      });
    }
  };

  // Realtime subscriptions: schedule, results, announcements
  useLiveChannel(`event_${id}_schedule`, (msg) => {
    if (msg.type === 'schedule_update') {
      // Refresh schedule tab data silently
      eventFixturesAPI.list(id)
        .then((data) => {
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setSchedule((s) => ({ ...s, items }));
        })
        .catch(() => {});
    }
  });

  useLiveChannel(`event_${id}_results`, (msg) => {
    if (msg.type === 'results_update') {
      // Refresh results and leaderboard
      eventFixturesAPI.list(id, { status: 'finished' })
        .then((data) => {
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setResults((s) => ({ ...s, items }));
        })
        .catch(() => {});
      eventFixturesAPI.leaderboard(id)
        .then((data) => {
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setLeaderboard((s) => ({ ...s, items }));
        })
        .catch(() => {});
    }
  });

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
          { key: 'announcements', label: 'Announcements' },
          { key: 'media', label: 'Media' },
          { key: 'news', label: 'News' },
          { key: 'tickets', label: 'Tickets' },
        ]}
        active={active}
        onChange={setActive}
      />
      <div className="text-sm text-gray-700">
        {active === 'overview' && (
          <div className="space-y-4">
            {event && (
              <>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Event Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Sport:</span> {event.sport_name}
                    </div>
                    <div>
                      <span className="font-medium">Venue:</span> {event.venue_name || 'TBA'}
                    </div>
                    <div>
                      <span className="font-medium">Start:</span> {new Date(event.start_datetime).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">End:</span> {new Date(event.end_datetime).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Registration Fee:</span> {event.fee_cents ? `$${(event.fee_cents / 100).toFixed(2)}` : 'Free'}
                    </div>
                    <div>
                      <span className="font-medium">Capacity:</span> {event.capacity || 'Unlimited'}
                    </div>
                  </div>
                </div>
                {event.description && (
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p>{event.description}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {active === 'schedule' && (
          schedule.loading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i)=>(<Skeleton key={i} className="h-6" />))}</div>
          ) : schedule.items.length === 0 ? (
            <EmptyState title="No fixtures yet" description="Check back later." />
          ) : (
            <ul className="space-y-2 text-sm">
              {schedule.items.map((f) => (
                <li key={f.id} className="bg-white rounded border px-3 py-2 flex justify-between">
                  <span>{f.home_team?.name || 'TBD'} vs {f.away_team?.name || 'TBD'}</span>
                  <span className="text-gray-600">{f.start_at ? new Date(f.start_at).toLocaleString() : ''}</span>
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
                  <span>{r.fixture?.home_team?.name || 'TBD'} {r.home_score} - {r.away_score} {r.fixture?.away_team?.name || 'TBD'}</span>
                  <span className="text-gray-600">{r.fixture?.status || 'Completed'}</span>
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
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">Position</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-left">Points</th>
                    <th className="px-4 py-3 text-left">Played</th>
                    <th className="px-4 py-3 text-left">Won</th>
                    <th className="px-4 py-3 text-left">Lost</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.items.map((row, index) => (
                    <tr key={row.team_id || index} className="border-b">
                      <td className="px-4 py-3">{row.position || index + 1}</td>
                      <td className="px-4 py-3">{row.team_name || 'Unknown Team'}</td>
                      <td className="px-4 py-3">{row.points || 0}</td>
                      <td className="px-4 py-3">{row.played || 0}</td>
                      <td className="px-4 py-3">{row.won || 0}</td>
                      <td className="px-4 py-3">{row.lost || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {active === 'media' && (
          media.loading ? (
            <div className="space-y-4">{[...Array(4)].map((_,i)=>(<Skeleton key={i} className="h-48" />))}</div>
          ) : media.items.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Event Media</h3>
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No media available for this event yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Photos and videos will appear here once they're uploaded and approved.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-4">Event Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {media.items.map((item, index) => (
                    <div key={item.id || index} className="relative group">
                      {item.media_type === 'image' ? (
                        <img 
                          src={item.file_url || item.url} 
                          alt={item.title || 'Event media'}
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600 mt-2">Video</p>
                          </div>
                        </div>
                      )}
                      {item.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
                          <p className="text-sm truncate">{item.title}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
        {active === 'announcements' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-4">Live Announcements</h3>
              <RealtimeAnnouncements eventId={id} />
            </div>
          </div>
        )}
        {active === 'news' && (
          news.loading ? (
            <div className="space-y-4">{[...Array(3)].map((_,i)=>(<Skeleton key={i} className="h-32" />))}</div>
          ) : news.items.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Event News</h3>
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No news articles available for this event yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Updates and announcements will appear here.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-4">Event News</h3>
                <div className="space-y-4">
                  {news.items.map((article, index) => (
                    <div key={article.id || index} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{article.excerpt || article.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {article.author?.name || article.author?.username || 'Staff'}
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(article.published_at || article.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
        {active === 'tickets' && (
          tickets.loading ? (<div className="space-y-4">{[...Array(3)].map((_,i)=>(<Skeleton key={i} className="h-24" />))}</div>) :
          tickets.items.length === 0 ? (
            <div className="space-y-4">
              {event?.fee_cents ? (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Tickets</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">General Admission</h4>
                          <p className="text-sm text-gray-600">Access to all event activities</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">${(event.fee_cents / 100).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleBuyTickets(event.fee_cents, 'General Admission')}
                      className="w-full"
                    >
                      Buy Tickets
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Tickets</h3>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-green-600 mr-2">✓</div>
                      <div>
                        <h4 className="font-medium">Free Event</h4>
                        <p className="text-sm text-gray-600">No tickets required for this free event</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-4">Available Tickets</h3>
                <div className="space-y-4">
                  {tickets.items.map((ticketType) => (
                    <div key={ticketType.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{ticketType.name}</h4>
                          {ticketType.description && (
                            <p className="text-sm text-gray-600 mt-1">{ticketType.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Available: {ticketType.available_quantity || (ticketType.quantity_total - ticketType.quantity_sold)}</span>
                            <span>Total: {ticketType.quantity_total}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-semibold text-gray-900">
                            ${(ticketType.price_cents / 100).toFixed(2)}
                          </div>
                          <Button 
                            onClick={() => handleBuyTickets(ticketType.price_cents, ticketType.name)}
                            size="sm"
                            className="mt-2"
                            disabled={!ticketType.on_sale || (ticketType.available_quantity || 0) <= 0}
                          >
                            {!ticketType.on_sale ? 'Not Available' : 
                             (ticketType.available_quantity || 0) <= 0 ? 'Sold Out' : 'Buy Now'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}


