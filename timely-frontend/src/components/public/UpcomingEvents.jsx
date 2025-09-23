import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  ArrowRightIcon,
  TrophyIcon,
  UserGroupIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/api.js';
import useSocket from '../../hooks/useSocket';
import Skeleton, { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // WebSocket connection for real-time updates
  const { connectionStatus } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/content/public/`,
    {
      onMessage: (message) => {
        if (message.type === 'event_update' && message.data.lifecycle_status === 'published') {
          // Refresh events when new event is published
          fetchEvents();
        }
      }
    }
  );

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await publicAPI.getEvents({
        page_size: 6,
        status: 'upcoming',
        ordering: 'start_datetime'
      });
      setEvents(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load upcoming events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSportColor = (sport) => {
    const colors = {
      'Basketball': 'from-orange-500 to-red-500',
      'Football': 'from-green-500 to-emerald-500',
      'Soccer': 'from-blue-500 to-cyan-500',
      'Tennis': 'from-purple-500 to-pink-500',
      'Volleyball': 'from-yellow-500 to-orange-500',
      'Baseball': 'from-indigo-500 to-blue-500'
    };
    return colors[sport] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} className="h-80" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <EmptyState
              icon={CalendarIcon}
              title="Unable to load events"
              description={error}
              action={
                <button
                  onClick={fetchEvents}
                  className="btn btn-primary"
                  aria-label="Try again"
                >
                  Try again
                </button>
              }
            />
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <EmptyState
              icon={CalendarIcon}
              title="No upcoming events"
              description="Check back soon for new events and competitions."
              action={
                <button
                  onClick={() => window.location.href = '/events'}
                  className="btn btn-primary"
                  aria-label="View all events"
                >
                  View all events
                </button>
              }
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-20"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-600 mb-6">
            <SparklesIcon className="w-4 h-4 text-blue-500" />
            Upcoming Events
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            Don't Miss Out on
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Exciting Events
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover upcoming sports events, competitions, and tournaments happening near you. 
            Register now and be part of the action!
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Event Image/Header */}
              <div className={`h-48 bg-gradient-to-br ${getSportColor(event.sport)} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-4 left-4">
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                    {event.sport}
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                    {event.phase}
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">
                    {event.name}
                  </h3>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Date & Time */}
                  <div className="flex items-center gap-3 text-gray-600">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">{formatDate(event.start_datetime)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <ClockIcon className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">{formatTime(event.start_datetime)}</span>
                  </div>

                  {/* Location */}
                  {event.venue && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPinIcon className="w-5 h-5 text-red-500" />
                      <span className="font-semibold">{event.venue.name}</span>
                    </div>
                  )}

                  {/* Participants */}
                  <div className="flex items-center gap-3 text-gray-600">
                    <UserGroupIcon className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold">
                      {event.registered_participants || 0} participants
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <Link
                    to={`/events/${event.id}`}
                    className="group/btn w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <EyeIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    View Details
                    <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
            </div>
          ))}
        </div>

        {/* View All Events CTA */}
        <div className="text-center">
          <Link
            to="/events"
            className="group inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <TrophyIcon className="w-6 h-6 text-blue-500" />
            <span>View All Events</span>
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;