import { useState, useEffect } from "react";
import { getNews } from "../lib/api";

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    date: "",
    author: ""
  });

  // Fallback data for development
  const fallbackNews = [
    {
      id: 1,
      title: "Summer Sports Festival 2024 - Registration Now Open! 🏆",
      body: "Get ready for the biggest sports event of the year! The Summer Sports Festival 2024 is now accepting registrations for all sports categories including Football, Basketball, Tennis, Swimming, Cricket, and Athletics. Early bird discounts available until August 31st.",
      category: "EVENT_ANNOUNCEMENT",
      author: "Sports Committee",
      published_at: "2024-08-20T10:00:00Z",
      image_url: null,
      tags: ["Registration", "Summer Festival", "Sports"],
      read_time: "3 min read"
    },
    {
      id: 2,
      title: "New Venue Partnership - Central Sports Complex 🏟️",
      body: "We're excited to announce our new partnership with Central Sports Complex! This state-of-the-art facility will host our premium events with world-class amenities including Olympic-size swimming pool, professional tennis courts, and indoor basketball arena.",
      category: "PARTNERSHIP",
      author: "Venue Management",
      published_at: "2024-08-19T14:30:00Z",
      image_url: null,
      tags: ["Venue", "Partnership", "Facilities"],
      read_time: "2 min read"
    },
    {
      id: 3,
      title: "Championship Results - Congratulations to All Winners! 🎉",
      body: "The Spring Championship has concluded with spectacular performances across all sports. Special congratulations to the Blue Dragons Football Team, Green Eagles Basketball Squad, and Golden Lions Tennis Club for their outstanding achievements. Full results and highlights available now.",
      category: "RESULTS",
      author: "Tournament Director",
      published_at: "2024-08-18T16:00:00Z",
      image_url: null,
      tags: ["Results", "Championship", "Winners"],
      read_time: "4 min read"
    },
    {
      id: 4,
      title: "Volunteer Program Launch - Join Our Sports Community! 🤝",
      body: "We're launching our new volunteer program to support upcoming sports events. Whether you're passionate about sports, event management, or community service, we have opportunities for everyone. Training provided, flexible schedules available.",
      category: "COMMUNITY",
      author: "Community Outreach",
      published_at: "2024-08-17T11:15:00Z",
      image_url: null,
      tags: ["Volunteer", "Community", "Opportunities"],
      read_time: "3 min read"
    },
    {
      id: 5,
      title: "Technology Upgrade - New Mobile App Coming Soon! 📱",
      body: "Get ready for a better sports experience! Our new mobile app will feature real-time updates, live scores, ticket booking, and personalized notifications. Beta testing starts next month - sign up to be among the first to try it!",
      category: "TECHNOLOGY",
      author: "Tech Team",
      published_at: "2024-08-16T09:45:00Z",
      image_url: null,
      tags: ["Mobile App", "Technology", "Innovation"],
      read_time: "2 min read"
    },
    {
      id: 6,
      title: "Safety First - Updated COVID-19 Guidelines 📋",
      body: "Your safety remains our top priority. We've updated our health and safety guidelines based on the latest recommendations. All events will continue to follow strict protocols including enhanced cleaning, social distancing measures, and health screenings.",
      category: "SAFETY",
      author: "Health & Safety",
      published_at: "2024-08-15T13:20:00Z",
      image_url: null,
      tags: ["Safety", "Health", "Guidelines"],
      read_time: "3 min read"
    }
  ];

  const categories = ["EVENT_ANNOUNCEMENT", "PARTNERSHIP", "RESULTS", "COMMUNITY", "TECHNOLOGY", "SAFETY"];
  const authors = ["Sports Committee", "Venue Management", "Tournament Director", "Community Outreach", "Tech Team", "Health & Safety"];

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Try to load from API first
      const response = await getNews();
      
      if (response && (response.results || response.length > 0)) {
        setNews(response.results || response || []);
      } else {
        // Use fallback data if API returns empty
        setNews(fallbackNews);
      }
    } catch (err) {
      console.error('Error loading news:', err);
      // Use fallback data on error
      setNews(fallbackNews);
      setError("Using offline data. Some features may be limited.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      date: "",
      author: ""
    });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'EVENT_ANNOUNCEMENT': return 'bg-blue-100 text-blue-800';
      case 'PARTNERSHIP': return 'bg-green-100 text-green-800';
      case 'RESULTS': return 'bg-yellow-100 text-yellow-800';
      case 'COMMUNITY': return 'bg-purple-100 text-purple-800';
      case 'TECHNOLOGY': return 'bg-indigo-100 text-indigo-800';
      case 'SAFETY': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'EVENT_ANNOUNCEMENT': return '📢';
      case 'PARTNERSHIP': return '🤝';
      case 'RESULTS': return '🏆';
      case 'COMMUNITY': return '👥';
      case 'TECHNOLOGY': return '💻';
      case 'SAFETY': return '🛡️';
      default: return '📰';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "TBD";
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return "TBD";
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    return formatDate(dateTimeString);
  };

  // Filter news based on current filters
  const filteredNews = news.filter(item => {
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    if (filters.author && item.author !== filters.author) {
      return false;
    }
    if (filters.date) {
      const newsDate = new Date(item.published_at).toDateString();
      const filterDate = new Date(filters.date).toDateString();
      if (newsDate !== filterDate) {
        return false;
      }
    }
    return true;
  });

  const eventAnnouncements = filteredNews.filter(item => item.category === 'EVENT_ANNOUNCEMENT').length;
  const partnerships = filteredNews.filter(item => item.category === 'PARTNERSHIP').length;
  const results = filteredNews.filter(item => item.category === 'RESULTS').length;
  const totalNews = filteredNews.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            News & Announcements
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest news, announcements, and updates from the sports community! 📰🎯🏆
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-yellow-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Events</p>
                <p className="text-2xl font-bold text-gray-900">{eventAnnouncements}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Partnerships</p>
                <p className="text-2xl font-bold text-gray-900">{partnerships}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Results</p>
                <p className="text-2xl font-bold text-gray-900">{results}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total News</p>
                <p className="text-2xl font-bold text-gray-900">{totalNews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">🔍 Search & Filter</h3>
            <button
              onClick={clearFilters}
              className="mt-3 sm:mt-0 px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all duration-200"
            >
              Clear all filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{String(category || 'GENERAL').replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <select
                value={filters.author}
                onChange={(e) => handleFilterChange("author", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              >
                <option value="">All Authors</option>
                {authors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* News Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="flex items-center justify-center mb-6">
              <svg className="animate-spin h-12 w-12 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading news...</h3>
            <p className="text-gray-600">Please wait while we fetch the latest updates</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">📰</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No news found</h3>
            <p className="text-gray-600 text-lg mb-6">Try adjusting your filters or check back later for new updates.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNews.map((item) => (
              <div key={item.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  {/* News Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item?.category)}`}>
                          {getCategoryIcon(item?.category)} {String(item?.category || 'GENERAL').replace('_', ' ')}
                        </span>
                        <span className="ml-3 text-sm text-gray-500">{getTimeAgo(item.published_at)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-200">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  
                  {/* News Content */}
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed mb-4">{item.body}</p>
                    
                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* News Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{item.author}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{item.read_time}</span>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105">
                    Read Full Article
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
