import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface ErrorResponse {
  status?: number;
  data?: {
    message?: string;
    detail?: string;
    errors?: Record<string, string[]>;
  };
}

export const useErrorHandler = () => {
  const { showError } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);

    let message = 'An unexpected error occurred';
    let title = 'Error';

    if (error?.response) {
      const response: ErrorResponse = error.response;
      const status = response.status;
      const data = response.data;

      switch (status) {
        case 400:
          title = 'Validation Error';
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat();
            message = errorMessages.join(', ');
          } else if (data?.message) {
            message = data.message;
          } else if (data?.detail) {
            message = data.detail;
          } else {
            message = 'Invalid request. Please check your input.';
          }
          break;

        case 401:
          title = 'Authentication Required';
          message = 'Please log in to continue.';
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
          break;

        case 403:
          title = 'Access Denied';
          message = 'You do not have permission to perform this action.';
          break;

        case 404:
          title = 'Not Found';
          message = 'The requested resource was not found.';
          break;

        case 409:
          title = 'Conflict';
          message = data?.message || data?.detail || 'A conflict occurred. Please try again.';
          break;

        case 422:
          title = 'Validation Error';
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat();
            message = errorMessages.join(', ');
          } else if (data?.message) {
            message = data.message;
          } else if (data?.detail) {
            message = data.detail;
          } else {
            message = 'Please check your input and try again.';
          }
          break;

        case 429:
          title = 'Too Many Requests';
          message = 'You have made too many requests. Please wait a moment and try again.';
          break;

        case 500:
          title = 'Server Error';
          message = 'Something went wrong on our end. Please try again later.';
          break;

        case 502:
        case 503:
        case 504:
          title = 'Service Unavailable';
          message = 'The service is temporarily unavailable. Please try again later.';
          break;

        default:
          if (data?.message) {
            message = data.message;
          } else if (data?.detail) {
            message = data.detail;
          } else {
            message = `An error occurred (${status}). Please try again.`;
          }
      }
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    showError(title, message);
  }, [showError]);

  const handleNetworkError = useCallback((error: any) => {
    console.error('Network error:', error);
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      showError(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      showError(
        'Request Timeout',
        'The request took too long to complete. Please try again.'
      );
    } else {
      handleError(error, 'network');
    }
  }, [handleError, showError]);

  const handleValidationError = useCallback((errors: Record<string, string[]>) => {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    
    showError('Validation Error', errorMessages);
  }, [showError]);

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
  };
};