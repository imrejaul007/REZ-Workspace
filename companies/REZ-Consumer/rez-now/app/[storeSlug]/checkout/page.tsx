'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useStore } from '../StoreContextProvider';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useRazorpay } from '@/lib/hooks/useRazorpay';
import { createRazorpayOrder, verifyPayment } from '@/lib/api/payment';
import { getWalletBalance } from '@/lib/api/wallet';
import { formatINR } from '@/lib/utils/currency';
import { buildUPILinks, openUPIApp } from '@/lib/utils/upi';
import { WalletBalance, RazorpayOrderResponse, CouponValidateResponse } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import Button from '@/components/ui/Button';
import { useTrack } from '@/lib/analytics/events';
import PaymentOptions from '@/components/checkout/PaymentOptions';
import SplitBillModal from '@/components/checkout/SplitBillModal';
import ScheduleModal, { formatScheduledTime } from '@/components/checkout/ScheduleModal';
import { queueOrder, registerBackgroundSync } from '@/lib/utils/offlineQueue';
import CouponInput from '@/components/checkout/CouponInput';
import { validateCoupon } from '@/lib/api/cart';
import PushPromptBanner from '@/components/ui/PushPromptBanner';
import { checkDelivery, type DeliveryCheck, type DeliveryAddress } from '@/lib/api/delivery';

