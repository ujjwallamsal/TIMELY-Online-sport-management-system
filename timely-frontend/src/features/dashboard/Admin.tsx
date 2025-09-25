import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  Clock,
  CheckCircle,
  BarChart3,
  PlusCircle,
  Settings,
  UserCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
// Admin data fetching removed; use Django Admin instead

// Deprecated: Use Django Admin instead. Keep component minimal to avoid routing errors.
const AdminDashboard: React.FC = () => {
  const [metrics] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalRegistrations: 0,
    totalFixtures: 0,
    totalResults: 0,
    upcomingEvents: 0,
    ongoingEvents: 0,
    completedEvents: 0
  });
  const [recentEvents] = useState<any[]>([]);
  const [recentRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  // This dashboard is deprecated in favor of Django Admin
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Quick actions for admin
  const quickActions = [
    {
      title: 'Create Event',
      description: 'Set up a new sports event',
      icon: PlusCircle,
      href: '/events/create',
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: UserCheck,
      href: '/admin/users',
      color: 'bg-green-500',
    },
    {
      title: 'Manage Events',
      description: 'View and manage all events',
      icon: Calendar,
      href: '/admin/events',
      color: 'bg-blue-500',
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-purple-500',
    },
    {
      title: 'View Reports',
      description: 'Generate and view analytics',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Use Django Admin</h1>
          <p className="text-gray-600 mt-2">This dashboard has been removed. Use the built-in Django Admin instead.</p>
          <a href="http://127.0.0.1:8000/admin" target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">Open Django Admin</a>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder to avoid layout jumps; remove metrics */}
        <div className="hidden">
          {/* Total Users */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                            {isLoading ? (
                              <div className="skeleton-text-lg w-16"></div>
                            ) : (
                              <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
                            )}
              </div>
            </div>
          </div>

          {/* Total Events */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                            {isLoading ? (
                              <div className="skeleton-text-lg w-16"></div>
                            ) : (
                              <p className="text-2xl font-bold text-gray-900">{metrics.totalEvents.toLocaleString()}</p>
                            )}
              </div>
            </div>
          </div>

          {/* Total Registrations */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Registrations</p>
                            {isLoading ? (
                              <div className="skeleton-text-lg w-16"></div>
                            ) : (
                              <p className="text-2xl font-bold text-gray-900">{metrics.totalRegistrations.toLocaleString()}</p>
                            )}
              </div>
            </div>
          </div>

          {/* Total Fixtures */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Fixtures</p>
                            {isLoading ? (
                              <div className="skeleton-text-lg w-16"></div>
                            ) : (
                              <p className="text-2xl font-bold text-gray-900">{metrics.totalFixtures.toLocaleString()}</p>
                            )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                {isLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{metrics.upcomingEvents}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ongoing Events</p>
                {isLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{metrics.ongoingEvents}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Events</p>
                {isLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{metrics.completedEvents}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.href}
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentEvents.length > 0 || recentRegistrations.length > 0 ? (
                <div className="space-y-3">
                  {/* Recent Events */}
                  {recentEvents.slice(0, 3).map((event) => (
                    <div key={`event-${event.id}`} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Event created: {event.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.created_at || event.start_datetime).toLocaleDateString()} at{' '}
                          {new Date(event.created_at || event.start_datetime).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                        event.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  ))}
                  
                  {/* Recent Registrations */}
                  {recentRegistrations.slice(0, 2).map((registration) => (
                    <div key={`reg-${registration.id}`} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <ClipboardList className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          New registration for {registration.event_name || `Event ${registration.event}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(registration.created_at).toLocaleDateString()} at{' '}
                          {new Date(registration.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        registration.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {registration.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400">Events and registrations will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">API Status</p>
                  <p className="text-xs text-gray-500">
                    {error ? 'Some endpoints unavailable' : 'All systems operational'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Database</p>
                  <p className="text-xs text-gray-500">Connected and healthy</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Real-time Updates</p>
                  <p className="text-xs text-gray-500">Using polling fallback</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;