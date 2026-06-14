import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineService } from '../services/offline';
import { queryKeys } from './queries/queryKeys';
import { logger } from '@/utils/logger';

export interface NetworkStatus {
  isConnected: boolean;
  connectionType: string;
  isReachable: boolean;
  hasInternetConnection: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  lastConnectedAt: Date | null;
  syncStatus: {
    isSyncing: boolean;
    pendingActions: number;
    lastSyncAt: Date | null;
    syncErrors: string[];
  };
}

export const useNetworkStatus = () => {
  const queryClient = useQueryClient();

  const invalidateForAction = (actionType: string) => {
    // G-MA-C13 FIX: After an offline action syncs successfully, invalidate the
    // matching React Query caches so the UI reflects the latest server state.
    switch (actionType) {
      case 'CREATE_PRODUCT':
      case 'UPDATE_PRODUCT':
      case 'DELETE_PRODUCT':
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        break;
      case 'UPDATE_ORDER':
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        break;
      case 'APPROVE_CASHBACK':
      case 'REJECT_CASHBACK':
        queryClient.invalidateQueries({ queryKey: queryKeys.cashback.all });
        break;
    }
    // Always refresh dashboard since mutations affect revenue/analytics widgets.
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    connectionType: 'unknown',
    isReachable: true,
    hasInternetConnection: true,
    connectionQuality: 'unknown',
    lastConnectedAt: null,
    syncStatus: {
      isSyncing: false,
      pendingActions: 0,
      lastSyncAt: null,
      syncErrors: [],
    },
  });

  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  // Ref to track previous connection state inside the NetInfo listener (avoids stale closure)
  const prevIsConnectedRef = useRef<boolean>(true);
  const isSyncingRef = useRef<boolean>(false);

  // Determine connection quality based on connection type and details
  const getConnectionQuality = (state: NetInfoState): 'excellent' | 'good' | 'poor' | 'unknown' => {
    if (!state.isConnected) return 'unknown';

    switch (state.type) {
      case 'wifi':
        return 'excellent';
      case 'cellular':
        // Check cellular generation if available
        if (state.details && 'cellularGeneration' in state.details) {
          const generation = state.details.cellularGeneration;
          if (generation === '4g' || generation === '5g') return 'excellent';
          if (generation === '3g') return 'good';
          return 'poor';
        }
        return 'good';
      case 'ethernet':
        return 'excellent';
      case 'bluetooth':
        return 'poor';
      default:
        return 'unknown';
    }
  };

  // Update sync status
  const updateSyncStatus = async () => {
    try {
      const cacheInfo = await offlineService.getCacheInfo();
      setNetworkStatus((prev) => ({
        ...prev,
        syncStatus: {
          ...prev.syncStatus,
          pendingActions: cacheInfo.pendingActions,
          lastSyncAt: cacheInfo.lastSync,
        },
      }));
    } catch (error) {
      logger.error('Error updating sync status:', error);
    }
  };

  // Perform sync when network is restored
  const performSync = async () => {
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncErrors([]);

    try {
      setNetworkStatus((prev) => ({
        ...prev,
        syncStatus: { ...prev.syncStatus, isSyncing: true },
      }));

      const result = await offlineService.syncOfflineActions(invalidateForAction);

      if (__DEV__)
        logger.info(`Sync completed: ${result.successful} successful, ${result.failed} failed`);

      if (result.failed > 0) {
        setSyncErrors([`${result.failed} actions failed to sync`]);
      }

      setNetworkStatus((prev) => ({
        ...prev,
        syncStatus: {
          ...prev.syncStatus,
          isSyncing: false,
          lastSyncAt: new Date(),
          syncErrors: result.failed > 0 ? [`${result.failed} actions failed to sync`] : [],
        },
      }));

      // Update pending actions count
      await updateSyncStatus();
    } catch (error) {
      logger.error('Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setSyncErrors([errorMessage]);

      setNetworkStatus((prev) => ({
        ...prev,
        syncStatus: {
          ...prev.syncStatus,
          isSyncing: false,
          syncErrors: [errorMessage],
        },
      }));
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  };

  // Manual sync trigger
  const triggerSync = async (): Promise<boolean> => {
    if (!networkStatus.isConnected) {
      logger.warn('Cannot sync while offline');
      return false;
    }

    await performSync();
    return true;
  };

  // Clear sync errors
  const clearSyncErrors = () => {
    setSyncErrors([]);
    setNetworkStatus((prev) => ({
      ...prev,
      syncStatus: { ...prev.syncStatus, syncErrors: [] },
    }));
  };

  // Get human-readable status
  const getStatusMessage = (): string => {
    if (!networkStatus.isConnected) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (networkStatus.syncStatus.pendingActions > 0) {
      return `${networkStatus.syncStatus.pendingActions} pending actions`;
    }
    return 'Online';
  };

  // Get connection type display name
  const getConnectionTypeDisplay = (): string => {
    switch (networkStatus.connectionType) {
      case 'wifi':
        return 'Wi-Fi';
      case 'cellular':
        return 'Cellular';
      case 'ethernet':
        return 'Ethernet';
      case 'bluetooth':
        return 'Bluetooth';
      case 'wimax':
        return 'WiMAX';
      case 'vpn':
        return 'VPN';
      default:
        return 'Unknown';
    }
  };

  useEffect(() => {
    let lastConnectedTime: Date | null = null;

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isCurrentlyConnected = state.isConnected ?? false;
      // Use ref to avoid stale closure — prevIsConnectedRef always holds latest value
      const wasConnected = prevIsConnectedRef.current;

      // Track when we were last connected
      if (isCurrentlyConnected && !wasConnected) {
        lastConnectedTime = new Date();
      }

      // Update the ref so subsequent listener calls see the new value
      prevIsConnectedRef.current = isCurrentlyConnected;

      setNetworkStatus((prev) => ({
        ...prev,
        isConnected: isCurrentlyConnected,
        connectionType: state.type,
        isReachable: state.isInternetReachable ?? false,
        hasInternetConnection: state.isInternetReachable ?? false,
        connectionQuality: getConnectionQuality(state),
        lastConnectedAt: isCurrentlyConnected ? lastConnectedTime : prev.lastConnectedAt,
      }));

      // If we just came back online, perform sync
      if (isCurrentlyConnected && !wasConnected) {
        logger.info('Network restored, performing sync...');
        performSync();
      }
    });

    // Initial network state check
    NetInfo.fetch().then((state) => {
      setNetworkStatus((prev) => ({
        ...prev,
        isConnected: state.isConnected ?? false,
        connectionType: state.type,
        isReachable: state.isInternetReachable ?? false,
        hasInternetConnection: state.isInternetReachable ?? false,
        connectionQuality: getConnectionQuality(state),
        lastConnectedAt: state.isConnected ? new Date() : null,
      }));
    });

    // Update sync status periodically
    const syncStatusInterval = setInterval(updateSyncStatus, 30000); // Every 30 seconds

    // Initial sync status update
    updateSyncStatus();

    return () => {
      unsubscribe();
      clearInterval(syncStatusInterval);
    };
  }, []);

  return {
    ...networkStatus,
    isSyncing,
    syncErrors,
    triggerSync,
    clearSyncErrors,
    getStatusMessage,
    getConnectionTypeDisplay,
    // Helper methods
    isOnline: networkStatus.isConnected && networkStatus.hasInternetConnection,
    isOffline: !networkStatus.isConnected || !networkStatus.hasInternetConnection,
    hasGoodConnection:
      networkStatus.connectionQuality === 'excellent' || networkStatus.connectionQuality === 'good',
    canSync: networkStatus.isConnected && networkStatus.hasInternetConnection && !isSyncing,
  };
};
