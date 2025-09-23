import React, { useState, useEffect } from 'react';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import useLiveChannel from '../hooks/useLiveChannel';
import AnnouncementBanner from './ui/AnnouncementBanner';

/**
 * Real-time announcements component that displays live announcements
 * for events, admin dashboards, and public pages
 */
const RealtimeAnnouncements = ({ 
  eventId = null, 
  showInDashboard = false,
  maxAnnouncements = 5,
  autoHide = true,
  className = ''
}) => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(new Set());

  // Determine the channel topic based on context
  const channelTopic = eventId ? `event_${eventId}_announcements` : 'admin_announcements';

  // Real-time connection for announcements
  const { isConnected, error } = useLiveChannel(channelTopic, (data) => {
    if (data.type === 'announcement_update') {
      const announcement = data.data.announcement;
      
      // Add new announcement to the list
      setAnnouncements(prev => {
        // Avoid duplicates
        const exists = prev.some(ann => ann.id === announcement.id);
        if (exists) return prev;
        
        // Add to beginning of list and limit to maxAnnouncements
        return [announcement, ...prev].slice(0, maxAnnouncements);
      });
    }
  }, {
    debug: process.env.NODE_ENV === 'development'
  });

  // Load existing announcements on mount
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const url = eventId 
          ? `/api/events/${eventId}/announcements/`
          : '/api/announcements/active/';
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.slice(0, maxAnnouncements));
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAnnouncements();
  }, [eventId, maxAnnouncements]);

  const handleDismiss = (announcementId) => {
    setDismissedAnnouncements(prev => new Set([...prev, announcementId]));
  };

  const handleDismissAll = () => {
    const allIds = announcements.map(ann => ann.id);
    setDismissedAnnouncements(prev => new Set([...prev, ...allIds]));
  };

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(
    ann => !dismissedAnnouncements.has(ann.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header for dashboard view */}
      {showInDashboard && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Live Announcements</h3>
            {isConnected && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Live
              </span>
            )}
          </div>
          {visibleAnnouncements.length > 1 && (
            <button
              onClick={handleDismissAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Dismiss all
            </button>
          )}
        </div>
      )}

      {/* Announcements list */}
      <div className="space-y-2">
        {visibleAnnouncements.map((announcement) => (
          <AnnouncementBanner
            key={announcement.id}
            announcement={{
              ...announcement,
              type: announcement.priority?.toLowerCase() || 'info',
              title: announcement.title,
              message: announcement.message,
              created_at: announcement.created_at
            }}
            onDismiss={() => handleDismiss(announcement.id)}
            autoHide={autoHide}
            hideDelay={8000}
            className="animate-in slide-in-from-top-2 duration-300"
          />
        ))}
      </div>

      {/* Connection status indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          {error && ` - ${error}`}
        </div>
      )}
    </div>
  );
};

export default RealtimeAnnouncements;
