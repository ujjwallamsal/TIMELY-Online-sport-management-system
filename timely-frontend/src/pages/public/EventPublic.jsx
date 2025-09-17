import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  NewspaperIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import useSocket from '../../hooks/useSocket';
import api from '../../services/api';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState, { EmptyEvents } from '../../components/ui/EmptyState';

const EventPublic = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [tabData, setTabData] = useState({
    overview: null,
    schedule: null,
    results: null
  });

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/spectator/`,
    {
      onMessage: (message) => {
        console.log('Received message:', message);
        handleRealtimeUpdate(message);
      },
      onPolling: () => {
        fetchEventData();
      }
    }
  );

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`public/events/${eventId}/`);
      setEvent(response.data);
      
      // Fetch tab-specific data
      await Promise.all([
        fetchSchedule(),
        fetchResults()
      ]);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await api.get(`public/events/${eventId}/fixtures/`);
      setTabData(prev => ({ ...prev, schedule: response.data }));
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await api.get(`public/events/${eventId}/results/`);
      setTabData(prev => ({ ...prev, results: response.data }));
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'schedule_update':
        if (message.data.event_id === eventId) {
          fetchSchedule();
        }
        break;
      case 'results_update':
        if (message.data.event_id === eventId) {
          fetchResults();
        }
        break;
      case 'content_update':
        // Refresh event data when content is updated
        fetchEventData();
        break;
      default:
        break;
    }
  };

  const subscribeToEvent = () => {
    // Subscribe to event-specific updates
    if (eventId) {
      // This would be handled by the WebSocket connection
      console.log(`Subscribing to event ${eventId} updates`);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      subscribeToEvent();
    }
  }, [eventId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-green-100 text-green-800';
      case 'live': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: NewspaperIcon },
    { id: 'schedule', name: 'Schedule', icon: CalendarIcon },
    { id: 'results', name: 'Results', icon: TrophyIcon }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-96 mb-4" />
            <Skeleton className="h-4 w-64 mb-6" />
            <div className="flex gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton className="h-10 w-24" key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyEvents 
          title="Event Not Found"
          description="The event you're looking for doesn't exist or has been removed."
          action={
            <a href="/events" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Browse Events
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-gray-600 mt-2">{event.description}</p>
            </div>
            <LiveIndicator status={connectionStatus} />
          </div>

          {/* Event Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{formatDate(event.start_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPinIcon className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Venue</p>
                <p className="font-medium">{event.venue_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{event.duration} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p className="font-medium">{event.registered_count}</p>
              </div>
            </div>
          </div>

          {/* Status and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              <span className="text-2xl font-bold text-gray-900">{formatPrice(event.price_cents)}</span>
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Buy Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Event Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
              <div className="prose max-w-none">
                <p className="text-gray-600">{event.description}</p>
              </div>
            </div>

            {/* Event Rules */}
            {event.rules && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rules & Regulations</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-600">{event.rules}</p>
                </div>
              </div>
            )}

            {/* Event Prizes */}
            {event.prizes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prizes</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-600">{event.prizes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Schedule</h3>
              {tabData.schedule?.length > 0 ? (
                <div className="space-y-4">
                  {tabData.schedule.map(fixture => (
                    <div key={fixture.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{fixture.title}</h4>
                          <p className="text-sm text-gray-500">{formatDate(fixture.start_at)}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          fixture.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                          fixture.status === 'live' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {fixture.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Schedule Available"
                  description="The event schedule will be published soon."
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Results</h3>
              {tabData.results?.length > 0 ? (
                <div className="space-y-4">
                  {tabData.results.map(result => (
                    <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{result.fixture_title}</h4>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          result.status === 'published' ? 'bg-green-100 text-green-800' :
                          result.status === 'provisional' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Winner: {result.winner_name}</p>
                        <p>Score: {result.score}</p>
                        {result.notes && <p>Notes: {result.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Results Available"
                  description="Results will be published after the event concludes."
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPublic;
