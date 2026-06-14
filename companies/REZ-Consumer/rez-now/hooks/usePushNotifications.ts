import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

interface UsePushNotificationsResult {
  permission: NotificationPermission | 'unknown';
  token: string | null;
  error: string | null;
  requestPermission: () => Promise<NotificationPermission>;
  isSupported: boolean;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission);
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      return 'denied';
    }
  }, [isSupported]);

  return {
    permission,
    token,
    error,
    requestPermission,
    isSupported,
  };
}
