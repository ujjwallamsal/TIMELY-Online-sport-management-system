import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { useEventSchedule } from '../hooks/useLiveChannel';
import { 
  getMatches, 
  getPublicEvents 
} from '../../services/api.js';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  TrophyIcon,
  EyeIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('matches');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Real-time fixtures data
  const [liveFixtures, setLiveFixtures] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Real-time hook for schedule updates
  const { isConnected, lastMessage } = useEventSchedule(eventFilter, {
    onScheduleUpdate: (data) => {
      if (data.fixtures) {
        setLiveFixtures(data.fixtures);
        setLastUpdate(new Date());
      }
    }
  });

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage, eventFilter, statusFilter]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const matchesData = await getMatches(currentPage, {
        event: eventFilter,
        status: statusFilter,
        search: searchTerm
      });
      setMatches(matchesData.results || []);
      setTotalPages(Math.ceil((matchesData.count || 0) / 20));

      // Load events for filter dropdown
      if (events.length === 0) {
        const eventsData = await getPublicEvents(1, '', '', '', {});
        setEvents(eventsData.results || []);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setEventFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'SCHEDULED': { variant: 'info', text: 'Scheduled', icon: ClockIcon },
      'LIVE': { variant: 'warning', text: 'Live Now', icon: PlayIcon },
      'COMPLETED': { variant: 'success', text: 'Completed', icon: CheckCircleIcon },
      'CANCELLED': { variant: 'danger', text: 'Cancelled', icon: ExclamationTriangleIcon },
      'POSTPONED': { variant: 'warning', text: 'Postponed', icon: ExclamationTriangleIcon }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status, icon: ClockIcon };
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-4 h-4" />
        {config.text}
      </Badge>
    );
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'TBD';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
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



  const renderMatches = () => {
    if (matches.length === 0) {
      return (
        <div className="text-center py-12">
          <TrophyIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Matches Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || eventFilter || statusFilter 
              ? 'Try adjusting your filters or search terms.'
              : 'No matches have been scheduled yet.'
            }
          </p>
          {searchTerm || eventFilter || statusFilter ? (
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {matches.map((match) => (
          <Card key={match.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-2xl">{getSportEmoji(match.event?.sport_type)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {match.event?.name || 'Event Name'}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{match.event?.sport_type}</span>
                        {match.division && (
                          <>
                            <span>•</span>
                            <span>{match.division.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>R{match.round_no} M{match.sequence_no}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                      {formatDate(match.starts_at)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-2 text-green-500" />
                      {formatDateTime(match.starts_at)}
                    </div>
                    {match.venue_detail && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-2 text-purple-500" />
                        {match.venue_detail.name}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <TrophyIcon className="w-4 h-4 mr-2 text-yellow-500" />
                      {match.duration_minutes}min
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Teams:</span>
                      <span className="ml-2">
                        {match.team_home_detail?.name || 'TBD'} vs {match.team_away_detail?.name || 'TBD'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className="ml-2">{getStatusBadge(match.status)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 lg:mt-0 lg:ml-6">
                  <Button
                    as={Link}
                    to={`/fixtures/${match.event?.id}`}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View Event
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                variant={currentPage === pageNum ? 'primary' : 'outline'}
                size="sm"
                className="w-10"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
        <Button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Matches</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with all scheduled matches, live games, and completed results across all events.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    placeholder="Search matches or events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={MagnifyingGlassIcon}
                  />
                </div>
                
                <div>
                  <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Events</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="POSTPONED">Postponed</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button type="submit" variant="primary" size="sm">
                    <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button type="button" onClick={clearFilters} variant="outline" size="sm">
                    <FunnelIcon className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  {matches.length > 0 && (
                    <span>{matches.length} match{matches.length !== 1 ? 'es' : ''} found</span>
                  )}
                </div>
              </div>
            </form>
          </div>
        </Card>

        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Matches</h2>
              <p className="text-gray-600">View all scheduled and completed matches</p>
            </div>
          </div>
          
          {/* Real-time Status Indicator */}
          {eventFilter && (
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live Updates' : 'Offline'}
              </span>
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  • {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading matches...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Data</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        ) : (
          <>
            {renderMatches()}
            {renderPagination()}
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Need More Information?</h3>
            <p className="text-gray-600 mb-6">
              Explore events, view detailed results, or check your registrations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button as={Link} to="/events" variant="primary" size="lg">
                Browse Events
              </Button>
              <Button as={Link} to="/results" variant="outline" size="lg">
                View Results
              </Button>
              <Button as={Link} to="/dashboard" variant="outline" size="lg">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
