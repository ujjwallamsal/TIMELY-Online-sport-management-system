import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, Camera, Newspaper, ArrowRight, MapPin, Clock, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { api } from '../../api/client';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [publicEvents, setPublicEvents] = React.useState<any[]>([]);
  const [liveEvents, setLiveEvents] = React.useState<Set<number>>(new Set());
  const [eventsLoading, setEventsLoading] = React.useState(true);
  const [news, setNews] = React.useState<any[]>([]);
  const [newsLoading, setNewsLoading] = React.useState(true);
  const [galleryMedia, setGalleryMedia] = React.useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = React.useState(true);

  // Fetch public events
  React.useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        const response = await api.get(ENDPOINTS.publicEvents, {
          params: { ordering: 'start_date', limit: 6 }
        });
        setPublicEvents(response.data.results || []);
      } catch (error) {
        console.error('Failed to fetch public events:', error);
        setPublicEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchPublicEvents();
  }, []);

  // Check for live events
  React.useEffect(() => {
    const checkLiveEvents = async () => {
      const liveSet = new Set<number>();
      
      for (const event of publicEvents) {
        try {
          const response = await api.get(ENDPOINTS.publicEventFixtures(event.id));
          const fixtures = response.data.results || [];
          const hasLiveFixture = fixtures.some((fixture: any) => 
            fixture.status === 'IN_PROGRESS' || fixture.status === 'LIVE'
          );
          if (hasLiveFixture) {
            liveSet.add(event.id);
          }
        } catch (error) {
          // Ignore errors for individual event checks
        }
      }
      
      setLiveEvents(liveSet);
    };

    if (publicEvents.length > 0) {
      checkLiveEvents();
    }
  }, [publicEvents]);

  // Fetch news
  React.useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get(ENDPOINTS.news, {
          params: { ordering: '-published_at', limit: 3 }
        });
        setNews(response.data.results || []);
      } catch (error) {
        console.error('Failed to fetch news:', error);
        setNews([]);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Fetch gallery media
  React.useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await api.get(ENDPOINTS.galleryMedia, {
          params: { limit: 8 }
        });
        setGalleryMedia(response.data.results || []);
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
        setGalleryMedia([]);
      } finally {
        setGalleryLoading(false);
      }
    };

    fetchGallery();
  }, []);

  // Compute event status
  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.start_date || event.start_datetime);
    const endDate = new Date(event.end_date || event.end_datetime);
    
    if (event.status === 'COMPLETED' || endDate < now) {
      return 'ENDED';
    }
    
    if (liveEvents.has(event.id)) {
      return 'LIVE';
    }
    
    if (startDate > now) {
      return 'UPCOMING';
    }
    
    return 'ONGOING';
  };

  const features = [
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Create, manage, and track sports events with ease',
    },
    {
      icon: Trophy,
      title: 'Results & Leaderboards',
      description: 'Real-time results and competitive leaderboards',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Organize teams and manage registrations',
    },
    {
      icon: Camera,
      title: 'Media Gallery',
      description: 'Share photos and videos from events',
    },
    {
      icon: Newspaper,
      title: 'News & Updates',
      description: 'Stay updated with the latest sports news',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {isAuthenticated ? `Welcome back, ${user?.first_name || 'User'}!` : 'Welcome to Timely'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              {isAuthenticated 
                ? 'Manage your sports events, track results, and stay connected with the community.'
                : 'The comprehensive sports events management platform that brings athletes, organizers, and spectators together for unforgettable sporting experiences.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/events"
                className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Browse Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">Events Hosted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">10K+</div>
              <div className="text-gray-600">Athletes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-gray-600">Sports</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">25+</div>
              <div className="text-gray-600">Venues</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Sports Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides all the tools and features needed to manage 
              sports events from start to finish.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6" />
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

      {/* Featured Events Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Events
            </h2>
            <p className="text-xl text-gray-600">
              Discover exciting sports events happening around you
            </p>
          </div>

          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton-card h-48 mb-4"></div>
                  <div className="skeleton-text-lg mb-2"></div>
                  <div className="skeleton-text mb-4"></div>
                  <div className="flex justify-between">
                    <div className="skeleton-text w-24"></div>
                    <div className="skeleton-text w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : publicEvents && publicEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publicEvents.map((event) => {
                const eventStatus = getEventStatus(event);
                const eventDate = new Date(event.start_date || event.start_datetime);
                const fee = event.fee_cents ? (event.fee_cents / 100).toFixed(2) : null;
                
                return (
                  <div key={event.id} className="card hover:shadow-lg transition-shadow group">
                    <div className="relative">
                      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-primary-600" />
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          eventStatus === 'LIVE' ? 'bg-red-500 text-white animate-pulse' :
                          eventStatus === 'UPCOMING' ? 'bg-blue-500 text-white' :
                          eventStatus === 'ENDED' ? 'bg-gray-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {eventStatus}
                        </span>
                      </div>
                      {fee && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          ${fee}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {event.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {event.description || 'No description available'}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          {eventDate.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {(event.venue_name || event.location) && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-2" />
                            {event.venue_name || event.location}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {eventStatus === 'LIVE' && (
                            <Play className="h-4 w-4 text-red-500" />
                          )}
                          {eventStatus === 'ENDED' && (
                            <CheckCircle className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-600">
                            {eventStatus}
                          </span>
                        </div>
                        <Link
                          to={`/events/${event.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No events available at the moment.</p>
              <p className="text-gray-400 text-sm mt-2">Check back later for upcoming sports events.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/events"
              className="btn btn-primary inline-flex items-center"
            >
              Browse All Events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest News
            </h2>
            <p className="text-xl text-gray-600">
              Stay updated with the latest sports news and announcements
            </p>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton-card h-48 mb-4"></div>
                  <div className="skeleton-text-lg mb-2"></div>
                  <div className="skeleton-text mb-4"></div>
                  <div className="skeleton-text w-24"></div>
                </div>
              ))}
            </div>
          ) : news && news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {news.map((article) => (
                <div key={article.id} className="card hover:shadow-lg transition-shadow group">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <Newspaper className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt || (article.content ? article.content.substring(0, 150) + '...' : '')}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'No date'}
                    </span>
                    <Link
                      to={`/news/${article.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No news articles available.</p>
              <p className="text-gray-400 text-sm mt-2">Check back later for updates.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/news"
              className="btn btn-secondary inline-flex items-center"
            >
              View All News
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Gallery
            </h2>
            <p className="text-xl text-gray-600">
              Explore photos and videos from our sports events
            </p>
          </div>

          {galleryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square skeleton rounded-lg"></div>
              ))}
            </div>
          ) : galleryMedia && galleryMedia.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {galleryMedia.slice(0, 8).map((media, index) => (
                <div key={media.id || index} className="group cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No media available in the gallery.</p>
              <p className="text-gray-400 text-sm mt-2">Photos and videos will appear here after events.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/gallery"
              className="btn btn-secondary inline-flex items-center"
            >
              View Full Gallery
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of athletes, coaches, and organizers who trust Timely 
            for their sports event management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Sticky Footer */}
      <footer className="bg-gray-900 text-white py-12 sticky bottom-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Product */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/events" className="text-gray-300 hover:text-white transition-colors">Events</Link></li>
                <li><Link to="/news" className="text-gray-300 hover:text-white transition-colors">News</Link></li>
                <li><Link to="/gallery" className="text-gray-300 hover:text-white transition-colors">Gallery</Link></li>
                <li><Link to="/tickets" className="text-gray-300 hover:text-white transition-colors">Tickets</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Refund Policy</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Timely. All rights reserved. Built for sports communities worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
