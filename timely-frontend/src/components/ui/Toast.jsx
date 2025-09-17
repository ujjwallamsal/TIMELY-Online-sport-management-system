// src/components/ui/Toast.jsx
import React, { useEffect, useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const Toast = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  position = 'top-right',
  showIcon = true,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const types = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-400',
      titleColor: 'text-green-800',
      textColor: 'text-green-700'
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-400',
      titleColor: 'text-red-800',
      textColor: 'text-red-700'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-800',
      textColor: 'text-yellow-700'
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700'
    }
  };

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const config = types[type];
  const Icon = config.icon;

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose(id);
      }
    }, 300);
  };

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full ${positions[position]} ${className}
        transform transition-all duration-300 ease-in-out
        ${isLeaving ? 'opacity-0 scale-95 translate-x-full' : 'opacity-100 scale-100 translate-x-0'}
      `}
    >
      <div className={`
        ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4
        backdrop-blur-sm bg-opacity-95
      `}>
        <div className="flex items-start">
          {showIcon && (
            <div className="flex-shrink-0">
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
          )}
          
          <div className={`ml-3 flex-1 ${showIcon ? '' : 'ml-0'}`}>
            {title && (
              <h4 className={`text-sm font-medium ${config.titleColor}`}>
                {title}
              </h4>
            )}
            {message && (
              <p className={`text-sm ${config.textColor} ${title ? 'mt-1' : ''}`}>
                {message}
              </p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`
                inline-flex ${config.textColor} hover:opacity-75 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                transition-opacity duration-200
              `}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
