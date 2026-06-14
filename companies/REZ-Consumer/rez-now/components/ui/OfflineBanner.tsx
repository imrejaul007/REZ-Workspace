'use client';

import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import { cn } from '@/lib/utils/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SWMessageEvent extends MessageEvent {
  data: {
    type: string;
    orderId?: string;
    orderNumber?: string;
    message?: string;
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * OfflineBanner
 *
 * Shows a sticky bottom bar while the browser is offline:
 *   "You're offline — menu loaded from cache. Cart saved."
 *
 * Hides automatically when connectivity returns (with a brief "Back online"
 * flash via the shared Toast system).
 *
 * Also listens for the service-worker postMessage ORDER_SYNCED and fires a
 * "Your order was placed!" toast when a queued order is successfully submitted
 * in the background.
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Track whether we went offline at least once so the "Back online" toast
  // only fires after an actual outage, not on first mount.
  const wasOfflineRef = useRef(false);
  const showToast = useUIStore((s) => s.showToast);

  // ── Online / offline events ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const initiallyOffline = !navigator.onLine;
    if (initiallyOffline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding state from browser API on mount is intentional
      setIsOffline(true);
      wasOfflineRef.current = true;
    }

    function handleOffline() {
      setIsOffline(true);
      setDismissed(false);
      wasOfflineRef.current = true;
    }

    function handleOnline() {
      setIsOffline(false);
      setDismissed(false);
      if (wasOfflineRef.current) {
        showToast('Back online', 'success');
      }
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [showToast]);

  // ── Service-worker ORDER_SYNCED / ORDER_SYNC_EXHAUSTED messages ───────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    function handleSWMessage(event: SWMessageEvent) {
      if (event.data?.type === 'ORDER_SYNCED') {
        const identifier =
          event.data.orderNumber ?? event.data.orderId ?? 'Your offline order';
        showToast(
          `${identifier === 'Your offline order' ? identifier : `Order #${identifier}`} was placed!`,
          'success'
        );
      }
      // MED-2: Alert the user when background sync failed permanently after MAX_RETRIES.
      // Previously the order silently vanished from the queue with no user feedback.
      if (event.data?.type === 'ORDER_SYNC_EXHAUSTED') {
        showToast(
          event.data.message ?? 'Your offline order could not be placed. Please try again.',
          'error'
        );
      }
    }

    navigator.serviceWorker.addEventListener(
      'message',
      handleSWMessage as EventListener
    );
    return () => {
      navigator.serviceWorker.removeEventListener(
        'message',
        handleSWMessage as EventListener
      );
    };
  }, [showToast]);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 left-0 right-0 z-40 px-4 pointer-events-none"
    >
      <div
        className={cn(
          'mx-auto max-w-sm pointer-events-auto',
          'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
          'bg-orange-600 text-white text-sm font-medium'
        )}
      >
        {/* Inline wifi-off icon — no extra dependencies */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="w-5 h-5 shrink-0"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>

        <span className="flex-1 leading-snug">
          {"You're offline \u2014 menu loaded from cache. Cart saved."}
        </span>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss offline banner"
          className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          &#x2715;
        </button>
      </div>
    </div>
  );
}
