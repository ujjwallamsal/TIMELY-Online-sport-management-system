import React, { useState, useEffect } from 'react';
import { getPublicPage } from '../lib/api';

const PrivacyPolicy = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await getPublicPage('privacy');
        setPage(response.data);
      } catch (err) {
        console.error('Error fetching privacy policy:', err);
        setError('Failed to load privacy policy');
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
          <p className="mt-4 text-gray-600">Loading privacy policy...</p>
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
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy Not Found</h1>
          <p className="text-gray-600">The privacy policy page is not available.</p>
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
          <p className="text-lg text-gray-600">
            We are committed to protecting your privacy and personal information.
          </p>
          <div className="w-24 h-1 bg-blue-600 rounded mt-4"></div>
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

        {/* Data Protection Notice */}
        <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Your Data Protection Rights
          </h3>
          <p className="text-green-800 mb-4">
            You have the right to access, update, or delete your personal information. 
            You can also object to the processing of your data or request data portability.
          </p>
          <div className="space-y-2 text-sm text-green-700">
            <p>• <strong>Access:</strong> Request a copy of your personal data</p>
            <p>• <strong>Rectification:</strong> Correct inaccurate personal data</p>
            <p>• <strong>Erasure:</strong> Request deletion of your personal data</p>
            <p>• <strong>Portability:</strong> Receive your data in a structured format</p>
            <p>• <strong>Objection:</strong> Object to processing of your personal data</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Last Updated:</strong> {new Date(page.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Privacy Questions?
          </h3>
          <p className="text-gray-700 mb-4">
            If you have any questions about this privacy policy or your data rights, 
            please contact our privacy team.
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Contact Privacy Team
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
