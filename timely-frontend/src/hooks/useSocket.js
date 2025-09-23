import { useEffect, useRef, useState, useCallback } from 'react';

const useSocket = (url, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected', 'connecting', 'disconnected', 'polling'
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const maxReconnectAttempts = useRef(10);
  const baseReconnectInterval = useRef(5000);

  // Add fallback for WebSocket URL
  const wsUrl = url || 'ws://127.0.0.1:8000/ws/spectator/';

  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    onPolling,
    reconnectInterval = 5000,
    pingInterval = 30000,
    pollingInterval = 20000,
    enablePolling = true,
    maxReconnectAttempts: maxAttempts = 10
  } = options;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    console.log(`WebSocket connecting to ${wsUrl} (attempt ${reconnectAttempts + 1})`);

    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = (event) => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        console.log('WebSocket connected:', wsUrl);
        onOpen?.(event);
        
        // Clear polling when connected
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Start ping interval
        if (pingInterval > 0) {
          pingIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ 
                type: 'ping', 
                timestamp: Date.now() 
              }));
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
        setIsConnected(false);
        setConnectionStatus('disconnected');
        console.log('WebSocket disconnected:', wsUrl, 'Code:', event.code);
        onClose?.(event);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Start polling fallback if enabled
        if (enablePolling && pollingInterval > 0) {
          setConnectionStatus('polling');
          pollingIntervalRef.current = setInterval(() => {
            console.log('Polling fallback active');
            if (onPolling) {
              onPolling();
            }
          }, pollingInterval);
        }
        
        // Reconnect with exponential backoff
        if (reconnectAttempts < maxAttempts) {
          const delay = Math.min(
            baseReconnectInterval.current * Math.pow(2, reconnectAttempts),
            30000 // Max 30 seconds
          );
          
          setReconnectAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxAttempts})`);
        } else {
          console.log('Max reconnection attempts reached, giving up');
          setConnectionStatus('disconnected');
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [url, reconnectAttempts, maxAttempts, enablePolling, pollingInterval, pingInterval, onOpen, onClose, onError, onPolling, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const forceReconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  useEffect(() => {
    if (wsUrl) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [wsUrl, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connectionStatus,
    reconnectAttempts,
    sendMessage,
    connect,
    disconnect,
    forceReconnect
  };
};

export default useSocket;