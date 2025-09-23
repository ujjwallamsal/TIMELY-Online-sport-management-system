import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { listEvents } from '../../services/api.js';
import api from '../../services/api.js';
import EventCard from '../components/EventCard';
import EventFilters from '../components/EventFilters';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const EventsList = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0
  });

  // Available sports for filter dropdown
  const [sports, setSports] = useState([]);

  const fetchEvents = useCallback(async (page = 1, currentFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        page_size: pagination.pageSize,
        ...currentFilters
      };

      // Use different API based on user role
      const response = user?.role === 'ADMIN' 
        ? await api.get('/api/events/', { params })
        : await listEvents(params);
      const data = response.data;
      
      setEvents(data.results || []);
      setPagination({
        page: data.page || 1,
        pageSize: data.page_size || 12,
        total: data.count || 0,
        totalPages: Math.ceil((data.count || 0) / (data.page_size || 12))
      });

      // Extract unique sports for filter dropdown
      if (data.results) {
        const uniqueSports = [...new Set(data.results.map(event => event.sport))];
        setSports(uniqueSports.sort());
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    fetchEvents(1, filters);
  }, [fetchEvents, filters]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    fetchEvents(newPage, filters);
  };

  const canCreateEvents = user && ['ORGANIZER', 'ADMIN'].includes(user.role);

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="mt-2 text-gray-600">
              Discover and participate in sports events
            </p>
          </div>
          
          {canCreateEvents && (
            <div className="mt-4 sm:mt-0">
              <Link
                to="/events/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </div>
          )}
        </div>

        {/* Filters */}
        <EventFilters
          onFiltersChange={handleFiltersChange}
          sports={sports}
        />

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Events grid */}
        {events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.pageSize + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.total}</span>{' '}
                      results
                    </p>
                  </div>
                  
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              pageNum === pagination.page
                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No events found</h3>
            <p className="mt-2 text-gray-500">
              {Object.values(filters).some(value => value !== '')
                ? 'Try adjusting your filters to see more events.'
                : 'No events are available at the moment.'}
            </p>
            {canCreateEvents && (
              <div className="mt-6">
                <Link
                  to="/events/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create the first event
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Loading overlay for pagination */}
        {loading && events.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;