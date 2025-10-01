import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  RefreshCw,
  DollarSign,
  FileText
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { formatDateTime, formatRelativeTime } from '../../utils/date';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../auth/AuthProvider';

interface Registration {
  id: number;
  event: number;
  event_name?: string;
  applicant_name?: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  decided_at?: string;
  reason?: string;
  fee_cents?: number;
  payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}

const RegistrationApproval: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

  const { data: registrations, isLoading, error, refetch } = useQuery<Registration[]>({
    queryKey: ['registrations', selectedStatus],
    queryFn: async () => {
      try {
        const params: any = {};
        if (selectedStatus !== 'ALL') {
          // Backend expects uppercase status values
          params.status = selectedStatus;
        }
        const response = await api.get(ENDPOINTS.registrations, { params });
        return response.data.results || response.data || [];
      } catch (error: any) {
        console.error('Error fetching registrations:', error);
        // Return empty array on error to prevent crashes
        return [];
      }
    },
    enabled: !!(user?.role === 'ORGANIZER' || user?.role === 'ADMIN' || user?.role === 'COACH'),
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    staleTime: 15 * 1000,
    retry: false, // Don't retry on error
  });

  const approveMutation = useMutation({
    mutationFn: async (registrationId: number) => {
      return await api.patch(ENDPOINTS.registrationApprove(registrationId), {});
    },
    onSuccess: () => {
      showSuccess('Registration Approved', 'The athlete has been notified');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setActioningId(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.response?.data?.detail || 'Failed to approve registration';
      showError('Approval Failed', message);
      setActioningId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ registrationId, reason }: { registrationId: number; reason: string }) => {
      return await api.patch(ENDPOINTS.registrationReject(registrationId), { reason });
    },
    onSuccess: () => {
      showSuccess('Registration Rejected', 'The athlete has been notified');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setActioningId(null);
      setShowRejectModal(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.response?.data?.detail || 'Failed to reject registration';
      showError('Rejection Failed', message);
      setActioningId(null);
    },
  });

  const handleApprove = (registrationId: number) => {
    setActioningId(registrationId);
    approveMutation.mutate(registrationId);
  };

  const handleReject = (registrationId: number) => {
    if (!rejectReason.trim()) {
      showError('Reason Required', 'Please provide a reason for rejection');
      return;
    }
    setActioningId(registrationId);
    rejectMutation.mutate({ registrationId, reason: rejectReason });
  };

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
          text: 'Pending'
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

  if (!(user?.role === 'ORGANIZER' || user?.role === 'ADMIN' || user?.role === 'COACH')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">Only organizers, coaches, and admins can manage registrations.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Registrations</h3>
            <p className="text-gray-600 mb-4">Unable to load registrations.</p>
            <button onClick={() => refetch()} className="btn btn-primary inline-flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900">Registration Management</h1>
          <p className="text-gray-600 mt-2">Review and approve athlete registrations</p>
        </div>

        {/* Status Filter */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Registrations List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : registrations && registrations.length > 0 ? (
            registrations.map((registration) => {
              const statusBadge = getStatusBadge(registration.status);
              const isActioning = actioningId === registration.id;
              
              return (
                <div key={registration.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                            {registration.payment_status === 'PAID' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <DollarSign className="h-3 w-3 mr-1" />
                                Paid
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{registration.applicant_name || 'Athlete'}</span>
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Submitted {formatRelativeTime(registration.submitted_at)}</span>
                        </div>

                        {registration.fee_cents !== undefined && registration.fee_cents > 0 && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>${(registration.fee_cents / 100).toFixed(2)} Fee</span>
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
                      
                      {registration.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(registration.id)}
                            disabled={isActioning}
                            className="btn btn-primary flex items-center justify-center"
                          >
                            {isActioning ? (
                              <>
                                <div className="spinner spinner-sm mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => setShowRejectModal(registration.id)}
                            disabled={isActioning}
                            className="btn bg-red-600 text-white hover:bg-red-700 flex items-center justify-center"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Registrations</h3>
              <p className="text-gray-500">
                {selectedStatus === 'PENDING' 
                  ? 'No pending registrations at the moment'
                  : 'No registrations match your filter'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Registration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this registration. The athlete will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              rows={4}
              placeholder="Reason for rejection..."
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectReason.trim() || actioningId === showRejectModal}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                {actioningId === showRejectModal ? 'Rejecting...' : 'Reject Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationApproval;

