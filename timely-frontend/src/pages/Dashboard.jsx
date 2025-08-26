import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents, getMatches, getMyRegistrations } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  async function loadDashboard() {
    try {
      setLoading(true);
      
      // Load data
      const [eventsData, matchesData] = await Promise.all([
        getEvents(1, "", "", ""),
        getMatches(1)
      ]);

      setEvents(eventsData.results || []);
      setMatches(matchesData.results || []);

      // Calculate stats based on role
      const allEvents = eventsData.results || [];
      const allMatches = matchesData.results || [];
      
      setStats({
        totalEvents: allEvents.length,
        upcomingEvents: allEvents.filter(e => e.status === 'UPCOMING').length,
        ongoingEvents: allEvents.filter(e => e.status === 'ONGOING').length,
        totalMatches: allMatches.length,
        scheduledMatches: allMatches.filter(m => m.status === 'SCHEDULED').length,
        liveMatches: allMatches.filter(m => m.status === 'LIVE').length
      });

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  function getRoleColor(role) {
    switch (role) {
      case 'ORGANIZER': return 'bg-purple-100 text-purple-800';
      case 'ATHLETE': return 'bg-green-100 text-green-800';
      case 'SPECTATOR': return 'bg-blue-100 text-blue-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getRoleIcon(role) {
    switch (role) {
      case 'ORGANIZER': return '🎯';
      case 'ATHLETE': return '🏃';
      case 'SPECTATOR': return '👀';
      case 'ADMIN': return '⚙️';
      default: return '👤';
    }
  }

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <p className="mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-wrap">
        <div className="card">
          <div className="card-body text-center">
            <h2 className="mb-4">Please Login</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to view your dashboard.</p>
            <Link to="/login" className="btn btn-primary">Login Now</Link>
          </div>
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
            <div className="text-6xl">{getRoleIcon(user.role)}</div>
            <div>
              <h1 className="text-white">Welcome back, {user.first_name}!</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
          <p className="text-white/90">
            {user.role === 'ORGANIZER' && "Manage your events and track registrations"}
            {user.role === 'ATHLETE' && "View your upcoming matches and track performance"}
            {user.role === 'SPECTATOR' && "Browse events and purchase tickets"}
            {user.role === 'ADMIN' && "Monitor system health and manage users"}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalEvents || 0}</div>
            <div className="text-gray-600">Total Events</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-2xl font-bold text-gray-800">{stats.upcomingEvents || 0}</div>
            <div className="text-gray-600">Upcoming</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-gray-800">{stats.ongoingEvents || 0}</div>
            <div className="text-gray-600">Live Now</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalMatches || 0}</div>
            <div className="text-gray-600">Matches</div>
          </div>
        </div>
      </div>

      {/* Role-specific Content */}
      {user.role === 'ORGANIZER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* My Events */}
          <div className="card">
            <div className="card-header">
              <h3>My Events</h3>
              <Link to="/create-event" className="btn btn-primary btn-sm">+ Create Event</Link>
            </div>
            <div className="card-body">
              {events.filter(e => e.created_by === user.id).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-gray-600 mb-4">You haven't created any events yet.</p>
                  <Link to="/create-event" className="btn btn-primary">Create Your First Event</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.filter(e => e.created_by === user.id).slice(0, 3).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{event.name}</h4>
                        <p className="text-sm text-gray-600">{event.sport_type} • {event.status}</p>
                      </div>
                      <Link to={`/events/${event.id}`} className="btn btn-secondary btn-sm">View</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <Link to="/create-event" className="btn btn-primary w-full">🎯 Create New Event</Link>
                <Link to="/events" className="btn btn-secondary w-full">📋 View All Events</Link>
                <button className="btn btn-secondary w-full">📊 View Reports</button>
                <button className="btn btn-secondary w-full">👥 Manage Registrations</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {user.role === 'ATHLETE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* My Registrations */}
          <div className="card">
            <div className="card-header">
              <h3>My Event Registrations</h3>
            </div>
            <div className="card-body">
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🏃</div>
                <p className="text-gray-600 mb-4">You haven't registered for any events yet.</p>
                <Link to="/events" className="btn btn-primary">Browse Events</Link>
              </div>
            </div>
          </div>

          {/* Upcoming Matches */}
          <div className="card">
            <div className="card-header">
              <h3>Upcoming Matches</h3>
            </div>
            <div className="card-body">
              <div className="text-center py-8">
                <div className="text-4xl mb-2">⚽</div>
                <p className="text-gray-600">No upcoming matches scheduled.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {user.role === 'SPECTATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Favorite Events */}
          <div className="card">
            <div className="card-header">
              <h3>Favorite Events</h3>
            </div>
            <div className="card-body">
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👀</div>
                <p className="text-gray-600 mb-4">Start following events to see them here.</p>
                <Link to="/events" className="btn btn-primary">Discover Events</Link>
              </div>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="card">
            <div className="card-header">
              <h3>My Tickets</h3>
            </div>
            <div className="card-body">
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎫</div>
                <p className="text-gray-600">No tickets purchased yet.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {user.role === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* System Overview Card */}
          <div className="card">
            <div className="card-header">
              <h3>System Overview</h3>
              <Link to="/admin" className="btn btn-primary btn-sm">Admin Panel</Link>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Users:</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Events:</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Venues:</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Approvals:</span>
                  <span className="font-medium text-orange-600">12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions Card */}
          <div className="card">
            <div className="card-header">
              <h3>Admin Actions</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <Link to="/admin" className="btn btn-primary w-full">⚙️ Admin Dashboard</Link>
                <button className="btn btn-secondary w-full">👥 Manage Users</button>
                <button className="btn btn-secondary w-full">🎯 Approve Events</button>
                <button className="btn btn-secondary w-full">🏟️ Manage Venues</button>
                <button className="btn btn-secondary w-full">📊 View Reports</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-gray-600">No recent activity to display.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
