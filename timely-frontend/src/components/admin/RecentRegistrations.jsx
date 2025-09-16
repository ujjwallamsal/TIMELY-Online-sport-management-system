// src/components/admin/RecentRegistrations.jsx
import React from 'react';
import { User, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

const RecentRegistrations = ({
  registrations,
  loading = false,
  className = ''
}) => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'waitlisted':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'waitlisted':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'athlete':
        return <User className="h-4 w-4" />;
      case 'coach':
        return <Users className="h-4 w-4" />;
      case 'team':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="h-5 w-5 bg-gray-200 rounded mr-2"></div>
            <div className="h-6 bg-gray-200 rounded w-40"></div>
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

  if (!registrations || registrations.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center mb-6">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p>No registrations found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <User className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
      </div>

      <div className="space-y-4">
        {registrations.slice(0, 5).map((registration) => (
          <div
            key={registration.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="text-gray-500 mr-2">
                    {getTypeIcon(registration.type)}
                  </div>
                  <h4 className="font-medium text-gray-900">
                    {registration.user.first_name} {registration.user.last_name}
                  </h4>
                  {registration.team_name && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({registration.team_name})
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{registration.event.name}</p>
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatDate(registration.event.start_datetime)}</span>
                  </div>
                  <span>{registration.user.email}</span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center">
                  {getStatusIcon(registration.status)}
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(registration.status)}`}>
                    {registration.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(registration.created_at)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentRegistrations;
