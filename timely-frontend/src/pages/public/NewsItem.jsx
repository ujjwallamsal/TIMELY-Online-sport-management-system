import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import api from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { 
  CalendarIcon,
  UserIcon,
  ArrowLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function NewsItem() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      
      setLoading(true);
      setNotFound(false);
      
      try {
        const data = await api.getNewsItem(slug);
        setArticle(data);
      } catch (err) {
        if (err.status === 404) {
          setNotFound(true);
        } else {
          push({ 
            type: 'error', 
            title: 'Failed to load article', 
            message: err.message || 'Please try again.' 
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, push]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `http://127.0.0.1:8000${image}`;
  };

  if (notFound) {
    return <Navigate to="/news" replace />;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <EmptyState 
          title="Article not found" 
          description="The article you're looking for doesn't exist or has been removed." 
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/news"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to News
        </Link>
      </div>

      {/* Article header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-1" />
            <span>{article.author_name || 'Anonymous'}</span>
          </div>
          
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{formatDate(article.published_at || article.created_at)}</span>
          </div>
          
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>{formatTime(article.published_at || article.created_at)}</span>
          </div>
        </div>

        {article.excerpt && (
          <p className="text-lg text-gray-700 leading-relaxed">
            {article.excerpt}
          </p>
        )}
      </header>

      {/* Featured image */}
      {article.image && (
        <div className="mb-8">
          <img
            src={getImageUrl(article.image)}
            alt={article.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg shadow-sm"
          />
        </div>
      )}

      {/* Article content */}
      <article className="prose prose-lg max-w-none">
        <div 
          className="text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ 
            __html: article.body.replace(/\n/g, '<br />') 
          }}
        />
      </article>

      {/* Article footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Published on {formatDate(article.published_at || article.created_at)}</p>
            {article.author_name && (
              <p>By {article.author_name}</p>
            )}
          </div>
          
          <Link
            to="/news"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to News
          </Link>
        </div>
      </footer>
    </div>
  );
}
