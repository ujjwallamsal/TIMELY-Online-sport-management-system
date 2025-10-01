import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, Camera, Newspaper, ArrowRight, MapPin, Clock, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { api } from '../../api/client';
import { parseServerDate, formatEventDate, formatPrice, formatDate } from '../../utils/dateUtils';
import { getRoleDisplayName } from '../../utils/role';

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
          params: { ordering: 'start_datetime', limit: 6 }
        });
        // Normalize response to handle both array and paginated responses
        const events = response.data?.results || response.data || [];
        setPublicEvents(Array.isArray(events) ? events : []);
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
      
      for (const event of (publicEvents || [])) {
        try {
          const response = await api.get(ENDPOINTS.publicEventFixtures(event.id));
          const fixtures = response.data?.results || response.data || [];
          const hasLiveFixture = Array.isArray(fixtures) && fixtures.some((fixture: any) => 
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
        // Normalize response to handle both array and paginated responses
        const newsData = response.data?.results || response.data || [];
        setNews(Array.isArray(newsData) ? newsData : []);
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
        // Normalize response to handle both array and paginated responses
        const mediaData = response.data?.results || response.data || [];
        setGalleryMedia(Array.isArray(mediaData) ? mediaData : []);
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
    const startDate = parseServerDate(event.start_date || event.start_datetime);
    const endDate = parseServerDate(event.end_date || event.end_datetime);
    
    if (event.status === 'COMPLETED' || (endDate && endDate < now)) {
      return 'ENDED';
    }
    
    if (liveEvents.has(event.id)) {
      return 'LIVE';
    }
    
    if (startDate && startDate > now) {
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
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {isAuthenticated 
                ? `Welcome back, ${user?.first_name || getRoleDisplayName(user?.role || '')}!` 
                : 'Welcome to Timely'
              }
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              {isAuthenticated 
                ? 'Manage your sports events, track results, and stay connected with the community.'
                : 'The comprehensive sports events management platform that brings athletes, organizers, and spectators together for unforgettable sporting experiences.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/events"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Browse Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
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
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Events Hosted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Athletes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Sports</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">25+</div>
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
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
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
                const eventDate = parseServerDate(event.start_date || event.start_datetime);
                const fee = formatPrice(event.fee_cents);
                
                return (
                  <div key={event.id} className="card hover:shadow-lg transition-shadow group">
                    <div className="relative">
                      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-blue-600" />
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
                      {fee !== 'Free' && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {fee}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {event.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {event.description || 'No description available'}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          {eventDate ? formatEventDate(event.start_date || event.start_datetime) : 'Date TBD'}
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
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt || (article.content ? article.content.substring(0, 150) + '...' : '')}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {article.published_at ? formatDate(article.published_at) : 'No date'}
                    </span>
                    <Link
                      to={`/news/${article.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
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
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of athletes, coaches, and organizers who trust Timely 
            for their sports event management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
