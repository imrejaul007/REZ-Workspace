'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { callWaiter, getWaiterCallStatus } from '@/lib/api/waiter';
import { useUIStore } from '@/lib/store/uiStore';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface WaiterCallButtonProps {
  storeSlug: string;
  tableNumber?: string | null;
}

const COOLDOWN_SECONDS = 60;
const POLL_INTERVAL_MS = 10_000;

type Priority = 'normal' | 'urgent';
type RequestType = 'general' | 'order' | 'payment' | 'complaint' | 'celebration';

interface CallOptions {
  priority: Priority;
  requestType: RequestType;
  specialRequest?: string;
  hasAllergenAlert: boolean;
}

function getCooldownKey(storeSlug: string, tableNumber: string): string {
  return `rez_waiter_cooldown_${storeSlug}_${tableNumber}`;
}

function getRemainingCooldown(storeSlug: string, tableNumber: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(getCooldownKey(storeSlug, tableNumber));
  if (!raw) return 0;
  const expiresAt = parseInt(raw, 10);
  if (isNaN(expiresAt)) return 0;
  const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

function setCooldown(storeSlug: string, tableNumber: string): void {
  if (typeof window === 'undefined') return;
  const expiresAt = Date.now() + COOLDOWN_SECONDS * 1000;
  localStorage.setItem(getCooldownKey(storeSlug, tableNumber), String(expiresAt));
}

const REQUEST_TYPES: { id: RequestType; label: string; icon: string; description: string }[] = [
  { id: 'general', label: 'General Help', icon: '👋', description: 'Need assistance with anything' },
  { id: 'order', label: 'Place Order', icon: '📝', description: 'Ready to order or add items' },
  { id: 'payment', label: 'Request Bill', icon: '💳', description: 'Ready to pay the bill' },
  { id: 'complaint', label: 'Issue', icon: '⚠️', description: 'Something needs attention' },
  { id: 'celebration', label: 'Celebration', icon: '🎉', description: 'Special occasion setup' },
];

const PRIORITY_OPTIONS: { id: Priority; label: string; color: string; bgColor: string }[] = [
  { id: 'normal', label: 'Normal', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  { id: 'urgent', label: 'Urgent', color: 'text-red-700', bgColor: 'bg-red-100' },
];

export default function WaiterCallButton({ storeSlug, tableNumber }: WaiterCallButtonProps) {
  const t = useTranslations('waiter');
  const tCommon = useTranslations('common');
  const showToast = useUIStore((s) => s.showToast);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [callId, setCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'pending' | 'acknowledged' | 'resolved' | null>(null);

  // Enhanced options state
  const [selectedPriority, setSelectedPriority] = useState<Priority>('normal');
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType>('general');
  const [specialRequest, setSpecialRequest] = useState('');
  const [hasAllergenAlert, setHasAllergenAlert] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore cooldown from sessionStorage on mount
  useEffect(() => {
    if (!tableNumber) return;
    const remaining = getRemainingCooldown(storeSlug, tableNumber);
    if (remaining > 0) {
      setCountdown(remaining);
    }
  }, [storeSlug, tableNumber]);

  // Tick countdown every second
  useEffect(() => {
    if (countdown <= 0) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          countdownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [countdown]);

  // Poll waiter call status
  const startPolling = useCallback(
    (id: string) => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      pollTimerRef.current = setInterval(async () => {
        try {
          const result = await getWaiterCallStatus(id);
          setCallStatus(result.status);

          if (result.status === 'acknowledged') {
            showToast(t('calledHint'), 'success');
            clearInterval(pollTimerRef.current!);
            pollTimerRef.current = null;
          } else if (result.status === 'resolved') {
            clearInterval(pollTimerRef.current!);
            pollTimerRef.current = null;
          }
        } catch {
          // Best-effort polling
        }
      }, POLL_INTERVAL_MS);
    },
    [showToast, t]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  if (!tableNumber) return null;

  async function handleConfirm() {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const callOptions: CallOptions = {
        priority: selectedPriority,
        requestType: selectedRequestType,
        specialRequest: specialRequest.trim() || undefined,
        hasAllergenAlert,
      };
      const result = await callWaiter(storeSlug, tableNumber!, callOptions);
      setCallId(result.requestId);
      setCallStatus('pending');
      setCooldown(storeSlug, tableNumber!);
      setCountdown(COOLDOWN_SECONDS);
      showToast(t('called'), 'success');
      if (result.requestId) {
        startPolling(result.requestId);
      }
      // Reset options
      setSelectedPriority('normal');
      setSelectedRequestType('general');
      setSpecialRequest('');
      setHasAllergenAlert(false);
    } catch {
      showToast('Could not reach the waiter system. Please ask staff directly.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const isCoolingDown = countdown > 0;

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => {
          if (!isCoolingDown && !loading) setConfirmOpen(true);
        }}
        disabled={isCoolingDown || loading}
        aria-label={isCoolingDown ? `Call again in ${countdown}s` : t('callButton')}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5',
          'w-14 h-14 rounded-full shadow-lg',
          'text-white text-xs font-semibold',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
          'disabled:cursor-not-allowed',
          isCoolingDown
            ? 'bg-green-600 opacity-80'
            : loading
            ? 'bg-indigo-400'
            : 'bg-indigo-600 hover:bg-indigo-700'
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
        <span className="leading-none text-[10px]">
          {isCoolingDown ? `${countdown}s` : 'Waiter'}
        </span>
      </button>

      {/* Enhanced confirmation modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="waiter-modal-title"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
          <div className="relative w-full max-w-md mx-4 mb-6 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👋</span>
                  <div>
                    <h2 id="waiter-modal-title" className="text-lg font-bold text-white">Call Waiter</h2>
                    <p className="text-xs text-indigo-100">Table {tableNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="text-white/80 hover:text-white"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Priority Selection */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedPriority(opt.id)}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                        selectedPriority === opt.id
                          ? opt.bgColor + ' ' + opt.color + ' border-current'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {opt.id === 'urgent' && <span>🚨</span>}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Request Type */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                  Request Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REQUEST_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedRequestType(type.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-center transition-all',
                        selectedRequestType === type.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Request */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                  Special Request (Optional)
                </label>
                <textarea
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder="Any specific instructions..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Allergen Alert */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAllergenAlert}
                  onChange={(e) => setHasAllergenAlert(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Allergen Alert</span>
                    <p className="text-xs text-gray-500">Notify staff about food allergies</p>
                  </div>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={handleConfirm}
                >
                  {selectedPriority === 'urgent' ? '🚨 Call Immediately' : 'Call Waiter'}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  fullWidth
                  onClick={() => setConfirmOpen(false)}
                >
                  {tCommon('cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
