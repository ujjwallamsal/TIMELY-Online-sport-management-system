// pages/Venues.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast.jsx';
import * as api from '../lib/api';
import VenueForm from '../components/VenueForm';
import VenueAvailability from '../components/VenueAvailability';
import {
  BuildingOfficeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  UsersIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function Venues() {
  const { user } = useAuth();
  const { show, error: showError, success } = useToast();
  
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showAvailability, setShowAvailability] = useState(false);

  const canManage = user?.is_staff || user?.role === 'organizer';

  useEffect(() => {
    loadVenues();
  }, [currentPage, searchTerm, capacityFilter]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        search: searchTerm,
        ...(capacityFilter && { capacity__gte: capacityFilter })
      };
      
      const response = await api.getVenues(params);
      setVenues(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } catch (err) {
      console.error('Error loading venues:', err);
      setError('Failed to load venues');
      showError('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVenue = async (venueData) => {
    try {
      const response = await api.createVenue(venueData);
      setVenues(prev => [response.data, ...prev]);
      setShowCreateForm(false);
      success('Venue created successfully');
    } catch (err) {
      console.error('Error creating venue:', err);
      showError('Failed to create venue');
    }
  };

  const handleUpdateVenue = async (venueId, venueData) => {
    try {
      const response = await api.updateVenue(venueId, venueData);
      setVenues(prev => prev.map(v => v.id === venueId ? response.data : v));
      setEditingVenue(null);
      success('Venue updated successfully');
    } catch (err) {
      console.error('Error updating venue:', err);
      showError('Failed to update venue');
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (!window.confirm('Are you sure you want to delete this venue?')) {
      return;
    }
    
    try {
      await api.deleteVenue(venueId);
      setVenues(prev => prev.filter(v => v.id !== venueId));
      success('Venue deleted successfully');
    } catch (err) {
      console.error('Error deleting venue:', err);
      showError('Failed to delete venue');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadVenues();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCapacityFilter('');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-10 h-10 text-sm font-medium rounded-md ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Venues</h1>
              <p className="mt-2 text-gray-600">
                Manage event venues and their availability
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Venue
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search venues by name or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <input
                    type="number"
                    placeholder="Min capacity"
                    value={capacityFilter}
                    onChange={(e) => setCapacityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <FunnelIcon className="w-4 h-4 mr-2" />
                    Clear
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  {venues.length > 0 && (
                    <span>{venues.length} venue{venues.length !== 1 ? 's' : ''} found</span>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading venues...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-center">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Venues Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || capacityFilter 
                ? 'Try adjusting your search criteria.'
                : 'No venues have been created yet.'
              }
            </p>
            {canManage && !searchTerm && !capacityFilter && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Venue
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Venues Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Venue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      {canManage && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {venues.map((venue) => (
                      <tr key={venue.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="w-8 h-8 text-blue-500 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {venue.name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <MapPinIcon className="w-4 h-4 mr-1" />
                                {venue.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {venue.capacity || 'Unlimited'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(venue.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {venue.created_by_name}
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedVenue(venue);
                                  setShowAvailability(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 focus:outline-none focus:underline"
                                title="View Availability"
                              >
                                <CalendarIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingVenue(venue)}
                                className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:underline"
                                title="Edit Venue"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteVenue(venue.id)}
                                className="text-red-600 hover:text-red-900 focus:outline-none focus:underline"
                                title="Delete Venue"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {renderPagination()}
          </>
        )}

        {/* Create/Edit Venue Form */}
        {showCreateForm && (
          <VenueForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCreateVenue}
          />
        )}

        {editingVenue && (
          <VenueForm
            venue={editingVenue}
            onClose={() => setEditingVenue(null)}
            onSuccess={(data) => handleUpdateVenue(editingVenue.id, data)}
          />
        )}

        {/* Venue Availability Modal */}
        {showAvailability && selectedVenue && (
          <VenueAvailability
            venue={selectedVenue}
            onClose={() => {
              setShowAvailability(false);
              setSelectedVenue(null);
            }}
          />
        )}
      </div>
    </div>
  );
}