import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { can } from '../../utils/capabilities.js';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myEvents: 0,
    pendingRegistrations: 0,
    upcomingFixtures: 0,
    myAnnouncements: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load organizer-specific stats
      const [eventsData, registrationsData, fixturesData, announcementsData] = await Promise.all([
        api.getEvents({ page_size: 1, created_by: user?.id }),
        api.getRegistrations({ page_size: 1, status: 'pending' }),
        api.getFixtures({ page_size: 1, status: 'upcoming' }),
        api.getAnnouncements({ page_size: 1, created_by: user?.id })
      ]);

      setStats({
        myEvents: eventsData.count || 0,
        pendingRegistrations: registrationsData.count || 0,
        upcomingFixtures: fixturesData.count || 0,
        myAnnouncements: announcementsData.count || 0
      });

      // Load recent data
      const [recentEventsData, pendingRegistrationsData] = await Promise.all([
        api.getEvents({ page_size: 5, ordering: '-created_at', created_by: user?.id }),
        api.getRegistrations({ page_size: 5, ordering: '-created_at', status: 'pending' })
      ]);

      setRecentEvents(recentEventsData.results || recentEventsData);
      setPendingRegistrations(pendingRegistrationsData.results || pendingRegistrationsData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Event',
      description: 'Set up a new sporting event',
      href: '/organizer/events',
      icon: '🎯',
      capability: 'create_edit_events'
    },
    {
      title: 'Review Registrations',
      description: 'Approve or reject pending registrations',
      href: '/organizer/registrations',
      icon: '📋',
      capability: 'manage_registrations'
    },
    {
      title: 'Manage Fixtures',
      description: 'Set up match schedules',
      href: '/organizer/fixtures',
      icon: '⚽',
      capability: 'manage_fixtures'
    },
    {
      title: 'Enter Results',
      description: 'Record match outcomes',
      href: '/organizer/results',
      icon: '🏆',
      capability: 'enter_results'
    }
  ].filter(action => can(user?.role, action.capability));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500">Loading organizer dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your events, registrations, and fixtures
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">🎯</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">My Events</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.myEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-lg">📋</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Registrations</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingRegistrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">⚽</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming Fixtures</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcomingFixtures}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">📢</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">My Announcements</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.myAnnouncements}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
            <Link
              to="/organizer/events"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No events yet</p>
            )}
          </div>
        </div>

        {/* Pending Registrations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Registrations</h2>
            <Link
              to="/organizer/registrations"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {pendingRegistrations.length > 0 ? (
              pendingRegistrations.map((registration) => (
                <div key={registration.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <span className="text-lg">📋</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {registration.user?.first_name} {registration.user?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {registration.event?.title}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {registration.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No pending registrations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
