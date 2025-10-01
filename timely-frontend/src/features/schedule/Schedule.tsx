import React from 'react';
import { Calendar, MapPin, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../utils/date';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';

// Normalize API response to always return an array
const normalizeToArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data?.results && Array.isArray(data.results)) return data.results;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
};

const Schedule: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { showError } = useToast();
  
  const { data: schedule, isLoading, error } = useQuery({
    queryKey: ['schedule', user?.role],
    queryFn: async () => {
      try {
        // Role-specific data fetching
        if (user?.role === 'COACH') {
          // Coaches: fetch fixtures for teams they coach
          const fixturesResponse = await api.get(ENDPOINTS.fixtures);
          const fixtures = normalizeToArray(fixturesResponse.data);
          
          // Transform fixtures into schedule entries
          return fixtures.map((fixture: any) => ({
            id: fixture.id,
            event_id: fixture.event?.id || fixture.event_id,
            event_name: fixture.event?.name || 'Event',
            event: fixture.event,
            fixture_id: fixture.id,
            status: 'confirmed' as const,
            start_at: fixture.start_at,
            venue: fixture.venue,
          }));
        } else if (user?.role === 'ORGANIZER') {
          // Organizers: fetch their events
          const eventsResponse = await api.get(ENDPOINTS.events);
          const events = normalizeToArray(eventsResponse.data);
          
          return events.map((event: any) => ({
            id: event.id,
            event_id: event.id,
            event_name: event.name,
            event: event,
            status: 'confirmed' as const,
          }));
        } else {
          // Athletes & Spectators: fetch registrations and tickets
          const [registrationsResponse, ticketsResponse] = await Promise.allSettled([
            api.get(ENDPOINTS.myRegistrations),
            api.get(ENDPOINTS.myTickets)
          ]);
          
          const allRegistrations = registrationsResponse.status === 'fulfilled'
            ? normalizeToArray(registrationsResponse.value.data)
            : [];
          
          // Filter only approved registrations
          const registrations = Array.isArray(allRegistrations)
            ? allRegistrations.filter((r: any) => r.status === 'APPROVED')
            : [];
          
          const ticketsData = ticketsResponse.status === 'fulfilled'
            ? ticketsResponse.value.data
            : null;
          
          const tickets = normalizeToArray(ticketsData);
          
          // Filter tickets that are valid (payment received)
          const approvedTickets = Array.isArray(tickets)
            ? tickets.filter((t: any) => t.status === 'valid' || t.order?.status === 'paid')
            : [];
          
          // Merge both into a unified schedule
          return [...registrations, ...approvedTickets];
        }
      } catch (error: any) {
        console.error('Error fetching schedule:', error);
        showError('Couldn\'t load schedule', 'Please try again.');
        return [];
      }
    },
    enabled: !!user && !authLoading, // Only run when user is loaded
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    retry: 1, // Retry once on error
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      confirmed: 'bg-blue-100 text-blue-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Schedule</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-32 bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Couldn't load schedule</h3>
            <p className="text-gray-600 mb-4">
              If this continues, please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const scheduleItems = Array.isArray(schedule) ? schedule : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
          <p className="text-gray-600">
            {user?.role === 'COACH' 
              ? 'Fixtures for teams you coach'
              : user?.role === 'ORGANIZER'
              ? 'Your organized events'
              : 'Your approved events and competitions'}
          </p>
        </div>

        {scheduleItems.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Items</h3>
            <p className="text-gray-500 mb-6">
              {user?.role === 'COACH'
                ? 'No fixtures scheduled for your teams yet'
                : user?.role === 'ORGANIZER'
                ? 'You haven\'t created any events yet'
                : 'Your approved event registrations will appear here'}
            </p>
            <Link to="/events" className="btn btn-primary">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduleItems.map((item: any) => (
              <div
                key={item.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {item.event_name || item.event?.name || 'Event'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status || 'approved')}`}>
                        Confirmed
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {(item.start_at || item.event?.start_datetime) && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{formatDateTime(item.start_at || item.event.start_datetime)}</span>
                        </div>
                      )}

                      {(item.venue?.name || item.event?.venue?.name) && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{item.venue?.name || item.event.venue.name}</span>
                        </div>
                      )}

                      {item.status === 'pending' && (
                        <div className="text-yellow-600 text-sm mt-2">
                          Awaiting approval from organizer
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {item.event_id && (
                      <Link
                        to={`/events/${item.event_id}`}
                        className="btn btn-secondary flex items-center justify-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Event
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
