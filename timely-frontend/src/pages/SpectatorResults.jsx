import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import ResultsTable from '../components/ResultsTable';
import LeaderboardTable from '../components/LeaderboardTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const SpectatorResults = () => {
  const [results, setResults] = useState([]);
  const [leaderboards, setLeaderboards] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  
  const [filters, setFilters] = useState({
    sport: '',
    event: '',
    date_from: '',
    date_to: ''
  });

  // Load results with current filters
  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all events first
      const eventsResponse = await publicAPI.listPublicEvents({ page_size: 1000 });
      const allEvents = eventsResponse.data.results || [];
      
      // Filter events based on current filters
      let filteredEvents = allEvents;
      if (filters.sport) {
        filteredEvents = filteredEvents.filter(event => event.sport === filters.sport);
      }
      if (filters.event) {
        filteredEvents = filteredEvents.filter(event => event.id.toString() === filters.event);
      }
      
      // Get results for filtered events
      const resultPromises = filteredEvents.map(event => 
        publicAPI.listPublicResults(event.id)
      );
      
      const resultResponses = await Promise.all(resultPromises);
      
      // Combine all results
      let allResults = [];
      const eventLeaderboards = {};
      
      resultResponses.forEach((response, index) => {
        const event = filteredEvents[index];
        const eventResults = response.data.results || [];
        const eventLeaderboard = response.data.leaderboard || [];
        
        // Add event info to results
        const resultsWithEvent = eventResults.map(result => ({
          ...result,
          event: event
        }));
        
        allResults = [...allResults, ...resultsWithEvent];
        eventLeaderboards[event.id] = {
          event: event,
          leaderboard: eventLeaderboard
        };
      });
      
      // Apply date filters
      if (filters.date_from) {
        allResults = allResults.filter(result => 
          new Date(result.created_at) >= new Date(filters.date_from)
        );
      }
      if (filters.date_to) {
        allResults = allResults.filter(result => 
          new Date(result.created_at) <= new Date(filters.date_to)
        );
      }
      
      // Sort by creation date (newest first)
      allResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setResults(allResults);
      setLeaderboards(eventLeaderboards);
      
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('Failed to load results. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load available sports and events for filters
  const loadFilterData = useCallback(async () => {
    try {
      const response = await publicAPI.listPublicEvents({ page_size: 1000 });
      const allEvents = response.data.results || [];
      
      setEvents(allEvents);
      
    } catch (err) {
      console.error('Failed to load filter data:', err);
    }
  }, []);

  useEffect(() => {
    loadFilterData();
  }, [loadFilterData]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

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

  // Get unique sports from events
  const sports = [...new Set(events.map(event => event.sport))].sort();

  // Group results by event
  const resultsByEvent = results.reduce((groups, result) => {
    const eventId = result.event.id;
    if (!groups[eventId]) {
      groups[eventId] = {
        event: result.event,
        results: []
      };
    }
    groups[eventId].results.push(result);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Results & Leaderboards</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            View match results and team standings across all events.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Results</h3>
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
          <div className="space-y-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
            <button
              onClick={loadResults}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-8">
            {/* Results count */}
            <div className="text-center">
              <p className="text-gray-600">
                Showing {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Results grouped by event */}
            {Object.entries(resultsByEvent).map(([eventId, eventData]) => (
              <div key={eventId} className="space-y-6">
                {/* Event Header */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{eventData.event.name}</h2>
                      <p className="text-blue-600 font-medium">{eventData.event.sport}</p>
                    </div>
                    <Link
                      to={`/events/${eventId}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                      View Event
                    </Link>
                  </div>
                </div>

                {/* Results for this event */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  <ResultsTable results={eventData.results} />
                </div>

                {/* Leaderboard for this event */}
                {leaderboards[eventId]?.leaderboard && leaderboards[eventId].leaderboard.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <LeaderboardTable leaderboard={leaderboards[eventId].leaderboard} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters 
                ? "Try adjusting your filters to see more results."
                : "No results are currently available. Check back after matches are completed!"
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

export default SpectatorResults;
