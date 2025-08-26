import { useState, useEffect } from "react";

export default function FilterPanel({ filters, onFilterChange, onApply, onClear }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync local filters with parent filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onApply();
  };

  const handleClear = () => {
    const clearedFilters = {
      sport_type: "",
      venue: "",
      start_date: "",
      end_date: "",
      status: ""
    };
    setLocalFilters(clearedFilters);
    onClear();
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== "");

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Filter Events</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-300 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Filters Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 transition-all duration-300 ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        {/* Sport Type Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Sport Type</label>
          <select
            value={localFilters.sport_type}
            onChange={(e) => handleFilterChange('sport_type', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Sports</option>
            <option value="Football">Football</option>
            <option value="Basketball">Basketball</option>
            <option value="Tennis">Tennis</option>
            <option value="Swimming">Swimming</option>
            <option value="Athletics">Athletics</option>
            <option value="Cricket">Cricket</option>
            <option value="Hockey">Hockey</option>
            <option value="Volleyball">Volleyball</option>
            <option value="Badminton">Badminton</option>
          </select>
        </div>

        {/* Venue Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Venue</label>
          <input
            type="text"
            placeholder="Search venues..."
            value={localFilters.venue}
            onChange={(e) => handleFilterChange('venue', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Start Date Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">From Date</label>
          <input
            type="date"
            value={localFilters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* End Date Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">To Date</label>
          <input
            type="date"
            value={localFilters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
          <select
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Status</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>
      
      {/* Filter Actions */}
      <div className={`flex gap-3 mt-6 transition-all duration-300 ${
        isExpanded ? 'opacity-100' : 'opacity-0'
      }`}>
        <button 
          onClick={handleApply}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Apply Filters
        </button>
        <button 
          onClick={handleClear}
          className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            Active filters: {Object.entries(localFilters)
              .filter(([_, value]) => value !== "")
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
