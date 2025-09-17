import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from './ui/Toast';

/**
 * Toast context for managing global toast notifications
 */
const ToastContext = createContext();

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Toast provider component
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      kind: 'info',
      duration: 6000,
      ...toast,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different toast types
  const toast = {
    info: (title, body, options = {}) => 
      addToast({ kind: 'info', title, body, ...options }),
    
    success: (title, body, options = {}) => 
      addToast({ kind: 'success', title, body, ...options }),
    
    warning: (title, body, options = {}) => 
      addToast({ kind: 'warning', title, body, ...options }),
    
    error: (title, body, options = {}) => 
      addToast({ kind: 'error', title, body, ...options }),
    
    announcement: (title, body, options = {}) => 
      addToast({ kind: 'announcement', title, body, ...options }),
    
    custom: (toastData) => addToast(toastData),
    remove: removeToast,
    clear: clearAllToasts,
  };

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    toast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Toast container component
 */
export const ToastContainer = ({ position = 'top-right', maxToasts = 5 }) => {
  const { toasts, removeToast } = useToast();

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  // Limit number of visible toasts
  const visibleToasts = toasts.slice(0, maxToasts);

  return (
    <div 
      className={`fixed z-50 space-y-2 ${positionClasses[position]}`}
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {visibleToasts.map((toast) => (
        <Toast
          key={toast.id}
          notification={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * AppToaster component that combines provider and container
 */
const AppToaster = ({ children, position = 'top-right', maxToasts = 5 }) => {
  return (
    <ToastProvider>
      {children}
      <ToastContainer position={position} maxToasts={maxToasts} />
    </ToastProvider>
  );
};

export default AppToaster;
