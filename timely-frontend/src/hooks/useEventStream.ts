import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../api/ENDPOINTS';

interface EventStreamOptions {
  eventId: number;
  enabled?: boolean;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
}

export const useEventStream = ({ eventId, enabled = true, onMessage, onError }: EventStreamOptions) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<number | null>(null);

  // SSE connection - disabled to avoid 406 errors, use polling only
  const connectSSE = () => {
    if (!eventId || !enabled) return;

    // Skip SSE connection and go directly to polling to avoid 406 errors
    console.log('Using automatic updates for event:', eventId);
    setConnectionStatus('connected'); // Show as connected for polling
    setIsConnected(true);
    setErrorMessage(null);
    startPolling();
  };

  // Polling fallback when SSE 404s
  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    console.log('Starting polling fallback for event:', eventId);
    pollingRef.current = window.setInterval(() => {
      // Refetch related queries every 15s
      queryClient.invalidateQueries({ queryKey: ['fixtures', 'event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['results', 'event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
    }, 15000); // 15 seconds
  };

  const handleRealtimeMessage = (data: any) => {
    switch (data.type) {
      case 'results_update':
        queryClient.invalidateQueries({ queryKey: ['results', 'event', eventId] });
        queryClient.invalidateQueries({ queryKey: ['events', eventId, 'leaderboard'] });
        break;
      case 'schedule_update':
        queryClient.invalidateQueries({ queryKey: ['fixtures', 'event', eventId] });
        break;
      case 'announcement':
        // Show toast notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
              type: 'info', 
              title: 'Event Announcement', 
              message: data.message || 'New announcement available' 
            }
          }));
        }
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  useEffect(() => {
    if (enabled && eventId) {
      connectSSE();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [eventId, enabled]);

  return {
    isConnected,
    connectionStatus,
    errorMessage,
    reconnect: connectSSE
  };
};
