import { useEffect, useState } from 'react';
import { useSSE } from './useSSE';
import { useAuth } from '../auth/useAuth';

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
    onError: () => {
      setIsConnected(false);
    },
    onClose: () => {
      setIsConnected(false);
    },
    maxRetries: 5,
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
        }
      } catch (err) {
        console.error('Polling failed:', err);
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
