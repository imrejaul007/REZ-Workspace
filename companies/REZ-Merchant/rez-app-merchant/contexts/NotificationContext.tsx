import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '@/services/api/socket';
import { notificationsService } from '@/services/api/notifications';
import { useAuth } from './AuthContext';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { Notification, NotificationType } from '@/types/notifications';
import { logger } from '@/utils/logger';

interface NotificationContextType {
  unreadCount: number;
  unreadByType: Record<string, number>;
  latestNotification: Notification | null;
  showNotificationToast: (notification: Notification) => void;
  clearLatestNotification: () => void;
  refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated, merchant } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByType, setUnreadByType] = useState<Record<string, number>>({});
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  // Listen for real-time notification events
  useEffect(() => {
    if (!isAuthenticated || !merchant) {
      return;
    }

    logger.debug('📡 Setting up notification socket listeners...');

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      logger.debug('🔔 New notification received:', notification);

      // Update unread count
      setUnreadCount((prev) => prev + 1);

      // Update unread by type
      setUnreadByType((prev) => ({
        ...prev,
        [notification.type]: (prev[notification.type] || 0) + 1,
      }));

      // Set as latest notification for toast
      setLatestNotification(notification);

      // Invalidate notification queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.stats() });
    };

    // MERCH-023: Listen for notification read events and decrement badge count
    const handleNotificationRead = (data: { notificationId: string; type?: string }) => {
      logger.debug('✅ Notification marked as read:', data.notificationId);

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // MERCH-023: Also decrement type-specific counter
      if (data.type) {
        setUnreadByType((prev) => {
          const notificationType = data.type || '';
          return {
            ...prev,
            [notificationType]: Math.max(0, (prev[notificationType] || 0) - 1),
          };
        });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
    };

    // Listen for notification deleted events
    const handleNotificationDeleted = (data: { notificationId: string }) => {
      logger.debug('🗑️ Notification deleted:', data.notificationId);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
    };

    // Listen for unread count updates
    const handleUnreadCountUpdate = (data: { count: number; byType: Record<string, number> }) => {
      logger.debug('📊 Unread count updated:', data);
      setUnreadCount(data.count);
      setUnreadByType(data.byType);
    };

    // Subscribe to socket events
    socketService.on('notification:new', handleNewNotification);
    socketService.on('notification:read', handleNotificationRead);
    socketService.on('notification:deleted', handleNotificationDeleted);
    socketService.on('notification:unread-count', handleUnreadCountUpdate);

    // Cleanup
    return () => {
      logger.debug('🔌 Cleaning up notification socket listeners...');
      socketService.off('notification:new', handleNewNotification);
      socketService.off('notification:read', handleNotificationRead);
      socketService.off('notification:deleted', handleNotificationDeleted);
      socketService.off('notification:unread-count', handleUnreadCountUpdate);
    };
  }, [isAuthenticated, merchant, queryClient]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      // First try to get fresh data from the API
      const data = await notificationsService.getUnreadCount();
      setUnreadCount(data.unreadCount);
      setUnreadByType(data.byType);
    } catch {
      // Fall back to react-query cache if API call fails
      try {
        const cachedData = queryClient.getQueryData(queryKeys.notifications.unread());
        if (cachedData && typeof cachedData === 'object' && 'unreadCount' in cachedData) {
          const data = cachedData as { unreadCount: number; byType: Record<string, number> };
          setUnreadCount(data.unreadCount);
          setUnreadByType(data.byType);
        }
      } catch (error) {
        logger.error('Failed to refresh unread count:', error);
      }
    }
  }, [queryClient]);

  // Reset state on logout so stale counts are never shown to a different merchant
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setUnreadByType({});
      setLatestNotification(null);
    }
  }, [isAuthenticated]);

  // Fetch initial unread count when authenticated
  useEffect(() => {
    if (isAuthenticated && merchant) {
      refreshUnreadCount();
    }
  }, [isAuthenticated, merchant, refreshUnreadCount]);

  const showNotificationToast = useCallback((notification: Notification) => {
    setLatestNotification(notification);
  }, []);

  const clearLatestNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  const value: NotificationContextType = {
    unreadCount,
    unreadByType,
    latestNotification,
    showNotificationToast,
    clearLatestNotification,
    refreshUnreadCount,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
