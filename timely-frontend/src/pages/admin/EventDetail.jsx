import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getEvent, 
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent
} from '../../lib/api';
import useSocket from '../../hooks/useSocket';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { 
  PencilIcon, 
  TrashIcon, 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useSocket(
    user?.role === 'ADMIN' ? '/ws/admin/' : '/ws/organizer/',
    {
      onMessage: (data) => {
        console.log('Real-time event update:', data);
        if (data.type === 'event_update' && data.data.id === parseInt(id)) {
          // Update the specific event
          setEvent(prev => ({
            ...prev,
            ...data.data
          }));
        }
      }
    }
  );

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEvent(id);
      setEvent(response.data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setActionLoading(true);
      await publishEvent(id);
      // Real-time update will handle the refresh
    } catch (err) {
      console.error('Error publishing event:', err);
      alert('Failed to publish event. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setActionLoading(true);
      await unpublishEvent(id);
      // Real-time update will handle the refresh
    } catch (err) {
      console.error('Error unpublishing event:', err);
      alert('Failed to unpublish event. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    try {
      setActionLoading(true);
      await deleteEvent(id);
      navigate('/admin/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton type="text" className="h-8 w-48 mb-4" />
            <Skeleton type="text" className="h-4 w-96" />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Skeleton type="text" className="h-6 w-64 mb-4" />
            <Skeleton type="text" className="h-4 w-full mb-2" />
            <Skeleton type="text" className="h-4 w-3/4 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton type="text" className="h-4 w-48" />
              <Skeleton type="text" className="h-4 w-48" />
            </div>
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
          title="Failed to load event"
          message={error}
          action={
            <button
              onClick={fetchEvent}
              className="btn btn-primary"
              aria-label="Try again"
            >
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon="📅"
          title="Event not found"
          message="The event you're looking for doesn't exist or has been removed."
          action={
            <button
              onClick={() => navigate('/admin/events')}
              className="btn btn-primary"
              aria-label="Back to events"
            >
              Back to Events
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/events')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <p className="mt-2 text-gray-600">{event.sport}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Live indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              
              {getStatusBadge(event.lifecycle_status)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => navigate(`/admin/events/${id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Event
              </button>
              
              {event.lifecycle_status === 'draft' ? (
                <button
                  onClick={handlePublish}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Publishing...' : 'Publish Event'}
                </button>
              ) : event.lifecycle_status === 'published' ? (
                <button
                  onClick={handleUnpublish}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Unpublishing...' : 'Unpublish Event'}
                </button>
              ) : null}
            </div>
            
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {actionLoading ? 'Deleting...' : 'Delete Event'}
            </button>
          </div>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600">
                {event.description || 'No description provided.'}
              </p>
            </div>

            {/* Event Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Start Date & Time</h3>
                    <p className="text-sm text-gray-600">{formatDate(event.start_datetime)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">End Date & Time</h3>
                    <p className="text-sm text-gray-600">{formatDate(event.end_datetime)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Location</h3>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Capacity</h3>
                    <p className="text-sm text-gray-600">
                      {event.capacity > 0 ? event.capacity : 'Unlimited'}
                    </p>
                  </div>
                </div>
                
                {event.fee_cents > 0 && (
                  <div className="flex items-start space-x-3">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Registration Fee</h3>
                      <p className="text-sm text-gray-600">{formatPrice(event.fee_cents)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Windows */}
            {(event.registration_open_at || event.registration_close_at) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Registration Windows</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.registration_open_at && (
                    <div className="flex items-start space-x-3">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Registration Opens</h3>
                        <p className="text-sm text-gray-600">{formatDate(event.registration_open_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {event.registration_close_at && (
                    <div className="flex items-start space-x-3">
                      <ClockIcon className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Registration Closes</h3>
                        <p className="text-sm text-gray-600">{formatDate(event.registration_close_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  {getStatusBadge(event.lifecycle_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Phase</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {event.phase}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm text-gray-900">
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">
                    {new Date(event.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Creator */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Creator</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {event.created_by_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {event.created_by_name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-600">Event Organizer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
