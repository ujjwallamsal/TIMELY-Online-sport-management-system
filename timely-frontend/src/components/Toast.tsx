import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    const iconClass = `h-6 w-6 ${getIconColor()}`;
    switch (type) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'info':
        return <Info className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getToastStyles = () => {
    const baseClass = 'w-full bg-white rounded-xl shadow-lg border-l-4 transform transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-5';
    switch (type) {
      case 'success':
        return `${baseClass} border-l-green-500`;
      case 'error':
        return `${baseClass} border-l-red-500`;
      case 'warning':
        return `${baseClass} border-l-yellow-500`;
      case 'info':
        return `${baseClass} border-l-blue-500`;
      default:
        return `${baseClass} border-l-blue-500`;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-white';
      case 'error':
        return 'bg-white';
      case 'warning':
        return 'bg-white';
      case 'info':
        return 'bg-white';
      default:
        return 'bg-white';
    }
  };

  const getTextColor = () => {
    return 'text-gray-900';
  };
  
  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className={`p-4 ${getBackgroundColor()}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${getTextColor()}`}>{title}</p>
            {message && (
              <p className="mt-0.5 text-sm text-gray-600">{message}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            <button
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              onClick={() => onClose(id)}
              aria-label="Close notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
