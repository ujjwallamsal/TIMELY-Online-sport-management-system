// hooks/useSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Lightweight WebSocket hook with 30s polling fallback
 * @param {string} url - WebSocket URL
 * @param {object} options - Configuration options
 * @returns {object} - Socket state and methods
 */
export function useSocket(url, options = {}) {
  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    pollingInterval = 30000, // 30 seconds
    enablePolling = true,
    onMessage = null,
    onError = null,
    onConnect = null,
    onDisconnect = null,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);

  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const pollingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Polling fallback function
  const pollData = useCallback(async () => {
    if (!enablePolling || !url) return;
    
    try {
      // This would be replaced with actual API call
      // For now, just log that polling is happening
      console.log('Polling for updates...');
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, [enablePolling, url]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(pollData, pollingInterval);
  }, [pollData, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!url || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        stopPolling(); // Stop polling when WS is connected
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        onError?.(err);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // Start polling fallback
        if (enablePolling) {
          startPolling();
        }

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setError('Max reconnection attempts reached');
        }
      };

    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
      
      // Start polling fallback
      if (enablePolling) {
        startPolling();
      }
    }
  }, [url, isConnecting, reconnectInterval, maxReconnectAttempts, enablePolling, onConnect, onMessage, onError, onDisconnect, startPolling, stopPolling]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopPolling();
    setIsConnected(false);
    setIsConnecting(false);
  }, [stopPolling]);

  // Send message
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Send ping
  const ping = useCallback(() => {
    return sendMessage({
      type: 'ping',
      timestamp: Date.now()
    });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    ping,
  };
}

/**
 * Hook specifically for fixtures WebSocket
 * @param {number} eventId - Event ID
 * @param {object} options - Additional options
 * @returns {object} - Socket state and methods
 */
export function useFixturesSocket(eventId, options = {}) {
  const wsUrl = eventId ? `ws://127.0.0.1:8000/ws/fixtures/events/${eventId}/` : null;
  
  const handleMessage = useCallback((data) => {
    if (data.type === 'fixtures.updated' || data.type === 'fixtures.deleted') {
      console.log('Fixtures updated:', data);
      // Trigger any callbacks or state updates
      options.onFixturesUpdate?.(data);
    } else if (data.type === 'fixtures.entry_updated' || data.type === 'fixtures.entry_deleted') {
      console.log('Fixture entry updated:', data);
      options.onFixturesUpdate?.(data);
    }
  }, [options.onFixturesUpdate]);

  return useSocket(wsUrl, {
    ...options,
    onMessage: handleMessage,
  });
}

/**
 * Hook for fixtures group WebSocket (simplified interface)
 * @param {string} groupName - WebSocket group name (e.g., "fixtures:event:123")
 * @param {object} options - Additional options
 * @returns {object} - Socket state and methods
 */
export function useFixturesGroupSocket(groupName, options = {}) {
  const wsUrl = groupName ? `ws://127.0.0.1:8000/ws/fixtures/groups/${groupName}/` : null;
  
  const handleMessage = useCallback((data) => {
    if (data.type && data.type.startsWith('fixtures.')) {
      console.log('Fixtures group message:', data);
      options.onMessage?.(data);
    }
  }, [options.onMessage]);

  return useSocket(wsUrl, {
    ...options,
    onMessage: handleMessage,
  });
}

/**
 * Hook for notifications WebSocket
 * @param {number} userId - User ID
 * @param {object} options - Additional options
 * @returns {object} - Socket state and methods
 */
export function useNotificationsSocket(userId, options = {}) {
  const wsUrl = userId ? `ws://127.0.0.1:8000/ws/notify/user/${userId}/` : null;
  
  const handleMessage = useCallback((data) => {
    if (data.type === 'notify.new') {
      console.log('New notification:', data);
      options.onNotification?.(data);
    }
  }, [options.onNotification]);

  return useSocket(wsUrl, {
    ...options,
    onMessage: handleMessage,
  });
}

/**
 * Hook for messages WebSocket
 * @param {string} threadId - Thread ID
 * @param {object} options - Additional options
 * @returns {object} - Socket state and methods
 */
export function useMessagesSocket(threadId, options = {}) {
  const wsUrl = threadId ? `ws://127.0.0.1:8000/ws/messages/thread/${threadId}/` : null;
  
  const handleMessage = useCallback((data) => {
    if (data.type === 'message.new') {
      console.log('New message:', data);
      options.onMessage?.(data);
    } else if (data.type === 'thread.updated') {
      console.log('Thread updated:', data);
      options.onThreadUpdate?.(data);
    }
  }, [options.onMessage, options.onThreadUpdate]);

  return useSocket(wsUrl, {
    ...options,
    onMessage: handleMessage,
  });
}

/**
 * Hook for public spectator portal WebSocket subscriptions
 * @param {object} subscriptions - Object with subscription keys and callbacks
 * @param {object} options - Additional options
 * @returns {object} - Socket state and methods
 */
export function usePublicSocket(subscriptions = {}, options = {}) {
  const {
    onEventsUpdate = null,
    onFixturesUpdate = null,
    onResultsUpdate = null,
    onNewsUpdate = null,
    ...socketOptions
  } = subscriptions;

  // Create a single WebSocket connection for all public subscriptions
  const wsUrl = 'ws://127.0.0.1:8000/ws/public/';
  
  const handleMessage = useCallback((data) => {
    console.log('Public socket message:', data);
    
    // Handle different message types
    switch (data.type) {
      case 'events:list':
      case 'events:item':
        onEventsUpdate?.(data);
        break;
      case 'fixtures:event':
        onFixturesUpdate?.(data);
        break;
      case 'results:event':
        onResultsUpdate?.(data);
        break;
      case 'content:news':
        onNewsUpdate?.(data);
        break;
      default:
        // Handle any other message types
        if (data.type && data.type.includes(':')) {
          const [category] = data.type.split(':');
          switch (category) {
            case 'events':
              onEventsUpdate?.(data);
              break;
            case 'fixtures':
              onFixturesUpdate?.(data);
              break;
            case 'results':
              onResultsUpdate?.(data);
              break;
            case 'content':
              onNewsUpdate?.(data);
              break;
          }
        }
    }
  }, [onEventsUpdate, onFixturesUpdate, onResultsUpdate, onNewsUpdate]);

  return useSocket(wsUrl, {
    ...socketOptions,
    onMessage: handleMessage,
  });
}

/**
 * Hook for specific event WebSocket subscriptions
 * @param {number} eventId - Event ID
 * @param {object} options - Additional options
 * @returns {object} - Socket state and methods
 */
export function useEventSocket(eventId, options = {}) {
  const {
    onEventUpdate = null,
    onFixturesUpdate = null,
    onResultsUpdate = null,
    ...socketOptions
  } = options;

  const wsUrl = eventId ? `ws://127.0.0.1:8000/ws/events/${eventId}/` : null;
  
  const handleMessage = useCallback((data) => {
    console.log('Event socket message:', data);
    
    switch (data.type) {
      case 'event:updated':
        onEventUpdate?.(data);
        break;
      case 'fixtures:updated':
      case 'fixtures:deleted':
        onFixturesUpdate?.(data);
        break;
      case 'results:updated':
      case 'results:deleted':
        onResultsUpdate?.(data);
        break;
    }
  }, [onEventUpdate, onFixturesUpdate, onResultsUpdate]);

  return useSocket(wsUrl, {
    ...socketOptions,
    onMessage: handleMessage,
  });
}

export default useSocket;
