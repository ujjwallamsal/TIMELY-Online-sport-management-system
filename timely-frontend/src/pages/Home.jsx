// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDaysIcon,
  TrophyIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowRightIcon,
  PlayIcon,
  StarIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import EventCard from '../components/EventCard';
import EmptyState from '../components/ui/EmptyState';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API calls for featured and upcoming events
    const fetchEvents = async () => {
      try {
        // In a real app, these would be API calls
        setFeaturedEvents([
          {
            id: 1,
            title: "Championship Finals 2024",
            date: "2024-03-15",
            time: "14:00",
            location: "Madison Square Garden",
            sport: "Basketball",
            status: "upcoming",
            featured: true,
            image: "/api/placeholder/400/300"
          },
          {
            id: 2,
            title: "Summer Olympics Qualifiers",
            date: "2024-03-20",
            time: "10:00",
            location: "Olympic Stadium",
            sport: "Track & Field",
            status: "upcoming",
            featured: true,
            image: "/api/placeholder/400/300"
          }
        ]);
        
        setUpcomingEvents([
          {
            id: 3,
            title: "Local Basketball Tournament",
            date: "2024-03-10",
            time: "18:00",
            location: "Community Center",
            sport: "Basketball",
            status: "upcoming"
          },
          {
            id: 4,
            title: "Swimming Championships",
            date: "2024-03-12",
            time: "09:00",
            location: "Aquatic Center",
            sport: "Swimming",
            status: "upcoming"
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

  const features = [
    {
      icon: CalendarDaysIcon,
      title: "Event Management",
      description: "Create, manage, and track sporting events with ease"
    },
    {
      icon: TrophyIcon,
      title: "Live Results",
      description: "Real-time scoring and leaderboards for all events"
    },
    {
      icon: UserGroupIcon,
      title: "Team Registration",
      description: "Easy team registration and roster management"
    },
    {
      icon: ClockIcon,
      title: "Scheduling",
      description: "Automated fixture generation and scheduling"
    }
  ];

  const stats = [
    { label: "Active Events", value: "24", icon: CalendarDaysIcon },
    { label: "Registered Teams", value: "156", icon: UserGroupIcon },
    { label: "Total Participants", value: "2,847", icon: TrophyIcon },
    { label: "Events Completed", value: "89", icon: CheckCircleIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Timely Sports
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              The ultimate platform for managing sporting events, tracking results, 
              and connecting athletes, coaches, and fans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                      Go to Dashboard
                      <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/events">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                      Browse Events
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg" className="bg-yellow-400 text-gray-900 hover:bg-yellow-500">
                      Get Started Free
                      <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Events
            </h2>
            <p className="text-lg text-gray-600">
              Don't miss these exciting upcoming sporting events
            </p>
          </div>
          
          {featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} featured />
              ))}
            </div>
          ) : (
            <EmptyEvents />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Timely Sports?
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to manage and participate in sporting events
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Upcoming Events
              </h2>
              <p className="text-lg text-gray-600">
                Join the excitement and register for upcoming events
              </p>
            </div>
            <Link to="/events">
              <Button variant="outline">
                View All Events
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyEvents />
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of athletes, coaches, and sports enthusiasts on the platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Create Free Account
                  <SparklesIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/events">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Explore Events
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Timely Sports</span>
              </div>
              <p className="text-gray-400">
                The ultimate platform for sporting events and competitions.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Events</h3>
              <ul className="space-y-2">
                <li><Link to="/events" className="text-gray-400 hover:text-white">Browse Events</Link></li>
                <li><Link to="/schedule" className="text-gray-400 hover:text-white">Schedule</Link></li>
                <li><Link to="/results" className="text-gray-400 hover:text-white">Results</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Community</h3>
              <ul className="space-y-2">
                <li><Link to="/news" className="text-gray-400 hover:text-white">News</Link></li>
                <li><Link to="/gallery" className="text-gray-400 hover:text-white">Gallery</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Timely Sports. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
