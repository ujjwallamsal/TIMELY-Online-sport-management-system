import React, { useState, useEffect } from 'react';
import { getPublicPage } from '../lib/api';

const About = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await getPublicPage('about');
        setPage(response.data);
      } catch (err) {
        console.error('Error fetching about page:', err);
        setError('Failed to load about page');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading about page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">About Page Not Found</h1>
          <p className="text-gray-600">The about page content is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {page.title}
          </h1>
          <div className="w-24 h-1 bg-blue-600 rounded"></div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700"
            dangerouslySetInnerHTML={{ 
              __html: page.body.replace(/\n/g, '<br>') 
            }}
          />
        </div>

        {/* SEO Meta (if available) */}
        {page.seo_title && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">SEO Information</h3>
            <p className="text-sm text-blue-800">
              <strong>Title:</strong> {page.seo_title}
            </p>
            {page.seo_description && (
              <p className="text-sm text-blue-800 mt-1">
                <strong>Description:</strong> {page.seo_description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default About;
