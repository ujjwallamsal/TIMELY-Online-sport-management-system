import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthProvider';
import { useFixtures, useEvents, useVenues } from '../../api/queries';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import type { Fixture, Venue } from '../../api/types';
import type { Event } from '../../api/queries';
import { formatDate, formatEventDate } from '../../utils/dateUtils';
// import { toast } from 'react-hot-toast';

const FixturesList: React.FC = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null);
  const [filters, setFilters] = useState({
    event: '',
    date: '',
    status: ''
  });
  const [formData, setFormData] = useState({
    event: '',
    venue: '',
    scheduled_date: '',
    home_team: '',
    away_team: '',
    notes: ''
  });

  const { data: fixturesData, isLoading, error } = useFixtures({
    event: filters.event || undefined,
    date: filters.date || undefined,
    status: filters.status || undefined
  });
  const fixtures = fixturesData?.results || [];

  const { data: eventsData } = useEvents({});
  const events = eventsData?.results || [];

  const { data: venuesData } = useVenues({});
  const venues = venuesData?.results || [];

  const canManage = hasRole(['ORGANIZER', 'ADMIN']);

  const createFixtureMutation = useMutation({
    mutationFn: (data: Partial<Fixture>) => api.post(ENDPOINTS.fixtures, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixtures'] });
      setIsCreating(false);
      setFormData({ event: '', venue: '', scheduled_date: '', home_team: '', away_team: '', notes: '' });
      console.log('Fixture created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create fixture:', error.response?.data?.detail);
    }
  });

  const updateFixtureMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Fixture> }) => 
      api.patch(ENDPOINTS.fixture(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixtures'] });
      setEditingFixture(null);
      setFormData({ event: '', venue: '', scheduled_date: '', home_team: '', away_team: '', notes: '' });
      console.log('Fixture updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update fixture:', error.response?.data?.detail);
    }
  });

  const deleteFixtureMutation = useMutation({
    mutationFn: (id: number) => api.delete(ENDPOINTS.fixture(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixtures'] });
      console.log('Fixture deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete fixture:', error.response?.data?.detail);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      event: formData.event ? parseInt(formData.event) : undefined,
      venue: formData.venue ? parseInt(formData.venue) : undefined,
      scheduled_date: formData.scheduled_date ? new Date(formData.scheduled_date).toISOString() : undefined,
      home_team: formData.home_team ? parseInt(formData.home_team) : null,
      away_team: formData.away_team ? parseInt(formData.away_team) : null,
      notes: formData.notes || null
    };

    if (editingFixture) {
      updateFixtureMutation.mutate({ id: editingFixture.id, data });
    } else {
      createFixtureMutation.mutate(data);
    }
  };

  const handleEdit = (fixture: Fixture) => {
    setEditingFixture(fixture);
    setFormData({
      event: fixture.event?.toString() || '',
      venue: fixture.venue?.toString() || '',
      scheduled_date: fixture.scheduled_date ? new Date(fixture.scheduled_date).toISOString().slice(0, 16) : '',
      home_team: fixture.home_team?.toString() || '',
      away_team: fixture.away_team?.toString() || '',
      notes: ''
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingFixture(null);
    setFormData({ event: '', venue: '', scheduled_date: '', home_team: '', away_team: '', notes: '' });
  };

  const handleDelete = (fixture: Fixture) => {
    if (window.confirm(`Are you sure you want to delete this fixture?`)) {
      deleteFixtureMutation.mutate(fixture.id);
    }
  };

  const getEventName = (eventId: number) => {
    const event = events.find((e: Event) => e.id === eventId);
    return event?.name || `Event ${eventId}`;
  };

  const getVenueName = (venueId: number) => {
    const venue = venues.find((v: Venue) => v.id === venueId);
    return venue?.name || `Venue ${venueId}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Fixtures</h1>
            <div className="text-red-600">
              Failed to load fixtures. Please try again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Fixtures</h1>
            {canManage && (
              <button
                onClick={() => setIsCreating(true)}
                className="btn btn-primary"
              >
                Add Fixture
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event
                </label>
                <select
                  value={filters.event}
                  onChange={(e) => setFilters({ ...filters, event: e.target.value })}
                  className="input"
                >
                  <option value="">All Events</option>
                  {events.map((event: Event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input"
                >
                  <option value="">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {isCreating && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Create New Fixture</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event *
                  </label>
                  <select
                    required
                    value={formData.event}
                    onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Event</option>
                    {events.map((event: Event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue *
                  </label>
                  <select
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Venue</option>
                    {venues.map((venue: Venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Home Team
                  </label>
                  <input
                    type="text"
                    value={formData.home_team}
                    onChange={(e) => setFormData({ ...formData, home_team: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Away Team
                  </label>
                  <input
                    type="text"
                    value={formData.away_team}
                    onChange={(e) => setFormData({ ...formData, away_team: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary">
                  {editingFixture ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : fixtures.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No fixtures found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fixtures.map((fixture: Fixture) => (
                <div key={fixture.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {fixture.home_team_name && fixture.away_team_name 
                          ? `${fixture.home_team_name} vs ${fixture.away_team_name}`
                          : 'Fixture'
                        }
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getEventName(fixture.event)} at {getVenueName(fixture.venue)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(fixture.status)}`}>
                        {fixture.status}
                      </span>
                      {canManage && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(fixture)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(fixture)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Scheduled:</strong> {formatEventDate(fixture.scheduled_date)}</p>
                    <p><strong>Created:</strong> {formatDate(fixture.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixturesList;
