// src/hooks/useLiveChannel.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './useToast';

/**
 * Custom hook for real-time data updates using WebSocket with EventSource fallback
 * @param {string} topic - The channel topic to subscribe to
 * @param {Object} options - Configuration options
 * @returns {Object} - Live data and connection status
 */
export const useLiveChannel = (topic, options = {}) => {
  const {
    url = process.env.VITE_WS_URL || 'ws://localhost:8000/ws/',
    fallbackUrl = process.env.VITE_EVENTSOURCE_URL || 'http://localhost:8000/events/',
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    onMessage = null,
    onError = null,
    onConnect = null,
    onDisconnect = null,
    autoConnect = true
  } = options;

  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const { showToast } = useToast();

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = `${url}${topic}/`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        setReconnectAttempts(0);
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setData(message);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();
        
        // Attempt reconnection if not manually closed
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (err) => {
        setError(err);
        setIsConnecting(false);
        onError?.(err);
      };

    } catch (err) {
      setError(err);
      setIsConnecting(false);
      onError?.(err);
    }
  }, [url, topic, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onConnect, onMessage, onDisconnect, onError]);

  const connectEventSource = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    try {
      const esUrl = `${fallbackUrl}${topic}/`;
      eventSourceRef.current = new EventSource(esUrl);

      eventSourceRef.current.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        setReconnectAttempts(0);
        onConnect?.();
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setData(message);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse EventSource message:', err);
        }
      };

      eventSourceRef.current.onerror = (err) => {
        setError(err);
        setIsConnecting(false);
        onError?.(err);
        
        // Attempt WebSocket fallback
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, reconnectInterval);
        }
      };

    } catch (err) {
      setError(err);
      setIsConnecting(false);
      onError?.(err);
    }
  }, [fallbackUrl, topic, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onConnect, onMessage, onError]);

  const connect = useCallback(() => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    // Try WebSocket first, fallback to EventSource
    if (typeof WebSocket !== 'undefined') {
      connectWebSocket();
    } else {
      connectEventSource();
    }
  }, [isConnecting, connectWebSocket, connectEventSource]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && topic) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, topic, connect, disconnect]);

  // Show connection status toasts
  useEffect(() => {
    if (error && reconnectAttempts > 0) {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: `Failed to connect to live updates. Attempting reconnection... (${reconnectAttempts}/${maxReconnectAttempts})`
      });
    }
  }, [error, reconnectAttempts, maxReconnectAttempts, showToast]);

  return {
    data,
    isConnected,
    isConnecting,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage
  };
};

export default useLiveChannel;
