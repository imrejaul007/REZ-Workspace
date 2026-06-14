import { useEffect, useState, useCallback } from 'react';
import * as Network from 'expo-network';
import { useAppStore } from '../store/appStore';
import { offline } from '../services/offline';

export function useOnlineStatus() {
  const { isOnline, setIsOnline, setSyncStatus, syncStatus } = useAppStore();
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const state = await Network.getNetworkStateAsync();
      const online = state.isConnected ?? false;
      setIsOnline(online);

      // Update sync status
      const status = await offline.getSyncStatus();
      setSyncStatus({
        lastSyncAt: status.lastSyncAt,
        pendingActions: status.pendingActions,
      });
    } catch (error) {
      logger.error('Failed to check network status:', error);
    } finally {
      setIsChecking(false);
    }
  }, [setIsOnline, setSyncStatus]);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up interval to check periodically
    const interval = setInterval(checkConnection, 30000);

    // Start background sync
    offline.startBackgroundSync(60000);

    return () => {
      clearInterval(interval);
      offline.stopBackgroundSync();
    };
  }, [checkConnection]);

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      return { success: 0, failed: 0 };
    }
    return await offline.syncQueue();
  }, [isOnline]);

  return {
    isOnline,
    isChecking,
    checkConnection,
    syncNow,
    pendingActions: syncStatus.pendingActions,
    lastSyncAt: syncStatus.lastSyncAt,
  };
}
