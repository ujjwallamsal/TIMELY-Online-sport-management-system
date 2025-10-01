import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { 
  useFixtures, 
  useResults
} from '../../api/queries';
import { useAuth } from '../../auth/AuthProvider';
// import { formatDateTime, formatRelativeTime } from '../../utils/date';
import { useToast } from '../../contexts/ToastContext';

const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch data for coach's fixtures and results
  const { data: fixturesData, isLoading: fixturesLoading } = useFixtures({
    coach: user?.id,
    page_size: 10,
  });

  const { data: resultsData, isLoading: resultsLoading } = useResults({
    recorded_by: user?.id,
    page_size: 10,
  });

  const fixtures = fixturesData?.results || [];
  const results = resultsData?.results || [];

  // Calculate metrics
  const todayFixtures = fixtures?.filter(fixture => {
    const fixtureDate = new Date(fixture.scheduled_date);
    const today = new Date();
    return fixtureDate.toDateString() === today.toDateString();
  }).length || 0;

  const pendingResults = fixtures?.filter(fixture => 
    fixture.status === 'COMPLETED' && 
    !results?.some(result => result.fixture === fixture.id)
  ).length || 0;

  const completedResults = results?.length || 0;

  // Quick actions for coach
  const quickActions = [
    {
      title: 'Enter Results',
      description: 'Record match results',
      icon: Trophy,
      href: '/results/enter',
      color: 'bg-green-500',
    },
    {
      title: 'View Fixtures',
      description: 'See upcoming matches',
      icon: Calendar,
      href: '/fixtures/my',
      color: 'bg-blue-500',
    },
    {
      title: 'Team Management',
      description: 'Manage team members',
      icon: Users,
      href: '/teams/manage',
      color: 'bg-purple-500',
    },
    {
      title: 'View Reports',
      description: 'Team performance analytics',
      icon: BarChart3,
      href: '/reports/team',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your team's fixtures and results</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Fixtures */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Fixtures</p>
                {fixturesLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{todayFixtures}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pending Results */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Results</p>
                {fixturesLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{pendingResults}</p>
                )}
              </div>
            </div>
          </div>

          {/* Completed Results */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Results Entered</p>
                {resultsLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{completedResults}</p>
                )}
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-500">Feature coming soon</p>
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

          {/* Recent Results */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Results</h3>
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
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results.slice(0, 5).map((result) => (
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
                  <p className="text-gray-500">No results recorded yet</p>
                  <p className="text-sm text-gray-400">Results will appear here after you enter them</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Fixtures */}
        <div className="mt-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Fixtures</h3>
              <Link
                to="/fixtures/my"
                className="btn btn-primary btn-sm inline-flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                View All
              </Link>
            </div>
            
            {fixturesLoading ? (
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
            ) : fixtures.length > 0 ? (
              <div className="space-y-4">
                {fixtures.slice(0, 5).map((fixture) => (
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
                      {fixture.status === 'COMPLETED' && !results.some(r => r.fixture === fixture.id) && (
                        <Link
                          to={`/results/enter?fixture=${fixture.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          Enter Result
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No fixtures assigned</h3>
                <p className="text-gray-500 mb-4">You don't have any fixtures assigned yet</p>
                <p className="text-sm text-gray-400">Contact your organizer to get assigned to fixtures</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
