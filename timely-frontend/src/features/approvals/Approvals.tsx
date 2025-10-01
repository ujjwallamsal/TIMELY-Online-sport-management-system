import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, FileText, User, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime } from '../../utils/date';

interface Registration {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  event: {
    id: number;
    name: string;
    start_datetime: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  documents?: Array<{
    id: number;
    type: string;
    file_url: string;
  }>;
}

const Approvals: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['registrations', 'review', filter],
    queryFn: async () => {
      const params = filter === 'pending' ? { status: 'pending' } : {};
      const response = await api.get(ENDPOINTS.registrations, { params });
      return response.data.results || response.data || [];
    },
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000, // Poll every 15 seconds
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(ENDPOINTS.registrationApprove(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      showSuccess('Registration Approved', 'The athlete has been notified and the event added to their schedule.');
    },
    onError: (error: any) => {
      showError('Approval Failed', error.response?.data?.detail || 'Failed to approve registration');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return api.post(ENDPOINTS.registrationReject(id), { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      showSuccess('Registration Rejected', 'The athlete has been notified.');
    },
    onError: (error: any) => {
      showError('Rejection Failed', error.response?.data?.detail || 'Failed to reject registration');
    },
  });

  const handleApprove = (id: number) => {
    if (confirm('Approve this registration? The athlete will be notified and the event added to their schedule.')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Registration Approvals</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-40 bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const registrationsList = registrations || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Approvals</h1>
          <p className="text-gray-600">
            Review and approve athlete registration requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('pending')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All
            </button>
          </nav>
        </div>

        {registrationsList.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Registrations</h3>
            <p className="text-gray-500">
              {filter === 'pending'
                ? 'No pending registrations to review'
                : 'No registrations found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {registrationsList.map((registration: Registration) => (
              <div
                key={registration.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {registration.event?.name || 'Event'}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {registration.user?.first_name} {registration.user?.last_name}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDateTime(registration.submitted_at)}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(registration.status)}
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>Email: {registration.user?.email}</p>
                      {registration.documents && registration.documents.length > 0 && (
                        <p className="mt-1">
                          Documents: {registration.documents.length} file(s) attached
                        </p>
                      )}
                    </div>
                  </div>

                  {registration.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleApprove(registration.id)}
                        disabled={approveMutation.isPending}
                        className="btn btn-primary flex items-center justify-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(registration.id)}
                        disabled={rejectMutation.isPending}
                        className="btn btn-danger flex items-center justify-center"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;

