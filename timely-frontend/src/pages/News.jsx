import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../api';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  // Load news with pagination
  const loadNews = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        page_size: pagination.pageSize
      };
      
      const response = await publicAPI.listPublicNews(params);
      
      setNews(response.data.results || []);
      setPagination(prev => ({
        ...prev,
        page: response.data.page || 1,
        total: response.data.count || 0,
        totalPages: response.data.total_pages || 0
      }));
      
    } catch (err) {
      console.error('Failed to load news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    loadNews(1);
  }, [loadNews]);

  // Handle page changes
  const handlePageChange = (page) => {
    loadNews(page);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">News & Announcements</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest news, announcements, and updates from our sports community.
          </p>
        </div>

        {/* News List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
            <button
              onClick={() => loadNews(pagination.page)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : news.length > 0 ? (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {news.length} of {pagination.total} articles
              </p>
            </div>

            {/* News articles */}
            <div className="space-y-6 mb-8">
              {news.map((article) => (
                <article
                  key={article.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                          <Link to={`/news/${article.slug}`}>
                            {article.title}
                          </Link>
                        </h2>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <time dateTime={article.created_at}>
                            {formatDate(article.created_at)}
                          </time>
                          {article.author && (
                            <>
                              <span className="mx-2">•</span>
                              <span>By {article.author}</span>
                            </>
                          )}
                          {article.updated_at !== article.created_at && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Updated {formatDateTime(article.updated_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="prose max-w-none">
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {article.body}
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Link
                        to={`/news/${article.slug}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Read full article →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No news available</h3>
            <p className="text-gray-600">
              Check back later for the latest announcements and updates.
            </p>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default News;