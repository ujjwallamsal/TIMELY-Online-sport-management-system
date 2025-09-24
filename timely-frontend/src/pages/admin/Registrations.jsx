import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, [statusFilter]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter ? { status: statusFilter } : {};
      const data = await api.getRegistrations(params);
      setRegistrations(data.results || data);
    } catch (err) {
      setError(err.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId) => {
    try {
      await api.approveRegistration(registrationId);
      loadRegistrations();
    } catch (err) {
      setError(err.message || 'Failed to approve registration');
    }
  };

  const handleReject = async (registrationId, reason = '') => {
    try {
      await api.rejectRegistration(registrationId, reason);
      loadRegistrations();
    } catch (err) {
      setError(err.message || 'Failed to reject registration');
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

  const getStatusBadge = (status) => {
    const statusClasses = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      header: 'User',
      accessor: 'user',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {value?.first_name} {value?.last_name}
          </div>
          <div className="text-sm text-gray-500">{value?.email}</div>
        </div>
      )
    },
    {
      header: 'Event',
      accessor: 'event',
      sortable: true,
      render: (value) => value?.name || 'Unknown Event'
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (value) => getStatusBadge(value)
    },
    {
      header: 'Requested At',
      accessor: 'created_at',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      header: 'Fee',
      accessor: 'event',
      render: (value) => value?.fee_cents > 0 ? `$${(value.fee_cents / 100).toFixed(2)}` : 'Free'
    }
  ];

  const fetchPage = async ({ page, pageSize, sortBy, sortDir, filters }) => {
    const params = {
      page,
      page_size: pageSize,
      ordering: sortDir === 'desc' ? `-${sortBy}` : sortBy,
      status: statusFilter,
      ...filters
    };

    const data = await api.getRegistrations(params);
    return {
      rows: data.results || data,
      total: data.count || data.length || 0
    };
  };

  const rowActions = (row) => (
    <div className="flex items-center space-x-2">
      {row.status === 'PENDING' && (
        <>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleApprove(row.id)}
          >
            Approve
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              const reason = window.prompt('Reason for rejection (optional):');
              handleReject(row.id, reason);
            }}
          >
            Reject
          </Button>
        </>
      )}
      {row.status === 'APPROVED' && (
        <span className="text-sm text-green-600 font-medium">Approved</span>
      )}
      {row.status === 'REJECTED' && (
        <span className="text-sm text-red-600 font-medium">Rejected</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registration Management</h1>
          <p className="mt-1 text-sm text-gray-600">Approve or reject event registrations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' }
            ]}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Registrations Table */}
      <DataTable
        columns={columns}
        fetchPage={fetchPage}
        rowActions={rowActions}
        pageSize={10}
        initialSortBy="created_at"
        initialSortDir="desc"
        emptyDescription="No registrations found."
      />
    </div>
  );
}