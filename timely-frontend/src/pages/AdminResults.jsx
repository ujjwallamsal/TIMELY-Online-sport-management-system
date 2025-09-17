// src/pages/AdminResults.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEventResults } from '../hooks/useLiveChannel';
import { 
  TrophyIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

export default function AdminResults() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real-time leaderboard data
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Real-time hook for results updates
  const { isConnected, lastMessage } = useEventResults(selectedEventId, {
    onResultsUpdate: (data) => {
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        setLastUpdate(new Date());
      }
    }
  });

  useEffect(() => {
    if (user && ['ADMIN', 'ORGANIZER'].includes(user.role)) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API call
      const mockEvents = [
        { id: 1, name: 'Summer Soccer Tournament', sport: 'Soccer', status: 'ONGOING' },
        { id: 2, name: 'Basketball Championship', sport: 'Basketball', status: 'UPCOMING' },
        { id: 3, name: 'Tennis Open', sport: 'Tennis', status: 'COMPLETED' },
      ];
      setEvents(mockEvents);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
    setLeaderboard([]);
    setLastUpdate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || !['ADMIN', 'ORGANIZER'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-2 text-gray-500">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Results Management</h1>
          <p className="mt-2 text-gray-600">Manage and monitor event results in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Event</h2>
              <div className="space-y-3">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedEventId === event.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{event.name}</div>
                    <div className="text-sm text-gray-600">{event.sport}</div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                      event.status === 'ONGOING' ? 'bg-green-100 text-green-800' :
                      event.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2">
            {selectedEventId ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Live Leaderboard</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-600">
                      {isConnected ? 'Live Updates' : 'Offline'}
                    </span>
                    {lastUpdate && (
                      <span className="text-xs text-gray-500">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No results yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Results will appear here as they are entered
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Pos</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Team</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-700">P</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-700">W</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-700">D</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-700">L</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-700">GF</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-700">GA</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-700">GD</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-700">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, index) => (
                          <tr key={entry.team_id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-bold text-gray-800">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-800">
                                {entry.team_name}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-gray-700">
                              {entry.matches_played}
                            </td>
                            <td className="py-3 px-2 text-center text-green-600 font-medium">
                              {entry.w}
                            </td>
                            <td className="py-3 px-2 text-center text-gray-600 font-medium">
                              {entry.d}
                            </td>
                            <td className="py-3 px-2 text-center text-red-600 font-medium">
                              {entry.l}
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-gray-700">
                              {entry.gf}
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-gray-700">
                              {entry.ga}
                            </td>
                            <td className="py-3 px-2 text-center font-medium text-gray-700">
                              <span className={entry.gd >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {entry.gd >= 0 ? '+' : ''}{entry.gd}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-gray-800">
                              {entry.pts}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Real-time Status */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Real-time Status</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-gray-600">
                          {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Updates every 30s
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Event</h3>
                  <p className="text-gray-600">
                    Choose an event from the sidebar to view its live results and leaderboard.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
