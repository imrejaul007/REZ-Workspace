'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import { getQueueCount } from '@/lib/utils/offlineQueue';
import { cn } from '@/lib/utils/cn';

// ── Wifi-off SVG icon (inline, no extra deps) ─────────────────────────────────

function WifiOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  // Track whether we went offline at least once this session so we only fire
  // the "Back online!" toast after an actual outage, not on first mount.
  const wasOfflineRef = useRef(false);
  const showToast = useUIStore((s) => s.showToast);

  // Refresh the queued-order count whenever the banner is visible
  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await getQueueCount();
      setQueueCount(count);
    } catch {
      setQueueCount(0);
    }
  }, []);

  useEffect(() => {
    // Seed initial state from the browser's connectivity API
    const initiallyOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (initiallyOffline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding state from browser API on mount is intentional
      setIsOffline(true);
      wasOfflineRef.current = true;
      refreshQueueCount();
    }

    function handleOffline() {
      setIsOffline(true);
      setDismissed(false);
      wasOfflineRef.current = true;
      refreshQueueCount();
    }

    function handleOnline() {
      setIsOffline(false);
      setDismissed(false);
      setQueueCount(0);
      if (wasOfflineRef.current) {
        showToast('Back online!', 'success');
      }
    }

    // NW-CRIT-007: Listen for offline order sync failures — show a persistent banner
    // so users know their order was not submitted and can contact support.
    function handleOrderSyncFailed(event: Event) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally unused, just need to consume the event
      const { id, storeSlug } = (event as CustomEvent).detail;
      setDismissed(false);
      showToast('Order could not be synced. Contact support with your order reference.', 'error');
      refreshQueueCount();
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('rez:order-sync-failed', handleOrderSyncFailed);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('rez:order-sync-failed', handleOrderSyncFailed);
    };
  }, [showToast, refreshQueueCount]);

  // Periodically re-count while offline so the number stays fresh
  useEffect(() => {
    if (!isOffline || dismissed) return;
    const interval = setInterval(refreshQueueCount, 5000);
    return () => clearInterval(interval);
  }, [isOffline, dismissed, refreshQueueCount]);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // Fixed above the mobile nav (assumed ~64px / bottom-16). z-40 sits
        // below modals (z-50) but above regular page content.
        'fixed bottom-16 left-0 right-0 z-40 px-4 pointer-events-none',
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-sm pointer-events-auto',
          'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
          'bg-orange-600 text-white text-sm font-medium',
        )}
      >
        <WifiOffIcon className="w-5 h-5" />

        <span className="flex-1 leading-snug">
          {"You're offline \u2014 changes will sync when reconnected"}
          {queueCount > 0 && (
            <span className="ml-1 font-semibold">
              ({queueCount} queued {queueCount === 1 ? 'order' : 'orders'})
            </span>
          )}
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
