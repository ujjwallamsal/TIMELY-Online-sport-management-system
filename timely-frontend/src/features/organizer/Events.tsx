import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  MoreVertical,
  Edit,
  Megaphone,
  XCircle,
  Eye,
  Plus,
  AlertCircle,
  RefreshCw,
  Settings,
  Users,
  Trophy
} from 'lucide-react';
import { useEvents, useUpdateEvent } from '../../api/queries';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../auth/AuthProvider';

const OrganizerEvents: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [endpointStatus, setEndpointStatus] = useState<{[key: string]: boolean}>({});
  const { showSuccess, showError } = useToast();

  const { data: eventsData, isLoading, error, refetch } = useEvents({
    created_by: user?.id,
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    sport: sportFilter !== 'all' ? sportFilter : undefined,
    page_size: 50,
  });

  const updateEventMutation = useUpdateEvent();

  // Check endpoint availability
  useEffect(() => {
    const checkEndpoints = async () => {
      const endpoints = ['announce', 'cancel', 'genFixtures'];
      const status: {[key: string]: boolean} = {};
      
      for (const endpoint of endpoints) {
        try {
          let testUrl;
          if (endpoint === 'announce') {
            testUrl = ENDPOINTS.eventAnnounce(1);
          } else if (endpoint === 'cancel') {
            testUrl = ENDPOINTS.eventCancel(1);
          } else if (endpoint === 'genFixtures') {
            testUrl = ENDPOINTS.eventGenFixtures(1);
          }
          
          if (testUrl) {
            await api.head(testUrl);
            status[endpoint] = true;
          }
        } catch (error) {
          status[endpoint] = false;
        }
      }
      
      setEndpointStatus(status);
    };

    checkEndpoints();
  }, []);

  const events = eventsData?.results || [];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAnnounce = async (eventId: number) => {
    try {
      if (endpointStatus.announce) {
        await api.post(ENDPOINTS.eventAnnounce(eventId));
        showSuccess('Event Announced', 'The event has been successfully announced.');
      } else {
        await updateEventMutation.mutateAsync({
          id: eventId,
          status: 'PUBLISHED'
        });
        showSuccess('Event Published', 'The event status has been updated to published.');
      }
      refetch();
    } catch (error) {
      console.error('Announce error:', error);
      showError('Announce Failed', 'Failed to announce the event. Please try again.');
    }
  };

  const handleCancel = async (eventId: number) => {
    try {
      if (endpointStatus.cancel) {
        await api.post(ENDPOINTS.eventCancel(eventId));
        showSuccess('Event Cancelled', 'The event has been successfully cancelled.');
      } else {
        await updateEventMutation.mutateAsync({
          id: eventId,
          status: 'CANCELLED'
        });
        showSuccess('Event Cancelled', 'The event status has been updated to cancelled.');
      }
      refetch();
    } catch (error) {
      console.error('Cancel error:', error);
      showError('Cancel Failed', 'Failed to cancel the event. Please try again.');
    }
  };

  const handleGenerateFixtures = async (eventId: number) => {
    try {
      if (endpointStatus.genFixtures) {
        await api.post(ENDPOINTS.eventGenFixtures(eventId));
        showSuccess('Fixtures Generated', 'Fixtures have been successfully generated for this event.');
      } else {
        showError('Feature Unavailable', 'Fixture generation is not available at the moment.');
      }
    } catch (error) {
      console.error('Generate fixtures error:', error);
      showError('Generation Failed', 'Failed to generate fixtures. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Events</h3>
              <p className="text-gray-600 mb-4">Unable to load your events. This might be a temporary issue.</p>
              <button
                onClick={() => refetch()}
                className="btn btn-primary inline-flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
              <p className="text-gray-600 mt-2">Manage your sports events and registrations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/events/create"
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="form-label">Search Events</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by event name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="form-label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Sport Filter */}
            <div>
              <label className="form-label">Sport</label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Sports</option>
                <option value="1">Football</option>
                <option value="2">Basketball</option>
                <option value="3">Tennis</option>
                <option value="4">Swimming</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="card">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {event.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {event.sport_name || `Sport ${event.sport}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {new Date(event.start_datetime).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {new Date(event.start_datetime).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.venue_name || event.location || 'TBD'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge ${getStatusBadgeColor(event.status)}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.fee_cents ? `$${(event.fee_cents / 100).toFixed(2)}` : 'Free'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/events/${event.id}`}
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="View Event"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/events/${event.id}/edit`}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Edit Event"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/registrations?event=${event.id}`}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Manage Registrations"
                          >
                            <Users className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/fixtures?event=${event.id}`}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Manage Fixtures"
                          >
                            <Calendar className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/results?event=${event.id}`}
                            className="text-orange-600 hover:text-orange-900 p-1"
                            title="Enter Results"
                          >
                            <Trophy className="h-4 w-4" />
                          </Link>
                          {event.status === 'DRAFT' && (
                            <button
                              onClick={() => handleAnnounce(event.id)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Announce Event"
                            >
                              <Megaphone className="h-4 w-4" />
                            </button>
                          )}
                          {event.status === 'PUBLISHED' && (
                            <button
                              onClick={() => handleGenerateFixtures(event.id)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Generate Fixtures"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                          )}
                          {event.status === 'PUBLISHED' && (
                            <button
                              onClick={() => handleCancel(event.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Cancel Event"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || sportFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No events have been created yet'
                }
              </p>
              <div className="mt-4">
                <Link
                  to="/events/create"
                  className="btn btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Event
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {eventsData && eventsData.count > 50 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {events.length} of {eventsData.count} events
            </div>
            <div className="flex space-x-2">
              <button className="btn btn-outline btn-sm" disabled>
                Previous
              </button>
              <button className="btn btn-outline btn-sm" disabled>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerEvents;
