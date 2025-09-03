import { useState, useCallback } from 'react';

// Simple toast state management
let toastId = 0;
const toastListeners = new Set();

// Toast state
let toasts = [];

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Add toast
export const addToast = (message, type = TOAST_TYPES.INFO, duration = 5000) => {
  const id = ++toastId;
  const toast = {
    id,
    message,
    type,
    duration,
    timestamp: Date.now(),
  };
  
  toasts = [...toasts, toast];
  
  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  
  // Notify listeners
  toastListeners.forEach(listener => listener([...toasts]));
  
  return id;
};

// Remove toast
export const removeToast = (id) => {
  toasts = toasts.filter(toast => toast.id !== id);
  toastListeners.forEach(listener => listener([...toasts]));
};

// Clear all toasts
export const clearToasts = () => {
  toasts = [];
  toastListeners.forEach(listener => listener([]));
};

// Hook to use toasts
export const useToast = () => {
  const [toastList, setToastList] = useState(toasts);
  
  // Subscribe to toast changes
  const updateToasts = useCallback((newToasts) => {
    setToastList(newToasts);
  }, []);
  
  // Subscribe on mount, unsubscribe on unmount
  useState(() => {
    toastListeners.add(updateToasts);
    return () => {
      toastListeners.delete(updateToasts);
    };
  });
  
  const showToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
    return addToast(message, type, duration);
  }, []);
  
  const showSuccess = useCallback((message, duration = 5000) => {
    return addToast(message, TOAST_TYPES.SUCCESS, duration);
  }, []);
  
  const showError = useCallback((message, duration = 7000) => {
    return addToast(message, TOAST_TYPES.ERROR, duration);
  }, []);
  
  const showWarning = useCallback((message, duration = 6000) => {
    return addToast(message, TOAST_TYPES.WARNING, duration);
  }, []);
  
  const showInfo = useCallback((message, duration = 5000) => {
    return addToast(message, TOAST_TYPES.INFO, duration);
  }, []);
  
  const dismissToast = useCallback((id) => {
    removeToast(id);
  }, []);
  
  const dismissAll = useCallback(() => {
    clearToasts();
  }, []);
  
  return {
    toasts: toastList,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    dismissAll,
  };
};

// Toast component for rendering
export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
            transform transition-all duration-300 ease-in-out
            ${toast.type === TOAST_TYPES.SUCCESS ? 'border-l-4 border-green-500' : ''}
            ${toast.type === TOAST_TYPES.ERROR ? 'border-l-4 border-red-500' : ''}
            ${toast.type === TOAST_TYPES.WARNING ? 'border-l-4 border-yellow-500' : ''}
            ${toast.type === TOAST_TYPES.INFO ? 'border-l-4 border-blue-500' : ''}
          `}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === TOAST_TYPES.SUCCESS && (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === TOAST_TYPES.ERROR && (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === TOAST_TYPES.WARNING && (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === TOAST_TYPES.INFO && (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">
                  {toast.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => onDismiss(toast.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default useToast;
