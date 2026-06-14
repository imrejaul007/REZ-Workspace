'use client';

import { useState, useCallback, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { formatINR } from '@/lib/utils/currency';
import { buildUPILinks, openUPIApp, isUPIAvailable } from '@/lib/utils/upi';
import { usePaymentConfirmation } from '@/lib/hooks/usePaymentConfirmation';
import { checkPaymentStatus } from '@/lib/api/scanPayment';

export interface PaymentOptionsProps {
  razorpayOrderId: string;
  /** Amount in paise */
  amount: number;
  /** Merchant VPA — when provided, per-app UPI buttons are rendered */
  vpa?: string;
  merchantName: string;
  onRazorpaySelect: () => void;
  onUPISelect: (app: 'phonepe' | 'gpay' | 'paytm' | 'generic') => void;
  onPayAtCounter: () => void;
}

interface UPIAppButton {
  id: 'phonepe' | 'gpay' | 'paytm' | 'generic';
  label: string;
  icon: string;
}

const UPI_APPS: UPIAppButton[] = [
  { id: 'phonepe', label: 'PhonePe', icon: '💜' },
  { id: 'gpay', label: 'GPay', icon: '🔵' },
  { id: 'paytm', label: 'Paytm', icon: '🔷' },
  { id: 'generic', label: 'Other UPI', icon: '📲' },
];

const UPI_URL_MAP: Record<string, 'phonePe' | 'gpay' | 'paytm' | 'generic'> = {
  phonepe: 'phonePe',
  gpay: 'gpay',
  paytm: 'paytm',
  generic: 'generic',
};

interface UPIStatus {
  state: 'waiting' | 'success' | 'failed' | 'timeout';
  message: string;
  paymentId?: string;
}

export default function PaymentOptions({
  amount,
  vpa,
  merchantName,
  razorpayOrderId,
  onRazorpaySelect,
  onUPISelect,
  onPayAtCounter,
}: PaymentOptionsProps) {
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [upiStatus, setUpiStatus] = useState<UPIStatus | null>(null);
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  // NW-MED-018: Tracks the authoritative backend status after a polling timeout,
  // before showing the Retry button. null = not yet checked.
  const [preRetryStatus, setPreRetryStatus] = useState<string | null>(null);

  // NW-CRIT-012 fix: use subscribe(storeSlug, razorpayOrderId) which joins the store room
  // via join-store, ensuring the socket receives payment:confirmed events from the backend.
  const { state: socketState, subscribe, disconnect } = usePaymentConfirmation();

  const upiLinks = vpa
    ? buildUPILinks({ vpa, name: merchantName, amount, txnRef: razorpayOrderId })
    : null;

  const isMobile = isUPIAvailable();

  // Sync socket state changes into the UPI modal UI
  useEffect(() => {
    if (socketState.phase === 'confirmed') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing socket phase to UI state is intentional
      setUpiStatus({
        state: 'success',
        message: 'Payment confirmed!',
        paymentId: socketState.event.paymentId,
      });
      const storeSlug = window.location.pathname.split('/')[1] || '';
      setTimeout(() => {
        window.location.href = `/${storeSlug}/pay/confirm/${socketState.event.paymentId}?amount=${amount}&razorpayOrderId=${socketState.event.razorpayOrderId}`;
      }, 1500);
    } else if (socketState.phase === 'failed') {
      setUpiStatus({ state: 'failed', message: socketState.reason || 'Payment was not completed.' });
    } else if (socketState.phase === 'polling') {
      // NW-CRIT-006: Socket timed out; now polling backend for actual payment status.
      // The 90s socket window wasn't enough for this UPI payment. Backend polling will
      // determine the real status — do NOT show "timed out" to the user.
      setUpiStatus({
        state: 'waiting',
        message: 'Checking payment status...',
      });
    }
    // NW-CRIT-006: 'timeout' phase removed — socket timeout now triggers polling fallback.
    // The 'timeout' state is no longer reachable since startPolling() takes over.
  }, [socketState, amount]);

  // NW-MED-018: After polling fails, query checkPaymentStatus before showing the Retry button.
  // This prevents double charges when the UPI payment succeeded but the socket/polling missed it.
  useEffect(() => {
    if (socketState.phase !== 'failed' || upiStatus?.state !== 'failed') return;
    // Using setTimeout to defer state update and avoid cascading renders (react-hooks/set-state-in-effect)
    const timeoutId = setTimeout(() => {
      // Reset any prior pre-retry status
      setPreRetryStatus(null);
      checkPaymentStatus(razorpayOrderId)
        .then((result) => {
          if (result.status === 'completed') {
            setUpiStatus({ state: 'success', message: 'Payment confirmed!', paymentId: result.transactionId });
            const storeSlug = window.location.pathname.split('/')[1] || '';
            setTimeout(() => {
              window.location.href = `/${storeSlug}/pay/confirm/${result.transactionId ?? razorpayOrderId}?amount=${amount}`;
            }, 1500);
          } else {
            // Genuine failure — allow retry
            setPreRetryStatus(result.status);
          }
        })
        .catch(() => {
          // Network error — allow retry but don't assume success
          setPreRetryStatus('failed');
        });
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [socketState.phase, upiStatus?.state, razorpayOrderId, amount]);

  /**
   * NW-CRIT-012 fix: subscribe(storeSlug) joins the store room via join-store.
   * The backend emits payment:confirmed to `store-${storeSlug}`, so the customer
   * socket now receives it and the UI transitions from waiting → success.
   */
  const startUPIPayment = useCallback(async (app: string) => {
    setShowUPIModal(true);
    setSelectedApp(app);
    setUpiStatus({ state: 'waiting', message: `Waiting for ${app} payment...` });

    // Extract storeSlug from URL path: /${storeSlug}/pay/...
    const storeSlug = window.location.pathname.split('/')[1] || '';
    subscribe(storeSlug, razorpayOrderId);
  }, [subscribe, razorpayOrderId]);

  const handleUPISelect = useCallback((app: 'phonepe' | 'gpay' | 'paytm' | 'generic') => {
    if (!upiLinks) return;
    const urlKey = UPI_URL_MAP[app] || 'generic';
    const fallbackUrl = `${window.location.origin}${window.location.pathname}`;
    openUPIApp(upiLinks[urlKey], fallbackUrl, 2000);
    startUPIPayment(app);
    onUPISelect(app);
  }, [upiLinks, onUPISelect, startUPIPayment]);

  const closeModal = () => {
    // NW-MED-008: Disconnect the payment socket when the UPI modal is closed.
    // A late payment:confirmed event arriving after dismissal could otherwise
    // trigger an unexpected redirect via window.location.href.
    disconnect();
    setShowUPIModal(false);
    setUpiStatus(null);
  };

  return (
    <>
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900">Choose payment method</h2>

        {/* UPI Intent — PRIMARY */}
        {vpa && (
          <div className="bg-white border border-indigo-200 rounded-xl px-4 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">📱</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Pay with UPI app</p>
                <p className="text-xs text-gray-500 mt-0.5">Fast · Zero fees · {merchantName}</p>
              </div>
              {!isMobile && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Desktop</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {UPI_APPS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => handleUPISelect(id)}
                  disabled={!isMobile}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1',
                    isMobile
                      ? 'border-indigo-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed',
                  )}
                >
                  <span className="text-lg leading-none">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">Paying to {merchantName} · {vpa}</p>
          </div>
        )}

        {/* Collapsible: Other methods */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            onClick={() => setShowOtherMethods((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💳</span>
              <span className="text-sm font-semibold text-gray-700">Other payment methods</span>
            </div>
            <svg className={cn('w-4 h-4 text-gray-400 transition-transform', showOtherMethods && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showOtherMethods && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none">💳</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Razorpay</p>
                  <p className="text-xs text-gray-500 mt-0.5">UPI · Cards · Wallets · Net banking</p>
                </div>
                <Button size="sm" variant="secondary" onClick={onRazorpaySelect}>Pay</Button>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none">🧾</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Pay at the counter</p>
                  <p className="text-xs text-gray-500 mt-0.5">Place your order now, pay when you collect</p>
                </div>
                <Button size="sm" variant="ghost" onClick={onPayAtCounter}>Use</Button>
              </div>
            </div>
          )}
        </div>

        {!vpa && (
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none">🧾</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Pay at the counter</p>
              <p className="text-xs text-gray-500 mt-0.5">Place your order now, pay when you collect</p>
            </div>
            <Button size="sm" variant="ghost" onClick={onPayAtCounter}>Use</Button>
          </div>
        )}
      </div>

      {/* UPI Waiting Modal */}
      {showUPIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5 text-center">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto',
              upiStatus?.state === 'success' ? 'bg-green-100' :
              upiStatus?.state === 'failed' || upiStatus?.state === 'timeout' ? 'bg-red-100' :
              'bg-indigo-100',
            )}>
              {upiStatus?.state === 'success' ? <span className="text-3xl">✅</span> :
               upiStatus?.state === 'failed' || upiStatus?.state === 'timeout' ? <span className="text-3xl">❌</span> :
               <span className="text-3xl animate-bounce">⏳</span>}
            </div>
            <div>
              <p className="text-sm text-gray-500">Pay</p>
              <p className="text-3xl font-bold text-gray-900">{formatINR(amount)}</p>
              <p className="text-xs text-gray-400 mt-1">to {merchantName}</p>
            </div>
            <p className={cn(
              'text-sm font-medium',
              upiStatus?.state === 'success' ? 'text-green-600' :
              upiStatus?.state === 'failed' || upiStatus?.state === 'timeout' ? 'text-red-600' :
              'text-gray-700',
            )}>
              {upiStatus?.state === 'success' ? 'Payment confirmed! Redirecting...' :
               upiStatus?.state === 'failed' ? 'Payment not completed.' :
               upiStatus?.state === 'timeout' ? upiStatus.message :
               upiStatus?.message}
            </p>
            {upiStatus?.state === 'waiting' && (
              <p className="text-xs text-gray-400">Return to this app to complete — or wait for confirmation</p>
            )}
            {upiStatus?.state !== 'success' && (
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1"
                  onClick={() => { closeModal(); setShowOtherMethods(true); }}>
                  Other method
                </Button>
                {/* NW-MED-018: Only show Retry after checkPaymentStatus confirms failure.
                    If payment succeeded, user is redirected to confirm page above. */}
                {(upiStatus?.state === 'failed' || upiStatus?.state === 'timeout') && preRetryStatus != null && (
                  <Button variant="primary" className="flex-1"
                    onClick={() => { closeModal(); startUPIPayment(selectedApp || 'generic'); }}>
                    Retry
                  </Button>
                )}
                {upiStatus?.state === 'waiting' && (
                  <Button variant="ghost" className="flex-1" onClick={closeModal}>Close</Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
