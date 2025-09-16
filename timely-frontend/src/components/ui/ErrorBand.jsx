// src/components/ui/ErrorBand.jsx
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorBand = ({ 
  message = 'Something went wrong', 
  onRetry,
  className = '' 
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBand;
