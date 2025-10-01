import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthProvider';
import { useVenues } from '../../api/queries';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import type { Venue } from '../../api/types';
// import { formatDate } from '../../utils/dateUtils';

const VenuesList: React.FC = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    capacity: '',
    contact_phone: '',
    contact_email: ''
  });

  const { data: venuesData, isLoading, error } = useVenues({});
  const venues = venuesData?.results || [];

  const canManage = hasRole(['ORGANIZER', 'ADMIN']);

  const createVenueMutation = useMutation({
    mutationFn: (data: Partial<Venue>) => api.post(ENDPOINTS.venues, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setIsCreating(false);
      setFormData({ name: '', address: '', city: '', state: '', postal_code: '', country: '', capacity: '', contact_phone: '', contact_email: '' });
      console.log('Venue created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create venue:', error.response?.data?.detail);
    }
  });

  const updateVenueMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Venue> }) => 
      api.patch(ENDPOINTS.venue(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setEditingVenue(null);
      setFormData({ name: '', address: '', city: '', state: '', postal_code: '', country: '', capacity: '', contact_phone: '', contact_email: '' });
      console.log('Venue updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update venue:', error.response?.data?.detail);
    }
  });

  const deleteVenueMutation = useMutation({
    mutationFn: (id: number) => api.delete(ENDPOINTS.venue(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      console.log('Venue deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete venue:', error.response?.data?.detail);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : null
    };

    if (editingVenue) {
      updateVenueMutation.mutate({ id: editingVenue.id, data });
    } else {
      createVenueMutation.mutate(data);
    }
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name || '',
      address: venue.address || '',
      city: venue.city || '',
      state: venue.state || '',
      postal_code: venue.postal_code || '',
      country: venue.country || '',
      capacity: venue.capacity?.toString() || '',
      contact_phone: venue.contact_phone || '',
      contact_email: venue.contact_email || ''
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingVenue(null);
    setFormData({ name: '', address: '', city: '', state: '', postal_code: '', country: '', capacity: '', contact_phone: '', contact_email: '' });
  };

  const handleDelete = (venue: Venue) => {
    if (window.confirm(`Are you sure you want to delete "${venue.name}"?`)) {
      deleteVenueMutation.mutate(venue.id);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Venues</h1>
            <div className="text-red-600">
              Failed to load venues. Please try again.
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
            <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
            {canManage && (
              <button
                onClick={() => setIsCreating(true)}
                className="btn btn-primary"
              >
                Add Venue
              </button>
            )}
          </div>

          {isCreating && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Create New Venue</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary">
                  {editingVenue ? 'Update' : 'Create'}
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
          ) : venues.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No venues found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <div key={venue.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                    {canManage && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(venue)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(venue)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Address:</strong> {venue.address}</p>
                    <p><strong>Location:</strong> {venue.city}, {venue.state} {venue.postal_code}</p>
                    {venue.capacity && <p><strong>Capacity:</strong> {venue.capacity}</p>}
                    {venue.contact_phone && <p><strong>Phone:</strong> {venue.contact_phone}</p>}
                    {venue.contact_email && <p><strong>Email:</strong> {venue.contact_email}</p>}
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

export default VenuesList;
