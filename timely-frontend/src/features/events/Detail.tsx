import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEvent } from '../../api/queries';
import { formatDateTime } from '../../utils/format';
import { useEventStream } from '../../hooks/useEventStream';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  Clock, 
  RefreshCw,
  Wifi,
  WifiOff,
  Ticket
} from 'lucide-react';

interface Fixture {
  id: number;
  round: number;
  team1: string;
  team2: string;
  scheduled_time: string;
  venue: string;
  status: string;
  result?: {
    team1_score: number;
    team2_score: number;
  };
}

interface Result {
  id: number;
  fixture_id: number;
  team1: string;
  team2: string;
  team1_score: number;
  team2_score: number;
  completed_at: string;
}

interface LeaderboardEntry {
  team: string;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const eventId = parseInt(id || '0');
  const { data: event, isLoading } = useEvent(eventId);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'fixtures' | 'results' | 'leaderboard'>('overview');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isProcessingTicket, setIsProcessingTicket] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'success' | 'canceled' | null>(null);
  const hasNotifiedRef = useRef(false);

  // Use SSE for real-time updates
  const { isConnected, connectionStatus, errorMessage } = useEventStream({
    eventId,
    enabled: !!eventId && eventId > 0
  });

  // Detect Stripe Checkout return status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === '1' || params.get('success') === 'true') {
      setCheckoutStatus('success');
    } else if (params.get('canceled') === '1' || params.get('canceled') === 'true') {
      setCheckoutStatus('canceled');
    }
  }, [location.search]);

  // On successful checkout, create a notification once and clean URL params
  useEffect(() => {
    const handleSuccess = async () => {
      if (checkoutStatus !== 'success' || hasNotifiedRef.current) return;
      try {
        await api.post(ENDPOINTS.notifications, {
          title: 'Ticket Purchased',
          message: `Your ticket for ${event?.name || 'the event'} has been issued.`,
          type: 'success'
        });
        hasNotifiedRef.current = true;
        // Strip query params
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        url.searchParams.delete('canceled');
        window.history.replaceState({}, '', url.toString());
      } catch {}
    };
    handleSuccess();
  }, [checkoutStatus, event]);

  // Handle ticket purchase
  const handleGetTicket = async () => {
    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(`/events/${eventId}`);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }

    setIsProcessingTicket(true);
    try {
      if (event?.fee_cents && event.fee_cents > 0) {
        // Paid event - navigate to checkout page
        navigate(`/events/${eventId}/checkout`);
      } else {
        // Free event - call dedicated free endpoint
        await api.post(ENDPOINTS.ticketsFree, { event_id: eventId });
        showSuccess('Ticket Issued', 'Your free ticket has been issued successfully!');
        // Create notification
        await api.post(ENDPOINTS.notifications, {
          title: 'Free Ticket Issued',
          message: `You have received a free ticket for ${event?.name}`,
          type: 'success'
        });
        navigate('/tickets/me');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.detail
        || error?.response?.data?.error
        || error?.response?.data?.message
        || 'Failed to process ticket. Please try again.';
      showError('Ticket Error', msg);
    } finally {
      setIsProcessingTicket(false);
    }
  };

  // Fetch fixtures
  const fetchFixtures = async () => {
    if (!eventId) return;
    setIsLoadingFixtures(true);
    try {
      const response = await api.get(ENDPOINTS.publicEventFixtures(eventId));
      setFixtures(response.data.results || []);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    } finally {
      setIsLoadingFixtures(false);
    }
  };

  // Fetch results
  const fetchResults = async () => {
    if (!eventId) return;
    setIsLoadingResults(true);
    try {
      const response = await api.get(ENDPOINTS.publicEventResults(eventId));
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    if (!eventId) return;
    setIsLoadingLeaderboard(true);
    try {
      const response = await api.get(ENDPOINTS.publicEventLeaderboard(eventId));
      setLeaderboard(response.data.results || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'fixtures' && fixtures.length === 0) {
      fetchFixtures();
    } else if (activeTab === 'results' && results.length === 0) {
      fetchResults();
    } else if (activeTab === 'leaderboard' && leaderboard.length === 0) {
      fetchLeaderboard();
    }
  }, [activeTab, eventId]);

  // Get event status
  const getEventStatus = (event: any) => {
    if (!event) return 'UNKNOWN';
    const now = new Date();
    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime);
    
    if (event.status === 'CANCELLED') return 'CANCELLED';
    if (event.status === 'COMPLETED') return 'COMPLETED';
    if (now < start) return 'UPCOMING';
    if (now >= start && now <= end) return 'LIVE';
    if (now > end) return 'ENDED';
    return 'UNKNOWN';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-100 text-red-800';
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800';
      case 'ENDED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <p className="text-gray-600">The event you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const eventStatus = getEventStatus(event);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <span className={`status-badge ${getStatusBadgeColor(eventStatus)}`}>
                  {eventStatus}
                </span>
              </div>
              <p className="text-gray-600 text-lg">{event.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
              <span className="capitalize">{connectionStatus === 'connected' ? 'Live updates active' : 'Auto-refresh every 15s'}</span>
            </div>
          </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-md bg-yellow-50 border border-yellow-200">
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> Live updates temporarily unavailable. Results will refresh automatically every 15 seconds.
            </div>
          </div>
        )}

        {checkoutStatus && (
          <div className={`mb-4 p-4 rounded-md border ${checkoutStatus === 'success' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm ${checkoutStatus === 'success' ? 'text-green-800' : 'text-yellow-800'}`}>
                {checkoutStatus === 'success' ? 'Payment successful! Your ticket will appear in My Tickets shortly.' : 'Checkout was canceled. You can try again when ready.'}
              </div>
              <button
                onClick={() => setCheckoutStatus(null)}
                className={`text-sm ${checkoutStatus === 'success' ? 'text-green-700 hover:text-green-900' : 'text-yellow-700 hover:text-yellow-900'}`}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

          {/* Get Ticket Button */}
          <div className="mt-6">
            <button
              onClick={handleGetTicket}
              disabled={isProcessingTicket || eventStatus === 'ENDED'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Ticket className="h-5 w-5 mr-2" />
              {isProcessingTicket ? 'Processing...' : (
                event?.fee_cents && event.fee_cents > 0 ? 'Get Ticket' : 'Get Free Ticket'
              )}
            </button>
            {eventStatus === 'ENDED' && (
              <p className="mt-2 text-sm text-gray-500">This event has ended.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{formatDateTime(event.start_datetime)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Venue</p>
                <p className="font-medium">{event.venue_name || 'TBD'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Sport</p>
                <p className="font-medium">{event.sport_name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Fee</p>
                <p className="font-medium">
                  {event.fee_cents ? `$${(event.fee_cents / 100).toFixed(2)}` : 'Free'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'fixtures', label: 'Fixtures' },
                { id: 'results', label: 'Results' },
                { id: 'leaderboard', label: 'Leaderboard' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Start Time:</span>
                        <p className="text-gray-900">{formatDateTime(event.start_datetime)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">End Time:</span>
                        <p className="text-gray-900">{formatDateTime(event.end_datetime)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <p className="text-gray-900">{event.location || 'TBD'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {event.capacity && (
                        <div>
                          <span className="font-medium text-gray-700">Capacity:</span>
                          <p className="text-gray-900">{event.capacity} participants</p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Registration Status:</span>
                        <p className="text-gray-900">Open</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Rules:</span>
                        <p className="text-gray-900">Standard rules apply</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fixtures Tab */}
            {activeTab === 'fixtures' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Fixtures</h3>
                  <button
                    onClick={fetchFixtures}
                    disabled={isLoadingFixtures}
                    className="btn btn-outline btn-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFixtures ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                {isLoadingFixtures ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="skeleton h-16 rounded"></div>
                    ))}
                  </div>
                ) : fixtures.length > 0 ? (
                  <div className="space-y-4">
                    {fixtures.map((fixture) => (
                      <div key={fixture.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-500">Round {fixture.round}</span>
                              <span className={`status-badge ${getStatusBadgeColor(fixture.status)}`}>
                                {fixture.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-medium">{fixture.team1}</div>
                              <div className="text-gray-500">vs</div>
                              <div className="text-lg font-medium">{fixture.team2}</div>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                              <span>{new Date(fixture.scheduled_time).toLocaleString()}</span>
                              <span>{fixture.venue}</span>
                            </div>
                            {fixture.result && (
                              <div className="mt-2 text-center text-lg font-bold">
                                {fixture.result.team1_score} - {fixture.result.team2_score}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No fixtures available yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Results</h3>
                  <button
                    onClick={fetchResults}
                    disabled={isLoadingResults}
                    className="btn btn-outline btn-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingResults ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                {isLoadingResults ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="skeleton h-16 rounded"></div>
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-4">
                    {results.map((result) => (
                      <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-500">
                                {new Date(result.completed_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-medium">{result.team1}</div>
                              <div className="text-2xl font-bold text-primary-600">
                                {result.team1_score} - {result.team2_score}
                              </div>
                              <div className="text-lg font-medium">{result.team2}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No results available yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
                  <button
                    onClick={fetchLeaderboard}
                    disabled={isLoadingLeaderboard}
                    className="btn btn-outline btn-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLeaderboard ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                {isLoadingLeaderboard ? (
                  <div className="skeleton h-64 rounded"></div>
                ) : leaderboard.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pts</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GF</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GA</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GD</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leaderboard.map((entry, index) => (
                          <tr key={index} className={index < 3 ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {entry.team}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {entry.points}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.matches_played}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.wins}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.draws}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.losses}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.goals_for}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.goals_against}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.goal_difference > 0 ? '+' : ''}{entry.goal_difference}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No leaderboard available yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;