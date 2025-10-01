import { useEffect, useState, useRef } from 'react';

interface SSEOptions {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: Event) => void;
  retryInterval?: number;
  maxRetries?: number;
}

export const useSSE = (options: SSEOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(options.url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = (event) => {
        setIsConnected(true);
        setError(null);
        setRetryCount(0);
        options.onOpen?.(event);
      };

      eventSource.onmessage = (event) => {
        options.onMessage?.(event);
      };

      eventSource.onerror = (event) => {
        setIsConnected(false);
        
        // Check if it's a 406 error or similar server rejection
        if (eventSource.readyState === EventSource.CLOSED) {
          setError('Server rejected connection (406) - falling back to polling');
          // Don't retry SSE if server rejects it
          return;
        }
        
        setError('Connection error');
        options.onError?.(event);

        // Auto-retry with exponential backoff only for network errors
        if (retryCount < (options.maxRetries || 5)) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      eventSource.onclose = (event) => {
        setIsConnected(false);
        options.onClose?.(event);
      };
    } catch (err) {
      setError('Failed to create SSE connection');
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [options.url]);

  return {
    isConnected,
    error,
    retryCount,
    connect,
    disconnect,
  };
};
