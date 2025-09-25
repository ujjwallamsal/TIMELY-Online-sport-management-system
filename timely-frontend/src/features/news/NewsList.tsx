import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Newspaper } from 'lucide-react';
import { usePublicNews } from '../../api/queries';

// interface NewsArticle {
//   id: number;
//   title: string;
//   content: string;
//   excerpt?: string;
//   author: string;
//   published_at: string;
//   featured_image?: string;
//   tags?: string[];
// }

const NewsList: React.FC = () => {
  const { data: news, isLoading, error } = usePublicNews({
    page_size: 12,
    ordering: '-published_at',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load News</h3>
            <p className="text-gray-500">There was an error loading the news articles.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!news || news.results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No News Articles</h3>
            <p className="text-gray-500">Check back later for the latest sports news and updates.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sports News</h1>
          <p className="text-xl text-gray-600">
            Stay updated with the latest news, announcements, and updates from the sports world
          </p>
        </div>

        {/* Featured Article (First Article) */}
        {news.results.length > 0 && (
          <div className="mb-12">
            <div className="card">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    <Newspaper className="h-16 w-16 text-primary-600" />
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Featured
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(news.results[0].published_at || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {news.results[0].title}
                  </h2>
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {news.results[0].excerpt || news.results[0].content.substring(0, 200) + '...'}
                  </p>
                  <Link
                    to={`/news/${news.results[0].id}`}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Read Full Article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.results.slice(1).map((article) => (
            <article key={article.id} className="card hover:shadow-lg transition-shadow group">
              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4">
                <Newspaper className="h-12 w-12 text-gray-400" />
              </div>
              
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(article.published_at || '').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-1" />
                  {article.author}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                {article.title}
              </h3>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {article.excerpt || article.content.substring(0, 150) + '...'}
              </p>
              
              <Link
                to={`/news/${article.id}`}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Read More
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </article>
          ))}
        </div>

        {/* Load More Button */}
        {news.count > news.results.length && (
          <div className="text-center mt-12">
            <button className="btn btn-primary">
              Load More Articles
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsList;
