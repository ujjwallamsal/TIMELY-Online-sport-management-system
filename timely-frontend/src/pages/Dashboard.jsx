import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  getPublicEvents, 
  getPublicResults, 
  getMyRegistrations,
  getMyTickets,
  getSystemStats
} from '../lib/api';
import api from '../lib/api';
import { 
  CalendarIcon, 
  TrophyIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  BellIcon,
  CogIcon,
  UsersIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    liveEvents: 0,
    completedEvents: 0,
    myRegistrations: 0,
    myTickets: 0,
    totalResults: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError('');

      const promises = [
        // Use different API based on user role
        user?.role === 'ADMIN' 
          ? api.get('/api/events/?page=1&page_size=12').then(r => r.data).catch(err => ({ results: [], count: 0, error: err.message }))
          : getPublicEvents(1, '', '', '', {}).catch(err => ({ results: [], count: 0, error: err.message })),
        getPublicResults(1, {}).catch(err => ({ results: [], count: 0, error: err.message })),
      ];

      // Add user-specific data if authenticated
      if (user) {
        promises.push(
          getMyRegistrations(1, {}).catch(err => ({ results: [], count: 0, error: err.message })),
          getMyTickets(1, {}).catch(err => ({ results: [], count: 0, error: err.message }))
        );
      }

      const [eventsData, resultsData, registrationsData, ticketsData] = await Promise.all(promises);

      const events = eventsData.results || [];
      const results = resultsData.results || [];
      const registrations = registrationsData?.results || [];
      const tickets = ticketsData?.results || [];

      // Calculate stats
      setStats({
        totalEvents: events.length,
        upcomingEvents: events.filter(e => e.status === 'UPCOMING').length,
        liveEvents: events.filter(e => e.status === 'ONGOING').length,
        completedEvents: events.filter(e => e.status === 'COMPLETED').length,
        myRegistrations: registrations.length,
        myTickets: tickets.length,
        totalResults: results.length
      });

      // Set recent data
      setRecentEvents(events.slice(0, 5));
      setMyRegistrations(registrations.slice(0, 5));
      setMyTickets(tickets.slice(0, 5));
      setRecentResults(results.slice(0, 5));

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { variant: 'warning', text: 'Draft', icon: ExclamationTriangleIcon },
      'PUBLISHED': { variant: 'success', text: 'Published', icon: CheckCircleIcon },
      'UPCOMING': { variant: 'info', text: 'Upcoming', icon: ClockIcon },
      'ONGOING': { variant: 'warning', text: 'Live Now', icon: ClockIcon },
      'COMPLETED': { variant: 'secondary', text: 'Completed', icon: CheckCircleIcon },
      'CANCELLED': { variant: 'danger', text: 'Cancelled', icon: ExclamationTriangleIcon }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status, icon: ClockIcon };
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-4 h-4" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getSportEmoji = (sport) => {
    const sportEmojis = {
      'Soccer': '⚽',
      'Football': '🏈',
      'Basketball': '🏀',
      'Tennis': '🎾',
      'Swimming': '🏊',
      'Athletics': '🏃',
      'Cricket': '🏏',
      'Baseball': '⚾',
      'Volleyball': '🏐',
      'Hockey': '🏒'
    };
    return sportEmojis[sport] || '⚽';
  };

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="p-6 text-center">
            <UsersIcon className="w-8 h-8 mx-auto text-blue-600 mb-3" />
            <div className="text-2xl font-bold text-blue-900">{stats.totalEvents}</div>
            <div className="text-sm text-blue-700">Total Events</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="p-6 text-center">
            <UserGroupIcon className="w-8 h-8 mx-auto text-green-600 mb-3" />
            <div className="text-2xl font-bold text-green-900">{stats.myRegistrations}</div>
            <div className="text-sm text-green-700">Total Registrations</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="p-6 text-center">
            <TrophyIcon className="w-8 h-8 mx-auto text-purple-600 mb-3" />
            <div className="text-2xl font-bold text-purple-900">{stats.totalResults}</div>
            <div className="text-sm text-purple-700">Published Results</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <div className="p-6 text-center">
            <CurrencyDollarIcon className="w-8 h-8 mx-auto text-orange-600 mb-3" />
            <div className="text-2xl font-bold text-orange-900">{stats.myTickets}</div>
            <div className="text-sm text-orange-700">Total Tickets</div>
          </div>
        </Card>
      </div>

      {/* Admin Actions */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Admin Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button as={Link} to="/events/create" variant="primary" size="lg" className="justify-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Event
            </Button>
            <Button as={Link} to="/events/manage" variant="outline" size="lg" className="justify-center">
              <CogIcon className="w-5 h-5 mr-2" />
              Manage Events
            </Button>
            <Button as={Link} to="/admin/users" variant="outline" size="lg" className="justify-center">
              <UsersIcon className="w-5 h-5 mr-2" />
              Manage Users
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderOrganizerDashboard = () => (
    <div className="space-y-8">
      {/* Organizer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="p-6 text-center">
            <CalendarIcon className="w-8 h-8 mx-auto text-blue-600 mb-3" />
            <div className="text-2xl font-bold text-blue-900">{stats.upcomingEvents}</div>
            <div className="text-sm text-blue-700">Upcoming Events</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="p-6 text-center">
            <ClockIcon className="w-8 h-8 mx-auto text-yellow-600 mb-3" />
            <div className="text-2xl font-bold text-yellow-900">{stats.liveEvents}</div>
            <div className="text-sm text-yellow-700">Live Events</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="p-6 text-center">
            <CheckCircleIcon className="w-8 h-8 mx-auto text-green-600 mb-3" />
            <div className="text-2xl font-bold text-green-900">{stats.completedEvents}</div>
            <div className="text-sm text-green-700">Completed Events</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="p-6 text-center">
            <UserGroupIcon className="w-8 h-8 mx-auto text-purple-600 mb-3" />
            <div className="text-2xl font-bold text-purple-900">{stats.myRegistrations}</div>
            <div className="text-sm text-purple-700">Total Registrations</div>
          </div>
        </Card>
      </div>

      {/* Organizer Actions */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Organizer Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button as={Link} to="/events/create" variant="primary" size="lg" className="justify-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Event
            </Button>
            <Button as={Link} to="/events/manage" variant="outline" size="lg" className="justify-center">
              <CogIcon className="w-5 h-5 mr-2" />
              Manage Events
            </Button>
            <Button as={Link} to="/registrations" variant="outline" size="lg" className="justify-center">
              <UserGroupIcon className="w-5 h-5 mr-2" />
              View Registrations
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAthleteDashboard = () => (
    <div className="space-y-8">
      {/* Athlete Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="p-6 text-center">
            <CalendarIcon className="w-8 h-8 mx-auto text-blue-600 mb-3" />
            <div className="text-2xl font-bold text-blue-900">{stats.myRegistrations}</div>
            <div className="text-sm text-blue-700">My Registrations</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="p-6 text-center">
            <TrophyIcon className="w-8 h-8 mx-auto text-green-600 mb-3" />
            <div className="text-2xl font-bold text-green-900">{stats.myTickets}</div>
            <div className="text-sm text-green-700">My Tickets</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="p-6 text-center">
            <StarIcon className="w-8 h-8 mx-auto text-purple-600 mb-3" />
            <div className="text-2xl font-bold text-purple-900">{stats.totalResults}</div>
            <div className="text-sm text-purple-700">Results Available</div>
          </div>
        </Card>
      </div>

      {/* Athlete Actions */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button as={Link} to="/events" variant="primary" size="lg" className="justify-center">
              <EyeIcon className="w-5 h-5 mr-2" />
              Browse Events
            </Button>
            <Button as={Link} to="/registrations" variant="outline" size="lg" className="justify-center">
              <UserGroupIcon className="w-5 h-5 mr-2" />
              My Registrations
            </Button>
            <Button as={Link} to="/results" variant="outline" size="lg" className="justify-center">
              <TrophyIcon className="w-5 h-5 mr-2" />
              View Results
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSpectatorDashboard = () => (
    <div className="space-y-8">
      {/* Spectator Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="p-6 text-center">
            <CalendarIcon className="w-8 h-8 mx-auto text-blue-600 mb-3" />
            <div className="text-2xl font-bold text-blue-900">{stats.totalEvents}</div>
            <div className="text-sm text-blue-700">Available Events</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="p-6 text-center">
            <TrophyIcon className="w-8 h-8 mx-auto text-green-600 mb-3" />
            <div className="text-2xl font-bold text-green-900">{stats.totalResults}</div>
            <div className="text-sm text-green-700">Published Results</div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="p-6 text-center">
            <BellIcon className="w-8 h-8 mx-auto text-purple-600 mb-3" />
            <div className="text-2xl font-bold text-purple-900">{stats.liveEvents}</div>
            <div className="text-sm text-purple-700">Live Events</div>
          </div>
        </Card>
      </div>

      {/* Spectator Actions */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Explore & Watch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button as={Link} to="/events" variant="primary" size="lg" className="justify-center">
              <EyeIcon className="w-5 h-5 mr-2" />
              Browse Events
            </Button>
            <Button as={Link} to="/matches" variant="outline" size="lg" className="justify-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              View Matches
            </Button>
            <Button as={Link} to="/results" variant="outline" size="lg" className="justify-center">
              <TrophyIcon className="w-5 h-5 mr-2" />
              View Results
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderRecentData = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Recent Events */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Recent Events</h3>
            <Button as={Link} to="/events" variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{getSportEmoji(event.sport_type)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{event.sport_type}</span>
                      <span>•</span>
                      <span>{formatDate(event.start_date)}</span>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No events available</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* My Registrations (if authenticated) */}
      {user && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">My Registrations</h3>
              <Button as={Link} to="/registrations" variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {myRegistrations.length > 0 ? (
                myRegistrations.map((registration) => (
                  <div key={registration.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">{getSportEmoji(registration.event?.sport_type)}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{registration.event?.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{registration.registration_type}</span>
                        <span>•</span>
                        <span>{formatDate(registration.event?.start_date)}</span>
                      </div>
                    </div>
                    <Badge variant="info">{registration.status}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No registrations yet</p>
                  <Button as={Link} to="/events" variant="primary" size="sm" className="mt-3">
                    Browse Events
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Card className="border-red-200 bg-red-50">
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.first_name || 'User'}!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {user?.role === 'ADMIN' && 'Manage your sports event platform with comprehensive admin tools.'}
            {user?.role === 'ORGANIZER' && 'Organize and manage your events with powerful tools and insights.'}
            {user?.role === 'ATHLETE' && 'Track your registrations, view results, and stay updated with your events.'}
            {(!user || user?.role === 'SPECTATOR') && 'Discover exciting sports events, view live matches, and stay updated with results.'}
          </p>
        </div>

        {/* Role-based Dashboard */}
        {user?.role === 'ADMIN' && renderAdminDashboard()}
        {user?.role === 'ORGANIZER' && renderOrganizerDashboard()}
        {user?.role === 'ATHLETE' && renderAthleteDashboard()}
        {(!user || user?.role === 'SPECTATOR') && renderSpectatorDashboard()}

        {/* Recent Data */}
        <div className="mt-12">
          {renderRecentData()}
        </div>

        {/* Quick Links */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Quick Navigation</h3>
            <p className="text-gray-600 mb-6">
              Access all the features and information you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button as={Link} to="/events" variant="primary" size="lg">
                Browse Events
              </Button>
              <Button as={Link} to="/matches" variant="outline" size="lg">
                View Matches
              </Button>
              <Button as={Link} to="/results" variant="outline" size="lg">
                View Results
              </Button>
              <Button as={Link} to="/news" variant="outline" size="lg">
                Latest News
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}