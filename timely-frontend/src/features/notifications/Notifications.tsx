import React, { useState } from 'react';
import { Bell, Send, MessageSquare, X, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../contexts/ToastContext';
import { useGetNotifications, useMarkNotificationRead } from '../../api/queries';
import NotificationDrawer from '../../components/NotificationDrawer';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  read: boolean;
}

interface AnnouncementData {
  title: string;
  message: string;
  target_audience: 'all' | 'athletes' | 'coaches' | 'organizers';
}

const Notifications: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'notifications' | 'announce'>('notifications');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch real notifications data
  const { data: notifications = [], isLoading } = useGetNotifications();
  const markAsReadMutation = useMarkNotificationRead();

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      showSuccess('Notification Marked as Read', 'Notification has been marked as read.');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      showError('Error', 'Failed to mark notification as read.');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDrawerOpen(true);
    // Mark as read if unread
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedNotification(null);
  };

  // Calculate unread count - ensure notifications is always an array
  const notificationsArray = Array.isArray(notifications?.results) ? notifications.results : (Array.isArray(notifications) ? notifications : []);
  const unreadCount = notificationsArray.filter((n: Notification) => !n.read).length;

  const form = useForm<AnnouncementData>({
    initialValues: {
      title: '',
      message: '',
      target_audience: 'all',
    },
    validationSchema: z.object({
      title: z.string().min(1, 'Title is required'),
      message: z.string().min(1, 'Message is required'),
      target_audience: z.enum(['all', 'athletes', 'coaches', 'organizers']),
    }),
    onSubmit: async () => {
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        showSuccess('Announcement Sent', 'Your announcement has been sent successfully.');
        form.reset();
      } catch (error) {
        showError('Send Failed', 'Failed to send announcement. Please try again.');
      }
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <Bell className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with announcements and important messages</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bell className="h-4 w-4 inline mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('announce')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'announce'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Send className="h-4 w-4 inline mr-2" />
                Send Announcement
              </button>
            </nav>
          </div>
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notificationsArray.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                <p className="text-gray-500">You're all caught up! No new notifications.</p>
              </div>
            ) : (
              notificationsArray.map((notification: Notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`card border-l-4 ${getNotificationBg(notification.type)} cursor-pointer hover:shadow-lg transition-shadow ${
                    !notification.read ? 'shadow-md' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              New
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Announcement Tab */}
        {activeTab === 'announce' && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Send Announcement
            </h2>
            
            <form onSubmit={form.handleSubmit} className="space-y-6">
              <div>
                <label className="form-label">Announcement Title</label>
                <input
                  type="text"
                  value={form.values.title}
                  onChange={(e) => form.setValue('title', e.target.value)}
                  className="form-input"
                  placeholder="Enter announcement title"
                  required
                />
                {form.errors.title && (
                  <p className="form-error">{form.errors.title}</p>
                )}
              </div>

              <div>
                <label className="form-label">Message</label>
                <textarea
                  value={form.values.message}
                  onChange={(e) => form.setValue('message', e.target.value)}
                  className="form-input"
                  rows={4}
                  placeholder="Enter your announcement message"
                  required
                />
                {form.errors.message && (
                  <p className="form-error">{form.errors.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Target Audience</label>
                <select
                  value={form.values.target_audience}
                  onChange={(e) => form.setValue('target_audience', e.target.value as any)}
                  className="form-input"
                  required
                >
                  <option value="all">All Users</option>
                  <option value="athletes">Athletes Only</option>
                  <option value="coaches">Coaches Only</option>
                  <option value="organizers">Organizers Only</option>
                </select>
                {form.errors.target_audience && (
                  <p className="form-error">{form.errors.target_audience}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  This announcement will be sent to all users in the selected audience.
                </div>
                <button
                  type="submit"
                  disabled={form.isSubmitting}
                  className="btn btn-primary"
                >
                  {form.isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Announcement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Notification Detail Drawer */}
      {selectedNotification && (
        <NotificationDrawer
          notification={selectedNotification}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </div>
  );
};

export default Notifications;
