import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer, { type ToastData } from '../components/ToastContainer';

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  hideToast: (id: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      ...toast,
      id,
    };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Listen for custom toast events from the API client
  React.useEffect(() => {
    const handleToastEvent = (event: CustomEvent) => {
      const { type, title, message } = event.detail;
      showToast({ type, title, message });
    };

    window.addEventListener('toast', handleToastEvent as EventListener);
    return () => {
      window.removeEventListener('toast', handleToastEvent as EventListener);
    };
  }, [showToast]);

  const value: ToastContextType = {
    showToast,
    hideToast,
    showSuccess: (title: string, message?: string) => showToast({ type: 'success', title, message }),
    showError: (title: string, message?: string) => showToast({ type: 'error', title, message }),
    showInfo: (title: string, message?: string) => showToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};