const TIP_OPTIONS = [0, 5, 10, 15]; // percent

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations('checkout');
  const tDelivery = useTranslations('delivery');
  const tCart = useTranslations('cart');
  const searchParams = useSearchParams();
  const { store } = useStore();
  const { items, subtotal, storeSlug, tableNumber, setScheduledFor: storeSetScheduledFor } = useCartStore();
  const { user, isLoggedIn } = useAuthStore();
  const { openLoginModal, showToast } = useUIStore();
  const { ready: rzpReady, loadFailed: rzpFailed, openPayment, ensureLoaded } = useRazorpay();
  const track = useTrack();

  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>(tableNumber ? 'dine_in' : 'takeaway');
  const [tipPercent, setTipPercent] = useState(0);
  const [donation, setDonation] = useState(false);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [paying, setPaying] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitInfo, setSplitInfo] = useState<{ perPersonAmount: number; numPeople: number } | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledFor, setScheduledForLocal] = useState<string | null>(null);
  const [scheduleForLater, setScheduleForLater] = useState(false);

  // Delivery state
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({ line1: '', city: '', pincode: '' });
  const [deliveryCheck, setDeliveryCheck] = useState<DeliveryCheck | null>(null);
  const [deliveryChecking, setDeliveryChecking] = useState(false);
  const [locating, setLocating] = useState(false);

  function setScheduledFor(dt: string | null) {
    setScheduledForLocal(dt);
    storeSetScheduledFor(dt);
  }
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateResponse | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [payAtCounter, setPayAtCounter] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const couponCode = searchParams.get('coupon') || appliedCoupon?.couponCode || undefined;
  const sub = subtotal();
  const gst = store.gstEnabled ? Math.round(sub * (store.gstPercent / 100)) : 0;
  const tipAmount = Math.round(sub * (tipPercent / 100));
  const donationAmount = donation ? Math.max(0, Math.ceil((sub + gst + tipAmount) / 1000) * 1000 - (sub + gst + tipAmount)) : 0;
  const deliveryFee = orderType === 'delivery' && deliveryCheck?.deliverable ? deliveryCheck.fee : 0;
  const total = Math.max(0, sub + gst + tipAmount + donationAmount + deliveryFee - couponDiscount);

  // When a split is active, the amount charged to the current user is perPersonAmount
  const effectivePayAmount = splitInfo ? splitInfo.perPersonAmount : total;

  function handleSplitComplete(perPersonAmount: number, numPeople: number) {
    setSplitInfo({ perPersonAmount, numPeople });
  }

  // Run delivery check whenever coords are available
  const runDeliveryCheck = useCallback(async (lat: number, lng: number) => {
    setDeliveryChecking(true);
    try {
      const result = await checkDelivery(store.slug, lat, lng);
      setDeliveryCheck(result);
      if (!result.deliverable) {
        showToast(result.message ?? tDelivery('outsideZone'), 'error');
      }
    } catch {
      // Non-fatal — delivery check fails silently; fee stays 0
    } finally {
      setDeliveryChecking(false);
    }
  }, [store.slug, showToast, tDelivery]);

  function handleUseLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDeliveryAddress((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setLocating(false);
        await runDeliveryCheck(lat, lng);
      },
      () => {
        setLocating(false);
        showToast('Could not get your location. Please enter address manually.', 'error');
      },
      { timeout: 10000 },
    );
  }

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) openLoginModal(() => router.refresh());
  }, [isLoggedIn, openLoginModal, router]);

  // Load wallet balance if Program Merchant
  useEffect(() => {
    if (store.isProgramMerchant && isLoggedIn) {
      getWalletBalance().then(setWallet).catch(() => {});
    }
  }, [store.isProgramMerchant, isLoggedIn]);

  // Track online/offline state and trigger background sync on reconnect
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      registerBackgroundSync();
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fire checkout_started once on mount
  useEffect(() => {
    track({
      event: 'checkout_started',
      storeSlug: store.slug,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.slug]);

  if (items.length === 0) {
    // NW-MED-033: Show toast before redirect to avoid blank flash.
    showToast('Your cart is empty.', 'info');
    router.replace(`/${storeSlug}`);
    return null;
  }

  /**
   * Creates a Razorpay order and opens the payment sheet.
   * Returns the created order so UPI handlers can derive a fallback URL.
   */
  async function openPaymentModal(): Promise<RazorpayOrderResponse | null> {
    if (rzpFailed) { showToast('Payment service unavailable. Please pay at the counter.', 'error'); return null; }
    // NW-MED-015: Trigger lazy-load of the Razorpay script before opening payment.
    if (!rzpReady) {
      showToast('Loading payment gateway...', 'info');
      try { await ensureLoaded(); } catch { /* loadFailed flag updated by ensureLoaded */ }
    }

    setPaying(true);
    try {
      // NW-HIGH-008: Re-validate the coupon at checkout time to catch cases where:
      // 1. The coupon expired since it was applied in the cart
      // 2. The coupon was deleted by the merchant
      // 3. The cart total changed and no longer meets the minimum order value
      // The server returns the authoritative discount amount — use it, not the client-side value.
      let serverCouponDiscount = couponDiscount;
      if (couponCode) {
        try {
          const serverCoupon = await validateCoupon(couponCode, store.slug, sub);
          if (serverCoupon.discountAmount !== couponDiscount) {
            serverCouponDiscount = serverCoupon.discountAmount;
            setCouponDiscount(serverCouponDiscount);
            if (serverCouponDiscount === 0) {
              showToast(`Coupon "${couponCode}" is no longer valid.`, 'error');
            } else {
              showToast(`Coupon updated: you save ${formatINR(serverCouponDiscount)}`, 'info');
            }
          }
        } catch (e: unknown) {
          // NW-CRIT-011 PARTIAL: Handle rate-limit (429) from backend CAPTCHA enforcement.
          if (e instanceof Error && 'isAxiosError' in e) {
            const axiosErr = e as import('axios').AxiosError<{ message?: string }>;
            if (axiosErr.response?.status === 429) {
              showToast('Too many coupon attempts. Please try again later.', 'error');
            } else {
              showToast('Coupon could not be verified. Proceeding without discount.', 'error');
            }
          }
          // Coupon is invalid — clear it and continue without discount
          setAppliedCoupon(null);
          serverCouponDiscount = 0;
        }
      }

      const order = await createRazorpayOrder({
        storeSlug: store.slug,
        tableNumber: orderType === 'dine_in' ? (tableNumber || undefined) : undefined,
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
        items,
        subtotal: sub,
        tip: tipAmount,
        donation: donationAmount,
        couponCode,
        discount: serverCouponDiscount > 0 ? serverCouponDiscount : undefined,
        splitBillId: splitInfo ? `${splitInfo.numPeople}` : undefined,
        scheduledFor: scheduledFor || undefined,
      });

      // Fire payment_initiated after order is successfully created
      track({
        event: 'payment_initiated',
        storeSlug: store.slug,
        properties: {
          amount: splitInfo ? effectivePayAmount : order.amount,
          paymentMethod: 'razorpay',
        },
      });

      // Fire coupon_applied when a coupon was included in this order
      if (couponCode) {
        track({
          event: 'coupon_applied',
          storeSlug: store.slug,
          properties: {
            code: couponCode,
          },
        });
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        logger.error('[rez-now] NEXT_PUBLIC_RAZORPAY_KEY_ID is not set — payment will fail');
        showToast('Payment service is not configured. Please contact support.', 'error');
        setPaying(false);
        return null;
      }

      openPayment({
        key: razorpayKey,
        order_id: order.razorpayOrderId,
        amount: splitInfo ? effectivePayAmount : order.amount,
        currency: order.currency || 'INR',
        name: store.name,
        description: `Order at ${store.name}`,
        prefill: { contact: user?.phone, name: user?.name },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            await verifyPayment(order.orderNumber, response);
            setShowPushPrompt(true);
            router.push(`/${store.slug}/order/${order.orderNumber}`);
          } catch {
            showToast('Payment verification failed. Please contact support.', 'error');
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

      return order;
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Payment failed. Please try again.', 'error');
      setPaying(false);
      return null;
    }
  }

  /**
   * Builds the order payload from the current cart state.
   * This mirrors what createRazorpayOrder sends so the SW can POST it directly.
   */
  function buildOrderPayload() {
    return {
      storeSlug: store.slug,
      tableNumber: orderType === 'dine_in' ? tableNumber || undefined : undefined,
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      items,
      subtotal: sub,
      tip: tipAmount,
      donation: donationAmount,
      couponCode,
      discount: couponDiscount > 0 ? couponDiscount : undefined,
      splitBillId: splitInfo ? `${splitInfo.numPeople}` : undefined,
      scheduledFor: scheduledFor || undefined,
    };
  }

  /**
   * Queues the order in IndexedDB and navigates to the queued confirmation
   * screen. Called when the user attempts to pay while offline.
   */
  async function handleOfflineQueue() {
    try {
      const queuedId = await queueOrder(store.slug, buildOrderPayload());
      showToast("Order queued! It'll be placed when you reconnect.", 'info');
      router.push(
        `/${store.slug}/order/queued?queueId=${queuedId}&storeName=${encodeURIComponent(store.name)}&total=${total}`
      );
    } catch {
      showToast('Could not save your order offline. Please try again.', 'error');
    }
  }

  async function handleRazorpaySelect() {
    if (!isOnline) { await handleOfflineQueue(); return; }
    await openPaymentModal();
  }

  async function handleUPISelect(app: 'phonepe' | 'gpay' | 'paytm' | 'generic') {
    if (!isOnline) { await handleOfflineQueue(); return; }
    const vpa = store.phone;
    if (!vpa) {
      await openPaymentModal();
      return;
    }
    const order = await openPaymentModal();
    if (!order) return;
    const upiLinks = buildUPILinks({
      vpa,
      name: store.name,
      amount: effectivePayAmount,
      txnRef: order.orderNumber,
      note: `Order at ${store.name}`,
    });
    // Map PaymentOptions app key ('phonepe') to UPILinks key ('phonePe')
    const upiKey = app === 'phonepe' ? 'phonePe' : app;
    openUPIApp(upiLinks[upiKey], window.location.href);
  }

  function handlePayAtCounter() {
    setPayAtCounter(true);
    setShowPushPrompt(true);
    showToast('Order placed! Please pay at the counter.', 'info');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Go back" className="text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">{t('title')}</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Store closed banner */}
        {!store.isOpen && (
          <div role="status" aria-live="polite" className="w-full bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-3 text-sm text-amber-800">
            <svg className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              This store is currently closed. Orders placed now will be processed when the store opens.
              {store.nextChangeLabel ? ` ${store.nextChangeLabel}.` : ''}
            </p>
          </div>
        )}

        {/* Offline banner */}
        {!isOnline && (
          <div role="alert" aria-live="assertive" className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-yellow-800">
            <svg className="w-5 h-5 shrink-0 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p>You&apos;re offline. Payment will be queued and placed automatically when you reconnect.</p>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-xl px-4 py-3 space-y-1">
          <h3 className="text-sm font-bold text-gray-900 mb-2">{t('orderSummary')}</h3>
          {items.map((item) => (
            <div key={`${item.itemId}-${JSON.stringify(item.customizations)}`} className="flex justify-between text-sm text-gray-600">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Order type selector */}
        {(tableNumber || store.deliveryEnabled) && (
          <div className="bg-white rounded-xl px-4 py-3">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Order Type</h3>
            <div className="flex gap-2 flex-wrap">
              {tableNumber && (
                <button
                  onClick={() => setOrderType('dine_in')}
                  aria-pressed={orderType === 'dine_in'}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${orderType === 'dine_in' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                >
                  Dine-in · Table {tableNumber}
                </button>
              )}
              <button
                onClick={() => setOrderType('takeaway')}
                aria-pressed={orderType === 'takeaway'}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${orderType === 'takeaway' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
              >
                Takeaway
              </button>
              {store.deliveryEnabled && (
                <button
                  onClick={() => setOrderType('delivery')}
                  aria-pressed={orderType === 'delivery'}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${orderType === 'delivery' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                >
                  {tDelivery('label')}
                </button>
              )}
            </div>

            {/* Delivery address form */}
            {orderType === 'delivery' && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">{tDelivery('address')}</p>
                <div>
                  <label htmlFor="delivery-line1" className="block text-xs text-gray-500 mb-1">{tDelivery('line1')}</label>
                  <input
                    id="delivery-line1"
                    type="text"
                    value={deliveryAddress.line1}
                    onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, line1: e.target.value }))}
                    placeholder="House / flat, street, area"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    maxLength={200}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="delivery-city" className="block text-xs text-gray-500 mb-1">{tDelivery('city')}</label>
                    <input
                      id="delivery-city"
                      type="text"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      maxLength={100}
                    />
                  </div>
                  <div className="w-32">
                    <label htmlFor="delivery-pincode" className="block text-xs text-gray-500 mb-1">{tDelivery('pincode')}</label>
                    <input
                      id="delivery-pincode"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      value={deliveryAddress.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setDeliveryAddress((prev) => ({ ...prev, pincode: val }));
                      }}
                      placeholder="560001"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating || deliveryChecking}
                  className="flex items-center gap-2 text-sm text-indigo-600 font-medium disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {locating ? 'Getting location...' : deliveryChecking ? tDelivery('checking') : tDelivery('useLocation')}
                </button>
                {deliveryCheck && !deliveryCheck.deliverable && (
                  <p className="text-sm text-red-600">{deliveryCheck.message ?? tDelivery('outsideZone')}</p>
                )}
                {deliveryCheck?.deliverable && (
                  <p className="text-sm text-green-700">
                    Delivery available · {deliveryCheck.distanceKm} km away
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Schedule for later */}
        <div className="bg-white rounded-xl px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Schedule for later</p>
              <p className="text-xs text-gray-500">{scheduleForLater ? 'Pick a date and time' : 'Order will be prepared ASAP'}</p>
            </div>
            <button
              onClick={() => {
                const next = !scheduleForLater;
                setScheduleForLater(next);
                if (!next) setScheduledFor(null);
              }}
              aria-label="Schedule for later"
              aria-pressed={scheduleForLater}
              className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${scheduleForLater ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${scheduleForLater ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          {scheduleForLater && (
            <>
              <label htmlFor="schedule-datetime" className="sr-only">
                Schedule date and time
              </label>
              <input
                id="schedule-datetime"
                type="datetime-local"
                value={scheduledFor ? new Date(scheduledFor).toISOString().slice(0, 16) : ''}
                min={new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)}
                max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                onChange={(e) => setScheduledFor(e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </>
          )}
        </div>

        {/* Tip selector */}
        <div className="bg-white rounded-xl px-4 py-3">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Add a Tip</h3>
          <div className="flex gap-2">
            {TIP_OPTIONS.map((pct) => (
              <button
                key={pct}
                onClick={() => setTipPercent(pct)}
                aria-pressed={tipPercent === pct}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${tipPercent === pct ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
              >
                {pct === 0 ? 'None' : `${pct}%`}
              </button>
            ))}
          </div>
          {tipAmount > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">Tip: {formatINR(tipAmount)}</p>
          )}
        </div>

        {/* Donation */}
        <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Round up for a cause</p>
            <p className="text-xs text-gray-500">Donate {formatINR(donationAmount || 100)} to our charity partner</p>
          </div>
          <button
            onClick={() => setDonation(!donation)}
            aria-label="Round up for a cause"
            aria-pressed={donation}
            className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${donation ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${donation ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Wallet balance */}
        {store.isProgramMerchant && wallet && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🪙</span>
            <div>
              <p className="text-sm font-semibold text-indigo-900">REZ Wallet</p>
              <p className="text-xs text-indigo-700">{wallet.coins} coins · {formatINR(wallet.coins * 100)}</p>
            </div>
          </div>
        )}

        {/* Bill summary */}
        <div className="bg-white rounded-xl px-4 py-3 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Bill Summary</h3>
          <div className="flex justify-between text-sm text-gray-600"><span>{tCart('subtotal')}</span><span>{formatINR(sub)}</span></div>
          {gst > 0 && <div className="flex justify-between text-sm text-gray-600"><span>GST ({store.gstPercent}%)</span><span>{formatINR(gst)}</span></div>}
          {tipAmount > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Tip</span><span>{formatINR(tipAmount)}</span></div>}
          {donationAmount > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Donation</span><span>{formatINR(donationAmount)}</span></div>}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>{tDelivery('fee')}</span>
              <span>{formatINR(deliveryFee)}</span>
            </div>
          )}
          {couponDiscount > 0 && appliedCoupon && (
            <div className="flex justify-between text-sm text-green-700">
              <span>Coupon ({appliedCoupon.couponCode})</span>
              <span>−{formatINR(couponDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>{tCart('total')}</span>
            <span>{formatINR(total)}</span>
          </div>
          {splitInfo && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                  Splitting with {splitInfo.numPeople} people
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-indigo-700">You pay {formatINR(splitInfo.perPersonAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Scheduled order badge */}
        {scheduledFor && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-indigo-800 font-medium">
                Scheduled for {formatScheduledTime(scheduledFor)}
              </p>
            </div>
            <button
              onClick={() => { setScheduledFor(null); setScheduleForLater(false); }}
              className="text-indigo-400 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
              aria-label="Remove schedule"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Coupon input */}
        <CouponInput
          storeSlug={storeSlug ?? store.slug}
          subtotal={sub}
          onApply={(coupon, discount) => {
            if (coupon) {
              setAppliedCoupon({ ...coupon, success: true, discountAmount: discount, couponCode: coupon.code });
              setCouponDiscount(discount);
            } else {
              setAppliedCoupon(null);
              setCouponDiscount(0);
            }
          }}
        />

        {rzpFailed && (
          <div role="alert" aria-live="polite" className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
            Payment service unavailable. Please pay at the counter.
          </div>
        )}

        {/* Pay-at-counter confirmation */}
        {payAtCounter && (
          <div role="status" aria-live="polite" className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
            Your order has been placed. Please pay at the counter when collecting.
          </div>
        )}

        {/* Payment options */}
        {!payAtCounter && (
          <PaymentOptions
            razorpayOrderId=""
            amount={effectivePayAmount}
            vpa={store.phone || undefined}
            merchantName={store.name}
            onRazorpaySelect={handleRazorpaySelect}
            onUPISelect={handleUPISelect}
            onPayAtCounter={handlePayAtCounter}
          />
        )}

        {/* Bill actions: split + schedule */}
        {!payAtCounter && (
          <div className="flex gap-2 pb-6">
            <Button
              variant="secondary"
              fullWidth
              size="md"
              disabled={paying}
              onClick={() => setSplitModalOpen(true)}
            >
              {splitInfo ? `Splitting with ${splitInfo.numPeople} people — change` : 'Split bill'}
            </Button>
            <Button
              variant="ghost"
              size="md"
              disabled={paying}
              onClick={() => setScheduleModalOpen(true)}
              aria-label="Schedule for later"
              className="shrink-0 px-3"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
          </div>
        )}
      </div>

      <SplitBillModal
        isOpen={splitModalOpen}
        onClose={() => setSplitModalOpen(false)}
        totalAmount={total}
        orderNumber=""
        onSplitComplete={handleSplitComplete}
      />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        storeOpenHours={store.operatingHours?.[new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()] ?? undefined}
        onSchedule={(iso) => {
          setScheduledFor(iso);
          setScheduleForLater(true);
          showToast(`Order scheduled for ${formatScheduledTime(iso)}`, 'success');
        }}
      />

      <PushPromptBanner
        show={showPushPrompt}
        onDismiss={() => setShowPushPrompt(false)}
      />
    </div>
  );
}
