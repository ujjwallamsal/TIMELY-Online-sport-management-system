import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for real-time updates via WebSocket and SSE fallback
 * @param {string} topic - The topic/channel to subscribe to
 * @param {function} onMessage - Callback function for received messages
 * @param {object} options - Configuration options
 */
export const useLiveChannel = (topic, onMessage, options = {}) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState(null);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  
  const {
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    enableSSEFallback = true,
    enableWebSocket = true,
    debug = false
  } = options;

  const log = (message, ...args) => {
    if (debug) {
      console.log(`[useLiveChannel:${topic}]`, message, ...args);
    }
  };

  const connectWebSocket = () => {
    if (!enableWebSocket || !user) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Support both event-specific and general topics
      const backendHost = '127.0.0.1:8000';
      const wsUrl = topic.startsWith('event_') 
        ? `${protocol}//${backendHost}/ws/events/${topic.replace('event_', '')}/`
        : `${protocol}//${backendHost}/ws/notifications/`;
      
      log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        log('WebSocket connected');
        setIsConnected(true);
        setConnectionType('websocket');
        setError(null);
        reconnectAttempts.current = 0;
        
        // Send authentication if user is logged in
        if (user) {
          ws.send(JSON.stringify({
            type: 'auth',
            user_id: user.id,
            token: localStorage.getItem('access_token')
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log('WebSocket message received:', data);
          
          if (data.type === 'connected') {
            log('Connection established for topic:', data.event_id || data.user_id);
            // Subscribe to specific streams based on topic
            if (topic.startsWith('event_')) {
              const eventId = topic.replace('event_', '');
              if (topic.includes('_schedule')) {
                ws.send(JSON.stringify({ type: 'subscribe_schedule' }));
              } else if (topic.includes('_results')) {
                ws.send(JSON.stringify({ type: 'subscribe_results' }));
              } else if (topic.includes('_announcements')) {
                ws.send(JSON.stringify({ type: 'subscribe_announcements' }));
              }
            }
          } else if (onMessage) {
            onMessage(data);
          }
        } catch (err) {
          log('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionType(null);
        
        if (event.code !== 1000) { // Not a normal closure
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        // Only log WebSocket errors in debug mode to reduce console spam
        if (process.env.NODE_ENV === 'development' && window.DEBUG_WEBSOCKETS) {
          log('WebSocket error:', error);
        }
        setError('WebSocket connection error');
        scheduleReconnect();
      };

    } catch (err) {
      log('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
      if (enableSSEFallback) {
        connectSSE();
      }
    }
  };

  const connectSSE = () => {
    if (!enableSSEFallback || !user) return;

    try {
      // Support both event-specific and general SSE endpoints
      const sseUrl = topic.startsWith('event_') 
        ? `/api/events/${topic.replace('event_', '').replace('_schedule', '').replace('_results', '').replace('_announcements', '')}/stream/`
        : `/api/notifications/stream/`;
      log('Connecting to SSE:', sseUrl);
      
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;
      setConnectionType('sse');

      eventSource.onopen = () => {
        log('SSE connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log('SSE message received:', data);
          
          if (onMessage) {
            onMessage(data);
          }
        } catch (err) {
          log('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = (error) => {
        log('SSE error:', error);
        setError('SSE connection error');
        eventSource.close();
        scheduleReconnect();
      };

    } catch (err) {
      log('Error creating SSE:', err);
      setError('Failed to create SSE connection');
    }
  };

  const scheduleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      log('Max reconnection attempts reached');
      setError('Connection failed after maximum attempts');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttempts.current += 1;
    const delay = reconnectInterval * Math.pow(2, reconnectAttempts.current - 1); // Exponential backoff
    
    log(`Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (connectionType === 'websocket' || !connectionType) {
        connectWebSocket();
      } else if (connectionType === 'sse') {
        connectSSE();
      }
    }, delay);
  };

  const disconnect = () => {
    log('Disconnecting...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setConnectionType(null);
    setError(null);
  };

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      log('Message sent via WebSocket:', message);
    } else {
      log('Cannot send message: WebSocket not connected');
    }
  };

  const ping = () => {
    sendMessage({
      type: 'ping',
      timestamp: Date.now()
    });
  };

  // Connect on mount and when user changes
  useEffect(() => {
    if (user && topic) {
      connectWebSocket();
    }

    return () => {
      disconnect();
    };
  }, [user, topic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionType,
    error,
    sendMessage,
    ping,
    disconnect,
    reconnect: () => {
      disconnect();
      reconnectAttempts.current = 0;
      if (enableWebSocket) {
        connectWebSocket();
      } else if (enableSSEFallback) {
        connectSSE();
      }
    }
  };
};

export default useLiveChannel;