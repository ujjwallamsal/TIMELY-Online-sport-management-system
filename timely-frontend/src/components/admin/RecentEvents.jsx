// src/components/admin/RecentEvents.jsx
import React from 'react';
import { Calendar, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecentEvents = ({
  events,
  loading = false,
  className = ''
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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

  const handleEventClick = (eventId) => {
    navigate(`/admin/events/${eventId}`);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="h-5 w-5 bg-gray-200 rounded mr-2"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center mb-6">
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p>No events found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
        </div>
        <button
          onClick={() => navigate('/admin/events')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View all
        </button>
      </div>

      <div className="space-y-4">
        {events.slice(0, 5).map((event) => (
          <div
            key={event.id}
            onClick={() => handleEventClick(event.id)}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{event.name}</h4>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(event.start_datetime)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{event.location}</span>
                  </div>
                  {event.capacity && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>
                        {event.registered_count || 0}/{event.capacity}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.lifecycle_status)}`}>
                  {event.lifecycle_status}
                </span>
                <span className="text-xs text-gray-500">{event.sport}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentEvents;
