import React, { useState, useEffect, useCallback } from 'react';
import { publicAPI } from '../services/api.js';
import FixtureList from '../components/FixtureList';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const SpectatorSchedule = () => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sports, setSports] = useState([]);
  const [events, setEvents] = useState([]);
  
  const [filters, setFilters] = useState({
    sport: '',
    event: '',
    date_from: '',
    date_to: ''
  });

  // Load fixtures with current filters
  const loadFixtures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all events first to build fixture list
      const eventsResponse = await publicAPI.getEvents({ page_size: 1000 });
      const allEvents = eventsResponse.data.results || [];
      
      // Filter events based on current filters
      let filteredEvents = allEvents;
      if (filters.sport) {
        filteredEvents = filteredEvents.filter(event => event.sport === filters.sport);
      }
      if (filters.event) {
        filteredEvents = filteredEvents.filter(event => event.id.toString() === filters.event);
      }
      
      // Get fixtures for filtered events
      const fixturePromises = filteredEvents.map(event => 
        publicAPI.getEventFixtures(event.id)
      );
      
      const fixtureResponses = await Promise.all(fixturePromises);
      
      // Combine all fixtures
      let allFixtures = [];
      fixtureResponses.forEach((response, index) => {
        const eventFixtures = (response.data.results || []).map(fixture => ({
          ...fixture,
          event: filteredEvents[index]
        }));
        allFixtures = [...allFixtures, ...eventFixtures];
      });
      
      // Apply date filters
      if (filters.date_from) {
        allFixtures = allFixtures.filter(fixture => 
          new Date(fixture.start_at) >= new Date(filters.date_from)
        );
      }
      if (filters.date_to) {
        allFixtures = allFixtures.filter(fixture => 
          new Date(fixture.start_at) <= new Date(filters.date_to)
        );
      }
      
      // Sort by start time
      allFixtures.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
      
      setFixtures(allFixtures);
      
    } catch (err) {
      console.error('Failed to load fixtures:', err);
      setError('Failed to load schedule. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load available sports and events for filters
  const loadFilterData = useCallback(async () => {
    try {
      const response = await publicAPI.getEvents({ page_size: 1000 });
      const allEvents = response.data.results || [];
      
      const uniqueSports = [...new Set(allEvents.map(event => event.sport))];
      setSports(uniqueSports.sort());
      setEvents(allEvents);
      
    } catch (err) {
      console.error('Failed to load filter data:', err);
    }
  }, []);

  useEffect(() => {
    loadFilterData();
  }, [loadFilterData]);

  useEffect(() => {
    loadFixtures();
  }, [loadFixtures]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      sport: '',
      event: '',
      date_from: '',
      date_to: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(f => f);

  // Group fixtures by date
  const groupedFixtures = fixtures.reduce((groups, fixture) => {
    const date = new Date(fixture.start_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(fixture);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Match Schedule</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            View upcoming matches across all events. Filter by sport, event, or date range.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Schedule</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sport Filter */}
            <div>
              <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <select
                id="sport"
                value={filters.sport}
                onChange={(e) => handleFilterChange('sport', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Sports</option>
                {sports.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Filter */}
            <div>
              <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">
                Event
              </label>
              <select
                id="event"
                value={filters.event}
                onChange={(e) => handleFilterChange('event', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="date_from"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="date_to"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
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
              onClick={loadFixtures}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : fixtures.length > 0 ? (
          <div className="space-y-8">
            {/* Results count */}
            <div className="text-center">
              <p className="text-gray-600">
                Showing {fixtures.length} matches
              </p>
            </div>

            {/* Grouped fixtures by date */}
            {Object.entries(groupedFixtures).map(([date, dateFixtures]) => (
              <div key={date} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {dateFixtures.length} match{dateFixtures.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                <div className="p-6">
                  <FixtureList fixtures={dateFixtures} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters 
                ? "Try adjusting your filters to see more matches."
                : "No matches are currently scheduled. Check back later!"
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpectatorSchedule;
