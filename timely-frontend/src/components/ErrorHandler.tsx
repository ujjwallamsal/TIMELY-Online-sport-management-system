import React from 'react';

// Global error handler for API errors
export const handleApiError = (error: any) => {
  if (error?.response?.status === 404) {
    console.warn('API endpoint not found:', error.config?.url);
    return;
  }
  
  if (error?.response?.status === 401) {
    console.warn('Unauthorized access:', error.config?.url);
    return;
  }
  
  if (error?.response?.status === 403) {
    console.warn('Forbidden access:', error.config?.url);
    return;
  }
  
  console.error('API Error:', error);
};

// Component to display API errors gracefully
interface ApiErrorProps {
  error: any;
  fallback?: React.ReactNode;
}

export const ApiError: React.FC<ApiErrorProps> = ({ error, fallback }) => {
  if (error?.response?.status === 404) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-sm">
          This feature is not available yet.
        </div>
      </div>
    );
  }
  
  if (error?.response?.status === 401) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-sm">
          Please log in to access this feature.
        </div>
      </div>
    );
  }
  
  if (error?.response?.status === 403) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-sm">
          You don't have permission to access this feature.
        </div>
      </div>
    );
  }
  
  return fallback || (
    <div className="text-center py-8">
      <div className="text-red-500 text-sm">
        Something went wrong. Please try again.
      </div>
    </div>
  );
};

export default ApiError;
