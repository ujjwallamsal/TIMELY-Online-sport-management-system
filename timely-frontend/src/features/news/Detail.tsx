import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Newspaper, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { useAuth } from '../../auth/AuthProvider';

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const newsId = parseInt(id || '0');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['news', newsId],
    queryFn: () => api.get(ENDPOINTS.newsItem(newsId)).then(res => res.data),
    enabled: !!newsId && newsId > 0,
  });

  const handleLoginRedirect = () => {
    const returnTo = encodeURIComponent(`/news/${newsId}`);
    navigate(`/login?returnTo=${returnTo}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-6">The news article you're looking for doesn't exist.</p>
            <Link to="/news" className="btn btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            to="/news" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Link>
        </div>

        {/* Article Header */}
        <div className="card mb-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {article.author_name || 'Unknown Author'}
              </div>
            </div>
          </div>

          {/* Featured Image Placeholder */}
          <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-8">
            <Newspaper className="h-16 w-16 text-blue-600" />
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {isAuthenticated ? (
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: article.content || article.excerpt || 'No content available.' 
                }}
              />
            ) : (
              <div>
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: article.excerpt || 'No preview available.' 
                  }}
                />
                
                {/* Login Gate */}
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 text-center mb-2">
                    Continue Reading
                  </h3>
                  <p className="text-blue-700 text-center mb-4">
                    Sign in to read the full article and access exclusive content.
                  </p>
                  <div className="text-center">
                    <button
                      onClick={handleLoginRedirect}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Sign In to Continue
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Articles or Back to News */}
        <div className="text-center">
          <Link to="/news" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All News
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;