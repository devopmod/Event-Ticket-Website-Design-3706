import { useEffect, useRef, useState } from 'react';

// Custom hook for WebSocket management
export const useWebSocket = (eventId, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    // In a real application, this would connect to your WebSocket server
    // For now, we'll simulate a WebSocket connection
    try {
      // Simulate WebSocket connection
      const mockWs = {
        readyState: 1, // WebSocket.OPEN
        send: (data) => {
          console.log('WebSocket send:', data);
        },
        close: () => {
          setIsConnected(false);
        },
        addEventListener: (event, handler) => {
          // Simulate message events for testing
          if (event === 'message') {
            // Store handler for potential use
            mockWs._messageHandler = handler;
          }
        },
        removeEventListener: () => {},
        // Method to simulate receiving messages (for testing)
        _simulateMessage: (data) => {
          if (mockWs._messageHandler) {
            mockWs._messageHandler({ data: JSON.stringify(data) });
          }
        }
      };

      wsRef.current = mockWs;
      setIsConnected(true);
      reconnectAttempts.current = 0;

      // Simulate connection events
      mockWs.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      console.log(`WebSocket connected for event: ${eventId}`);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      handleReconnect();
    }
  };

  const handleReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      console.log(`WebSocket reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    } else {
      console.error('WebSocket max reconnection attempts reached');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  };

  useEffect(() => {
    if (eventId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [eventId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};

export default useWebSocket;