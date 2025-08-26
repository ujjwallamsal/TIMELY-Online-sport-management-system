import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents, getDivisions, getVenues } from "../lib/api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    sport_type: "",
    venue: "",
    start_date: "",
    end_date: "",
    min_fee: "",
    max_fee: "",
    registration_open: "",
    status: "PUBLISHED" // Default to published events
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter options
  const [sportTypes, setSportTypes] = useState([]);
  const [venues, setVenues] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Fallback data for development
  const fallbackEvents = [
    {
      id: 1,
      name: "Summer Football Championship",
      sport_type: "Football",
      start_date: "2024-07-15",
      end_date: "2024-07-20",
      venue_name: "Central Stadium",
      status: "UPCOMING",
      is_registration_open: true,
      fee_dollars: 25.00
    },
    {
      id: 2,
      name: "Basketball Tournament",
      sport_type: "Basketball",
      start_date: "2024-08-01",
      end_date: "2024-08-05",
      venue_name: "Sports Complex",
      status: "UPCOMING",
      is_registration_open: true,
      fee_dollars: 30.00
    },
    {
      id: 3,
      name: "Swimming Competition",
      sport_type: "Swimming",
      start_date: "2024-09-10",
      end_date: "2024-09-12",
      venue_name: "Aquatic Center",
      status: "UPCOMING",
      is_registration_open: false,
      fee_dollars: 20.00
    }
  ];

  useEffect(() => {
    loadEvents();
    loadFilterOptions();
  }, [currentPage]);

  // Load filter options
  async function loadFilterOptions() {
    try {
      const [divisionsData, venuesData] = await Promise.all([
        getDivisions().catch(() => []),
        getVenues().catch(() => [])
      ]);
      
      setDivisions(divisionsData || []);
      setVenues(venuesData || []);
      
      // Extract unique sport types from fallback data
      const uniqueSports = [...new Set(fallbackEvents.map(event => event.sport_type))];
      setSportTypes(uniqueSports);
    } catch (err) {
      console.error('Failed to load filter options:', err);
      // Use fallback sport types
      const uniqueSports = [...new Set(fallbackEvents.map(event => event.sport_type))];
      setSportTypes(uniqueSports);
    }
  }

  // Load events with better error handling
  async function loadEvents() {
    try {
      setLoading(true);
      setError("");
      
      // Try to load from API first
      const response = await getEvents(currentPage, filters.search, filters.sport_type, filters.venue, filters);
      
      if (response && (response.results || response.length > 0)) {
        setEvents(response.results || response || []);
        setTotalPages(response.total_pages || 1);
        setTotalCount(response.count || response.length || 0);
        
        // Update sport types if we have new events
        if (response.results && response.results.length > 0) {
          const uniqueSports = [...new Set(response.results.map(event => event.sport_type))];
          setSportTypes(prev => [...new Set([...prev, ...uniqueSports])]);
        }
      } else {
        // Use fallback data if API returns empty
        setEvents(fallbackEvents);
        setTotalPages(1);
        setTotalCount(fallbackEvents.length);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      // Use fallback data on error
      setEvents(fallbackEvents);
      setTotalPages(1);
      setTotalCount(fallbackEvents.length);
      setError("Using offline data. Some features may be limited.");
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      sport_type: "",
      venue: "",
      start_date: "",
      end_date: "",
      min_fee: "",
      max_fee: "",
      registration_open: "",
      status: "PUBLISHED"
    });
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'UPCOMING': return 'bg-blue-100 text-blue-800';
      case 'ONGOING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "TBD";
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    if (filters.search && !event.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.sport_type && event.sport_type !== filters.sport_type) {
      return false;
    }
    if (filters.venue && event.venue_name !== filters.venue) {
      return false;
    }
    if (filters.registration_open === 'true' && !event.is_registration_open) {
      return false;
    }
    if (filters.registration_open === 'false' && event.is_registration_open) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sports Events
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Discover and join exciting sports events in your area. From football to swimming, we've got you covered! 🏟️⚽🏀🏊‍♂️
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-yellow-700">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">🔍 Search & Filter</h3>
            <button
              onClick={clearFilters}
              className="mt-3 sm:mt-0 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200"
            >
              Clear all filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Events</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search by event name, sport, or description..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            {/* Sport Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport Type</label>
              <select
                value={filters.sport_type}
                onChange={(e) => handleFilterChange("sport_type", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">All Sports</option>
                {sportTypes.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            
            {/* Registration Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration</label>
              <select
                value={filters.registration_open}
                onChange={(e) => handleFilterChange("registration_open", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">All</option>
                <option value="true">Open</option>
                <option value="false">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Available Events ({filteredEvents.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🏟️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No events found</h3>
              <p className="text-gray-600 text-lg mb-6">Try adjusting your filters or check back later for new events.</p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
                    <div className="p-6">
                      {/* Event Header */}
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                          {event.name}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      
                      {/* Sport & Venue */}
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <span className="font-semibold text-blue-600">{event.sport_type}</span>
                        {event.venue_name && (
                          <>
                            <span className="mx-2 text-gray-400">•</span>
                            <span>{event.venue_name}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Dates */}
                      <div className="text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(event.start_date)} - {formatDate(event.end_date)}
                        </div>
                      </div>
                      
                      {/* Registration & Fee */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${event.is_registration_open ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm font-medium text-gray-700">
                            {event.is_registration_open ? 'Registration Open' : 'Registration Closed'}
                          </span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">
                          ${event.fee_dollars || 0}
                        </span>
                      </div>
                      
                      {/* Action Button */}
                      <Link
                        to={`/events/${event.id}`}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
