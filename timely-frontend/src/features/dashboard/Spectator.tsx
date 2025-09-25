import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  Eye, 
  Clock,
  AlertCircle,
  BarChart3,
  Star
} from 'lucide-react';
import { 
  useEvents
} from '../../api/queries';
// import { useAuth } from '../../auth/useAuth';

const SpectatorDashboard: React.FC = () => {
  // const { user } = useAuth();
  
  // Fetch data for spectator's events and tickets
  const { data: eventsData, isLoading: eventsLoading } = useEvents({
    page_size: 10,
  });

  const events = eventsData?.results || [];

  // Calculate metrics
  const totalEvents = eventsData?.count || 0;
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.start_datetime);
    const now = new Date();
    return eventDate > now && event.status === 'PUBLISHED';
  }).length;

  const liveEvents = events.filter(event => {
    const eventDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);
    const now = new Date();
    return now >= eventDate && now <= endDate && event.status === 'PUBLISHED';
  }).length;

  // Quick actions for spectator
  const quickActions = [
    {
      title: 'Browse Events',
      description: 'Discover upcoming sports events',
      icon: Calendar,
      href: '/events',
      color: 'bg-blue-500',
    },
    {
      title: 'Buy Tickets',
      description: 'Purchase tickets for events',
      icon: Ticket,
      href: '/tickets',
      color: 'bg-green-500',
    },
    {
      title: 'My Tickets',
      description: 'View your purchased tickets',
      icon: Eye,
      href: '/tickets/my',
      color: 'bg-purple-500',
    },
    {
      title: 'View Results',
      description: 'Check match results and standings',
      icon: BarChart3,
      href: '/results',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Spectator Dashboard</h1>
          <p className="text-gray-600 mt-2">Discover and enjoy sports events</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Events */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                {eventsLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                {eventsLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{upcomingEvents}</p>
                )}
              </div>
            </div>
          </div>

          {/* Live Events */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Live Now</p>
                {eventsLoading ? (
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{liveEvents}</p>
                )}
              </div>
            </div>
          </div>

          {/* My Tickets */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Tickets</p>
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

          {/* Featured Events */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Events</h3>
              {eventsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-4">
                  {events.slice(0, 3).map((event) => {
                    const eventDate = new Date(event.start_datetime);
                    const now = new Date();
                    const isUpcoming = eventDate > now;
                    const isLive = now >= eventDate && now <= new Date(event.end_datetime);
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-primary-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{event.name}</h4>
                            <p className="text-sm text-gray-500">
                              {eventDate.toLocaleDateString()} • {event.sport_name || `Sport ${event.sport}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {event.venue_name || event.location || 'Venue TBD'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`status-badge ${
                            isLive ? 'bg-red-100 text-red-800' :
                            isUpcoming ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {isLive ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'PAST'}
                          </span>
                          <Link
                            to={`/events/${event.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events available</h3>
                  <p className="text-gray-500 mb-4">Check back later for upcoming sports events</p>
                  <Link
                    to="/events"
                    className="btn btn-primary inline-flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Browse Events
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Events Alert */}
        {liveEvents > 0 && (
          <div className="mt-8">
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Live Events Happening Now!
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    There are {liveEvents} event{liveEvents > 1 ? 's' : ''} currently in progress. 
                    <Link to="/events" className="font-medium underline ml-1">
                      Watch live →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popular Sports */}
        <div className="mt-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Sports</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Football', 'Basketball', 'Tennis', 'Swimming'].map((sport) => (
                <div key={sport} className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Star className="h-6 w-6 text-primary-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{sport}</p>
                  <p className="text-xs text-gray-500">Events available</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpectatorDashboard;
