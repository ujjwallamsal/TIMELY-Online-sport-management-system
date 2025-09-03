import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  TrophyIcon, 
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  StarIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalVenues: 0,
    pendingApprovals: 0,
    activeEvents: 0,
    completedEvents: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data - replace with actual API calls
    setTimeout(() => {
      setStats({
        totalUsers: 1247,
        totalEvents: 89,
        totalVenues: 23,
        pendingApprovals: 12,
        activeEvents: 15,
        completedEvents: 67
      });
      setRecentUsers([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'ATHLETE', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'ORGANIZER', status: 'active' },
        { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'COACH', status: 'pending' }
      ]);
      setRecentEvents([
        { id: 1, name: 'Summer Soccer League', sport: 'Soccer', status: 'ONGOING', participants: 156 },
        { id: 2, name: 'Basketball Championship', sport: 'Basketball', status: 'UPCOMING', participants: 89 },
        { id: 3, name: 'Swimming Meet', sport: 'Swimming', status: 'COMPLETED', participants: 234 }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-purple-600 rounded-full flex items-center justify-center">
              <CogIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-xl text-gray-600 mt-2">System overview and management</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 text-center">
          <div className="flex justify-center space-x-4">
            <Button as={Link} to="/admin/users" variant="primary" size="xl" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <UserGroupIcon className="w-6 h-6 mr-3" />
              Manage Users
            </Button>
            <Button as={Link} to="/admin/events" variant="primary" size="xl" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg">
              <CalendarIcon className="w-6 h-6 mr-3" />
              Manage Events
            </Button>
            <Button as={Link} to="/admin/reports" variant="primary" size="xl" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
              <ChartBarIcon className="w-6 h-6 mr-3" />
              View Reports
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4">
              <UserGroupIcon className="w-8 h-8" />
            </div>
            <h3 className="text-4xl font-bold mb-2">{stats.totalUsers.toLocaleString()}</h3>
            <p className="text-blue-100">Total Users</p>
          </Card>

          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-4xl font-bold mb-2">{stats.totalEvents}</h3>
            <p className="text-green-100">Total Events</p>
          </Card>

          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4">
              <TrophyIcon className="w-8 h-8" />
            </div>
            <h3 className="text-4xl font-bold mb-2">{stats.totalVenues}</h3>
            <p className="text-purple-100">Total Venues</p>
          </Card>

          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8" />
            </div>
            <h3 className="text-4xl font-bold mb-2">{stats.pendingApprovals}</h3>
            <p className="text-orange-100">Pending Approvals</p>
          </Card>

          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4">
              <FireIcon className="w-8 h-8" />
            </div>
            <h3 className="text-4xl font-bold mb-2">{stats.activeEvents}</h3>
            <p className="text-red-100">Active Events</p>
          </Card>

          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8" />
            </div>
            <h3 className="text-4xl font-bold mb-2">{stats.completedEvents}</h3>
            <p className="text-indigo-100">Completed Events</p>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Users */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Users</h2>
              <Button as={Link} to="/admin/users" variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email} • {user.role}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={user.status === 'active' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {user.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Events */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Events</h2>
              <Button as={Link} to="/admin/events" variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {event.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-500">{event.sport} • {event.participants} participants</p>
                    </div>
                  </div>
                  <Badge 
                    variant={event.status === 'ONGOING' ? 'warning' : event.status === 'UPCOMING' ? 'info' : 'success'}
                    size="sm"
                  >
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Button as={Link} to="/admin/users/create" variant="outline" size="lg" className="justify-center h-20 text-lg hover:shadow-lg transition-all duration-200">
              <PlusIcon className="w-6 h-6 mr-3" />
              Add User
            </Button>
            <Button as={Link} to="/admin/events/create" variant="outline" size="lg" className="justify-center h-20 text-lg hover:shadow-lg transition-all duration-200">
              <PlusIcon className="w-6 h-6 mr-3" />
              Create Event
            </Button>
            <Button as={Link} to="/admin/approvals" variant="outline" size="lg" className="justify-center h-20 text-lg hover:shadow-lg transition-all duration-200">
              <ExclamationTriangleIcon className="w-6 h-6 mr-3" />
              Review Approvals
            </Button>
            <Button as={Link} to="/admin/reports" variant="outline" size="lg" className="justify-center h-20 text-lg hover:shadow-lg transition-all duration-200">
              <ChartBarIcon className="w-6 h-6 mr-3" />
              Generate Reports
            </Button>
          </div>
        </Card>

        {/* System Status */}
        <Card className="mt-8 border-0 shadow-xl bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Database: Online</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">API: Operational</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Storage: Active</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
