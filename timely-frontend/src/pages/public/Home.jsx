// src/pages/public/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
  PlayIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';

export default function PublicHome() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Simulate API calls
        setFeaturedEvents([
          {
            id: 1,
            name: "Championship Finals 2024",
            sport: "Basketball",
            startDate: "2024-03-15T18:00:00Z",
            venue: "Madison Square Garden",
            image: "/images/events/championship-2024.jpg",
            description: "The ultimate basketball championship featuring the best teams from around the world.",
            price: 75,
            capacity: 20000,
            registered: 18500,
            status: "upcoming"
          },
          {
            id: 2,
            name: "Summer Olympics Qualifiers",
            sport: "Swimming",
            startDate: "2024-03-20T09:00:00Z",
            venue: "Aquatic Center",
            image: "/images/events/olympics-qualifiers.jpg",
            description: "Qualifying rounds for the upcoming Summer Olympics swimming events.",
            price: 45,
            capacity: 5000,
            registered: 3200,
            status: "upcoming"
          }
        ]);

        setUpcomingEvents([
          {
            id: 3,
            name: "Local Basketball Tournament",
            sport: "Basketball",
            startDate: "2024-03-10T14:00:00Z",
            venue: "Community Center",
            price: 25,
            status: "upcoming"
          },
          {
            id: 4,
            name: "Tennis Championship",
            sport: "Tennis",
            startDate: "2024-03-12T10:00:00Z",
            venue: "Tennis Club",
            price: 35,
            status: "upcoming"
          }
        ]);

        setOngoingEvents([
          {
            id: 5,
            name: "Soccer League Finals",
            sport: "Soccer",
            startDate: "2024-03-08T16:00:00Z",
            venue: "Stadium Complex",
            price: 30,
            status: "ongoing"
          }
        ]);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming':
        return ClockIcon;
      case 'ongoing':
        return PlayIcon;
      case 'completed':
        return CheckCircleIcon;
      default:
        return CalendarDaysIcon;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <Skeleton variant="title" width="300px" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="card" className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Welcome to Timely Sports
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Discover, register, and participate in the best sporting events. 
              From local tournaments to international championships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="white">
                Browse Events
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
                Create Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Events */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Events</h2>
            <Link to="/events" className="text-indigo-600 hover:text-indigo-500 font-medium">
              View all events →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredEvents.map((event) => {
              const StatusIcon = getStatusIcon(event.status);
              return (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                      <TrophyIcon className="h-16 w-16 text-white" />
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {event.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.name}</h3>
                    <p className="text-gray-600 mb-4">{event.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarDaysIcon className="w-4 h-4 mr-2" />
                        {formatDate(event.startDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        {event.venue}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <UserGroupIcon className="w-4 h-4 mr-2" />
                        {event.registered.toLocaleString()} / {event.capacity.toLocaleString()} registered
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-indigo-600">${event.price}</span>
                      <Button>
                        Register Now
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <Link to="/events?status=upcoming" className="text-indigo-600 hover:text-indigo-500 font-medium">
              View all upcoming →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => {
              const StatusIcon = getStatusIcon(event.status);
              return (
                <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {event.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarDaysIcon className="w-4 h-4 mr-2" />
                      {formatDate(event.startDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      {event.venue}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-indigo-600">${event.price}</span>
                    <Button size="sm">
                      Register
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Ongoing Events */}
        {ongoingEvents.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Live Events</h2>
              <Link to="/events?status=ongoing" className="text-indigo-600 hover:text-indigo-500 font-medium">
                View all live →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ongoingEvents.map((event) => {
                const StatusIcon = getStatusIcon(event.status);
                return (
                  <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {event.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarDaysIcon className="w-4 h-4 mr-2" />
                        {formatDate(event.startDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        {event.venue}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-indigo-600">${event.price}</span>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <FireIcon className="w-4 h-4 mr-1" />
                        Watch Live
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="bg-indigo-600 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
            Join thousands of athletes and sports enthusiasts who trust Timely Sports 
            for their event management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="white">
              Create Account
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
              Learn More
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}