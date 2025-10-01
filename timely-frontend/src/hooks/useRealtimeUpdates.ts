import { useEffect, useState } from 'react';
import { useSSE } from './useSSE';
import { useAuth } from '../auth/AuthProvider';

interface RealtimeUpdate {
  type: 'fixture_update' | 'result_update' | 'announcement' | 'registration_update';
  data: any;
  timestamp: string;
}

export const useRealtimeUpdates = () => {
  const { isAuthenticated, user } = useAuth();
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const { isConnected: sseConnected, error, connect, disconnect } = useSSE({
    url: isAuthenticated ? '/api/realtime/stream/' : '',
    onMessage: (event) => {
      try {
        const update: RealtimeUpdate = JSON.parse(event.data);
        setUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    },
    onOpen: () => {
      setIsConnected(true);
    },
    onError: (error) => {
      setIsConnected(false);
      // Log error but don't crash the app
      console.warn('SSE connection error:', error);
    },
    onClose: () => {
      setIsConnected(false);
    },
    maxRetries: 3, // Reduced retries to fail faster to polling
  });

  // Fallback to polling if SSE is not available
  useEffect(() => {
    if (!isAuthenticated || sseConnected) return;

    const pollInterval = setInterval(async () => {
      try {
        // Poll for updates every 30 seconds
        const response = await fetch('/api/realtime/poll/');
        if (response.ok) {
          const data = await response.json();
          if (data.updates) {
            setUpdates(prev => [...data.updates, ...prev.slice(0, 49)]);
          }
        } else if (response.status === 404) {
          // Endpoint doesn't exist, stop polling
          console.warn('Realtime polling endpoint not available');
          clearInterval(pollInterval);
        }
      } catch (err) {
        // Network error, continue polling
        console.warn('Polling failed, will retry:', err);
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, sseConnected]);

  return {
    updates,
    isConnected: sseConnected || isConnected,
    error,
    connect,
    disconnect,
  };
};
