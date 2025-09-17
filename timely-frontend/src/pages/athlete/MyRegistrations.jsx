import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import api from '../../lib/api';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonList } from '../../components/ui/Skeleton';
import EmptyState, { EmptyRegistrations } from '../../components/ui/EmptyState';

const MyRegistrations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  });

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/athlete/`,
    {
      onMessage: (message) => {
        if (message.type === 'registration_update') {
          handleRegistrationUpdate(message.data);
        }
      },
      onPolling: () => {
        fetchRegistrations();
      }
    }
  );

  const fetchRegistrations = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`registrations/mine/?page=${page}`);
      setRegistrations(response.data.results || []);
      setPagination({
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
        hasNext: response.data.next || false,
        hasPrevious: response.data.previous || false
      });
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationUpdate = (data) => {
    setRegistrations(prev => 
      prev.map(reg => 
        reg.id === data.id ? { ...reg, ...data } : reg
      )
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'waitlisted':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'waitlisted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Registrations</h1>
          <Skeleton className="w-32 h-8" />
        </div>
        <SkeletonList items={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Registrations</h1>
          <p className="text-gray-600">Track your event registrations and their status</p>
        </div>
        <LiveIndicator status={connectionStatus} />
      </div>

      {/* Registrations List */}
      {registrations.length > 0 ? (
        <div className="space-y-4">
          {registrations.map(registration => (
            <div key={registration.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {registration.event_name}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Sport</p>
                        <p className="font-medium">{registration.event_sport}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Event Date</p>
                        <p className="font-medium">{formatDate(registration.event_start_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Registration Type</p>
                        <p className="font-medium capitalize">{registration.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fee</p>
                        <p className="font-medium">${registration.fee_dollars}</p>
                      </div>
                    </div>

                    {registration.team_name && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Team Name</p>
                        <p className="font-medium">{registration.team_name}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(registration.status)}
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(registration.status)}`}>
                          {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Submitted {formatDate(registration.submitted_at)}</span>
                      </div>
                    </div>

                    {registration.reason && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Note:</strong> {registration.reason}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                        <EyeIcon className="w-4 h-4" />
                        View Details
                      </button>
                      
                      {registration.status === 'pending' && (
                        <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
                          <DocumentTextIcon className="w-4 h-4" />
                          Upload Documents
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyRegistrations 
          action={
            <a href="/events" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Browse Events
            </a>
          }
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => fetchRegistrations(pagination.page - 1)}
            disabled={!pagination.hasPrevious}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => fetchRegistrations(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
