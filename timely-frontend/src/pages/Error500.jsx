import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * 500 Internal Server Error page
 * Provides a user-friendly error page for server errors
 */
const Error500 = ({ error, onRetry }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* Error Illustration */}
          <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-red-100 mb-8">
            <svg 
              className="h-16 w-16 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            500
          </h1>

          {/* Error Title */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Internal Server Error
          </h2>

          {/* Error Description */}
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            We're experiencing some technical difficulties on our end. Our team has been notified and is working to fix the issue. Please try again in a few moments.
          </p>

          {/* Error Details (if provided) */}
          {error && process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Error Details (Development Only):
              </h3>
              <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                {error.toString()}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="btn btn-primary"
              aria-label="Try loading the page again"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Try Again
            </button>

            <button
              onClick={handleGoBack}
              className="btn btn-secondary"
              aria-label="Go back to previous page"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Go Back
            </button>

            <Link
              to="/"
              className="btn btn-secondary"
              aria-label="Go to homepage"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              Homepage
            </Link>
          </div>

          {/* Status Information */}
          <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <svg 
                className="w-5 h-5 text-blue-600 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h3 className="text-sm font-medium text-blue-800">
                What's happening?
              </h3>
            </div>
            <p className="text-sm text-blue-700">
              This error usually means there's a temporary issue with our servers. 
              Our technical team has been automatically notified and is working to resolve it.
            </p>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If this problem persists, please{' '}
              <Link 
                to="/contact" 
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                contact our support team
              </Link>
              {' '}and include the error code 500.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error500;
