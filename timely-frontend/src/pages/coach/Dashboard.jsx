import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLiveChannel } from '../../hooks/useLiveChannel';
import { api } from '../../services/api';

const CoachDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingFixtures: 0,
    rosterCount: 0,
    unreadAnnouncements: 0,
    recentResults: 0
  });
  const [upcomingFixtures, setUpcomingFixtures] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates
  useLiveChannel('coach_updates', (data) => {
    if (data.type === 'fixture_update') {
      fetchUpcomingFixtures();
    } else if (data.type === 'result_update') {
      fetchRecentResults();
    } else if (data.type === 'announcement_update') {
      // Handle announcement updates
    }
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch teams I coach
      const teamsResponse = await api.get('/api/teams?mine=true');
      const teams = teamsResponse.data.results || teamsResponse.data;
      
      if (teams.length > 0) {
        const team = teams[0]; // For now, use first team
        
        // Fetch upcoming fixtures for my teams
        const fixturesResponse = await api.get(`/api/fixtures?team=${team.id}&status=upcoming`);
        const fixtures = fixturesResponse.data.results || fixturesResponse.data;
        
        // Fetch recent results for my teams
        const resultsResponse = await api.get(`/api/results?team=${team.id}&finalized=true`);
        const results = resultsResponse.data.results || resultsResponse.data;
        
        // Fetch roster
        const rosterResponse = await api.get(`/api/teams/${team.id}/members`);
        const rosterData = rosterResponse.data.results || rosterResponse.data;
        
        setUpcomingFixtures(fixtures.slice(0, 5));
        setRecentResults(results.slice(0, 5));
        setRoster(rosterData);
        
        setStats({
          upcomingFixtures: fixtures.length,
          rosterCount: rosterData.length,
          unreadAnnouncements: 0, // TODO: Implement announcement count
          recentResults: results.length
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingFixtures = async () => {
    try {
      const teamsResponse = await api.get('/api/teams?mine=true');
      const teams = teamsResponse.data.results || teamsResponse.data;
      
      if (teams.length > 0) {
        const team = teams[0];
        const response = await api.get(`/api/fixtures?team=${team.id}&status=upcoming`);
        const fixtures = response.data.results || response.data;
        setUpcomingFixtures(fixtures.slice(0, 5));
        setStats(prev => ({ ...prev, upcomingFixtures: fixtures.length }));
      }
    } catch (error) {
      console.error('Error fetching upcoming fixtures:', error);
    }
  };

  const fetchRecentResults = async () => {
    try {
      const teamsResponse = await api.get('/api/teams?mine=true');
      const teams = teamsResponse.data.results || teamsResponse.data;
      
      if (teams.length > 0) {
        const team = teams[0];
        const response = await api.get(`/api/results?team=${team.id}&finalized=true`);
        const results = response.data.results || response.data;
        setRecentResults(results.slice(0, 5));
        setStats(prev => ({ ...prev, recentResults: results.length }));
      }
    } catch (error) {
      console.error('Error fetching recent results:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleConfirmLineup = async (fixtureId) => {
    try {
      // TODO: Implement lineup confirmation
      console.log('Confirm lineup for fixture:', fixtureId);
    } catch (error) {
      console.error('Error confirming lineup:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your team, fixtures, and results</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming Fixtures</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcomingFixtures}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Roster Count</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rosterCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L16 4l-4 4H4.828z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unread Announcements</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unreadAnnouncements}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recent Results</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.recentResults}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/coach/roster"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Manage Roster
              </Link>
              
              <Link
                to="/coach/fixtures"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Fixtures
              </Link>
              
              <Link
                to="/coach/results"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Results
              </Link>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Fixtures */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Fixtures</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {upcomingFixtures.length > 0 ? (
                upcomingFixtures.map((fixture) => (
                  <div key={fixture.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {fixture.home?.name} vs {fixture.away?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(fixture.start_at).toLocaleDateString()} at {new Date(fixture.start_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleConfirmLineup(fixture.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Confirm Lineup
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No upcoming fixtures
                </div>
              )}
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Results</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentResults.length > 0 ? (
                recentResults.map((result) => (
                  <div key={result.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {result.fixture?.home?.name} {result.home_score} - {result.away_score} {result.fixture?.away?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(result.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.winner?.id === result.fixture?.home?.id ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.winner?.id === result.fixture?.home?.id ? 'W' : 'L'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No recent results
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
