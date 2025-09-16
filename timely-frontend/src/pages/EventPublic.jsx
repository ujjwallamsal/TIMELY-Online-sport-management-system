import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicAPI } from '../lib/api';
import { useToast } from '../components/AppToaster';
import TicketStrip from '../components/TicketStrip';
import FixtureList from '../components/FixtureList';
import ResultsTable from '../components/ResultsTable';
import LeaderboardTable from '../components/LeaderboardTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const EventPublic = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [event, setEvent] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  const wsRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [eventResponse, fixturesResponse] = await Promise.all([
          publicAPI.getPublicEvent(id),
          publicAPI.listPublicFixtures(id)
        ]);
        
        setEvent(eventResponse.data);
        setFixtures(fixturesResponse.data.results || []);
        
        // Load results data
        await loadResultsData();
        
      } catch (err) {
        console.error('Failed to load event data:', err);
        if (err.response?.status === 404) {
          setError('Event not found or not published.');
        } else {
          setError('Failed to load event data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadResultsData = async () => {
    try {
      setResultsLoading(true);
      
      const [resultsResponse, leaderboardResponse] = await Promise.all([
        fetch(`/api/results/event/${id}/recent/`),
        fetch(`/api/results/event/${id}/leaderboard/`)
      ]);
      
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData.results || []);
      }
      
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load results data:', err);
      toast.error('Failed to load results', 'Please refresh the page.');
    } finally {
      setResultsLoading(false);
    }
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!id) return;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/results/event/${id}/`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setWsConnected(true);
        console.log('WebSocket connected for results updates');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'result_created':
            case 'result_updated':
            case 'result_published':
              // Refresh results when a result is updated
              loadResultsData();
              break;
            case 'leaderboard_updated':
            case 'standings_recomputed':
              // Update leaderboard
              if (data.data) {
                setLeaderboard(data.data);
              } else {
                loadResultsData();
              }
              break;
            case 'pong':
              // Keep connection alive
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        setWsConnected(false);
        console.log('WebSocket disconnected');
        
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id]);

  // Send ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (!wsConnected || !wsRef.current) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [wsConnected]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (cents) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <Link
            to="/events"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg font-medium mb-4">Event not found</div>
          <Link
            to="/events"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📋' },
    { id: 'schedule', name: 'Schedule', icon: '📅' },
    { id: 'results', name: 'Results', icon: '🏆' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(event.phase)}`}>
                  {event.phase}
                </span>
              </div>
              
              <p className="text-xl text-blue-600 font-medium mb-4">{event.sport}</p>
              
              {event.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">{event.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Event Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Start:</strong> {formatDate(event.start_datetime)}</div>
                    <div><strong>End:</strong> {formatDate(event.end_datetime)}</div>
                    <div><strong>Location:</strong> {event.location}</div>
                    {event.venue && (
                      <div><strong>Venue:</strong> {event.venue.name}</div>
                    )}
                    {event.capacity > 0 && (
                      <div><strong>Capacity:</strong> {event.capacity} participants</div>
                    )}
                    <div><strong>Entry Fee:</strong> {formatPrice(event.fee_cents)}</div>
                  </div>
                </div>
                
                {event.divisions && event.divisions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Divisions</h3>
                    <div className="space-y-1">
                      {event.divisions.map((division) => (
                        <div key={division.id} className="text-sm">
                          <div className="font-medium">{division.name}</div>
                          {division.description && (
                            <div className="text-gray-600">{division.description}</div>
                          )}
                          {division.max_teams && (
                            <div className="text-gray-500">Max teams: {division.max_teams}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Strip */}
        <TicketStrip event={event} className="mb-8" />

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-600 leading-relaxed">
                      {event.description || 'No additional information available for this event.'}
                    </p>
                  </div>
                </div>
                
                {event.registration_open_at && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Registration Information</h4>
                    <div className="text-sm text-blue-800">
                      <div>Registration opens: {formatDate(event.registration_open_at)}</div>
                      {event.registration_close_at && (
                        <div>Registration closes: {formatDate(event.registration_close_at)}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Schedule</h3>
                <FixtureList fixtures={fixtures} />
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-8">
                {/* Connection Status */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Match Results</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-500">
                      {wsConnected ? 'Live updates' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                {resultsLoading ? (
                  <div className="space-y-4">
                    <Skeleton type="heading" className="w-48" />
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton type="card" key={i} className="h-16" />
                      ))}
                    </div>
                  </div>
                ) : results.length === 0 ? (
                  <EmptyState
                    icon="🏆"
                    title="No Results Yet"
                    message="Results will appear here once matches are completed and published."
                  />
                ) : (
                  <ResultsTable results={results} />
                )}
                
                {leaderboard.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard</h3>
                    <LeaderboardTable leaderboard={leaderboard} />
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

export default EventPublic;
