'use client';

import { notFound } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '../../../StoreContextProvider';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { creditScanPayCoins } from '@/lib/api/scanPayment';
import { getWalletBalance } from '@/lib/api/wallet';
import { formatINR } from '@/lib/utils/currency';
import { WalletBalance } from '@/lib/types';
import { usePaymentConfirmation } from '@/lib/hooks/usePaymentConfirmation';
import Button from '@/components/ui/Button';

export default function ScanPayConfirmPage({
  params,
}: {
  params: Promise<{ storeSlug: string; paymentId: string }>;
}) {
  const { paymentId, storeSlug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { store } = useStore();
  const { isLoggedIn } = useAuthStore();
  const { showToast } = useUIStore();

  const amountPaise = parseInt(searchParams.get('amount') ?? '0', 10);
  if (isNaN(amountPaise) || amountPaise < 0) {
    notFound();
  }
  const razorpayOrderId = searchParams.get('razorpayOrderId') || paymentId;

  // NW-CRIT-006: 'pending' means payment may still be processing (e.g. UPI).
  // Do NOT show full success UI — user should wait or check status.
  const [confirmed, setConfirmed] = useState(false);
  const [paymentUncertain, setPaymentUncertain] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [coinsDone, setCoinsDone] = useState(false);

  // R4 Sub-2s Settlement: wait for Socket.IO payment:confirmed before showing full success.
  // This handles cases where the user navigated here directly (e.g. browser back from UPI app).
  // NW-CRIT-012 fix: subscribe(storeSlug, razorpayOrderId) joins the store room so the
  // customer socket receives payment:confirmed emitted by the backend (to `store-${storeSlug}`).
  const { state: socketState, subscribe } = usePaymentConfirmation();

  useEffect(() => {
    if (!razorpayOrderId || !storeSlug) {
      setConfirmed(true);
      return;
    }
    subscribe(storeSlug, razorpayOrderId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [razorpayOrderId, storeSlug]);

  useEffect(() => {
    if (socketState.phase === 'confirmed') {
      setConfirmed(true);
    } else if (socketState.phase === 'failed') {
      setConfirmed(false);
      showToast('Payment verification failed. Contact support if amount was deducted.', 'error');
    } else if (socketState.phase === 'timeout') {
      // NW-CRIT-006: Do NOT show success UI on timeout. UPI payments can take up to 15 min.
      setPaymentUncertain(true);
      showToast('Payment may still be processing. Please check back in a few minutes.', 'info');
    }
  }, [socketState, showToast]);

  // Credit coins once (best-effort, non-blocking)
  useEffect(() => {
    if (!store.isProgramMerchant || !isLoggedIn || coinsDone) return;
    setCoinsDone(true);
    creditScanPayCoins(paymentId)
      .then(({ coinsEarned }) => {
        setCoinsEarned(coinsEarned);
        return getWalletBalance();
      })
      .then(setWallet)
      .catch(() => {
        // Coin credit is best-effort — don't show error for this
      });
  }, [store.isProgramMerchant, isLoggedIn, paymentId, coinsDone]);

  // NW-CRIT-006: 'paymentUncertain' shows a "processing" screen instead of full success.
  // User can still navigate, but should not assume payment is settled.
  if (paymentUncertain) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Payment may still be processing</h1>
            <p className="text-sm text-gray-500 mt-2">UPI payments can take a few minutes to confirm. Please check back shortly.</p>
          </div>
          {amountPaise > 0 && (
            <p className="text-2xl font-bold text-gray-900">{formatINR(amountPaise)}</p>
          )}
          <p className="text-xs text-gray-400">Ref: {paymentId}</p>
        </div>
        <div className="px-6 pb-10 space-y-3">
          <Button
            fullWidth size="lg" variant="primary"
            onClick={() => router.push(`/${store.slug}/pay`)}
          >
            Check Payment Status
          </Button>
          <Button
            fullWidth size="lg" variant="ghost"
            onClick={() => router.push(`/${store.slug}`)}
          >
            Back to Store
          </Button>
        </div>
      </div>
    );
  }

  // Show verifying screen while waiting for Socket.IO confirmation
  if (!confirmed && razorpayOrderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Verifying payment...</h1>
            <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your transaction.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs text-gray-400">Ref: {paymentId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
        {/* Success animation */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
          {amountPaise > 0 && (
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatINR(amountPaise)}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">paid to <strong>{store.name}</strong></p>
        </div>

        {/* Coins earned */}
        {store.isProgramMerchant && coinsEarned > 0 && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 w-full max-w-xs">
            <span className="text-3xl">🪙</span>
            <div className="text-left">
              <p className="text-sm font-bold text-indigo-900">+{coinsEarned} REZ Coins earned!</p>
              {wallet && (
                <p className="text-xs text-indigo-600">Total balance: {wallet.coins} coins · {formatINR(wallet.coins * 100)}</p>
              )}
            </div>
          </div>
        )}

        {/* Open in REZ App — links to wallet so coins are visible in the consumer app */}
        {store.isProgramMerchant && coinsEarned > 0 && (
          <a
            href="rezapp://wallet"
            className="mt-4 w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold rounded-2xl px-5 py-3 transition-colors"
          >
            View coins in REZ App
          </a>
        )}

        {/* Ref */}
        <p className="text-xs text-gray-400">Ref: {paymentId}</p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-10 space-y-3">
        <Button
          fullWidth size="lg" variant="secondary"
          onClick={() => router.push(`/${store.slug}/pay`)}
        >
          Pay Again
        </Button>
        <Button
          fullWidth size="lg" variant="ghost"
          onClick={() => router.push(`/${store.slug}`)}
        >
          {store.hasMenu ? 'Back to Menu' : 'Done'}
        </Button>
      </div>
    </div>
  );
}
