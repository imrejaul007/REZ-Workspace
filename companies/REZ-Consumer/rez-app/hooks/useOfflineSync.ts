import { useCallback, useMemo } from 'react';
import { useOfflineSyncStore } from '@/stores/offlineSyncStore';
import type { OfflineActionType } from '@/services/offlineSyncService';

/**
 * Convenience hook for the offline sync queue.
 * Wraps the Zustand store with computed values and typed enqueue helpers.
 *
 * Usage:
 *   const { queueVisitSubmission, queueReferralShare, queueRewardClaim, hasPending, canSync } = useOfflineSync();
 */
export function useOfflineSync() {
  const store = useOfflineSyncStore();

  const hasPending = store.pendingCount > 0;
  const hasFailed = store.failedCount > 0;
  const canSync = store.pendingCount > 0 && store.isOnline && !store.isSyncing;
  const isEmpty = store.queue.length === 0;
  const totalCount = store.queue.length;

  const queueVisitSubmission = useCallback(
    (data: {
      storeId: string;
      visitDate: string;
      visitTime: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      paymentMethod?: 'pay_at_store' | 'none';
    }) => store.enqueue('visit_submission', data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.enqueue]
  );

  const queueReferralShare = useCallback(
    (platform: 'whatsapp' | 'telegram' | 'email' | 'sms') =>
      store.enqueue('referral_share', { platform }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.enqueue]
  );

  const queueRewardClaim = useCallback(
    () => store.enqueue('reward_claim', {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.enqueue]
  );

  const pendingActions = useMemo(
    () => store.queue.filter((a: { status: string }) => a.status === 'pending'),
    [store.queue]
  );

  const failedActions = useMemo(
    () => store.queue.filter((a: { status: string }) => a.status === 'failed'),
    [store.queue]
  );

  return {
    // State
    queue: store.queue,
    isSyncing: store.isSyncing,
    isOnline: store.isOnline,
    lastSyncResult: store.lastSyncResult,
    error: store.error,
    pendingCount: store.pendingCount,
    failedCount: store.failedCount,

    // Computed
    hasPending,
    hasFailed,
    canSync,
    isEmpty,
    totalCount,
    pendingActions,
    failedActions,

    // Typed enqueuers
    queueVisitSubmission,
    queueReferralShare,
    queueRewardClaim,

    // Generic actions
    enqueue: store.enqueue,
    syncAll: store.syncAll,
    retryFailed: store.retryFailed,
    remove: store.remove,
    clearCompleted: store.clearCompleted,
    clearAll: store.clearAll,
    refreshQueue: store.refreshQueue,
    initialize: store.initialize,
  };
}

export default useOfflineSync;
