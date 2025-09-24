import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { publicAPI, ticketsAPI } from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { 
  CalendarIcon, 
  TrophyIcon, 
  TicketIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function AthleteDashboard() {
  const { user } = useAuth();
  const { push } = useToast();
  const [mySchedule, setMySchedule] = useState({ loading: true, items: [] });
  const [myResults, setMyResults] = useState({ loading: true, items: [] });
  const [myTickets, setMyTickets] = useState({ loading: true, items: [] });

  useEffect(() => {
    // Fetch athlete's schedule (fixtures where they participate)
    setMySchedule(prev => ({ ...prev, loading: true }));
    publicAPI.getEvents({ participant: user?.id, status: 'UPCOMING' })
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
    publicAPI.getEvents({ participant: user?.id, status: 'COMPLETED' })
      .then(data => {
        const items = data.results || data.data || [];
        setMyResults({ loading: false, items: items.slice(0, 5) });
      })
      .catch(err => {
        setMyResults({ loading: false, items: [] });
        push({ type: 'error', title: 'Failed to load results', message: err.message });
      });

    // Fetch athlete's tickets
    setMyTickets(prev => ({ ...prev, loading: true }));
    ticketsAPI.myTickets()
      .then(data => {
        const items = data.results || data.data || [];
        setMyTickets({ loading: false, items: items.slice(0, 3) });
      })
      .catch(err => {
        setMyTickets({ loading: false, items: [] });
        push({ type: 'error', title: 'Failed to load tickets', message: err.message });
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Athlete Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.first_name || 'Athlete'}! Track your schedule, results, and tickets.</p>
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
      </div>
    </div>
  );
}


