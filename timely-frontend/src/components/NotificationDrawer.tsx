import React from 'react';
import { X, ExternalLink, Calendar, FileText, DollarSign, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTimeAgo } from '../utils/dateUtils';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
  data?: {
    order_id?: number;
    registration_id?: number;
    announcement_id?: number;
    event_id?: number;
    [key: string]: any;
  };
}

interface NotificationDrawerProps {
  notification: Notification;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: number) => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
}) => {
  if (!isOpen) return null;

  const getDeepLink = () => {
    const data = notification.data || {};
    const type = notification.type;

    // Determine deep link based on notification type and data
    if (type === 'order_status' && data.order_id) {
      return { label: 'View Order', path: `/tickets/me#order-${data.order_id}` };
    }
    if (type === 'registration_status' && data.registration_id) {
      return { label: 'View Registration', path: `/registrations#reg-${data.registration_id}` };
    }
    if (type === 'announcement' && data.announcement_id) {
      return { label: 'Read Announcement', path: `/announcements/${data.announcement_id}` };
    }
    if (data.event_id) {
      return { label: 'View Event', path: `/events/${data.event_id}` };
    }
    return null;
  };

  const deepLink = getDeepLink();

  const getIcon = () => {
    switch (notification.type) {
      case 'order_status':
      case 'payment':
        return <DollarSign className="h-6 w-6 text-green-500" />;
      case 'registration_status':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'announcement':
        return <CheckCircle className="h-6 w-6 text-purple-500" />;
      case 'event':
        return <Calendar className="h-6 w-6 text-indigo-500" />;
      default:
        return <CheckCircle className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleMarkAsRead = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-drawer-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 id="notification-drawer-title" className="text-xl font-semibold text-gray-900">
            Notification Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Icon and Type */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                {notification.type.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {notification.title}
            </h3>
            <p className="text-sm text-gray-500">
              {formatTimeAgo(notification.created_at)}
            </p>
          </div>

          {/* Message */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Related Entity Info */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Information</h4>
              <dl className="space-y-2">
                {Object.entries(notification.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-gray-500 capitalize">{key.replace('_', ' ')}:</dt>
                    <dd className="text-gray-900 font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {deepLink && (
              <Link
                to={deepLink.path}
                onClick={onClose}
                className="btn btn-primary w-full flex items-center justify-center space-x-2"
              >
                <span>{deepLink.label}</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}

            {!notification.read && (
              <button
                onClick={handleMarkAsRead}
                className="btn btn-secondary w-full"
              >
                Mark as Read
              </button>
            )}

            <button
              onClick={onClose}
              className="btn btn-ghost w-full"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationDrawer;

