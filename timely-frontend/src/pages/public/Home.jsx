import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  UserGroupIcon,
  TrophyIcon,
  FireIcon,
  NewspaperIcon,
  ArrowRightIcon,
  TicketIcon,
  ChartBarIcon,
  CogIcon,
  PhotoIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api.js';
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [myTickets, setMyTickets] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchNews();
    
    // Fetch personalized data for logged-in users
    if (isAuthenticated && user) {
      fetchPersonalizedData();
    } else {
      // Fetch gallery media for logged-out users
      fetchGalleryMedia();
    }
  }, [filter, isAuthenticated, user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // For logged-in users, fetch personalized events; for logged-out, fetch featured events
      const limit = 6;
      const status = 'published';
      
      if (isAuthenticated && user?.role) {
        // Fetch role-specific events
        const { data } = await api.getEvents({ limit, status, role: user.role });
        setEvents(Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []));
      } else {
        // Fetch featured events for logged-out users
        const { data } = await api.getEvents({ limit, status });
        setEvents(Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalizedData = async () => {
    try {
      // Fetch user-specific data based on role
      const role = user.role;
      
      if (role === 'ATHLETE') {
        // Fetch upcoming fixtures and tickets
        const [ticketsResponse, registrationsResponse] = await Promise.allSettled([
          api.getOrders({ mine: 1, limit: 3 }),
          api.getRegistrations({ mine: 1, limit: 3 })
        ]);
        
        if (ticketsResponse.status === 'fulfilled') {
          const tickets = ticketsResponse.value.results || ticketsResponse.value.data || [];
          setMyTickets(tickets.slice(0, 3));
        }
        
        if (registrationsResponse.status === 'fulfilled') {
          const registrations = registrationsResponse.value.results || registrationsResponse.value.data || [];
          setMyRegistrations(registrations.slice(0, 3));
        }
      } else if (role === 'COACH') {
        // Fetch team fixtures and events
        const [fixturesResponse] = await Promise.allSettled([
          api.getFixtures({ mine: 1, limit: 3 })
        ]);
        
        if (fixturesResponse.status === 'fulfilled') {
          const fixtures = fixturesResponse.value.results || fixturesResponse.value.data || [];
          setMyRegistrations(fixtures.slice(0, 3));
        }
      } else if (role === 'ORGANIZER') {
        // Fetch owned events and registrations
        const [eventsResponse, registrationsResponse] = await Promise.allSettled([
          api.getEvents({ mine: 1, limit: 3 }),
          api.getRegistrations({ mine: 1, limit: 3 })
        ]);
        
        if (eventsResponse.status === 'fulfilled') {
          const events = eventsResponse.value.results || eventsResponse.value.data || [];
          setMyEvents(events.slice(0, 3));
        }
        
        if (registrationsResponse.status === 'fulfilled') {
          const registrations = registrationsResponse.value.results || registrationsResponse.value.data || [];
          setMyRegistrations(registrations.slice(0, 3));
        }
      } else if (role === 'ADMIN') {
        // Fetch system statistics
        try {
          const [eventsResponse, usersResponse] = await Promise.allSettled([
            api.getEvents({ limit: 1 }),
            api.getUsers({ limit: 1 })
          ]);
          
          const stats = {};
          if (eventsResponse.status === 'fulfilled') {
            stats.totalEvents = eventsResponse.value.count || 0;
          }
          if (usersResponse.status === 'fulfilled') {
            stats.totalUsers = usersResponse.value.count || 0;
          }
          setSystemStats(stats);
        } catch (error) {
          console.error('Error fetching admin stats:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching personalized data:', error);
    }
  };

  const fetchGalleryMedia = async () => {
    try {
      setGalleryLoading(true);
      const response = await api.getMedia({ limit: 6 });
      const items = response.results || response.data || [];
      setGalleryMedia(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching gallery media:', error);
      setGalleryMedia([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      const response = await api.getNews({ page: 1, limit: 3 });
      const items = response.results || response.data || [];
      setNews(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'ongoing':
        return 'Live Now';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEyMCA4MEwxNDAgMTAwTDEyMCAxMjBMMTAwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4MCIgeT0iODAiPgo8cGF0aCBkPSJNMjAgMjBMMzAgMTBMMzAgMzBMMjAgMjBaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo8L3N2Zz4K';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Optional Realtime Announcements Banner */}
      <RealtimeAnnouncements 
        showInDashboard={false} 
        maxAnnouncements={1} 
        autoHide={true}
        className="max-w-6xl mx-auto px-4 pt-4"
      />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {isAuthenticated ? (
            // Logged-in Hero
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Welcome back, {user?.first_name || user?.username || 'User'}!
              </h1>
              <p className="mt-6 text-xl leading-8 text-blue-100">
                {user?.role === 'ATHLETE' && "Ready for your next competition? Check your upcoming fixtures and tickets."}
                {user?.role === 'COACH' && "Manage your team and track upcoming fixtures and results."}
                {user?.role === 'ORGANIZER' && "Organize and manage your events, registrations, and announcements."}
                {user?.role === 'ADMIN' && "Monitor system activity and manage the platform."}
                {user?.role === 'SPECTATOR' && "Discover exciting sports events and get involved in the community."}
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to={user?.role === 'ADMIN' ? '/admin' : user?.role === 'ORGANIZER' ? '/organizer' : user?.role === 'COACH' ? '/coach' : user?.role === 'ATHLETE' ? '/athlete' : '/events'}
                  className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {user?.role === 'ADMIN' ? 'Admin Dashboard' : user?.role === 'ORGANIZER' ? 'Organizer Dashboard' : user?.role === 'COACH' ? 'Coach Dashboard' : user?.role === 'ATHLETE' ? 'Athlete Dashboard' : 'Browse Events'}
                </Link>
                <Link
                  to="/events"
                  className="text-sm font-semibold leading-6 text-white hover:text-blue-100"
                >
                  Browse All Events <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ) : (
            // Logged-out Hero
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Welcome to Timely
              </h1>
              <p className="mt-6 text-xl leading-8 text-blue-100">
                Discover and participate in exciting sports events happening around you.
                From local tournaments to major competitions, find your next challenge.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/events"
                  className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Browse Events
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold leading-6 text-white hover:text-blue-100"
                >
                  Create Account <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            {isAuthenticated ? 'For You' : 'Featured Events'}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {isAuthenticated 
              ? 'Your personalized sports experience and upcoming activities'
              : 'Discover exciting sports events happening near you'
            }
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'upcoming', label: 'Upcoming', icon: CalendarIcon },
              { key: 'ongoing', label: 'Live Now', icon: FireIcon },
              { key: 'completed', label: 'Completed', icon: TrophyIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {event.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formatDate(event.start_datetime)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {formatTime(event.start_datetime)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {event.venue_name || 'TBA'}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      {event.sport_name || 'Sport'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {event.fee_cents ? `$${(event.fee_cents / 100).toFixed(2)}` : 'Free'}
                    </div>
                    <Link
                      to={`/events/${event.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CalendarIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">
              {filter === 'upcoming' 
                ? 'No upcoming events at the moment. Check back later!'
                : `No ${filter} events found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Role-specific sections for logged-in users */}
      {isAuthenticated && user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {user.role === 'ATHLETE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* My Tickets */}
              {myTickets.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <TicketIcon className="h-5 w-5 mr-2 text-blue-600" />
                      My Tickets
                    </h3>
                    <Link to="/my-tickets" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {myTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ticket.event_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(ticket.purchased_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ticket.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My Registrations */}
              {myRegistrations.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                      My Registrations
                    </h3>
                    <Link to="/athlete" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {myRegistrations.map((registration) => (
                      <div key={registration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{registration.event_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(registration.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                          registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {registration.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user.role === 'COACH' && myRegistrations.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-orange-600" />
                  Upcoming Fixtures
                </h3>
                <Link to="/coach" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {myRegistrations.map((fixture) => (
                  <div key={fixture.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fixture.event_name || 'Team Fixture'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(fixture.start_datetime || fixture.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      fixture.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' : 
                      fixture.status === 'LIVE' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {fixture.status || 'UPCOMING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.role === 'ORGANIZER' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* My Events */}
              {myEvents.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <TrophyIcon className="h-5 w-5 mr-2 text-purple-600" />
                      My Events
                    </h3>
                    <Link to="/organizer/events" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {myEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.start_datetime).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.status === 'published' ? 'bg-green-100 text-green-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Registrations */}
              {myRegistrations.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <UserGroupIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Recent Registrations
                    </h3>
                    <Link to="/organizer/registrations" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {myRegistrations.map((registration) => (
                      <div key={registration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{registration.event_name}</p>
                          <p className="text-xs text-gray-500">
                            {registration.user_name || 'Anonymous'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                          registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {registration.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user.role === 'ADMIN' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2 text-slate-600" />
                  System Overview
                </h3>
                <Link to="/admin" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Admin Dashboard
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalEvents || 0}</p>
                  <p className="text-sm text-gray-600">Total Events</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers || 0}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  <p className="text-sm text-gray-600">Active Events</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Latest News Section */}
      {news.length > 0 && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Latest News
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Stay updated with the latest sports news and announcements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {news.map((article) => (
                <article key={article.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <NewspaperIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-500">
                      {new Date(article.published_at || article.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt || article.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      By {article.author?.name || article.author?.username || 'Staff'}
                    </div>
                    <Link
                      to="/news"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Read more
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/news"
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View All News
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Strip - Only for logged-out users */}
      {!isAuthenticated && galleryMedia.length > 0 && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Latest Photos
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                See the action from recent sports events and competitions
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {galleryMedia.slice(0, 6).map((media) => (
                <div key={media.id} className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {media.image ? (
                    <img
                      src={media.image}
                      alt={media.caption || 'Gallery photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={handleImageError}
                    />
                  ) : media.video_url ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <VideoCameraIcon className="h-8 w-8 text-gray-500" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <PhotoIcon className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/media"
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View All Media
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {isAuthenticated ? (
              <>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Stay Connected
                </h2>
                <p className="mt-4 text-lg text-gray-300">
                  Keep up with the latest announcements and updates from your sports community.
                </p>
                <div className="mt-8 flex items-center justify-center gap-x-6">
                  <Link
                    to="/events"
                    className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Browse All Events
                  </Link>
                  <Link
                    to="/news"
                    className="text-sm font-semibold leading-6 text-white hover:text-gray-300"
                  >
                    Latest News <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Ready to get started?
                </h2>
                <p className="mt-4 text-lg text-gray-300">
                  Join thousands of athletes and sports enthusiasts in our community.
                </p>
                <div className="mt-8 flex items-center justify-center gap-x-6">
                  <Link
                    to="/register"
                    className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Create Account
                  </Link>
                  <Link
                    to="/events"
                    className="text-sm font-semibold leading-6 text-white hover:text-gray-300"
                  >
                    Browse Events <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;