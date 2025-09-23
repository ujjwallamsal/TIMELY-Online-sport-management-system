import { useEffect, useRef, useState } from 'react';

const useWebSocket = (url, options = {}) => {
  const [wsConnected, setWsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectInterval = 30000, // Reduced reconnection frequency to prevent spam
    pingInterval = 30000,
    ...wsOptions
  } = options;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Skip WebSocket connections if no URL provided or if backend is not available
    if (!url) {
      return;
    }

    try {
      // Convert relative URLs to absolute backend URLs
      let wsUrl = url;
      if (url && url.startsWith('/')) {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const backendHost = '127.0.0.1:8000';
        wsUrl = `${proto}://${backendHost}${url}`;
      }
      
      wsRef.current = new WebSocket(wsUrl, ...wsOptions);
      
      wsRef.current.onopen = (event) => {
        setWsConnected(true);
        console.log('WebSocket connected:', wsUrl);
        onOpen?.(event);
        
        // Start ping interval
        if (pingInterval > 0) {
          pingIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
          }, pingInterval);
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data, event);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = (event) => {
        setWsConnected(false);
        console.log('WebSocket disconnected:', url);
        onClose?.(event);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Reconnect after delay
        if (reconnectInterval > 0) {
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };
      
      wsRef.current.onerror = (error) => {
        // Reduce console spam - only log in debug mode
        if (process.env.NODE_ENV === 'development' && window.DEBUG_WEBSOCKETS && !wsRef.current._errorLogged) {
          console.warn('WebSocket connection failed - backend may not support WebSockets yet');
          wsRef.current._errorLogged = true;
        }
        setWsConnected(false);
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setWsConnected(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setWsConnected(false);
  };

  const sendMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    wsConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };
};

export default useWebSocket;