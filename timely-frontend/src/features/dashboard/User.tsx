import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, Ticket } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useRegistrations, usePublicEvents } from '../../api/queries';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: registrations } = useRegistrations({ page_size: 5 });
  const { data: upcomingEvents } = usePublicEvents({ page_size: 3, status: 'upcoming' });

  const stats = [
    {
      name: 'My Registrations',
      value: registrations?.count || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/registrations',
    },
    {
      name: 'Upcoming Events',
      value: upcomingEvents?.length || 0,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/events',
    },
    {
      name: 'My Tickets',
      value: 0, // TODO: Implement tickets
      icon: Ticket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/tickets/my-tickets',
    },
    {
      name: 'Results',
      value: 0, // TODO: Implement results
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      href: '/results',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your sports activities.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              to={stat.href}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Registrations */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Registrations</h2>
              <Link
                to="/registrations"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
            
            {registrations && registrations.results.length > 0 ? (
              <div className="space-y-4">
                {registrations.results.map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{registration.event_title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(registration.registration_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`status-badge ${
                      registration.status === 'APPROVED' ? 'status-approved' :
                      registration.status === 'PENDING' ? 'status-pending' :
                      'status-rejected'
                    }`}>
                      {registration.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No registrations yet</p>
                <Link to="/events" className="btn btn-primary">
                  Browse Events
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
              <Link
                to="/events"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
            
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                    <Link
                      to={`/events/${event.id}`}
                      className="block hover:text-primary-600"
                    >
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(event.start_datetime).toLocaleDateString()} • {event.venue_name || 'TBD'}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No upcoming events</p>
                <Link to="/events" className="btn btn-primary">
                  Browse Events
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/events"
              className="card hover:shadow-lg transition-shadow text-center"
            >
              <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Browse Events</h3>
              <p className="text-sm text-gray-500">Find events to participate in</p>
            </Link>
            
            <Link
              to="/registrations/create"
              className="card hover:shadow-lg transition-shadow text-center"
            >
              <Users className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Register for Event</h3>
              <p className="text-sm text-gray-500">Sign up for a new event</p>
            </Link>
            
            <Link
              to="/results"
              className="card hover:shadow-lg transition-shadow text-center"
            >
              <Trophy className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">View Results</h3>
              <p className="text-sm text-gray-500">Check competition results</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
