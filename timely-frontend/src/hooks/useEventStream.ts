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
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<number | null>(null);

  // SSE connection
  const connectSSE = () => {
    if (!eventId || !enabled) return;

    try {
      setConnectionStatus('connecting');
      
      // Try to connect to SSE endpoint
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const sseUrl = `${baseUrl}${ENDPOINTS.sseEventResults(eventId)}`;
      const eventSource = new EventSource(sseUrl);
      
      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('SSE connected to:', sseUrl);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeMessage(data);
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setConnectionStatus('error');
        setIsConnected(false);
        eventSource.close();
        onError?.(error);
        
        // Fallback to polling
        startPolling();
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to connect to SSE:', error);
      setConnectionStatus('error');
      startPolling();
    }
  };

  // Polling fallback when SSE 404s
  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    console.log('Starting polling fallback for event:', eventId);
    pollingRef.current = window.setInterval(() => {
      // Refetch related queries every 20s
      queryClient.invalidateQueries({ queryKey: ['fixtures', 'event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['results', 'event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
    }, 20000); // 20 seconds
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
    reconnect: connectSSE
  };
};
