import React, { useState, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

/**
 * AnnouncementBanner component for displaying announcement messages
 */
const AnnouncementBanner = ({ 
  announcement, 
  onDismiss, 
  autoHide = true, 
  hideDelay = 5000,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (autoHide && announcement) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [announcement, autoHide, hideDelay]);

  const handleDismiss = () => {
    if (isDismissing) return;
    
    setIsDismissing(true);
    setIsVisible(false);
    
    // Call onDismiss after animation completes
    setTimeout(() => {
      if (onDismiss) {
        onDismiss(announcement.id);
      }
    }, 300);
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-400',
          textColor: 'text-green-800',
          titleColor: 'text-green-900'
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-400',
          textColor: 'text-yellow-800',
          titleColor: 'text-yellow-900'
        };
      case 'error':
        return {
          icon: XCircleIcon,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-400',
          textColor: 'text-red-800',
          titleColor: 'text-red-900'
        };
      case 'info':
      default:
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-400',
          textColor: 'text-blue-800',
          titleColor: 'text-blue-900'
        };
    }
  };

  if (!isVisible || !announcement) {
    return null;
  }

  const config = getTypeConfig(announcement.type || 'info');
  const IconComponent = config.icon;

  return (
    <div 
      className={`relative rounded-lg border ${config.bgColor} ${config.borderColor} p-4 ${className} ${
        isDismissing ? 'opacity-0 transform scale-95 transition-all duration-300' : 'opacity-100 transform scale-100 transition-all duration-300'
      }`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          {announcement.title && (
            <h3 className={`text-sm font-medium ${config.titleColor} mb-1`}>
              {announcement.title}
            </h3>
          )}
          <div className={`text-sm ${config.textColor}`}>
            <p>{announcement.message}</p>
          </div>
          {announcement.created_at && (
            <div className={`text-xs ${config.textColor} opacity-75 mt-2`}>
              {new Date(announcement.created_at).toLocaleString()}
            </div>
          )}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleDismiss}
              className={`inline-flex rounded-md p-1.5 ${config.iconColor} hover:${config.iconColor.replace('400', '600')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-600`}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
