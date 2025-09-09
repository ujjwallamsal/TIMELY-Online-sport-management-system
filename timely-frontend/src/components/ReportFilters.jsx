import React, { useState, useEffect } from 'react';
import { Calendar, Filter, X } from 'lucide-react';

const ReportFilters = ({ 
  onFiltersChange, 
  events = [], 
  sports = [], 
  divisions = [],
  loading = false 
}) => {
  const [filters, setFilters] = useState({
    event: '',
    sport: '',
    division: '',
    dateFrom: '',
    dateTo: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      event: '',
      sport: '',
      division: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        <div className={`grid gap-4 ${isExpanded ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'}`}>
          {/* Event Filter */}
          <div className="space-y-1">
            <label htmlFor="event-filter" className="block text-sm font-medium text-gray-700">
              Event
            </label>
            <select
              id="event-filter"
              value={filters.event}
              onChange={(e) => handleFilterChange('event', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sport Filter */}
          <div className="space-y-1">
            <label htmlFor="sport-filter" className="block text-sm font-medium text-gray-700">
              Sport
            </label>
            <select
              id="sport-filter"
              value={filters.sport}
              onChange={(e) => handleFilterChange('sport', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">All Sports</option>
              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div className="space-y-1">
            <label htmlFor="division-filter" className="block text-sm font-medium text-gray-700">
              Division
            </label>
            <select
              id="division-filter"
              value={filters.division}
              onChange={(e) => handleFilterChange('division', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">All Divisions</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From Filter */}
          <div className="space-y-1">
            <label htmlFor="date-from-filter" className="block text-sm font-medium text-gray-700">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="date-from-filter"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Date To Filter */}
          <div className="space-y-1">
            <label htmlFor="date-to-filter" className="block text-sm font-medium text-gray-700">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="date-to-filter"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.event && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Event: {events.find(e => e.id === parseInt(filters.event))?.name || filters.event}
                </span>
              )}
              {filters.sport && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Sport: {filters.sport}
                </span>
              )}
              {filters.division && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Division: {divisions.find(d => d.id === parseInt(filters.division))?.name || filters.division}
                </span>
              )}
              {filters.dateFrom && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  From: {filters.dateFrom}
                </span>
              )}
              {filters.dateTo && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  To: {filters.dateTo}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;
