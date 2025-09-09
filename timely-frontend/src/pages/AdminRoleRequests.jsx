// pages/AdminRoleRequests.jsx
import React, { useState, useEffect } from 'react';
import { roleRequestAPI } from '../lib/api';
import RoleRequestCard from '../components/RoleRequestCard';
import { toast } from 'react-hot-toast';

const AdminRoleRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    requested_role: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'approve' or 'reject'
  const [actionData, setActionData] = useState({ notes: '', reason: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filters, pagination.page]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        ...filters
      };

      const response = await roleRequestAPI.listRequests(params);
      setRequests(response.data.results || response.data);
      
      if (response.data.count !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: response.data.count,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      }
    } catch (error) {
      console.error('Error loading role requests:', error);
      toast.error('Failed to load role requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleApprove = (requestId) => {
    const request = requests.find(r => r.id === requestId);
    setSelectedRequest(request);
    setActionModal('approve');
    setActionData({ notes: '' });
  };

  const handleReject = (requestId) => {
    const request = requests.find(r => r.id === requestId);
    setSelectedRequest(request);
    setActionModal('reject');
    setActionData({ reason: '' });
  };

  const handleActionSubmit = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      
      if (actionModal === 'approve') {
        await roleRequestAPI.approveRequest(selectedRequest.id, {
          action: 'approve',
          notes: actionData.notes
        });
        toast.success('Role request approved successfully');
      } else if (actionModal === 'reject') {
        if (!actionData.reason.trim()) {
          toast.error('Rejection reason is required');
          return;
        }
        await roleRequestAPI.rejectRequest(selectedRequest.id, {
          action: 'reject',
          reason: actionData.reason
        });
        toast.success('Role request rejected');
      }

      setActionModal(null);
      setSelectedRequest(null);
      setActionData({ notes: '', reason: '' });
      await loadRequests();
    } catch (error) {
      console.error('Error processing role request:', error);
      toast.error('Failed to process role request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    requests.forEach(request => {
      counts[request.status] = (counts[request.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
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
          <h1 className="text-3xl font-bold text-gray-900">Role Requests</h1>
          <p className="mt-2 text-gray-600">
            Review and manage user role upgrade requests.
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-medium">✗</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Role
                </label>
                <select
                  id="role-filter"
                  value={filters.requested_role}
                  onChange={(e) => handleFilterChange('requested_role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="ORGANIZER">Organizer</option>
                  <option value="COACH">Coach</option>
                  <option value="ATHLETE">Athlete</option>
                </select>
              </div>

              <div>
                <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  id="search-filter"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-6">
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No role requests found</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters to see more results.'
                  : 'No role requests have been submitted yet.'
                }
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <RoleRequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
                isAdmin={true}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    page === pagination.page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Action Modal */}
        {actionModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {actionModal === 'approve' ? 'Approve Role Request' : 'Reject Role Request'}
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {actionModal === 'approve' 
                      ? `Approve ${selectedRequest.user_display_name}'s request for ${selectedRequest.requested_role_display} role?`
                      : `Reject ${selectedRequest.user_display_name}'s request for ${selectedRequest.requested_role_display} role?`
                    }
                  </p>
                </div>

                {actionModal === 'approve' ? (
                  <div className="mb-4">
                    <label htmlFor="approve-notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="approve-notes"
                      value={actionData.notes}
                      onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any notes for the user..."
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      id="reject-reason"
                      value={actionData.reason}
                      onChange={(e) => setActionData(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Explain why this request is being rejected..."
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setActionModal(null);
                      setSelectedRequest(null);
                      setActionData({ notes: '', reason: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActionSubmit}
                    disabled={processing || (actionModal === 'reject' && !actionData.reason.trim())}
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      actionModal === 'approve'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    }`}
                  >
                    {processing ? 'Processing...' : (actionModal === 'approve' ? 'Approve' : 'Reject')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoleRequests;
