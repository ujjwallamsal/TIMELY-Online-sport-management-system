import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  publishEvent,
  unpublishEvent
} from '../../lib/api';
import useSocket from '../../hooks/useSocket';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const EventsManage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    q: '',
    sport: '',
    status: '',
    page: 1
  });

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useSocket(
    user?.role === 'ADMIN' ? '/ws/admin/' : '/ws/organizer/',
    {
      onMessage: (data) => {
        console.log('Real-time event update:', data);
        if (data.type === 'event_update') {
          // Refresh events list
          fetchEvents();
        }
      },
      onPolling: () => {
        // Polling fallback
        fetchEvents();
      }
    }
  );

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.sport) params.append('sport', filters.sport);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      
      const response = await getEvents(params.toString());
      setEvents(response.data.results || response.data);
      setPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: filters.page
      });
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePublish = async (eventId) => {
    try {
      await publishEvent(eventId);
      // Real-time update will handle the refresh
    } catch (err) {
      console.error('Error publishing event:', err);
      alert('Failed to publish event. Please try again.');
    }
  };

  const handleUnpublish = async (eventId) => {
    try {
      await unpublishEvent(eventId);
      // Real-time update will handle the refresh
    } catch (err) {
      console.error('Error unpublishing event:', err);
      alert('Failed to unpublish event. Please try again.');
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteEvent(eventId);
      // Real-time update will handle the refresh
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'published': { color: 'bg-green-100 text-green-800', label: 'Published' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig['draft'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton type="text" className="h-8 w-48 mb-4" />
            <Skeleton type="text" className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} type="card" className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon="⚠️"
          title="Failed to load events"
          message={error}
          action={{
            label: "Try Again",
            onClick: fetchEvents
          }}
        />
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
              <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
              <p className="mt-2 text-gray-600">
                Manage your events and track their status
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Live indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <Link
                to="/admin/events/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                placeholder="Search events..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <select
                value={filters.sport}
                onChange={(e) => handleFilterChange('sport', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sports</option>
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="cricket">Cricket</option>
                <option value="tennis">Tennis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ q: '', sport: '', status: '', page: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        {events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {event.name}
                      </h3>
                      {getStatusBadge(event.lifecycle_status)}
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span>{formatDate(event.start_datetime)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                      {event.fee_cents > 0 && (
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                          <span>{formatPrice(event.fee_cents)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/events/${event.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/admin/events/${event.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Edit Event"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete Event"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex space-x-2">
                        {event.lifecycle_status === 'draft' ? (
                          <button
                            onClick={() => handlePublish(event.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Publish
                          </button>
                        ) : event.lifecycle_status === 'published' ? (
                          <button
                            onClick={() => handleUnpublish(event.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                          >
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Unpublish
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.count > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={Math.ceil(pagination.count / 12)}
                onPageChange={(page) => handleFilterChange('page', page)}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon="📅"
            title="No events found"
            message="Get started by creating your first event."
            action={{
              label: "Create Event",
              onClick: () => window.location.href = '/admin/events/create'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EventsManage;
