import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const AnnouncementBanner = ({ 
  announcement, 
  onDismiss, 
  autoHide = false, 
  hideDelay = 5000,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && hideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, hideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible || !announcement) return null;

  const getBannerStyles = (type) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'info':
        return <InformationCircleIcon className="w-5 h-5" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5" />;
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`border rounded-lg p-4 ${getBannerStyles(announcement.type)} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon(announcement.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1">
                {announcement.title}
              </h3>
              <p className="text-sm opacity-90">
                {announcement.message}
              </p>
              
              {announcement.created_at && (
                <p className="text-xs opacity-75 mt-2">
                  {formatDate(announcement.created_at)}
                </p>
              )}
            </div>
            
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 ml-3 p-1 hover:bg-black hover:bg-opacity-10 rounded-md transition-colors"
                aria-label="Dismiss announcement"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;