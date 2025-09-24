import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import useWebSocket from '../../hooks/useWebSocket.js';
import { 
  CalendarIcon, 
  TrophyIcon, 
  TicketIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

export default function AthleteDashboard() {
  const { user } = useAuth();
  const { push } = useToast();
  const [mySchedule, setMySchedule] = useState({ loading: true, items: [] });
  const [myResults, setMyResults] = useState({ loading: true, items: [] });
  const [myTickets, setMyTickets] = useState({ loading: true, items: [] });
  const [myRegistrations, setMyRegistrations] = useState({ loading: true, items: [] });
  const [notifications, setNotifications] = useState({ loading: true, items: [] });
  const [organizerApplication, setOrganizerApplication] = useState({ loading: false, status: null });

  // Subscribe to per-user realtime channel for updates
  useWebSocket(user ? `/ws/user/${user.id}/` : null, {
    onMessage: (data) => {
      if (data?.type === 'registration_update') {
        setMyRegistrations(prev => ({
          ...prev,
          items: prev.items.map(r => r.id === data.registration_id ? { ...r, status: data.status } : r)
        }));
      }
      if (data?.type === 'announcement' || data?.type === 'notification') {
        setNotifications(prev => ({ ...prev, items: [{ id: data.id || Date.now(), ...data }, ...prev.items] }));
      }
      if (data?.type === 'order_paid') {
        // Refresh orders on payment confirmation
        api.getOrders({ mine: 1 }).then(d => {
          const items = d.results || d.data || [];
          setMyTickets({ loading: false, items: items.slice(0, 3) });
        }).catch(() => {});
      }
    }
  });

  useEffect(() => {
    // Fetch athlete's schedule (fixtures where they participate)
    setMySchedule(prev => ({ ...prev, loading: true }));
    api.getEvents({ participant: user?.id, status: 'UPCOMING' })
      .then(data => {
        const items = data.results || data.data || [];
        setMySchedule({ loading: false, items: items.slice(0, 5) });
      })
      .catch(err => {
        setMySchedule({ loading: false, items: [] });
        push({ type: 'error', title: 'Failed to load schedule', message: err.message });
      });

    // Fetch athlete's results (completed events)
    setMyResults(prev => ({ ...prev, loading: true }));
    api.getEvents({ participant: user?.id, status: 'COMPLETED' })
      .then(data => {
        const items = data.results || data.data || [];
        setMyResults({ loading: false, items: items.slice(0, 5) });
      })
      .catch(err => {
        setMyResults({ loading: false, items: [] });
        push({ type: 'error', title: 'Failed to load results', message: err.message });
      });

    // Fetch athlete's tickets (orders)
    setMyTickets(prev => ({ ...prev, loading: true }));
    api.getOrders({ mine: 1 })
      .then(data => {
        const items = data.results || data.data || [];
        setMyTickets({ loading: false, items: items.slice(0, 3) });
      })
      .catch(err => {
        setMyTickets({ loading: false, items: [] });
        push({ type: 'error', title: 'Failed to load tickets', message: err.message });
      });

    // Fetch my registrations
    setMyRegistrations(prev => ({ ...prev, loading: true }));
    api.getRegistrations({ mine: 1 })
      .then(data => {
        const items = data.results || data.data || [];
        setMyRegistrations({ loading: false, items });
      })
      .catch(err => {
        setMyRegistrations({ loading: false, items: [] });
        push({ type: 'error', title: 'Failed to load registrations', message: err.message });
      });

    // Fetch notifications
    setNotifications(prev => ({ ...prev, loading: true }));
    api.getNotifications({ unread_first: 1 })
      .then(data => {
        const items = data.results || data.data || [];
        setNotifications({ loading: false, items });
      })
      .catch(err => {
        setNotifications({ loading: false, items: [] });
        push({ type: 'error', title: 'Failed to load notifications', message: err.message });
      });
  }, [user?.id, push]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const counts = useMemo(() => {
    const upcomingCount = mySchedule.items.length;
    const regPending = myRegistrations.items.filter(r => r.status === 'PENDING').length;
    const regApproved = myRegistrations.items.filter(r => r.status === 'APPROVED').length;
    const paidOrders = myTickets.items.filter(o => o.status === 'PAID').length;
    const pendingOrders = myTickets.items.filter(o => o.status && o.status !== 'PAID').length;
    const unreadNotifications = notifications.items.filter(n => !n.read).length;
    return { upcomingCount, regPending, regApproved, paidOrders, pendingOrders, unreadNotifications };
  }, [mySchedule.items, myRegistrations.items, myTickets.items, notifications.items]);

  const handleApplyOrganizer = async () => {
    setOrganizerApplication(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.applyOrganizer();
      setOrganizerApplication({ loading: false, status: response.status });
      push({ 
        type: 'success', 
        title: 'Application submitted', 
        message: `Your organizer application status is: ${response.status}` 
      });
    } catch (error) {
      setOrganizerApplication({ loading: false, status: null });
      push({ 
        type: 'error', 
        title: 'Application failed', 
        message: error.message || 'Failed to submit application' 
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Athlete Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.first_name || 'Athlete'}! Track your schedule, results, and tickets.</p>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">My Upcoming Matches</div>
              <div className="text-2xl font-semibold">{counts.upcomingCount}</div>
            </div>
            <CalendarIcon className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">My Registrations</div>
          <div className="text-sm mt-1"><span className="font-semibold">PENDING</span>: {counts.regPending}</div>
          <div className="text-sm"><span className="font-semibold">APPROVED</span>: {counts.regApproved}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">My Tickets/Orders</div>
          <div className="text-sm mt-1"><span className="font-semibold">PAID</span>: {counts.paidOrders}</div>
          <div className="text-sm"><span className="font-semibold">PENDING</span>: {counts.pendingOrders}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Notifications</div>
              <div className="text-2xl font-semibold">{counts.unreadNotifications}</div>
            </div>
            <BellIcon className="h-6 w-6 text-indigo-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Schedule</h2>
            <CalendarIcon className="h-6 w-6 text-blue-500" />
          </div>
          
          {mySchedule.loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : mySchedule.items.length === 0 ? (
            <EmptyState 
              title="No upcoming events" 
              description="You don't have any upcoming events scheduled."
              icon={<CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />}
            />
          ) : (
            <div className="space-y-3">
              {mySchedule.items.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{event.name}</h3>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">UPCOMING</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatDate(event.start_datetime)}
                    </div>
                    {event.venue_name && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {event.venue_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-3">
                <Link to="/events">View All Events</Link>
              </Button>
            </div>
          )}
        </div>

        {/* My Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Results</h2>
            <TrophyIcon className="h-6 w-6 text-yellow-500" />
          </div>
          
          {myResults.loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : myResults.items.length === 0 ? (
            <EmptyState 
              title="No completed events" 
              description="Your completed events and results will appear here."
              icon={<TrophyIcon className="mx-auto h-8 w-8 text-gray-400" />}
            />
          ) : (
            <div className="space-y-3">
              {myResults.items.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{event.name}</h3>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">COMPLETED</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Completed {formatDate(event.end_datetime)}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-3">
                <Link to="/athlete">View All Results</Link>
              </Button>
            </div>
          )}
        </div>

        {/* My Registrations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Registrations</h2>
          </div>
          {myRegistrations.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : myRegistrations.items.length === 0 ? (
            <EmptyState 
              title="No registrations yet" 
              description="Register for events to see them here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Event</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myRegistrations.items.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{r.event_name || r.event?.name || 'Event'}</td>
                      <td className="py-2 pr-4">{r.type || r.role || 'Athlete'}</td>
                      <td className="py-2 pr-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{r.status}</span>
                      </td>
                      <td className="py-2 pr-4">{formatDate(r.created_at || r.created)}</td>
                      <td className="py-2 pr-4">
                        {r.event_id && (
                          <Link className="text-blue-600 hover:underline" to={`/events/${r.event_id}`}>View Event</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My Tickets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Tickets</h2>
            <TicketIcon className="h-6 w-6 text-purple-500" />
          </div>
          
          {myTickets.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : myTickets.items.length === 0 ? (
            <EmptyState 
              title="No tickets found" 
              description="You haven't purchased any tickets yet. Browse events to find tickets you'd like to buy."
              icon={<TicketIcon className="mx-auto h-8 w-8 text-gray-400" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myTickets.items.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {ticket.event?.name || 'Event'}
                    </h3>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">PAID</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center mb-1">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {ticket.ticket_type?.name || 'General'}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(ticket.event?.start_datetime)}
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="md:col-span-3 mt-2">
                <Link to="/tickets">View All Tickets</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Announcements / Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
            <Button
              variant="outline"
              onClick={async () => { try { await api.markAllNotificationsRead(); setNotifications(prev => ({ ...prev, items: prev.items.map(n => ({ ...n, read: true })) })); } catch (_) {} }}
            >Mark all read</Button>
          </div>
          {notifications.loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : notifications.items.length === 0 ? (
            <EmptyState title="No announcements" description="Announcements will appear here." />
          ) : (
            <ul className="space-y-2">
              {notifications.items.map((n) => (
                <li key={n.id} className={`border border-gray-200 rounded-lg p-4 ${!n.read ? 'bg-indigo-50/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 text-sm">{n.title || n.type || 'Update'}</div>
                    <div className="text-xs text-gray-500">{n.created_at ? formatDate(n.created_at) : ''}</div>
                  </div>
                  {n.message && <div className="text-sm text-gray-700 mt-1">{n.message}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Apply to be Organizer Section */}
      {user?.role === 'SPECTATOR' && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Want to organize events?</h3>
              <p className="text-gray-600 mb-4">
                Apply to become an organizer and create your own sports events for others to participate in.
              </p>
              <Button 
                onClick={handleApplyOrganizer}
                disabled={organizerApplication.loading || organizerApplication.status}
                isLoading={organizerApplication.loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {organizerApplication.loading 
                  ? 'Applying...' 
                  : organizerApplication.status 
                    ? `Application ${organizerApplication.status}` 
                    : 'Apply to be Organizer'
                }
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-right">
        <Link className="text-blue-600 hover:underline" to="/athlete/profile">Go to Profile</Link>
      </div>
    </div>
  );
}


