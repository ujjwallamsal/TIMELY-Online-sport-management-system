import React, { useEffect, useState } from 'react';
import { publicAPI } from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { 
  NewspaperIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  });
  const { push } = useToast();

  const fetchNews = async (page = 1) => {
    let active = true;
    setLoading(true);
    
    try {
      const data = await publicAPI.getNews({ page, page_size: 10 });
      if (!active) return;
      
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setItems(list);
      
      setPagination({
        page: data.page || page,
        totalPages: Math.ceil((data.count || 0) / 10),
        hasNext: !!data.next,
        hasPrevious: !!data.previous
      });
    } catch (err) {
      if (active) {
        push({ type: 'error', title: 'Failed to load news', message: err.message || 'Please try again.' });
        setItems([]);
      }
    } finally {
      if (active) setLoading(false);
    }
    return () => { active = false; };
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">News & Updates</h1>
        <p className="text-gray-600">Stay up to date with the latest news and announcements</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No news found" description="Check back later for updates." />
      ) : (
        <>
          <div className="space-y-6">
            {items.map((n) => (
              <article key={n.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {n.title}
                  </h2>
                  <div className="flex items-center text-sm text-gray-500 ml-4">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(n.created_at)}
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                  <p className="line-clamp-3">
                    {n.body}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>Author #{n.author}</span>
                  </div>
                  {n.seo_title && (
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                      SEO: {n.seo_title}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => fetchNews(pagination.page - 1)}
                  disabled={!pagination.hasPrevious || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrentPage = pageNum === pagination.page;
                    const shouldShow = pageNum === 1 || pageNum === pagination.totalPages || 
                                     Math.abs(pageNum - pagination.page) <= 1;
                    
                    if (!shouldShow) {
                      if (pageNum === 2 || pageNum === pagination.totalPages - 1) {
                        return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchNews(pageNum)}
                        disabled={loading}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          isCurrentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => fetchNews(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}


