import React from 'react';

/**
 * Enhanced ErrorBoundary component with better UX and accessibility
 * Provides graceful error handling with retry functionality and proper ARIA attributes
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      error: null, 
      errorInfo: null,
      hasRetried: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo,
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // In production, you might want to send this to an error reporting service
    // Example: errorReportingService.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ 
      error: null, 
      errorInfo: null,
      hasRetried: true 
    });
    
    // Call the onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error, errorInfo, hasRetried } = this.state;
    const { fallback, children, showDetails = false } = this.props;

    if (error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      return (
        <div 
          className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg 
                  className="h-8 w-8 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              
              {/* Error Description */}
              <p className="text-gray-600 mb-6">
                {hasRetried 
                  ? "We're still having trouble loading this page. Please try refreshing or contact support if the problem persists."
                  : "We encountered an unexpected error. Don't worry, your data is safe."
                }
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
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
                  onClick={this.handleReload}
                  className="btn btn-secondary"
                  aria-label="Reload the entire page"
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
                  Reload Page
                </button>
              </div>

              {/* Error Details (Development/Admin only) */}
              {showDetails && errorInfo && (
                <details className="mt-8 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto max-h-64">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {error && error.toString()}
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Support Link */}
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  Still having trouble?{' '}
                  <a 
                    href="/contact" 
                    className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    Contact Support
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component for wrapping components with ErrorBoundary
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for manually triggering error boundary
 */
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    // This will be caught by the nearest ErrorBoundary
    throw error;
  };
};

export default ErrorBoundary;