import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getVenues, 
  createVenue, 
  updateVenue, 
  deleteVenue 
} from '../../services/api';
import useSocket from '../../hooks/useSocket';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MapPinIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Venues = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    q: '',
    capacity_min: '',
    page: 1
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: 0,
    facilities: '',
    timezone: 'UTC'
  });
  const [saving, setSaving] = useState(false);

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useSocket(
    user?.role === 'ADMIN' ? '/ws/admin/' : '/ws/organizer/',
    {
      onMessage: (data) => {
        console.log('Real-time venue update:', data);
        if (data.type === 'venue_update') {
          // Refresh venues list
          fetchVenues();
        }
      },
      onPolling: () => {
        // Polling fallback
        fetchVenues();
      }
    }
  );

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.capacity_min) params.append('capacity_min', filters.capacity_min);
      if (filters.page) params.append('page', filters.page);
      
      const response = await getVenues(params.toString());
      setVenues(response.data.results || response.data);
      setPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: filters.page
      });
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to load venues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Venue name is required.');
        return;
      }
      if (!formData.address.trim()) {
        setError('Address is required.');
        return;
      }
      
      // Parse facilities JSON
      let facilities = null;
      if (formData.facilities.trim()) {
        try {
          facilities = JSON.parse(formData.facilities);
        } catch (err) {
          setError('Facilities must be valid JSON format.');
          return;
        }
      }
      
      const venueData = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        facilities: facilities
      };
      
      await createVenue(venueData);
      
      // Reset form and close modal
      setFormData({
        name: '',
        address: '',
        capacity: 0,
        facilities: '',
        timezone: 'UTC'
      });
      setShowCreateForm(false);
      
      // Real-time update will handle the refresh
    } catch (err) {
      console.error('Error creating venue:', err);
      setError('Failed to create venue. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (venueId) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;
    
    try {
      await deleteVenue(venueId);
      // Real-time update will handle the refresh
    } catch (err) {
      console.error('Error deleting venue:', err);
      alert('Failed to delete venue. Please try again.');
    }
  };

  const formatCapacity = (capacity) => {
    return capacity > 0 ? capacity.toLocaleString() : 'Unlimited';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton type="text" className="h-8 w-48 mb-4" />
            <Skeleton type="text" className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} type="card" className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !showCreateForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon="⚠️"
          title="Failed to load venues"
          message={error}
          action={
            <button
              onClick={fetchVenues}
              className="btn btn-primary"
              aria-label="Try again"
            >
              Try Again
            </button>
          }
        />
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
              <h1 className="text-3xl font-bold text-gray-900">Venues Management</h1>
              <p className="mt-2 text-gray-600">
                Manage event venues and their availability
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Live indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Venue
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                placeholder="Search venues..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Capacity
              </label>
              <input
                type="number"
                min="0"
                value={filters.capacity_min}
                onChange={(e) => handleFilterChange('capacity_min', e.target.value)}
                placeholder="0"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ q: '', capacity_min: '', page: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Create Venue Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Venue</h3>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleCreateVenue} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      required
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facilities (JSON)
                    </label>
                    <textarea
                      value={formData.facilities}
                      onChange={(e) => setFormData(prev => ({ ...prev, facilities: e.target.value }))}
                      placeholder='{"parking": true, "wifi": true, "catering": false}'
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Creating...' : 'Create Venue'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Venues List */}
        {venues.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {venues.map((venue) => (
                <div key={venue.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {venue.name}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDelete(venue.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete Venue"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 mr-2 mt-0.5" />
                        <span className="line-clamp-2">{venue.address}</span>
                      </div>
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        <span>Capacity: {formatCapacity(venue.capacity)}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>Timezone: {venue.timezone}</span>
                      </div>
                    </div>
                    
                    {venue.facilities && Object.keys(venue.facilities).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Facilities</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(venue.facilities).map(([key, value]) => (
                            <span
                              key={key}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {key}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-400">
                      Created {new Date(venue.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.count > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={Math.ceil(pagination.count / 12)}
                onPageChange={(page) => handleFilterChange('page', page)}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon="🏟️"
            title="No venues found"
            message="Get started by creating your first venue."
            action={
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
                aria-label="Create venue"
              >
                Create Venue
              </button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default Venues;
