import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { 
  NewspaperIcon,
  CalendarIcon,
  UserIcon,
  ArrowRightIcon
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
      const data = await api.getNews({ page, page_size: 10 });
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

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `http://127.0.0.1:8000${image}`;
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEyMCA4MEwxNDAgMTAwTDEyMCAxMjBMMTAwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4MCIgeT0iODAiPgo8cGF0aCBkPSJNMjAgMjBMMzAgMTBMMzAgMzBMMjAgMjBaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo8L3N2Zz4K';
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((n) => (
              <article key={n.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {n.image && (
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={getImageUrl(n.image)}
                      alt={n.title}
                      className="w-full h-48 object-cover"
                      onError={handleImageError}
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(n.published_at || n.created_at)}
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                    {n.title}
                  </h2>
                  
                  <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                    <p className="line-clamp-3">
                      {n.excerpt || n.body}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="h-4 w-4 mr-1" />
                      <span>{n.author_name || 'Anonymous'}</span>
                    </div>
                    
                    <Link
                      to={`/news/${n.slug}`}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Read more
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
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


