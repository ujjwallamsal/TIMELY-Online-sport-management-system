import React, { useState, useEffect } from 'react';
import { 
  getResults, 
  getEventResults, 
  getEventLeaderboard, 
  finalizeResult, 
  verifyResult, 
  publishResult, 
  unpublishResult, 
  invalidateResult,
  recomputeStandings 
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

const AdminResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await getResults(1, { status: 'provisional' });
      setResults(response.data.results);
    } catch (err) {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const loadEventResults = async (eventId) => {
    try {
      setLoading(true);
      const [resultsResponse, leaderboardResponse] = await Promise.all([
        getEventResults(eventId),
        getEventLeaderboard(eventId)
      ]);
      setResults(resultsResponse.data.recent_results);
      setLeaderboard(leaderboardResponse.data.leaderboard);
      setSelectedEvent(eventId);
    } catch (err) {
      setError('Failed to load event results');
    } finally {
      setLoading(false);
    }
  };

  const handleResultAction = async (resultId, action) => {
    try {
      setLoading(true);
      let response;
      
      switch (action) {
        case 'finalize':
          response = await finalizeResult(resultId);
          break;
        case 'verify':
          response = await verifyResult(resultId);
          break;
        case 'publish':
          response = await publishResult(resultId);
          break;
        case 'unpublish':
          response = await unpublishResult(resultId);
          break;
        case 'invalidate':
          response = await invalidateResult(resultId);
          break;
        default:
          throw new Error('Invalid action');
      }
      
      // Reload results
      await loadResults();
      if (selectedEvent) {
        await loadEventResults(selectedEvent);
      }
    } catch (err) {
      setError(`Failed to ${action} result`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecomputeStandings = async (eventId) => {
    try {
      setLoading(true);
      await recomputeStandings(eventId);
      await loadEventResults(eventId);
    } catch (err) {
      setError('Failed to recompute standings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      provisional: 'bg-yellow-100 text-yellow-800',
      final: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      published: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getActionButtons = (result) => {
    const buttons = [];
    
    if (result.status === 'provisional') {
      buttons.push(
        <button
          key="finalize"
          onClick={() => handleResultAction(result.id, 'finalize')}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Finalize
        </button>
      );
    }
    
    if (result.status === 'final' && !result.is_verified) {
      buttons.push(
        <button
          key="verify"
          onClick={() => handleResultAction(result.id, 'verify')}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Verify
        </button>
      );
    }
    
    if (result.can_be_published) {
      buttons.push(
        <button
          key="publish"
          onClick={() => handleResultAction(result.id, 'publish')}
          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Publish
        </button>
      );
    }
    
    if (result.published) {
      buttons.push(
        <button
          key="unpublish"
          onClick={() => handleResultAction(result.id, 'unpublish')}
          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Unpublish
        </button>
      );
    }
    
    buttons.push(
      <button
        key="invalidate"
        onClick={() => handleResultAction(result.id, 'invalidate')}
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Invalidate
      </button>
    );
    
    return buttons;
  };

  if (!user?.is_staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Results Management</h1>
          <p className="mt-2 text-gray-600">Manage results lifecycle and standings</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Results List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Results</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          {result.home_team} vs {result.away_team}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        <p>Score: {result.score_home} - {result.score_away}</p>
                        <p>Event: {result.event_name}</p>
                        <p>Created: {new Date(result.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        {getActionButtons(result)}
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No results found</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Leaderboard</h2>
                {selectedEvent && (
                  <button
                    onClick={() => handleRecomputeStandings(selectedEvent)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={loading}
                  >
                    Recompute
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-lg text-gray-900">#{entry.position}</span>
                        <div>
                          <p className="font-medium text-gray-900">{entry.team_name}</p>
                          <p className="text-sm text-gray-600">
                            {entry.matches_played} matches, {entry.wins}W {entry.draws}D {entry.losses}L
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">{entry.points} pts</p>
                        <p className="text-sm text-gray-600">
                          GD: {entry.goal_difference > 0 ? '+' : ''}{entry.goal_difference}
                        </p>
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No leaderboard data</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResults;