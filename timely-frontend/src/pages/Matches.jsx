import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMatches } from "../lib/api";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    sport: "",
    venue: "",
    date: "",
    status: ""
  });

  // Fallback data for development
  const fallbackMatches = [
    {
      id: 1,
      home_team: "Blue Dragons",
      away_team: "Red Phoenix",
      sport: "Football",
      venue: "Central Stadium",
      scheduled_at: "2024-08-25T15:00:00Z",
      status: "UPCOMING",
      round_number: 1,
      match_number: 1,
      home_score: null,
      away_score: null
    },
    {
      id: 2,
      home_team: "Green Eagles",
      away_team: "Silver Wolves",
      sport: "Basketball",
      venue: "Sports Complex",
      scheduled_at: "2024-08-25T16:30:00Z",
      status: "UPCOMING",
      round_number: 1,
      match_number: 2,
      home_score: null,
      away_score: null
    },
    {
      id: 3,
      home_team: "Golden Lions",
      away_team: "Black Panthers",
      sport: "Tennis",
      venue: "Tennis Center",
      scheduled_at: "2024-08-26T10:00:00Z",
      status: "UPCOMING",
      round_number: 1,
      match_number: 3,
      home_score: null,
      away_score: null
    },
    {
      id: 4,
      home_team: "White Sharks",
      away_team: "Blue Dolphins",
      sport: "Swimming",
      venue: "Aquatic Center",
      scheduled_at: "2024-08-26T14:00:00Z",
      status: "UPCOMING",
      round_number: 1,
      match_number: 4,
      home_score: null,
      away_score: null
    },
    {
      id: 5,
      home_team: "Orange Tigers",
      away_team: "Purple Cobras",
      sport: "Cricket",
      venue: "Cricket Ground",
      scheduled_at: "2024-08-27T11:00:00Z",
      status: "UPCOMING",
      round_number: 1,
      match_number: 5,
      home_score: null,
      away_score: null
    },
    {
      id: 6,
      home_team: "Yellow Bees",
      away_team: "Green Hornets",
      sport: "Athletics",
      venue: "Track & Field",
      scheduled_at: "2024-08-27T15:30:00Z",
      status: "UPCOMING",
      round_number: 1,
      match_number: 6,
      home_score: null,
      away_score: null
    }
  ];

  const sports = ["Football", "Basketball", "Tennis", "Swimming", "Cricket", "Athletics"];
  const venues = ["Central Stadium", "Sports Complex", "Tennis Center", "Aquatic Center", "Cricket Ground", "Track & Field"];
  const statuses = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"];

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Try to load from API first
      const response = await getMatches();
      
      if (response && (response.results || response.length > 0)) {
        setMatches(response.results || response || []);
      } else {
        // Use fallback data if API returns empty
        setMatches(fallbackMatches);
      }
    } catch (err) {
      console.error('Error loading matches:', err);
      // Use fallback data on error
      setMatches(fallbackMatches);
      setError("Using offline data. Some features may be limited.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      sport: "",
      venue: "",
      date: "",
      status: ""
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-800';
      case 'ONGOING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'UPCOMING': return '⏰';
      case 'ONGOING': return '🔥';
      case 'COMPLETED': return '🏆';
      case 'CANCELLED': return '❌';
      default: return '❓';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "TBD";
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return "TBD";
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "TBD";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter matches based on current filters
  const filteredMatches = matches.filter(match => {
    if (filters.sport && match.sport !== filters.sport) {
      return false;
    }
    if (filters.venue && match.venue !== filters.venue) {
      return false;
    }
    if (filters.status && match.status !== filters.status) {
      return false;
    }
    if (filters.date) {
      const matchDate = new Date(match.scheduled_at).toDateString();
      const filterDate = new Date(filters.date).toDateString();
      if (matchDate !== filterDate) {
        return false;
      }
    }
    return true;
  });

  const upcomingMatches = filteredMatches.filter(match => match.status === 'UPCOMING');
  const ongoingMatches = filteredMatches.filter(match => match.status === 'ONGOING');
  const completedMatches = filteredMatches.filter(match => match.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Match Schedule
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View upcoming matches and fixtures for all sports events. Stay updated with real-time scores and schedules! ⚽🏀🎾🏊‍♂️
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingMatches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Live</p>
                <p className="text-2xl font-bold text-gray-900">{ongoingMatches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedMatches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{filteredMatches.length}</p>
              </div>
            </div>
          </div>
        </div>

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
              <select
                value={filters.sport}
                onChange={(e) => handleFilterChange("sport", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">All Sports</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
              <select
                value={filters.venue}
                onChange={(e) => handleFilterChange("venue", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">All Venues</option>
                {venues.map(venue => (
                  <option key={venue} value={venue}>{venue}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Matches Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="flex items-center justify-center mb-6">
              <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading matches...</h3>
            <p className="text-gray-600">Please wait while we fetch the latest match data</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🏟️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No matches found</h3>
            <p className="text-gray-600 text-lg mb-6">Try adjusting your filters or check back later for new matches.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-blue-600 mr-3">⏰</span>
                  Upcoming Matches ({upcomingMatches.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingMatches.map((match) => (
                    <div key={match.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
                      <div className="p-6">
                        {/* Match Header */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(match.status)}`}>
                            {getStatusIcon(match.status)} {match.status}
                          </span>
                          <span className="text-sm text-gray-500">Round {match.round_number}</span>
                        </div>
                        
                        {/* Teams */}
                        <div className="text-center mb-4">
                          <div className="text-lg font-bold text-gray-900 mb-2">{match.home_team}</div>
                          <div className="text-2xl font-bold text-blue-600 mb-2">VS</div>
                          <div className="text-lg font-bold text-gray-900">{match.away_team}</div>
                        </div>
                        
                        {/* Sport & Venue */}
                        <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                          <span className="font-semibold text-purple-600">{match.sport}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span>{match.venue}</span>
                        </div>
                        
                        {/* Date & Time */}
                        <div className="text-center text-sm text-gray-600 mb-4">
                          <div className="flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(match.scheduled_at)}
                          </div>
                          <div className="text-lg font-semibold text-gray-800 mt-1">
                            {formatTime(match.scheduled_at)}
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ongoing Matches */}
            {ongoingMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-yellow-600 mr-3">🔥</span>
                  Live Matches ({ongoingMatches.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ongoingMatches.map((match) => (
                    <div key={match.id} className="group bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg border border-yellow-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
                      <div className="p-6">
                        {/* Match Header */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(match.status)}`}>
                            {getStatusIcon(match.status)} {match.status}
                          </span>
                          <span className="text-sm text-gray-500">Round {match.round_number}</span>
                        </div>
                        
                        {/* Teams with Scores */}
                        <div className="text-center mb-4">
                          <div className="text-lg font-bold text-gray-900 mb-2">{match.home_team}</div>
                          <div className="text-2xl font-bold text-yellow-600 mb-2">LIVE</div>
                          <div className="text-lg font-bold text-gray-900">{match.away_team}</div>
                        </div>
                        
                        {/* Sport & Venue */}
                        <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                          <span className="font-semibold text-purple-600">{match.sport}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span>{match.venue}</span>
                        </div>
                        
                        {/* Live Indicator */}
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                            LIVE NOW
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 transform hover:scale-105">
                          Watch Live
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Matches */}
            {completedMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-green-600 mr-3">🏆</span>
                  Completed Matches ({completedMatches.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedMatches.map((match) => (
                    <div key={match.id} className="group bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
                      <div className="p-6">
                        {/* Match Header */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(match.status)}`}>
                            {getStatusIcon(match.status)} {match.status}
                          </span>
                          <span className="text-sm text-gray-500">Round {match.round_number}</span>
                        </div>
                        
                        {/* Teams with Final Scores */}
                        <div className="text-center mb-4">
                          <div className="text-lg font-bold text-gray-900 mb-2">{match.home_team}</div>
                          <div className="text-2xl font-bold text-green-600 mb-2">FINAL</div>
                          <div className="text-lg font-bold text-gray-900">{match.away_team}</div>
                        </div>
                        
                        {/* Sport & Venue */}
                        <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                          <span className="font-semibold text-purple-600">{match.sport}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span>{match.venue}</span>
                        </div>
                        
                        {/* Completion Time */}
                        <div className="text-center text-sm text-gray-600 mb-4">
                          <div className="text-lg font-semibold text-green-800">
                            Match Completed
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105">
                          View Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
