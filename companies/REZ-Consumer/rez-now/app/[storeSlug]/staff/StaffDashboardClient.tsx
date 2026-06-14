'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { getActiveCalls, updateCallStatus, WaiterCallRecord } from '@/lib/api/waiterStaff';

const POLL_INTERVAL_MS = 8_000;

// ─── PIN gate helpers ──────────────────────────────────────────────────────────

function getExpectedPin(storeSlug: string): string {
  // Deterministic: last 4 chars of slug, digits only, zero-padded if needed
  const digits = storeSlug.replace(/\D/g, '');
  const pinSource = digits.slice(-4).padStart(4, '0');
  return pinSource.length >= 4 ? pinSource.slice(-4) : storeSlug.slice(-4);
}

function storageKey(storeSlug: string): string {
  return `staff_unlocked_${storeSlug}`;
}

function isUnlocked(storeSlug: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(storageKey(storeSlug)) === '1';
}

function setUnlocked(storeSlug: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(storageKey(storeSlug), '1');
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface PinGateProps {
  storeSlug: string;
  onUnlock: () => void;
}

function PinGate({ storeSlug, onUnlock }: PinGateProps) {
  const t = useTranslations('staff');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === getExpectedPin(storeSlug)) {
      setUnlocked(storeSlug);
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h1 className="text-xl font-semibold text-gray-800">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pin')}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="staff-pin" className="sr-only">
            {t('pin')}
          </label>
          <input
            id="staff-pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'staff-pin-error' : undefined}
            className={`w-full text-center text-2xl tracking-[0.5em] border-2 rounded-xl py-3 outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-500'
            }`}
            placeholder="••••"
            autoFocus
          />
          {error && (
            <p id="staff-pin-error" role="alert" className="text-sm text-red-500 text-center">{t('wrongPin')}</p>
          )}
          <button
            type="submit"
            disabled={pin.length < 4}
            className="bg-indigo-600 text-white rounded-xl py-3 font-medium disabled:opacity-40 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {t('unlock')}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Call card ─────────────────────────────────────────────────────────────────

interface CallCardProps {
  call: WaiterCallRecord;
  onAcknowledge: (requestId: string) => void;
  onResolve: (requestId: string) => void;
  fading: boolean;
}

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const t = useTranslations('staff');
  const [seconds, setSeconds] = useState(() =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000),
  );

  useEffect(() => {
    const id = setInterval(
      () => setSeconds(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [createdAt]);

  return <span className="text-xs text-gray-500">{t('calledAgo', { seconds })}</span>;
}

function CallCard({ call, onAcknowledge, onResolve, fading }: CallCardProps) {
  const t = useTranslations('staff');

  const cardColor =
    call.status === 'acknowledged'
      ? 'bg-amber-50 border-amber-300'
      : 'bg-white border-gray-200';

  return (
    <div
      className={`border rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-all duration-1000 ${cardColor} ${
        fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-800 text-base">
            {t('table', { number: call.tableNumber })}
          </p>
          {call.reason && (
            <p className="text-sm text-gray-600 mt-0.5">{call.reason}</p>
          )}
        </div>
        <ElapsedTimer createdAt={call.createdAt} />
      </div>

      <div className="flex gap-2">
        {call.status === 'pending' && (
          <button
            onClick={() => onAcknowledge(call.requestId)}
            aria-label={`${t('acknowledge')} table ${call.tableNumber}`}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {t('acknowledge')}
          </button>
        )}
        {call.status === 'acknowledged' && (
          <span className="flex-1 text-center text-sm text-amber-700 font-medium py-2">
            ✓ {t('acknowledge')}d
          </span>
        )}
        <button
          onClick={() => onResolve(call.requestId)}
          aria-label={`${t('resolved')} table ${call.tableNumber}`}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          {t('resolved')}
        </button>
      </div>
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────

interface StaffDashboardClientProps {
  storeSlug: string;
}

export default function StaffDashboardClient({ storeSlug }: StaffDashboardClientProps) {
  const t = useTranslations('staff');

  // Initialise unlocked state from sessionStorage (client-only)
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    setUnlocked(isUnlocked(storeSlug));
  }, [storeSlug]);

  const [calls, setCalls] = useState<WaiterCallRecord[]>([]);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      const data = await getActiveCalls(storeSlug);
      setCalls(data);
      setLastRefresh(new Date());
    } catch {
      // Silently keep last known data — staff sees stale but doesn't crash
    }
  }, [storeSlug]);

  // Start/stop polling when unlocked state changes
  useEffect(() => {
    if (!unlocked) {
      if (pollerRef.current) clearInterval(pollerRef.current);
      return;
    }

    setLoading(true);
    fetchCalls().finally(() => setLoading(false));
    pollerRef.current = setInterval(fetchCalls, POLL_INTERVAL_MS);

    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [unlocked, fetchCalls]);

  async function handleAcknowledge(requestId: string) {
    try {
      await updateCallStatus(requestId, 'acknowledged');
      setCalls((prev) =>
        prev.map((c) => (c.requestId === requestId ? { ...c, status: 'acknowledged' } : c)),
      );
    } catch {
      // leave card as-is; next poll will sync
    }
  }

  async function handleResolve(requestId: string) {
    try {
      await updateCallStatus(requestId, 'resolved');
      // Fade out then remove
      setFadingIds((prev) => new Set(prev).add(requestId));
      setTimeout(() => {
        setCalls((prev) => prev.filter((c) => c.requestId !== requestId));
        setFadingIds((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
      }, 1000);
    } catch {
      // leave card as-is
    }
  }

  function handleManualRefresh() {
    setLoading(true);
    fetchCalls().finally(() => setLoading(false));
  }

  if (!unlocked) {
    return (
      <PinGate
        storeSlug={storeSlug}
        onUnlock={() => setUnlocked(true)}
      />
    );
  }

  const activeCount = calls.filter((c) => !fadingIds.has(c.requestId)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-800">{t('title')}</h1>
          <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-medium">
            Staff View
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <span
              className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5"
              aria-label={t('activeCalls', { count: activeCount })}
            >
              {t('activeCalls', { count: activeCount })}
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Refresh"
          >
            <svg
              className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-lg mx-auto p-4 flex flex-col gap-3">
        {lastRefresh && (
          <p className="text-xs text-gray-400 text-right">
            Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        {calls.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg
              className="w-16 h-16 mb-4 text-green-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-base font-medium">{t('noCalls')}</p>
          </div>
        ) : (
          calls.map((call) => (
            <CallCard
              key={call.requestId}
              call={call}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              fading={fadingIds.has(call.requestId)}
            />
          ))
        )}
      </main>
    </div>
  );
}
