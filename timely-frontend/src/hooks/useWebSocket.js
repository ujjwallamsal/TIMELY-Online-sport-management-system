import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useWebSocket() {
  const { user, refreshUser } = useAuth();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const eventHandlersRef = useRef(new Map());
  const attemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!user) return;

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = (import.meta.env.VITE_WS_URL) || `${proto}://127.0.0.1:8000/ws/user/`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected for user updates');
      // Store WebSocket reference globally for event management
      window.ws = wsRef.current;
      attemptsRef.current = 0;
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle user updates
        if (data.type === 'user.updated') {
          console.log('User updated via WebSocket:', data.user_data);
          refreshUser();
        }
        
        // Handle event updates
        if (data.type === 'event.changed') {
          console.log('Event updated via WebSocket:', data.event_data);
          // Trigger all registered event handlers
          eventHandlersRef.current.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error('Error in event handler:', error);
            }
          });
        }
        
        // Handle other event types
        if (data.type && data.type.startsWith('event.')) {
          console.log(`Event WebSocket message: ${data.type}`, data);
          // Trigger all registered event handlers
          eventHandlersRef.current.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error('Error in event handler:', error);
            }
          });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    wsRef.current.onclose = () => {
      if (attemptsRef.current >= 5) {
        console.log('WebSocket disconnected, stopping retries in dev.');
        return;
      }
      attemptsRef.current += 1;
      const delayMs = Math.min(3000 * attemptsRef.current, 15000);
      console.log('WebSocket disconnected, attempting to reconnect...');
      // Clear global reference
      window.ws = null;
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, delayMs);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [user, refreshUser]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    // Clear global reference
    window.ws = null;
  }, []);

  // Function to register event handlers
  const onEvent = useCallback((handler) => {
    const id = Date.now() + Math.random();
    eventHandlersRef.current.set(id, handler);
    return () => eventHandlersRef.current.delete(id);
  }, []);

  // Function to subscribe to specific event types
  const subscribeToEvent = useCallback((eventType, handler) => {
    const id = Date.now() + Math.random();
    const wrappedHandler = (data) => {
      if (data.type === eventType) {
        handler(data);
      }
    };
    eventHandlersRef.current.set(id, wrappedHandler);
    return () => eventHandlersRef.current.delete(id);
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return { 
    connected: wsRef.current?.readyState === WebSocket.OPEN,
    onEvent,
    subscribeToEvent
  };
}
