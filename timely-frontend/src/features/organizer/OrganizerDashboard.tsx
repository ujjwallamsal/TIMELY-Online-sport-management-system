import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Clock, 
  Trophy,
  Plus,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { listEvents, listRegistrations, listFixtures } from '../../api/admin';
import { Event, Registration, Fixture } from '../../api/types';
import { formatDateTime, formatRelativeTime } from '../../utils/date';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';

interface DashboardStats {
  myEvents: number;
  pendingRegistrations: number;
  thisWeekFixtures: number;
  recentEvents: Event[];
  pendingRegs: Registration[];
  upcomingFixtures: Fixture[];
}

const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    myEvents: 0,
    pendingRegistrations: 0,
    thisWeekFixtures: 0,
    recentEvents: [],
    pendingRegs: [],
    upcomingFixtures: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load events created by this organizer
      const eventsData = await listEvents({
        created_by: user.id,
        page_size: 10,
        ordering: '-start_datetime',
      });

      // Load pending registrations for organizer's events
      const eventIds = eventsData.results.map(e => e.id);
      const registrationsData = await listRegistrations({
        event__in: eventIds.join(','),
        status: 'PENDING',
        page_size: 10,
        ordering: '-registration_date',
      });

      // Load fixtures for this week
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 7));
      
      const fixturesData = await listFixtures({
        event__in: eventIds.join(','),
        scheduled_date__gte: weekStart.toISOString(),
        scheduled_date__lte: weekEnd.toISOString(),
        page_size: 10,
        ordering: 'scheduled_date',
      });

      setStats({
        myEvents: eventsData.count,
        pendingRegistrations: registrationsData.count,
        thisWeekFixtures: fixturesData.count,
        recentEvents: eventsData.results,
        pendingRegs: registrationsData.results,
        upcomingFixtures: fixturesData.results,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadDashboardData}
                className="btn btn-primary inline-flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your events, registrations, and fixtures</p>
            </div>
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="btn btn-outline inline-flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/organizer/events"
            className="card hover:shadow-lg transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-200">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">My Events</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.myEvents}</p>
                )}
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>

          <Link
            to="/organizer/registrations"
            className="card hover:shadow-lg transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 group-hover:scale-110 transition-transform duration-200">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Pending Registrations</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingRegistrations}</p>
                )}
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>

          <Link
            to="/organizer/fixtures"
            className="card hover:shadow-lg transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600 group-hover:scale-110 transition-transform duration-200">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">This Week's Fixtures</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.thisWeekFixtures}</p>
                )}
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/events/create"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Create New Event</p>
                  <p className="text-sm text-gray-500">Add a new sports event</p>
                </div>
              </Link>
              <Link
                to="/organizer/registrations"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Review Registrations</p>
                  <p className="text-sm text-gray-500">Approve or reject pending registrations</p>
                </div>
              </Link>
              <Link
                to="/organizer/fixtures"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Manage Fixtures</p>
                  <p className="text-sm text-gray-500">Schedule and manage event fixtures</p>
                </div>
              </Link>
              <Link
                to="/organizer/results"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Trophy className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Enter Results</p>
                  <p className="text-sm text-gray-500">Record and manage event results</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : stats.recentEvents.length > 0 ? (
                stats.recentEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(event.start_datetime)}
                      </p>
                    </div>
                    <span className={`status-badge ${getStatusBadgeColor(event.status)} text-xs`}>
                      {event.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Pending Registrations */}
        {stats.pendingRegs.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Registrations</h3>
              <Link
                to="/organizer/registrations"
                className="text-primary-600 hover:text-primary-900 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {stats.pendingRegs.slice(0, 5).map((reg) => (
                <div key={reg.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Registration #{reg.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(reg.registration_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-green-600 hover:text-green-900 p-1">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-1">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Fixtures */}
        {stats.upcomingFixtures.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Fixtures</h3>
              <Link
                to="/organizer/fixtures"
                className="text-primary-600 hover:text-primary-900 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {stats.upcomingFixtures.slice(0, 5).map((fixture) => (
                <div key={fixture.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {fixture.home_team_name || `Team ${fixture.home_team}`} vs {fixture.away_team_name || `Team ${fixture.away_team}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(fixture.scheduled_date)}
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge ${getStatusBadgeColor(fixture.status)} text-xs`}>
                    {fixture.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
