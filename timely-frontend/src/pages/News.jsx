import React, { useState, useEffect } from 'react';
import { getPublicNews } from '../lib/api';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    fetchNews();
  }, [page]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPublicNews(page);
      
      // Handle both paginated and non-paginated responses
      const items = Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
      setNews(items);
      
      // Handle pagination
      if (response.data.next) {
        setHasNext(true);
      } else {
        setHasNext(false);
      }
      
      if (response.data.previous) {
        setHasPrev(true);
      } else {
        setHasPrev(false);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <Skeleton type="text" className="h-10 w-96 mb-4" />
            <Skeleton type="text" className="h-6 w-80 mb-4" />
            <Skeleton type="text" className="h-1 w-24" />
          </div>

          {/* News Articles Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <Skeleton type="text" className="h-8 w-3/4 mb-4" />
                <Skeleton type="text" className="h-4 w-1/3 mb-4" />
                <Skeleton type="text" className="h-4 w-full mb-2" />
                <Skeleton type="text" className="h-4 w-2/3 mb-6" />
                <Skeleton type="text" className="h-1 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          icon="⚠️"
          title="Failed to load news"
          message={error}
          action={{
            label: "Try Again",
            onClick: fetchNews
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">News & Updates</h1>
          <p className="text-lg text-gray-600">
            Stay informed with the latest news and announcements from our platform.
          </p>
          <div className="w-24 h-1 bg-blue-600 rounded mt-4"></div>
        </div>

        {/* News Articles */}
        {news.length === 0 ? (
          <EmptyState
            icon="📰"
            title="No News Articles"
            message="There are no news articles available at the moment."
          />
        ) : (
          <div className="space-y-6">
            {news.map((article) => (
              <article 
                key={article.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {article.title}
                    </h2>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {formatDate(article.created_at)}
                      </span>
                      {article.author_name && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {article.author_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                  <p className="text-gray-700 leading-relaxed">
                    {truncateText(article.body.replace(/<[^>]*>/g, ''))}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button className="text-blue-600 font-medium hover:text-blue-700 focus:outline-none focus:underline">
                    Read more →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(hasNext || hasPrev) && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!hasPrev || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {page}
            </span>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasNext || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Next
            </button>
          </div>
        )}

        {/* Loading indicator for pagination */}
        {loading && page > 1 && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;