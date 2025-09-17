import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLiveChannel } from '../../hooks/useLiveChannel';
import { api } from '../../services/api';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingApprovals: 0,
    todayMatches: 0,
    totalRegistrations: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [todayFixtures, setTodayFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates
  useLiveChannel('organizer_updates', (data) => {
    if (data.type === 'event_update') {
      fetchDashboardData();
    } else if (data.type === 'registration_update') {
      fetchPendingRegistrations();
    } else if (data.type === 'fixture_update') {
      fetchTodayFixtures();
    }
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch events with mine=true filter
      const eventsResponse = await api.get('/api/events?mine=true');
      const events = eventsResponse.data.results || eventsResponse.data;
      
      // Fetch pending registrations
      const registrationsResponse = await api.get('/api/registrations?status=pending');
      const registrations = registrationsResponse.data.results || registrationsResponse.data;
      
      // Fetch today's fixtures
      const today = new Date().toISOString().split('T')[0];
      const fixturesResponse = await api.get(`/api/fixtures?date_from=${today}&date_to=${today}`);
      const fixtures = fixturesResponse.data.results || fixturesResponse.data;
      
      setRecentEvents(events.slice(0, 5));
      setPendingRegistrations(registrations.slice(0, 5));
      setTodayFixtures(fixtures.slice(0, 5));
      
      setStats({
        totalEvents: events.length,
        pendingApprovals: registrations.length,
        todayMatches: fixtures.length,
        totalRegistrations: registrations.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const response = await api.get('/api/registrations?status=pending');
      const registrations = response.data.results || response.data;
      setPendingRegistrations(registrations.slice(0, 5));
      setStats(prev => ({ ...prev, pendingApprovals: registrations.length }));
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    }
  };

  const fetchTodayFixtures = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/api/fixtures?date_from=${today}&date_to=${today}`);
      const fixtures = response.data.results || response.data;
      setTodayFixtures(fixtures.slice(0, 5));
      setStats(prev => ({ ...prev, todayMatches: fixtures.length }));
    } catch (error) {
      console.error('Error fetching today fixtures:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveRegistration = async (registrationId) => {
    try {
      await api.patch(`/api/registrations/${registrationId}/`, { status: 'approved' });
      fetchPendingRegistrations();
    } catch (error) {
      console.error('Error approving registration:', error);
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    try {
      await api.patch(`/api/registrations/${registrationId}/`, { status: 'rejected' });
      fetchPendingRegistrations();
    } catch (error) {
      console.error('Error rejecting registration:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your events, registrations, and fixtures</p>
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
                <p className="text-sm font-medium text-gray-500">My Events</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Matches</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayMatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Registrations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRegistrations}</p>
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
                to="/organizer/events/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Event
              </Link>
              
              <Link
                to="/organizer/events"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Manage Events
              </Link>
              
              <button
                onClick={() => {/* TODO: Implement announcement modal */}}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                New Announcement
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Registrations */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Pending Registrations</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingRegistrations.length > 0 ? (
                pendingRegistrations.map((registration) => (
                  <div key={registration.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {registration.applicant?.first_name} {registration.applicant?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{registration.event?.name}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveRegistration(registration.id)}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRegistration(registration.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No pending registrations
                </div>
              )}
            </div>
          </div>

          {/* Today's Fixtures */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Today's Fixtures</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {todayFixtures.length > 0 ? (
                todayFixtures.map((fixture) => (
                  <div key={fixture.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {fixture.home?.name} vs {fixture.away?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(fixture.start_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {fixture.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No fixtures today
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
