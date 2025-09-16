import React, { useState, useEffect } from 'react';
import { 
  NewspaperIcon, 
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import useSocket from '../../hooks/useSocket';
import { api } from '../../lib/api';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState, { EmptyEvents } from '../../components/ui/EmptyState';

const PublicNews = () => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    date_from: '',
    date_to: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/spectator/`,
    {
      onMessage: (message) => {
        console.log('Received message:', message);
        handleRealtimeUpdate(message);
      },
      onPolling: () => {
        fetchNews();
      }
    }
  );

  const fetchNews = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...filters
      });
      
      const response = await api.get(`cms/news/?${params}`);
      setNews(response.data.results);
      setPagination(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'content_update':
        // Refresh news when content is updated
        fetchNews(currentPage);
        break;
      default:
        break;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNews(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchNews(page);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-gray-50 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton className="h-10 w-full" key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* News Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Latest News</h1>
              <p className="text-gray-600 mt-2">Stay updated with the latest sports news and announcements</p>
            </div>
            <LiveIndicator status={connectionStatus} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search news..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="announcement">Announcement</option>
                  <option value="event">Event</option>
                  <option value="result">Result</option>
                  <option value="general">General</option>
                </select>
              </div>

              {/* Search Button */}
              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* News Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {news.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map(article => (
                <div key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {article.featured_image && (
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <NewspaperIcon className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{article.title}</h3>
                        <p className="text-sm text-gray-500">{formatDate(article.publish_at)}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        article.category === 'announcement' ? 'bg-blue-100 text-blue-800' :
                        article.category === 'event' ? 'bg-green-100 text-green-800' :
                        article.category === 'result' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {article.category}
                      </span>
                      <a
                        href={`/news/${article.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Read More
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.count > pagination.page_size && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.count)} of {pagination.count} articles
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.previous}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {currentPage} of {Math.ceil(pagination.count / pagination.page_size)}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.next}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyEvents 
            title="No News Available"
            description="There are no news articles available at the moment."
            action={
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    category: '',
                    date_from: '',
                    date_to: ''
                  });
                  fetchNews(1);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Clear Filters
              </button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default PublicNews;
