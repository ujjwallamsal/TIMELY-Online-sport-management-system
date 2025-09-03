import React, { useState, useEffect, useCallback } from 'react';
import { publicAPI } from '../api';
import EventCard from '../components/EventCard';
import EventFilters from '../components/EventFilters';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const SpectatorEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sports, setSports] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    date_from: '',
    date_to: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0
  });

  // Load events with current filters and pagination
  const loadEvents = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        page_size: pagination.pageSize,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await publicAPI.listPublicEvents(params);
      
      setEvents(response.data.results || []);
      setPagination(prev => ({
        ...prev,
        page: response.data.page || 1,
        total: response.data.count || 0,
        totalPages: response.data.total_pages || 0
      }));
      
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load available sports for filter dropdown
  const loadSports = useCallback(async () => {
    try {
      const response = await publicAPI.listPublicEvents({ page_size: 1000 });
      const uniqueSports = [...new Set(response.data.results.map(event => event.sport))];
      setSports(uniqueSports.sort());
    } catch (err) {
      console.error('Failed to load sports:', err);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadSports();
  }, [loadSports]);

  useEffect(() => {
    loadEvents(1);
  }, [loadEvents]);

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page changes
  const handlePageChange = (page) => {
    loadEvents(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upcoming Events</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover exciting sports tournaments and competitions happening near you.
          </p>
        </div>

        {/* Filters */}
        <EventFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          sports={sports}
          loading={loading}
        />

        {/* Results */}
        <div className="mb-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
              <button
                onClick={() => loadEvents(pagination.page)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : events.length > 0 ? (
            <>
              {/* Results count */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {events.length} of {pagination.total} events
                </p>
              </div>

              {/* Events grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-6">
                {Object.values(filters).some(f => f) 
                  ? "Try adjusting your filters to see more events."
                  : "No events are currently available. Check back later!"
                }
              </p>
              {Object.values(filters).some(f => f) && (
                <button
                  onClick={() => handleFiltersChange({
                    search: '',
                    sport: '',
                    date_from: '',
                    date_to: ''
                  })}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpectatorEvents;