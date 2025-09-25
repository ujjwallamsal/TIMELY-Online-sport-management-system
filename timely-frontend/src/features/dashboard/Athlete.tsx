import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  ClipboardList, 
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import { 
  useRegistrations, 
  useFixtures
} from '../../api/queries';
import { useAuth } from '../../auth/useAuth';

const AthleteDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch data for athlete's registrations and fixtures
  const { data: registrationsData, isLoading: registrationsLoading } = useRegistrations({
    user: user?.id,
    page_size: 10,
  });

  const { data: fixturesData, isLoading: fixturesLoading } = useFixtures({
    page_size: 20,
  });

  // const { data: resultsData, isLoading: resultsLoading } = useResults({
  //   page_size: 10,
  // });

  const registrations = registrationsData?.results || [];
  const fixtures = fixturesData?.results || [];
  // const results = resultsData?.results || [];

  // Calculate metrics
  const totalRegistrations = registrationsData?.count || 0;
  const approvedRegistrations = registrations?.filter(r => r.status === 'APPROVED').length || 0;
  const pendingRegistrations = registrations?.filter(r => r.status === 'PENDING').length || 0;
  const upcomingFixtures = fixtures?.filter(fixture => {
    const fixtureDate = new Date(fixture.scheduled_date);
    const now = new Date();
    return fixtureDate > now && fixture.status === 'SCHEDULED';
  }).length || 0;

  // Get athlete's fixtures from their approved registrations
  const athleteEvents = registrations
    ?.filter(r => r.status === 'APPROVED')
    .map(r => r.event) || [];
  
  const athleteFixtures = fixtures?.filter(fixture => 
    athleteEvents.includes(fixture.event)
  ) || [];

  // Quick actions for athlete
  const quickActions = [
    {
      title: 'Register for Event',
      description: 'Sign up for new events',
      icon: PlusCircle,
      href: '/registrations/create',
      color: 'bg-blue-500',
    },
    {
      title: 'My Registrations',
      description: 'View registration status',
      icon: ClipboardList,
      href: '/registrations/my',
      color: 'bg-green-500',
    },
    {
      title: 'My Fixtures',
      description: 'See upcoming matches',
      icon: Calendar,
      href: '/fixtures/my',
      color: 'bg-purple-500',
    },
    {
      title: 'My Results',
      description: 'View match results',
      icon: Trophy,
      href: '/results/my',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Athlete Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your registrations and track your performance</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Registrations */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Registrations</p>
                {registrationsLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{totalRegistrations}</p>
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

          {/* Upcoming Fixtures */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                {fixturesLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{upcomingFixtures}</p>
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
              {registrationsLoading ? (
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
              ) : registrations.length > 0 ? (
                <div className="space-y-3">
                  {registrations.slice(0, 5).map((registration) => (
                    <div key={registration.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        registration.status === 'APPROVED' ? 'bg-green-100' :
                        registration.status === 'PENDING' ? 'bg-yellow-100' :
                        'bg-red-100'
                      }`}>
                        {registration.status === 'APPROVED' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : registration.status === 'PENDING' ? (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Registration {registration.status.toLowerCase()} for {registration.event_title || `Event ${registration.event}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(registration.registration_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`status-badge ${
                        registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {registration.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No registrations yet</p>
                  <p className="text-sm text-gray-400">Register for events to see activity here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Registrations Overview */}
        <div className="mt-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Registrations</h3>
              <Link
                to="/registrations/create"
                className="btn btn-primary btn-sm inline-flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Register for Event
              </Link>
            </div>
            
            {registrationsLoading ? (
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
            ) : registrations.length > 0 ? (
              <div className="space-y-4">
                {registrations.slice(0, 5).map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <ClipboardList className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {registration.event_title || `Event ${registration.event}`}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Registered on {new Date(registration.registration_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`status-badge ${
                        registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {registration.status}
                      </span>
                      <Link
                        to={`/events/${registration.event}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Event →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations yet</h3>
                <p className="text-gray-500 mb-4">Register for sports events to get started</p>
                <Link
                  to="/registrations/create"
                  className="btn btn-primary inline-flex items-center"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Register for Event
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Fixtures */}
        {athleteFixtures.length > 0 && (
          <div className="mt-8">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">My Upcoming Fixtures</h3>
                <Link
                  to="/fixtures/my"
                  className="btn btn-primary btn-sm inline-flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </div>
              
              <div className="space-y-4">
                {athleteFixtures.slice(0, 5).map((fixture) => (
                  <div key={fixture.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {fixture.home_team_name} vs {fixture.away_team_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(fixture.scheduled_date).toLocaleDateString()} • {fixture.venue_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`status-badge ${
                        fixture.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        fixture.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        fixture.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {fixture.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteDashboard;
