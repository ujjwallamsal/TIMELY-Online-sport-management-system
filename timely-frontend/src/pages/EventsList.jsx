import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, getVenues, getDivisions } from '../lib/api';

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showRegistrationOpen, setShowRegistrationOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, ongoing: 0 });

  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm, selectedSport, selectedVenue, selectedDivision, dateRange, priceRange, showRegistrationOpen]);

  async function loadData(isBackground = false) {
    try {
      if (!isBackground) {
        setLoading(true);
        setError(null);
      }

      const filters = {
        start_date: dateRange.start,
        end_date: dateRange.end,
        min_fee: priceRange.min,
        max_fee: priceRange.max,
        registration_open: showRegistrationOpen
      };

      const [eventsData, venuesData, divisionsData] = await Promise.all([
        getEvents(currentPage, searchTerm, selectedSport, selectedVenue, filters),
        getVenues(),
        getDivisions()
      ]);

      setEvents(eventsData?.results || []);
      setVenues(venuesData?.results || venuesData || []);
      setDivisions(divisionsData?.results || divisionsData || []);

      // Calculate stats based on fetched data
      const allEvents = eventsData.results || [];
      setStats({
        total: allEvents.length,
        upcoming: allEvents.filter(e => e.status === 'UPCOMING').length,
        ongoing: allEvents.filter(e => e.status === 'ONGOING').length
      });
    } catch (err) {
      if (!isBackground) {
        setError("Failed to load events. Please try again.");
      }
      console.error("Error loading data:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSport('');
    setSelectedVenue('');
    setSelectedDivision('');
    setDateRange({ start: '', end: '' });
    setPriceRange({ min: '', max: '' });
    setShowRegistrationOpen(false);
    setCurrentPage(1);
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PUBLISHED': 'bg-blue-100 text-blue-800',
      'UPCOMING': 'bg-green-100 text-green-800',
      'ONGOING': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-purple-100 text-purple-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getSportEmoji = (sport) => {
    const sportEmojis = {
      'Soccer': '⚽',
      'Football': '🏈',
      'Basketball': '🏀',
      'Tennis': '🎾',
      'Swimming': '🏊',
      'Athletics': '🏃',
      'Cricket': '🏏',
      'Baseball': '⚾',
      'Volleyball': '🏐',
      'Hockey': '🏒'
    };
    return sportEmojis[sport] || '⚽';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (feeCents) => {
    if (!feeCents || feeCents === 0) return 'Free';
    return `$${(feeCents / 100).toFixed(2)}`;
  };

  return (
    <div className="page-wrap">
      {/* Hero Section */}
      <div className="hero mb-8">
        <div className="hero-content">
          <h1 className="text-white">Sports Events</h1>
          <p className="text-white/90">Discover and join exciting sports competitions</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-gray-600">Total Events</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-2xl font-bold text-gray-800">{stats.upcoming}</div>
            <div className="text-gray-600">Upcoming</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-gray-800">{stats.ongoing}</div>
            <div className="text-gray-600">Live Now</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events by name, sport, or description..."
                className="form-input flex-1"
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="form-input"
              >
                <option value="">All Sports</option>
                {Array.from(new Set(events.map(e => e.sport_type))).map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>

              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="form-input"
              >
                <option value="">All Venues</option>
                {venues && venues.length > 0 && venues.map(venue => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))}
              </select>

              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="form-input"
              >
                <option value="">All Divisions</option>
                {divisions && divisions.length > 0 && divisions.map(division => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="registration-open"
                  checked={showRegistrationOpen}
                  onChange={(e) => setShowRegistrationOpen(e.target.checked)}
                  className="form-checkbox"
                />
                <label htmlFor="registration-open" className="text-sm">Registration Open</label>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                placeholder="Start Date"
                className="form-input"
              />
              
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                placeholder="End Date"
                className="form-input"
              />
              
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                placeholder="Min Price ($)"
                className="form-input"
                min="0"
                step="0.01"
              />
              
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                placeholder="Max Price ($)"
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
              
              <div className="text-sm text-gray-600">
                {events.length} events found
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="card">
          <div className="card-body text-center py-8">
            <div className="loading-spinner"></div>
            <p className="mt-3">Loading events...</p>
          </div>
        </div>
      ) : error ? (
        <div className="error-message"><p>{error}</p></div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3 className="empty-state-title">No events found</h3>
          <p className="empty-state-description">Try adjusting your search criteria or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-card-header">
                <div className="event-sport-icon">
                  {getSportEmoji(event.sport_type)}
                </div>
                <div className="event-status">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>
              
              <div className="event-card-body">
                <h3 className="event-title">{event.name}</h3>
                <p className="event-sport">{event.sport_type}</p>
                
                <div className="event-details">
                  <div className="event-detail">
                    <span className="event-detail-label">📅 Dates:</span>
                    <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                  </div>
                  
                  <div className="event-detail">
                    <span className="event-detail-label">🏟️ Venue:</span>
                    <span>{event.venue_name}</span>
                  </div>
                  
                  <div className="event-detail">
                    <span className="event-detail-label">👥 Capacity:</span>
                    <span>{event.capacity} participants</span>
                  </div>
                  
                  <div className="event-detail">
                    <span className="event-detail-label">💰 Fee:</span>
                    <span>{formatPrice(event.fee_cents)}</span>
                  </div>
                  
                  {event.days_until_start > 0 && (
                    <div className="event-detail">
                      <span className="event-detail-label">⏰ Starts in:</span>
                      <span>{event.days_until_start} days</span>
                    </div>
                  )}
                </div>
                
                {event.is_registration_open && (
                  <div className="event-registration-open">
                    <span className="text-green-600 text-sm font-medium">✅ Registration Open</span>
                  </div>
                )}
              </div>
              
              <div className="event-card-footer">
                <Link to={`/events/${event.id}`} className="btn btn-primary w-full">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {events.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={events.length < 12}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


