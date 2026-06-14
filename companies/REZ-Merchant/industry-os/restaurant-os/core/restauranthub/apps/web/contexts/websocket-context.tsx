'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth/auth-provider';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: unknown[];
  clearNotifications: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  clearNotifications: () => {},
});

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('restauranthub_token');
      // Connect to WebSocket server
      const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
      });

      // Connection event handlers
      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('connected', (data) => {
        // Successfully authenticated
      });

      // Real-time notifications
      socketInstance.on('orderStatusUpdate', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'order-update',
          title: 'Order Status Updated',
          message: `Order ${data.orderNumber || data.orderId} status changed to ${data.status}`,
          data,
          timestamp: new Date(),
        }]);
      });

      socketInstance.on('newOrder', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'new-order',
          title: 'New Order Received',
          message: `New order #${data.orderNumber} from ${data.customerName}`,
          data,
          timestamp: new Date(),
        }]);
      });

      socketInstance.on('notification', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'notification',
          title: data.title || 'Notification',
          message: data.message || data.content,
          data,
          timestamp: new Date(),
        }]);
      });

      // Handle pending notifications
      socketInstance.on('pendingNotifications', (pendingNotifications) => {
        const mappedNotifications = pendingNotifications.map((notification) => ({
          id: notification.id,
          type: 'pending',
          title: notification.title,
          message: notification.content,
          data: notification.data,
          timestamp: new Date(notification.createdAt),
        }));
        setNotifications(prev => [...prev, ...mappedNotifications]);
      });

      // Auto-join user room
      socketInstance.emit('joinRoom', { room: user.id });

      // Auto-join role room
      socketInstance.emit('joinRoom', { room: `role:${user.role}` });

      // Auto-join restaurant room if user is restaurant owner
      if (user.role === 'RESTAURANT' && user.restaurant?.id) {
        socketInstance.emit('joinRoom', { room: `restaurant:${user.restaurant.id}` });
      }

      setSocket(socketInstance);

      // Cleanup function
      return () => {
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    socket,
    isConnected,
    notifications,
    clearNotifications,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};