import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { 
  getPublicResults, 
  getPublicEvents 
} from '../services/api';
import { 
  TrophyIcon, 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  StarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function Results() {
  const [results, setResults] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalResults: 0,
    totalEvents: 0,
    totalParticipants: 0,
    averageScore: 0
  });

  useEffect(() => {
    loadData();
  }, [currentPage, eventFilter, sportFilter, dateFilter]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const resultsData = await getPublicResults(currentPage, {
        event: eventFilter,
        sport: sportFilter,
        date: dateFilter,
        search: searchTerm
      });
      
      setResults(resultsData.results || []);
      setTotalPages(Math.ceil((resultsData.count || 0) / 20));

      // Load events for filter dropdown
      if (events.length === 0) {
        const eventsData = await getPublicEvents(1, '', '', '', {});
        setEvents(eventsData.results || []);
      }

      // Calculate stats
      if (resultsData.results) {
        const totalParticipants = resultsData.results.reduce((sum, result) => {
          return sum + (result.participants?.length || 0);
        }, 0);
        
        const totalScores = resultsData.results.reduce((sum, result) => {
          return sum + (result.total_score || 0);
        }, 0);
        
        setStats({
          totalResults: resultsData.count || 0,
          totalEvents: new Set(resultsData.results.map(r => r.match?.fixture?.event?.id)).size,
          totalParticipants,
          averageScore: resultsData.results.length > 0 ? Math.round(totalScores / resultsData.results.length) : 0
        });
      }

    } catch (err) {
      console.error('Error loading results:', err);
      setError('Failed to load results. Please try again.');
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
    setSportFilter('');
    setDateFilter('');
    setCurrentPage(1);
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
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
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

  const getResultBadge = (result) => {
    if (!result) return null;
    
    const { winner, participants, scores } = result;
    
    if (winner) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <TrophyIcon className="w-4 h-4" />
          Winner: {winner.name || winner}
        </Badge>
      );
    }
    
    if (scores && scores.length > 0) {
      const maxScore = Math.max(...scores.map(s => s.score || 0));
      const winners = participants?.filter(p => 
        scores.find(s => s.participant_id === p.id && s.score === maxScore)
      ) || [];
      
      if (winners.length > 0) {
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <TrophyIcon className="w-4 h-4" />
            Winner: {winners[0].name}
          </Badge>
        );
      }
    }
    
    return (
      <Badge variant="info" className="flex items-center gap-1">
        <ChartBarIcon className="w-4 h-4" />
        Results Available
      </Badge>
    );
  };

  const renderResultCard = (result) => {
    const event = result.match?.fixture?.event;
    const fixture = result.match?.fixture;
    const match = result.match;

  return (
      <Card key={result.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between">
            <div className="flex-1">
              {/* Event Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-3xl">{getSportEmoji(event?.sport_type)}</div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {event?.name || 'Event Name'}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{event?.sport_type}</span>
                    {fixture?.division && (
                      <>
                        <span>•</span>
                        <span>{fixture.division.name}</span>
                      </>
                    )}
                    {match?.match_type && (
                      <>
                        <span>•</span>
                        <span>{match.match_type}</span>
                      </>
                    )}
                  </div>
                </div>
        </div>

              {/* Match Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                  {formatDate(match?.scheduled_date)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-2 text-green-500" />
                  {formatDateTime(match?.scheduled_time)}
            </div>
                {match?.venue && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4 mr-2 text-purple-500" />
                    {match.venue.name}
          </div>
        )}
              </div>
              
              {/* Results Summary */}
              <div className="mb-4">
                {getResultBadge(result)}
              </div>
              
              {/* Participants and Scores */}
              {result.participants && result.participants.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Participants & Scores</h4>
                  <div className="space-y-2">
                    {result.participants.map((participant, index) => {
                      const score = result.scores?.find(s => s.participant_id === participant.id);
                      const isWinner = score && result.scores && 
                        score.score === Math.max(...result.scores.map(s => s.score || 0));
                      
                      return (
                        <div key={participant.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {isWinner ? (
                              <TrophyIcon className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <span className="text-gray-400 font-mono text-sm">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                            )}
                            <span className="font-medium text-gray-900">
                              {participant.name || participant.team_name || `Participant ${index + 1}`}
                            </span>
                            {isWinner && (
                              <Badge variant="warning" size="sm">🥇</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {score && (
                              <span className="text-lg font-bold text-blue-600">
                                {score.score}
                              </span>
                            )}
                            {score?.unit && (
                              <span className="text-sm text-gray-500">{score.unit}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
            </div>
          </div>
              )}
              
              {/* Additional Result Details */}
              {result.notes && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">{result.notes}</p>
              </div>
              )}
              
              {/* Result Metadata */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Result ID: {result.id}</span>
                <span>Published: {formatDateTime(result.created_at)}</span>
            </div>
          </div>

            <div className="mt-4 lg:mt-0 lg:ml-6">
              <Button
                as={Link}
                to={`/results/${result.id}`}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </div>
      </Card>
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

  const getUniqueSports = () => {
    const sports = new Set();
    events.forEach(event => {
      if (event.sport_type) {
        sports.add(event.sport_type);
      }
    });
    return Array.from(sports).sort();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Results & Outcomes</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View all published results, scores, and outcomes from completed matches and events across all sports.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="p-6 text-center">
              <TrophyIcon className="w-8 h-8 mx-auto text-blue-600 mb-3" />
              <div className="text-2xl font-bold text-blue-900">{stats.totalResults}</div>
              <div className="text-sm text-blue-700">Total Results</div>
              </div>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="p-6 text-center">
              <StarIcon className="w-8 h-8 mx-auto text-green-600 mb-3" />
              <div className="text-2xl font-bold text-green-900">{stats.totalEvents}</div>
              <div className="text-sm text-green-700">Events with Results</div>
              </div>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <div className="p-6 text-center">
              <TrophyIcon className="w-8 h-8 mx-auto text-purple-600 mb-3" />
              <div className="text-2xl font-bold text-purple-900">{stats.totalParticipants}</div>
              <div className="text-sm text-purple-700">Total Participants</div>
            </div>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <div className="p-6 text-center">
              <ArrowTrendingUpIcon className="w-8 h-8 mx-auto text-orange-600 mb-3" />
              <div className="text-2xl font-bold text-orange-900">{stats.averageScore}</div>
              <div className="text-sm text-orange-700">Average Score</div>
          </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    placeholder="Search results, events, or participants..."
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
                    value={sportFilter}
                    onChange={(e) => setSportFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Sports</option>
                    {getUniqueSports().map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                ))}
              </select>
            </div>
            
            <div>
              <input
                type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
                  {results.length > 0 && (
                    <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
                  )}
                </div>
            </div>
            </form>
          </div>
        </Card>

        {/* Results Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading results...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <div className="text-center py-8">
              <TrophyIcon className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Results</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        ) : results.length === 0 ? (
          <Card className="border-gray-200 bg-gray-50">
          <div className="text-center py-16">
              <TrophyIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || eventFilter || sportFilter || dateFilter 
                  ? 'Try adjusting your filters or search terms.'
                  : 'No results have been published yet.'
                }
              </p>
              {searchTerm || eventFilter || sportFilter || dateFilter ? (
                <Button onClick={clearFilters} variant="outline">
              Clear Filters
                </Button>
              ) : (
                <Button as={Link} to="/events" variant="primary">
                  Browse Events
                </Button>
              )}
          </div>
          </Card>
        ) : (
          <>
            <div className="space-y-6">
              {results.map(renderResultCard)}
                  </div>
            {renderPagination()}
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Explore More</h3>
            <p className="text-gray-600 mb-6">
              Check out upcoming matches, browse events, or view your registrations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button as={Link} to="/matches" variant="primary" size="lg">
                View Matches
              </Button>
              <Button as={Link} to="/events" variant="outline" size="lg">
                Browse Events
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
