import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../components/NotificationSystem";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalVenues: 0,
    totalMatches: 0,
    activeRegistrations: 0,
    pendingApprovals: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      // In real app, fetch admin data from API
      // For demo, simulate data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 156,
        totalEvents: 24,
        totalVenues: 8,
        totalMatches: 89,
        activeRegistrations: 342,
        pendingApprovals: 12
      });
      
      setRecentActivity([
        { id: 1, type: 'user_registration', message: 'New user registered: john.doe@email.com', timestamp: new Date(), severity: 'info' },
        { id: 2, type: 'event_created', message: 'New event created: Summer Football League', timestamp: new Date(Date.now() - 3600000), severity: 'success' },
        { id: 3, type: 'payment_failed', message: 'Payment failed for registration #1234', timestamp: new Date(Date.now() - 7200000), severity: 'warning' },
        { id: 4, type: 'venue_conflict', message: 'Venue conflict detected for Central Stadium', timestamp: new Date(Date.now() - 10800000), severity: 'error' }
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      addNotification({
        type: 'error',
        title: 'Data Load Failed',
        message: 'Could not load administrative data'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'success': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration': return '👤';
      case 'event_created': return '🎯';
      case 'payment_failed': return '💳';
      case 'venue_conflict': return '🏟️';
      default: return '📢';
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="page-wrap">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600">You need administrator privileges to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <p className="mt-4">Loading administrative data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      {/* Welcome Header */}
      <div className="hero mb-8">
        <div className="hero-content">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">⚙️</div>
            <div>
              <h1 className="text-white">Admin Dashboard</h1>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                ADMINISTRATOR
              </span>
            </div>
          </div>
          <p className="text-white/90">
            Monitor system health, manage users, and oversee all operations
          </p>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
            <div className="text-gray-600">Total Users</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalEvents}</div>
            <div className="text-gray-600">Active Events</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">⚙️</div>
            <div className="text-2xl font-bold text-gray-800">Admin</div>
            <div className="text-gray-600">Quick Actions</div>
            <div className="mt-3 space-y-2">
              <Link to="/admin/users" className="btn btn-primary btn-sm w-full">Manage Users</Link>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">🏟️</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalVenues}</div>
            <div className="text-gray-600">Venues</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">⚽</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalMatches}</div>
            <div className="text-gray-600">Scheduled Matches</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-2xl font-bold text-gray-800">{stats.activeRegistrations}</div>
            <div className="text-gray-600">Active Registrations</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold text-gray-800">{stats.pendingApprovals}</div>
            <div className="text-gray-600">Pending Approvals</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <button className="btn btn-primary w-full">
                👥 Manage Users
              </button>
              <button className="btn btn-secondary w-full">
                🎯 Approve Events
              </button>
              <button className="btn btn-secondary w-full">
                🏟️ Manage Venues
              </button>
              <button className="btn btn-secondary w-full">
                📊 View Reports
              </button>
              <button className="btn btn-secondary w-full">
                ⚙️ System Settings
              </button>
              <button className="btn btn-secondary w-full">
                🔒 Security Logs
              </button>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <div className="card-header">
            <h3>System Health</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-medium text-green-800">Database</div>
                    <div className="text-sm text-green-600">All systems operational</div>
                  </div>
                </div>
                <span className="text-green-600 font-medium">100%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-medium text-green-800">API Services</div>
                    <div className="text-sm text-green-600">Response time: 45ms</div>
                  </div>
                </div>
                <span className="text-green-600 font-medium">100%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <div className="font-medium text-yellow-800">Storage</div>
                    <div className="text-sm text-yellow-600">75% capacity used</div>
                  </div>
                </div>
                <span className="text-yellow-600 font-medium">75%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-medium text-green-800">Backup System</div>
                    <div className="text-sm text-green-600">Last backup: 2 hours ago</div>
                  </div>
                </div>
                <span className="text-green-600 font-medium">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card mb-8">
        <div className="card-header">
          <h3>Recent System Activity</h3>
          <button className="btn btn-secondary btn-sm">
            View All Logs
          </button>
        </div>
        <div className="card-body">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-600">No recent activity to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                    <div>
                      <p className="font-medium text-gray-800">{activity.message}</p>
                      <p className="text-sm text-gray-500">
                        {activity.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                    {activity.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth */}
        <div className="card">
          <div className="card-header">
            <h3>User Growth (Last 30 Days)</h3>
          </div>
          <div className="card-body">
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📈</div>
              <div className="text-2xl font-bold text-green-600 mb-2">+23%</div>
              <p className="text-gray-600">New user registrations</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Week 1: +8 users</p>
                <p>Week 2: +12 users</p>
                <p>Week 3: +15 users</p>
                <p>Week 4: +18 users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Event Statistics */}
        <div className="card">
          <div className="card-header">
            <h3>Event Statistics</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Football Events</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Basketball Events</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Swimming Events</span>
                <span className="font-medium">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Other Sports</span>
                <span className="font-medium">6</span>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Events</span>
                  <span className="text-blue-600">30</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
