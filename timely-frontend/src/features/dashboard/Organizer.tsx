import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  ClipboardList, 
  Trophy,
  PlusCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { 
  useEvents, 
  useRegistrations, 
  useResults
} from '../../api/queries';
import { useAuth } from '../../auth/useAuth';

const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch data for organizer's events
  const { data: eventsData, isLoading: eventsLoading } = useEvents({
    created_by: user?.id,
    page_size: 10,
  });

  const { data: registrationsData, isLoading: registrationsLoading } = useRegistrations({
    page_size: 10,
  });

  const { data: resultsData, isLoading: resultsLoading } = useResults({
    page_size: 10,
  });

  const events = eventsData?.results || [];
  const registrations = registrationsData?.results || [];
  const results = resultsData?.results || [];

  // Calculate metrics
  const totalEvents = eventsData?.count || 0;
  const pendingRegistrations = registrations?.filter(r => r.status === 'PENDING').length || 0;
  const approvedRegistrations = registrations?.filter(r => r.status === 'APPROVED').length || 0;
  const recentResults = results?.slice(0, 5) || [];

  // Quick actions for organizer
  const quickActions = [
    {
      title: 'Create Event',
      description: 'Set up a new sports event',
      icon: PlusCircle,
      href: '/events/create',
      color: 'bg-blue-500',
    },
    {
      title: 'Generate Fixtures',
      description: 'Create fixtures for your events',
      icon: Calendar,
      href: '/fixtures/generate',
      color: 'bg-green-500',
    },
    {
      title: 'Manage Registrations',
      description: 'Review and approve registrations',
      icon: ClipboardList,
      href: '/registrations/manage',
      color: 'bg-purple-500',
    },
    {
      title: 'Enter Results',
      description: 'Record match results',
      icon: Trophy,
      href: '/results/enter',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your sports events and registrations</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* My Events */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Events</p>
                {eventsLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pending Registrations */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                {registrationsLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{pendingRegistrations}</p>
                )}
              </div>
            </div>
          </div>

          {/* Approved Registrations */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                {registrationsLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{approvedRegistrations}</p>
                )}
              </div>
            </div>
          </div>

          {/* Total Participants */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <p className="text-2xl font-bold text-gray-900">{approvedRegistrations}</p>
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
              {resultsLoading ? (
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
              ) : recentResults.length > 0 ? (
                <div className="space-y-3">
                  {recentResults.map((result) => (
                    <div key={result.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Result recorded for {result.fixture_details || `Fixture ${result.fixture}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(result.recorded_at).toLocaleDateString()} at{' '}
                          {new Date(result.recorded_at).toLocaleTimeString()}
                        </p>
                      </div>
                      {result.home_score !== null && result.away_score !== null && (
                        <div className="text-sm font-medium text-gray-900">
                          {result.home_score} - {result.away_score}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400">Results and registrations will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Events Overview */}
        <div className="mt-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Events</h3>
              <Link
                to="/events/create"
                className="btn btn-primary btn-sm inline-flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </div>
            
            {eventsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{event.name}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(event.start_datetime).toLocaleDateString()} • {event.sport_name || `Sport ${event.sport}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`status-badge ${
                        event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                        event.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                      <Link
                        to={`/events/${event.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-500 mb-4">Create your first sports event to get started</p>
                <Link
                  to="/events/create"
                  className="btn btn-primary inline-flex items-center"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;