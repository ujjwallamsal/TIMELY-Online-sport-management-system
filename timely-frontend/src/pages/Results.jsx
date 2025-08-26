import { useState, useEffect } from "react";
import { getResults } from "../lib/api";

export default function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    sport: "",
    event: "",
    date: "",
    outcome: ""
  });

  // Fallback data for development
  const fallbackResults = [
    {
      id: 1,
      event_name: "Summer Football Championship",
      home_team: "Blue Dragons",
      away_team: "Red Phoenix",
      home_score: 3,
      away_score: 1,
      sport: "Football",
      venue: "Central Stadium",
      match_date: "2024-08-20T15:00:00Z",
      outcome: "HOME_WIN",
      round_number: 1,
      match_number: 1,
      highlights: ["Goal by John Doe (15')", "Goal by Jane Smith (32')", "Goal by Mike Johnson (67')", "Goal by Sarah Wilson (89')"]
    },
    {
      id: 2,
      event_name: "Basketball Tournament Finals",
      home_team: "Green Eagles",
      away_team: "Silver Wolves",
      home_score: 89,
      away_score: 92,
      sport: "Basketball",
      venue: "Sports Complex",
      match_date: "2024-08-20T16:30:00Z",
      outcome: "AWAY_WIN",
      round_number: 1,
      match_number: 2,
      highlights: ["3-pointer by Alex Brown (Q1)", "Dunk by Chris Davis (Q2)", "Fast break by Emma Wilson (Q3)", "Game-winning shot by Tom Lee (Q4)"]
    },
    {
      id: 3,
      event_name: "Tennis Open Championship",
      home_team: "Golden Lions",
      away_team: "Black Panthers",
      home_score: 6,
      away_score: 4,
      sport: "Tennis",
      venue: "Tennis Center",
      match_date: "2024-08-21T10:00:00Z",
      outcome: "HOME_WIN",
      round_number: 1,
      match_number: 3,
      highlights: ["Ace serve (1st set)", "Break point (2nd set)", "Match point (3rd set)"]
    },
    {
      id: 4,
      event_name: "Swimming Championship",
      home_team: "White Sharks",
      away_team: "Blue Dolphins",
      home_score: 2,
      away_score: 0,
      sport: "Swimming",
      venue: "Aquatic Center",
      match_date: "2024-08-21T14:00:00Z",
      outcome: "HOME_WIN",
      round_number: 1,
      match_number: 4,
      highlights: ["100m Freestyle Gold", "200m Butterfly Gold", "4x100m Relay Gold"]
    },
    {
      id: 5,
      event_name: "Cricket League",
      home_team: "Orange Tigers",
      away_team: "Purple Cobras",
      home_score: 245,
      away_score: 198,
      sport: "Cricket",
      venue: "Cricket Ground",
      match_date: "2024-08-22T11:00:00Z",
      outcome: "HOME_WIN",
      round_number: 1,
      match_number: 5,
      highlights: ["Century by David Miller", "5-wicket haul by Sarah Khan", "Man of the Match: David Miller"]
    },
    {
      id: 6,
      event_name: "Athletics Championship",
      home_team: "Yellow Bees",
      away_team: "Green Hornets",
      home_score: 1,
      away_score: 0,
      sport: "Athletics",
      venue: "Track & Field",
      match_date: "2024-08-22T15:30:00Z",
      outcome: "HOME_WIN",
      round_number: 1,
      match_number: 6,
      highlights: ["100m Sprint Gold", "Long Jump Gold", "4x400m Relay Gold"]
    }
  ];

  const sports = ["Football", "Basketball", "Tennis", "Swimming", "Cricket", "Athletics"];
  const events = ["Summer Football Championship", "Basketball Tournament Finals", "Tennis Open Championship", "Swimming Championship", "Cricket League", "Athletics Championship"];
  const outcomes = ["HOME_WIN", "AWAY_WIN", "DRAW", "CANCELLED"];

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Try to load from API first
      const response = await getResults();
      
      if (response && (response.results || response.length > 0)) {
        setResults(response.results || response || []);
      } else {
        // Use fallback data if API returns empty
        setResults(fallbackResults);
      }
    } catch (err) {
      console.error('Error loading results:', err);
      // Use fallback data on error
      setResults(fallbackResults);
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
      event: "",
      date: "",
      outcome: ""
    });
  };

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'HOME_WIN': return 'bg-green-100 text-green-800';
      case 'AWAY_WIN': return 'bg-blue-100 text-blue-800';
      case 'DRAW': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case 'HOME_WIN': return '🏆';
      case 'AWAY_WIN': return '🥈';
      case 'DRAW': return '🤝';
      case 'CANCELLED': return '❌';
      default: return '❓';
    }
  };

  const getOutcomeText = (outcome) => {
    switch (outcome) {
      case 'HOME_WIN': return 'Home Win';
      case 'AWAY_WIN': return 'Away Win';
      case 'DRAW': return 'Draw';
      case 'CANCELLED': return 'Cancelled';
      default: return 'Unknown';
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter results based on current filters
  const filteredResults = results.filter(result => {
    if (filters.sport && result.sport !== filters.sport) {
      return false;
    }
    if (filters.event && result.event_name !== filters.event) {
      return false;
    }
    if (filters.outcome && result.outcome !== filters.outcome) {
      return false;
    }
    if (filters.date) {
      const resultDate = new Date(result.match_date).toDateString();
      const filterDate = new Date(filters.date).toDateString();
      if (resultDate !== filterDate) {
        return false;
      }
    }
    return true;
  });

  const homeWins = filteredResults.filter(result => result.outcome === 'HOME_WIN').length;
  const awayWins = filteredResults.filter(result => result.outcome === 'AWAY_WIN').length;
  const draws = filteredResults.filter(result => result.outcome === 'DRAW').length;
  const totalMatches = filteredResults.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Match Results
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View the latest results and outcomes from completed matches across all sports events! 🏆🥈🤝
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
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Home Wins</p>
                <p className="text-2xl font-bold text-gray-900">{homeWins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Away Wins</p>
                <p className="text-2xl font-bold text-gray-900">{awayWins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draws</p>
                <p className="text-2xl font-bold text-gray-900">{draws}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900">{totalMatches}</p>
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
              className="mt-3 sm:mt-0 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-500 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                <option value="">All Sports</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
              <select
                value={filters.event}
                onChange={(e) => handleFilterChange("event", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event} value={event}>{event}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Outcome</label>
              <select
                value={filters.outcome}
                onChange={(e) => handleFilterChange("outcome", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                <option value="">All Outcomes</option>
                {outcomes.map(outcome => (
                  <option key={outcome} value={outcome}>{getOutcomeText(outcome)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="flex items-center justify-center mb-6">
              <svg className="animate-spin h-12 w-12 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading results...</h3>
            <p className="text-gray-600">Please wait while we fetch the latest match results</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No results found</h3>
            <p className="text-gray-600 text-lg mb-6">Try adjusting your filters or check back later for new results.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredResults.map((result) => (
              <div key={result.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  {/* Result Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getOutcomeColor(result.outcome)}`}>
                      {getOutcomeIcon(result.outcome)} {getOutcomeText(result.outcome)}
                    </span>
                    <span className="text-sm text-gray-500">Round {result.round_number}</span>
                  </div>
                  
                  {/* Event Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                    {result.event_name}
                  </h3>
                  
                  {/* Teams & Scores */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center flex-1">
                        <div className="text-lg font-bold text-gray-900 mb-2">{result.home_team}</div>
                        <div className="text-3xl font-bold text-green-600">{result.home_score}</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-400 mx-4">VS</div>
                      <div className="text-center flex-1">
                        <div className="text-lg font-bold text-gray-900 mb-2">{result.away_team}</div>
                        <div className="text-3xl font-bold text-blue-600">{result.away_score}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sport & Venue */}
                  <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                    <span className="font-semibold text-purple-600">{result.sport}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span>{result.venue}</span>
                  </div>
                  
                  {/* Match Date */}
                  <div className="text-center text-sm text-gray-600 mb-4">
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(result.match_date)}
                    </div>
                  </div>
                  
                  {/* Highlights */}
                  {result.highlights && result.highlights.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">🏆 Key Highlights:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {result.highlights.slice(0, 3).map((highlight, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105">
                    View Full Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
