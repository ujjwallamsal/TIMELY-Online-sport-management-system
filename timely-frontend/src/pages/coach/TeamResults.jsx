import React, { useState, useEffect } from 'react';
import { 
  TrophyIcon,
  MedalIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import useSocket from '../../hooks/useSocket';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const TeamResults = ({ teamId, eventId }) => {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [error, setError] = useState(null);

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/coach/`,
    {
      onMessage: (message) => {
        console.log('Received message:', message);
        handleRealtimeUpdate(message);
      }
    }
  );

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`teams/${teamId}/`);
      setTeam(response.data);
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const [resultsResponse, leaderboardResponse, statsResponse] = await Promise.all([
        api.get('results/', {
          params: {
            team_id: teamId,
            event_id: eventId,
            page_size: 100
          }
        }),
        api.get(`results/event/${eventId}/leaderboard/`),
        api.get('results/athlete-stats/', {
          params: {
            team_id: teamId,
            event_id: eventId
          }
        })
      ]);
      
      setResults(resultsResponse.data.results || resultsResponse.data);
      setLeaderboard(leaderboardResponse.data);
      setTeamStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load results');
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'results_update':
        if (message.data.event_id === eventId) {
          // Refresh results when they are updated
          fetchResults();
        }
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getResultStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'provisional': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
      case 2: return <MedalIcon className="w-5 h-5 text-gray-400" />;
      case 3: return <MedalIcon className="w-5 h-5 text-orange-500" />;
      default: return <span className="text-sm font-medium text-gray-500">#{position}</span>;
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId && eventId) {
      fetchResults();
    }
  }, [teamId, eventId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <SkeletonList items={5} />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState 
          title="Team Not Found"
          description="The team you're looking for doesn't exist."
          action={
            <button onClick={() => window.history.back()} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Go Back
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Results</h1>
            <p className="text-gray-600 mt-2">{team.name} • {team.sport}</p>
          </div>
          <LiveIndicator status={connectionStatus} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Team Stats Overview */}
      {teamStats && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <TrophyIcon className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Position</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {teamStats.position || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Points</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {teamStats.points || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <UserGroupIcon className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Matches</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {teamStats.matches_played || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <TrophyIcon className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Wins</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {teamStats.wins || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Losses
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => (
                    <tr 
                      key={entry.team_id} 
                      className={`${
                        entry.team_id === teamId ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPositionIcon(entry.position)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.team_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.matches_played}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.wins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.losses}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Match Results */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Match Results</h2>
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TrophyIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {result.fixture_title}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getResultStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Home Team</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {result.home_team_name}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">
                      {result.score_home}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Away Team</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {result.away_team_name}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">
                      {result.score_away}
                    </div>
                  </div>
                </div>
                
                {result.winner_name && (
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      <strong>Winner:</strong> {result.winner_name}
                    </div>
                  </div>
                )}
                
                {result.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <strong>Notes:</strong> {result.notes}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(result.created_at)}</span>
                  </div>
                  {result.verified_by && (
                    <div className="flex items-center gap-1">
                      <UserGroupIcon className="w-4 h-4" />
                      <span>Verified by {result.verified_by_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No Results Available"
            description="There are no results available for this team yet."
            action={
              <button
                onClick={() => fetchResults()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Refresh
              </button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default TeamResults;
