'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPendingOrders, PendingOrder } from '@/lib/utils/offlineQueue';
import { formatINR } from '@/lib/utils/currency';
import { useUIStore } from '@/lib/store/uiStore';
import { logger } from '@/lib/utils/logger';

export default function QueuedOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useUIStore((s) => s.showToast);

  const queueId = searchParams.get('queueId') ?? '';
  const storeName = searchParams.get('storeName') ?? 'this store';
  const totalParam = searchParams.get('total');
  const total = totalParam ? parseInt(totalParam, 10) : null;

  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Load pending queue count on mount
  useEffect(() => {
    getPendingOrders()
      .then(setPendingOrders)
      .catch((err) => {
        logger.error('Failed to load pending orders', { error: err });
        setPendingOrders([]);
      })
      .finally(() => setLoadingQueue(false));
  }, []);

  // Watch connectivity to update the status indicator
  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for ORDER_SYNCED / ORDER_SYNC_EXHAUSTED messages from the service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'ORDER_SYNCED') {
        // NEW-1: Show success toast so deep-linked users see confirmation (OfflineBanner
        // only covers users on other pages; queued-page visitors bypass it).
        showToast('Order placed successfully!', 'success');
        // Refresh the pending count when an order is placed by the SW
        getPendingOrders().then(setPendingOrders).catch(() => {});
      }
      // MED-2: Show error toast when background sync permanently failed after MAX_RETRIES
      if (event.data?.type === 'ORDER_SYNC_EXHAUSTED') {
        const data = event.data as { message?: string };
        showToast(
          (event.data as { message?: string }).message ?? 'Order could not be placed. Please try again.',
          'error'
        );
        // Refresh the list so the failed order disappears
        getPendingOrders().then(setPendingOrders).catch(() => {});
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [showToast]);

  const queueCount = pendingOrders.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-900"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">Order Queued</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Clock icon */}
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">Order Queued</h2>
        <p className="text-gray-600 text-sm max-w-xs mb-2">
          Your order at <span className="font-semibold text-gray-800">{storeName}</span> will be
          placed automatically when your connection is restored.
        </p>

        {total !== null && (
          <p className="text-sm text-gray-500 mb-6">
            Amount: <span className="font-semibold text-gray-900">{formatINR(total)}</span>
          </p>
        )}

        {/* Connectivity status pill */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 ${
            isOnline
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}
          />
          {isOnline ? 'Connected — syncing now...' : 'Offline — waiting for connection'}
        </div>

        {/* Queue details card */}
        <div className="w-full max-w-sm bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 text-left mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Offline Queue
          </p>

          {queueId && (
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Queue ID</span>
              <span className="font-mono text-xs text-gray-400 truncate max-w-[140px]">{queueId}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-600">
            <span>Orders waiting</span>
            <span className="font-semibold text-gray-900">
              {loadingQueue ? '...' : queueCount}
            </span>
          </div>

          {queueCount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
              {pendingOrders.map((order) => (
                <div key={order.id} className="flex justify-between text-xs text-gray-500">
                  <span className="font-mono truncate max-w-[160px]">{order.id}</span>
                  <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => {
              setLoadingQueue(true);
              getPendingOrders()
                .then(setPendingOrders)
                .catch(() => setPendingOrders([]))
                .finally(() => setLoadingQueue(false));
            }}
            className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loadingQueue ? 'Refreshing...' : `View queue (${queueCount} pending)`}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
