'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '../../StoreContextProvider';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useRazorpay } from '@/lib/hooks/useRazorpay';
import { createScanPayOrder, verifyScanPayment } from '@/lib/api/scanPayment';
import { getBillDetails } from '@/lib/api/bill';
import { getWalletBalance } from '@/lib/api/wallet';
import { formatINR } from '@/lib/utils/currency';
import { WalletBalance, BillStatus } from '@/lib/types';
import Button from '@/components/ui/Button';
import NfcPayButton from '@/components/payment/NfcPayButton';
import Image from 'next/image';

export default function ScanPayCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { store } = useStore();
  const { user, isLoggedIn } = useAuthStore();
  const { openLoginModal, showToast } = useUIStore();
  const { ready: rzpReady, loadFailed: rzpFailed, openPayment, ensureLoaded } = useRazorpay();

  const rawAmount = searchParams.get('amount');
  const rawBillId = searchParams.get('billId');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  const rawPaymentId = searchParams.get('paymentId');
  const amountPaise = parseInt(rawAmount || '0', 10);
  const [billId, setBillId] = useState<string | null>(rawBillId);
  const [billTotal, setBillTotal] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  const [billStatus, setBillStatus] = useState<BillStatus | null>(null);
  const [billStoreSlug, setBillStoreSlug] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  const [billRazorpayOrderId, setBillRazorpayOrderId] = useState<string | null>(null);
  const [loadingBill, setLoadingBill] = useState(!!rawBillId);
  const [billLoadError, setBillLoadError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [paying, setPaying] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  const [validationError, setValidationError] = useState<string | null>(null);
  // NW-CRIT-013: NFC confirmation state — prevents phantom order creation on repeated taps.
  const [pendingNfcRecord, setPendingNfcRecord] = useState<string | null>(null);

  // Guard: load bill details if billId is present
  useEffect(() => {
    if (!rawBillId) {
      // Validate amount-only flow
      const MIN_AMOUNT = 100;
      const MAX_AMOUNT = 10000000;

      if (Number.isNaN(amountPaise)) {
        setValidationError('Invalid amount provided');
        router.replace(`/${store.slug}/pay`);
        return;
      }

      if (!amountPaise || amountPaise < MIN_AMOUNT) {
        setValidationError('Amount must be at least Rs. 1');
        router.replace(`/${store.slug}/pay`);
        return;
      }

      if (amountPaise > MAX_AMOUNT) {
        setValidationError('Amount cannot exceed Rs. 100,000');
        router.replace(`/${store.slug}/pay`);
        return;
      }

      setValidationError(null);
      return;
    }

    // Bill Builder flow: load bill details
    setLoadingBill(true);
    setBillLoadError(null);

    getBillDetails(rawBillId)
      .then((bill) => {
        setBillId(bill.billId);
        setBillTotal(bill.total);
        setBillStatus(bill.status);
        setBillStoreSlug(bill.storeSlug);

        if (bill.status === 'paid') {
          setBillLoadError('This bill has already been paid.');
          return;
        }
        if (bill.status === 'expired' || bill.status === 'cancelled') {
          setBillLoadError(`This bill is ${bill.status} and can no longer be paid.`);
          return;
        }

        // Fetch razorpay order id for this bill
        const orderId = (bill as unknown as { razorpayOrderId?: string; razorpay_order_id?: string }).razorpayOrderId || (bill as unknown as { razorpayOrderId?: string; razorpay_order_id?: string }).razorpay_order_id || null;
        if (orderId) setBillRazorpayOrderId(orderId);

        setValidationError(null);
      })
      .catch((err) => {
        setBillLoadError(err instanceof Error ? err.message : 'Failed to load bill');
        setValidationError('Failed to load bill');
        router.replace(`/${store.slug}/pay`);
      })
      .finally(() => setLoadingBill(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawBillId, store.slug, router]);

  // Guard: must be logged in
  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => router.refresh());
    }
  }, [isLoggedIn, openLoginModal, router]);

  // Load wallet if Program Merchant
  useEffect(() => {
    if (store.isProgramMerchant && isLoggedIn) {
      getWalletBalance().then(setWallet).catch(() => {});
    }
  }, [store.isProgramMerchant, isLoggedIn]);

  // Effective amount: use bill total if coming from Bill Builder, else use amount param
  const effectiveAmount = billId ? (billTotal ?? 0) : amountPaise;

  // NOTE: This is a LOCAL ESTIMATE only. The actual coins are computed by the backend
  // (via /api/store-payment/coins/credit). Do not use this value for financial calculations.
  // Formula: coins = floor(rupees * (cashbackRate / 100))
  //   where rupees = effectiveAmount / 100 (paise → rupees) and cashbackRate = baseCashbackPercent
  // NA-HIGH-01 FIX: Removed spurious / 10 that caused coins to floor to 0 for most amounts
  const estimatedCoins = store.isProgramMerchant
    ? Math.floor((effectiveAmount / 100) * ((store.rewardRules.baseCashbackPercent || 0) / 100))
    : 0;

  async function handlePay() {
    if (rzpFailed) { showToast('Payment service unavailable. Please pay another way.', 'error'); return; }
    // NW-MED-015: Trigger lazy-load of the Razorpay script before opening payment.
    if (!rzpReady) {
      showToast('Loading payment gateway...', 'info');
      try { await ensureLoaded(); } catch { /* loadFailed flag updated by ensureLoaded */ }
    }

    setPaying(true);
    try {
      let order: Awaited<ReturnType<typeof createScanPayOrder>>;
      let redirectAmount = effectiveAmount;

      if (billId) {
        // Bill Builder flow: create order for this specific bill
        order = await createScanPayOrder(billStoreSlug || store.slug, billTotal!);
        redirectAmount = billTotal!;
      } else {
        // Direct amount flow
        order = await createScanPayOrder(store.slug, amountPaise);
      }

      openPayment({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        order_id: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: store.name,
        description: billId ? `Bill Payment at ${store.name}` : `Payment at ${store.name}`,
        prefill: { contact: user?.phone, name: user?.name },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            // NW-CRIT-010 fix: order.paymentId no longer exists in backend response.
            // razorpay_payment_id is the actual payment ID returned by the Razorpay SDK.
            // Use razorpayOrderId as the confirm-page identifier (stable across retries).
            await verifyScanPayment(response.razorpay_payment_id, response);
            router.push(
              `/${store.slug}/pay/confirm/${order.razorpayOrderId}` +
              `?amount=${redirectAmount}${billId ? `&billId=${billId}` : ''}`
            );
          } catch {
            showToast('Payment verification failed. Contact the merchant with your payment reference.', 'error');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled.', 'info');
            setPaying(false);
          },
        },
      });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Payment failed. Please try again.', 'error');
      setPaying(false);
    }
  }

  // NFC tap-to-pay: show user confirmation before creating any Razorpay order.
  // NW-CRIT-013: Repeated NFC taps must not create multiple phantom orders.
  // Instead of immediately creating an order, show a confirmation dialog.
  function handleNfcConfirmed(record: string) {
    if (paying) return;
    setPendingNfcRecord(record);
  }

  async function confirmNfcPayment() {
    const record = pendingNfcRecord;
    if (!record) return;
    setPendingNfcRecord(null);
    setPaying(true);
    try {
      let order: Awaited<ReturnType<typeof createScanPayOrder>>;
      let redirectAmount = effectiveAmount;

      if (billId) {
        order = await createScanPayOrder(billStoreSlug || store.slug, billTotal!);
        redirectAmount = billTotal!;
      } else {
        order = await createScanPayOrder(store.slug, amountPaise);
      }

      // NW-CRIT-010 fix: order.paymentId removed — use razorpayOrderId for confirm URL.
      await verifyScanPayment(record || 'nfc-tap', {
        razorpay_order_id: order.razorpayOrderId,
        razorpay_payment_id: record || 'nfc-tap',
        razorpay_signature: 'nfc',
      });
      router.push(
        `/${store.slug}/pay/confirm/${order.razorpayOrderId}` +
        `?amount=${redirectAmount}${billId ? `&billId=${billId}` : ''}`
      );
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : 'NFC payment failed. Please try another method.',
        'error',
      );
      setPaying(false);
    }
  }

  // NW-CRIT-013: NFC confirmation dialog — prevents accidental/phatom order creation on repeated taps.
  if (pendingNfcRecord !== null) {
    const confirmAmount = billId ? (billTotal ?? 0) : amountPaise;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">📱</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Confirm NFC Payment</h2>
            <p className="text-sm text-gray-500 mt-2">
              Pay <strong>{formatINR(confirmAmount)}</strong> at {store.name}?
            </p>
          </div>
        </div>
        <div className="px-6 pb-10 space-y-3">
          <Button
            fullWidth size="lg" variant="primary"
            onClick={confirmNfcPayment}
          >
            Confirm &amp; Pay {formatINR(confirmAmount)}
          </Button>
          <Button
            fullWidth size="lg" variant="ghost"
            onClick={() => setPendingNfcRecord(null)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!amountPaise && !billId) return null;
  if (loadingBill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (billLoadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm max-w-sm w-full">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Unable to Load Bill</h2>
          <p className="text-sm text-gray-500 mt-2">{billLoadError}</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">{billId ? 'Bill Payment' : 'Confirm Payment'}</h1>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {/* Store + amount card */}
        <div className="bg-white rounded-2xl px-5 py-5 text-center space-y-3 shadow-sm">
          {store.logo && (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 mx-auto">
              <Image
                src={store.logo}
                alt={store.name}
                fill
                sizes="64px"
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              />
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Paying</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">{formatINR(effectiveAmount)}</p>
            <p className="text-sm text-gray-600 mt-1">to <strong>{store.name}</strong></p>
          </div>
        </div>

        {/* Coins earn preview */}
        {store.isProgramMerchant && estimatedCoins > 0 && !loadingBill && !billLoadError && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <span className="text-2xl">🪙</span>
            <div>
              <p className="text-sm font-semibold text-indigo-900">You&apos;ll earn ~{estimatedCoins} REZ coins</p>
              {wallet && <p className="text-xs text-indigo-600">Current balance: {wallet.coins} coins</p>}
            </div>
          </div>
        )}

        {/* Paying as */}
        {user && (
          <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
              {user.name ? user.name[0].toUpperCase() : user.phone.slice(-2)}
            </div>
            <div>
              <p className="text-xs text-gray-500">Paying as</p>
              <p className="text-sm font-semibold text-gray-900">{user.name || user.phone}</p>
            </div>
          </div>
        )}

        {rzpFailed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
            Payment gateway unavailable. Please pay directly at the counter.
          </div>
        )}

        {/* NFC tap-to-pay (Chrome Android only — hidden on unsupported browsers) */}
        <NfcPayButton onNfcConfirmed={handleNfcConfirmed} />
      </div>

      {/* Pay button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <Button
          fullWidth size="lg"
          loading={paying}
          disabled={rzpFailed || !rzpReady || !isLoggedIn}
          onClick={handlePay}
        >
          {rzpReady ? `Pay ${formatINR(effectiveAmount)}` : 'Loading...'}
        </Button>
      </div>
    </div>
  );
}
