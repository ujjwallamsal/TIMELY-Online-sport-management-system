import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getEvent, publishEvent, unpublishEvent, cancelEvent, listDivisions } from '../lib/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchDivisions();
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

  const fetchDivisions = async () => {
    try {
      const response = await listDivisions(id);
      setDivisions(response.data);
    } catch (err) {
      console.error('Error fetching divisions:', err);
    }
  };

  const handleLifecycleAction = async (action) => {
    try {
      setActionLoading(true);
      
      switch (action) {
        case 'publish':
          await publishEvent(id);
          break;
        case 'unpublish':
          await unpublishEvent(id);
          break;
        case 'cancel':
          const reason = prompt('Reason for cancellation (optional):');
          await cancelEvent(id, reason || '');
          break;
        default:
          throw new Error('Invalid action');
      }
      
      // Refresh event data
      await fetchEvent();
    } catch (err) {
      console.error(`Error ${action}ing event:`, err);
      alert(`Failed to ${action} event. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFee = (feeCents) => {
    if (feeCents === 0) return 'Free';
    return `$${(feeCents / 100).toFixed(2)}`;
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = user && (
    user.role === 'ADMIN' || 
    (user.role === 'ORGANIZER' && event?.created_by === user.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Event not found</h3>
            <p className="mt-2 text-gray-500">
              The event you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="mt-6">
              <Link
                to="/events"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/events"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Events
            </Link>
            
            {canEdit && (
              <div className="flex space-x-2">
                <Link
                  to={`/events/${event.id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{event.sport}</p>
            </div>
            
            <div className="flex flex-col gap-2 ml-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(event.phase)}`}>
                {event.phase}
              </span>
              {event.lifecycle_status !== 'published' && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.lifecycle_status)}`}>
                  {event.lifecycle_status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lifecycle actions for organizers/admins */}
        {canEdit && event.lifecycle_status !== 'cancelled' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Management</h3>
            <div className="flex flex-wrap gap-2">
              {event.lifecycle_status === 'draft' && (
                <Button
                  onClick={() => handleLifecycleAction('publish')}
                  loading={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Publish Event
                </Button>
              )}
              
              {event.lifecycle_status === 'published' && (
                <Button
                  onClick={() => handleLifecycleAction('unpublish')}
                  loading={actionLoading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Unpublish Event
                </Button>
              )}
              
              {['draft', 'published'].includes(event.lifecycle_status) && (
                <Button
                  onClick={() => handleLifecycleAction('cancel')}
                  loading={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancel Event
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Event details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Start Date & Time</p>
                    <p className="text-sm text-gray-600">{formatDate(event.start_datetime)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">End Date & Time</p>
                    <p className="text-sm text-gray-600">{formatDate(event.end_datetime)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                </div>
                
                {event.capacity > 0 && (
                  <div className="flex items-start">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Capacity</p>
                      <p className="text-sm text-gray-600">{event.capacity} participants</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Registration Fee</p>
                    <p className="text-sm text-gray-600">{formatFee(event.fee_cents)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Divisions */}
            {divisions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Divisions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {divisions.map((division) => (
                    <div key={division.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{division.name}</h3>
                      {division.sort_order > 0 && (
                        <p className="text-sm text-gray-600 mt-1">Order: {division.sort_order}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h3>
              <p className="text-sm text-gray-600">
                {event.created_by_name || 'Unknown'}
              </p>
            </div>

            {/* Registration info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration</h3>
              <div className="space-y-2">
                {event.registration_open_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Opens</p>
                    <p className="text-sm text-gray-600">{formatDate(event.registration_open_at)}</p>
                  </div>
                )}
                {event.registration_close_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Closes</p>
                    <p className="text-sm text-gray-600">{formatDate(event.registration_close_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {user && event.lifecycle_status === 'published' && (
                  <Button 
                    onClick={() => navigate(`/events/${event.id}/register`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Register for Event
                  </Button>
                )}
                
                {!user && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Sign in to register for this event
                    </p>
                    <Link
                      to="/login"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;