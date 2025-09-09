/**
 * MediaFilters component for filtering media gallery.
 * Provides search, kind selection, and event/fixture filtering.
 */
import React, { useState, useEffect } from 'react';
import { eventsAPI, fixturesAPI } from '../lib/api';

const MediaFilters = ({ 
  filters, 
  onFiltersChange, 
  className = '' 
}) => {
  const [events, setEvents] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load events and fixtures for filter dropdowns
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [eventsResponse, fixturesResponse] = await Promise.all([
          eventsAPI.listEvents({ page_size: 100 }),
          fixturesAPI.listFixtures({ page_size: 100 })
        ]);
        
        setEvents(eventsResponse.data.results || []);
        setFixtures(fixturesResponse.data.results || []);
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      kind: '',
      event: '',
      fixture: '',
      featured: false
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false && value !== null
  );

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by title, description, or uploader..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Kind filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media Type
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'All' },
              { value: 'photo', label: 'Photos' },
              { value: 'video', label: 'Videos' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('kind', option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.kind === option.value
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Event filter */}
        <div>
          <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">
            Event
          </label>
          <select
            id="event"
            value={filters.event || ''}
            onChange={(e) => handleFilterChange('event', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fixture filter */}
        <div>
          <label htmlFor="fixture" className="block text-sm font-medium text-gray-700 mb-1">
            Match/Fixture
          </label>
          <select
            id="fixture"
            value={filters.fixture || ''}
            onChange={(e) => handleFilterChange('fixture', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">All Matches</option>
            {fixtures.map((fixture) => (
              <option key={fixture.id} value={fixture.id}>
                {fixture.event_name} - Round {fixture.round_no}
              </option>
            ))}
          </select>
        </div>

        {/* Featured filter */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.featured || false}
              onChange={(e) => handleFilterChange('featured', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Show only featured media
            </span>
          </label>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaFilters;
