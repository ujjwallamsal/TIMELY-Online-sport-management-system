import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Plus
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { formatDateTime, formatRelativeTime } from '../../utils/date';

interface Registration {
  id: number;
  event: number;
  event_name?: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  decided_at?: string;
  reason?: string;
  fee_cents?: number;
  payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  docs?: any;
}

const MyRegistrations: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: registrations, isLoading, error, refetch } = useQuery<Registration[]>({
    queryKey: ['myRegistrations'],
    queryFn: async () => {
      try {
        const response = await api.get(ENDPOINTS.myRegistrations);
        return response.data.results || response.data || [];
      } catch (error) {
        console.error('Error fetching registrations:', error);
        return [];
      }
    },
    refetchInterval: 30 * 1000, // Poll every 30 seconds for live updates
    staleTime: 15 * 1000, // Consider data stale after 15 seconds
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          className: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Approved'
        };
      case 'PENDING':
        return {
          className: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="h-4 w-4" />,
          text: 'Pending Approval'
        };
      case 'REJECTED':
        return {
          className: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-4 w-4" />,
          text: 'Rejected'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="h-4 w-4" />,
          text: status
        };
    }
  };

  const getPaymentStatusBadge = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'PAID':
        return {
          className: 'bg-green-100 text-green-700',
          text: 'Paid'
        };
      case 'PENDING':
        return {
          className: 'bg-yellow-100 text-yellow-700',
          text: 'Payment Pending'
        };
      case 'FAILED':
        return {
          className: 'bg-red-100 text-red-700',
          text: 'Payment Failed'
        };
      case 'REFUNDED':
        return {
          className: 'bg-blue-100 text-blue-700',
          text: 'Refunded'
        };
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Registrations</h3>
              <p className="text-gray-600 mb-4">Unable to load your registrations. This might be a temporary issue.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">My Registrations</h1>
              <p className="text-gray-600 mt-2">Track your event registrations and their status</p>
            </div>
            <Link
              to="/registrations/create"
              className="btn btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Registration
            </Link>
          </div>
        </div>

        {/* Registrations List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : registrations && registrations.length > 0 ? (
            registrations.map((registration) => {
              const statusBadge = getStatusBadge(registration.status);
              const paymentBadge = getPaymentStatusBadge(registration.payment_status);
              
              return (
                <div key={registration.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {registration.event_name || `Event #${registration.event}`}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                              {statusBadge.icon}
                              <span className="ml-1">{statusBadge.text}</span>
                            </span>
                            {paymentBadge && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${paymentBadge.className}`}>
                                <CreditCard className="h-3 w-3 mr-1" />
                                {paymentBadge.text}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Submitted {formatRelativeTime(registration.submitted_at)}</span>
                        </div>

                        {registration.fee_cents !== undefined && registration.fee_cents > 0 && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>${(registration.fee_cents / 100).toFixed(2)} Registration Fee</span>
                          </div>
                        )}

                        {registration.status === 'APPROVED' && (
                          <div className="flex items-center text-green-600 mt-2">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span>Check your schedule to see this event</span>
                          </div>
                        )}

                        {registration.status === 'REJECTED' && registration.reason && (
                          <div className="flex items-start mt-2">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                              <p className="text-sm text-red-600">{registration.reason}</p>
                            </div>
                          </div>
                        )}

                        {registration.status === 'PENDING' && (
                          <div className="text-yellow-600 text-sm mt-2 flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Awaiting organizer review</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to={`/events/${registration.event}`}
                        className="btn btn-secondary flex items-center justify-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Event
                      </Link>
                      {registration.status === 'APPROVED' && (
                        <Link
                          to="/schedule"
                          className="btn btn-primary flex items-center justify-center"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Registrations Yet</h3>
              <p className="text-gray-500 mb-6">
                You haven't registered for any events yet. Browse available events and sign up!
              </p>
              <Link to="/events" className="btn btn-primary">
                Browse Events
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRegistrations;
