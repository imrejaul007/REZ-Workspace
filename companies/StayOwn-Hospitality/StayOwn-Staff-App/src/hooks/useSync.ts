/**
 * UseSync Hook - React hook for sync state and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { SyncResult } from '../types';

export function useSync() {
  const { syncState, sync, pendingCount, conflictCount, isOnline, isSyncing } = useApp();
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const triggerSync = useCallback(async () => {
    const result = await sync();
    setLastSyncResult(result);
    return result;
  }, [sync]);

  return {
    // State
    isOnline,
    isSyncing,
    pendingCount,
    conflictCount,
    lastSync: syncState.lastSync,
    lastSyncResult,
    hasConflicts: conflictCount > 0,
    hasPending: pendingCount > 0,

    // Actions
    sync: triggerSync,
  };
}

export function useOfflineIndicator() {
  const { isOnline, pendingCount, conflictCount, lastSync } = useApp();

  const getStatusColor = () => {
    if (!isOnline) return '#EF4444'; // Red - offline
    if (conflictCount > 0) return '#F59E0B'; // Orange - conflicts
    if (pendingCount > 0) return '#3B82F6'; // Blue - syncing pending
    return '#10B981'; // Green - all synced
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (conflictCount > 0) return `${conflictCount} conflict${conflictCount > 1 ? 's' : ''}`;
    if (pendingCount > 0) return `${pendingCount} pending`;
    return 'Synced';
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never synced';
    const diff = Date.now() - new Date(lastSync).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(lastSync).toLocaleDateString();
  };

  return {
    isOnline,
    pendingCount,
    conflictCount,
    statusColor: getStatusColor(),
    statusText: getStatusText(),
    lastSyncText: formatLastSync(),
  };
}

export default useSync;
