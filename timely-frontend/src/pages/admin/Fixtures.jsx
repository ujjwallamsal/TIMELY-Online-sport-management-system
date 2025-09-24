import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';

export default function AdminFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventFilter, setEventFilter] = useState('');

  useEffect(() => {
    loadFixtures();
    loadEvents();
  }, [eventFilter]);

  const loadFixtures = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = eventFilter ? { event: eventFilter } : {};
      const data = await api.getFixtures(params);
      setFixtures(data.results || data);
    } catch (err) {
      setError(err.message || 'Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data.results || data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const handleDeleteFixture = async (fixtureId) => {
    if (!window.confirm('Are you sure you want to delete this fixture?')) {
      return;
    }
    
    try {
      await api.deleteFixture(fixtureId);
      loadFixtures();
    } catch (err) {
      setError(err.message || 'Failed to delete fixture');
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
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      header: 'Event',
      accessor: 'event',
      sortable: true,
      render: (value) => value?.name || 'Unknown Event'
    },
    {
      header: 'Teams',
      accessor: 'teams',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.team1?.name || 'TBD'} vs {row.team2?.name || 'TBD'}
          </div>
          {row.venue && (
            <div className="text-sm text-gray-500">{row.venue.name}</div>
          )}
        </div>
      )
    },
    {
      header: 'Scheduled Time',
      accessor: 'scheduled_time',
      sortable: true,
      render: (value) => value ? formatDate(value) : 'TBD'
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (value) => getStatusBadge(value)
    },
    {
      header: 'Score',
      accessor: 'result',
      render: (value) => value ? `${value.team1_score} - ${value.team2_score}` : 'TBD'
    }
  ];

  const fetchPage = async ({ page, pageSize, sortBy, sortDir, filters }) => {
    const params = {
      page,
      page_size: pageSize,
      ordering: sortDir === 'desc' ? `-${sortBy}` : sortBy,
      event: eventFilter,
      ...filters
    };

    const data = await api.getFixtures(params);
    return {
      rows: data.results || data,
      total: data.count || data.length || 0
    };
  };

  const rowActions = (row) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          // Navigate to results page for this fixture
          window.location.href = `/admin/results?fixture=${row.id}`;
        }}
      >
        View Results
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => handleDeleteFixture(row.id)}
      >
        Delete
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fixtures Management</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage event fixtures</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            options={[
              { value: '', label: 'All Events' },
              ...events.map(event => ({ value: event.id, label: event.name }))
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

      {/* Fixtures Table */}
      <DataTable
        columns={columns}
        fetchPage={fetchPage}
        rowActions={rowActions}
        pageSize={10}
        initialSortBy="scheduled_time"
        initialSortDir="asc"
        emptyDescription="No fixtures found."
      />
    </div>
  );
}