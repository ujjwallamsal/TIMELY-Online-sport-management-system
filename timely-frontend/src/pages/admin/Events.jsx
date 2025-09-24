import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [venues, setVenues] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    start_datetime: '',
    venue: '',
    status: 'DRAFT',
    fee_cents: 0,
    description: '',
    requires_approval: false
  });

  useEffect(() => {
    loadEvents();
    loadVenues();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEvents();
      setEvents(data.results || data);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadVenues = async () => {
    try {
      const data = await api.getVenues();
      setVenues(data.results || data);
    } catch (err) {
      console.error('Failed to load venues:', err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.createEvent(formData);
      setShowCreateDialog(false);
      resetForm();
      loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.updateEvent(editingEvent.id, formData);
      setShowEditDialog(false);
      setEditingEvent(null);
      resetForm();
      loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      await api.deleteEvent(eventId);
      loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const handlePublishEvent = async (eventId) => {
    try {
      await api.publishEvent(eventId);
      loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to publish event');
    }
  };

  const handleCancelEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel this event?')) {
      return;
    }
    
    try {
      await api.cancelEvent(eventId);
      loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to cancel event');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sport: '',
      start_datetime: '',
      venue: '',
      status: 'DRAFT',
      fee_cents: 0,
      description: '',
      requires_approval: false
    });
  };

  const openEditDialog = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name || '',
      sport: event.sport || '',
      start_datetime: event.start_datetime ? new Date(event.start_datetime).toISOString().slice(0, 16) : '',
      venue: event.venue?.id || '',
      status: event.status || 'DRAFT',
      fee_cents: event.fee_cents || 0,
      description: event.description || '',
      requires_approval: event.requires_approval || false
    });
    setShowEditDialog(true);
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
      'PUBLISHED': 'bg-green-100 text-green-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'COMPLETED': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.sport}</div>
        </div>
      )
    },
    {
      header: 'Start Date',
      accessor: 'start_datetime',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      header: 'Venue',
      accessor: 'venue',
      render: (value) => value?.name || 'TBD'
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (value) => getStatusBadge(value)
    },
    {
      header: 'Fee',
      accessor: 'fee_cents',
      sortable: true,
      render: (value) => value > 0 ? `$${(value / 100).toFixed(2)}` : 'Free'
    }
  ];

  const fetchPage = async ({ page, pageSize, sortBy, sortDir, filters }) => {
    const params = {
      page,
      page_size: pageSize,
      ordering: sortDir === 'desc' ? `-${sortBy}` : sortBy,
      ...filters
    };

    const data = await api.getEvents(params);
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
        onClick={() => openEditDialog(row)}
      >
        Edit
      </Button>
      {row.status === 'DRAFT' && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => handlePublishEvent(row.id)}
        >
          Publish
        </Button>
      )}
      {row.status === 'PUBLISHED' && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleCancelEvent(row.id)}
        >
          Cancel
        </Button>
      )}
      <Button
        variant="danger"
        size="sm"
        onClick={() => handleDeleteEvent(row.id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="mt-1 text-sm text-gray-600">Create and manage sporting events</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateDialog(true)}
        >
          Create Event
        </Button>
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

      {/* Events Table */}
      <DataTable
        columns={columns}
        fetchPage={fetchPage}
        rowActions={rowActions}
        pageSize={10}
        initialSortBy="start_datetime"
        initialSortDir="desc"
        emptyDescription="No events found. Create your first event to get started."
      />

      {/* Create Event Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          resetForm();
        }}
        title="Create New Event"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Event Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Input
            label="Sport"
            value={formData.sport}
            onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
            required
          />
          
          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={formData.start_datetime}
            onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
            required
          />
          
          <Select
            label="Venue"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            options={venues.map(venue => ({ value: venue.id, label: venue.name }))}
          />
          
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'COMPLETED', label: 'Completed' }
            ]}
          />
          
          <Input
            label="Entry Fee (cents)"
            type="number"
            value={formData.fee_cents}
            onChange={(e) => setFormData({ ...formData, fee_cents: parseInt(e.target.value) || 0 })}
            min="0"
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requires_approval"
              checked={formData.requires_approval}
              onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-900">
              Requires approval for ticket purchases
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Event
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingEvent(null);
          resetForm();
        }}
        title="Edit Event"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <Input
            label="Event Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Input
            label="Sport"
            value={formData.sport}
            onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
            required
          />
          
          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={formData.start_datetime}
            onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
            required
          />
          
          <Select
            label="Venue"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            options={venues.map(venue => ({ value: venue.id, label: venue.name }))}
          />
          
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'COMPLETED', label: 'Completed' }
            ]}
          />
          
          <Input
            label="Entry Fee (cents)"
            type="number"
            value={formData.fee_cents}
            onChange={(e) => setFormData({ ...formData, fee_cents: parseInt(e.target.value) || 0 })}
            min="0"
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit_requires_approval"
              checked={formData.requires_approval}
              onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="edit_requires_approval" className="ml-2 block text-sm text-gray-900">
              Requires approval for ticket purchases
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditDialog(false);
                setEditingEvent(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update Event
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}