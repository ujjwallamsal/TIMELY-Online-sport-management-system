import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import useSocket from '../../hooks/useSocket';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const TeamFixtures = ({ teamId, eventId }) => {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [fixtures, setFixtures] = useState([]);
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

  const fetchFixtures = async () => {
    try {
      const response = await api.get('fixtures/', {
        params: {
          team_id: teamId,
          event_id: eventId,
          page_size: 100
        }
      });
      setFixtures(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      setError('Failed to load fixtures');
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'schedule_update':
        if (message.data.event_id === eventId) {
          // Refresh fixtures when schedule is updated
          fetchFixtures();
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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFixtureStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFixtureStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return <ClockIcon className="w-4 h-4" />;
      case 'live': return <TrophyIcon className="w-4 h-4" />;
      case 'completed': return <TrophyIcon className="w-4 h-4" />;
      case 'cancelled': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'postponed': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId && eventId) {
      fetchFixtures();
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
            <h1 className="text-3xl font-bold text-gray-900">Team Fixtures</h1>
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

      {/* Fixtures List */}
      {fixtures.length > 0 ? (
        <div className="space-y-6">
          {fixtures.map((fixture) => (
            <div key={fixture.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getFixtureStatusIcon(fixture.status)}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {fixture.home_team_name} vs {fixture.away_team_name}
                  </h3>
                </div>
                <span className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getFixtureStatusColor(fixture.status)}`}>
                  {getFixtureStatusIcon(fixture.status)}
                  {fixture.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(fixture.start_datetime)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatTime(fixture.start_datetime)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{fixture.venue_name}</span>
                </div>
              </div>
              
              {fixture.division_name && (
                <div className="mt-3 text-sm text-gray-500">
                  Division: {fixture.division_name}
                </div>
              )}
              
              {fixture.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">{fixture.notes}</p>
                </div>
              )}
              
              {fixture.status === 'completed' && fixture.result && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Result</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">
                      {fixture.home_team_name}: {fixture.result.score_home}
                    </span>
                    <span className="text-gray-500">-</span>
                    <span className="font-medium">
                      {fixture.away_team_name}: {fixture.result.score_away}
                    </span>
                    {fixture.result.winner && (
                      <span className="text-green-600 font-medium">
                        Winner: {fixture.result.winner_name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No Fixtures Available"
          description="There are no fixtures scheduled for this team yet."
          action={
            <button
              onClick={() => fetchFixtures()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          }
        />
      )}

      {/* Team Stats */}
      {fixtures.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {fixtures.filter(f => f.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Matches Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {fixtures.filter(f => f.status === 'completed' && f.result?.winner_id === teamId).length}
              </div>
              <div className="text-sm text-gray-500">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {fixtures.filter(f => f.status === 'completed' && f.result?.winner_id && f.result?.winner_id !== teamId).length}
              </div>
              <div className="text-sm text-gray-500">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {fixtures.filter(f => f.status === 'upcoming').length}
              </div>
              <div className="text-sm text-gray-500">Upcoming</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamFixtures;
