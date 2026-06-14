'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../StoreContextProvider';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useOrderSocket } from '@/lib/hooks/useOrderSocket';
import { useOrderPolling } from '@/lib/hooks/useOrderPolling';
import { getOrder, sendReceipt, creditCoins, getLoyaltyStamps } from '@/lib/api/orders';
import { getWalletBalance } from '@/lib/api/wallet';
import { WebOrder, WebOrderStatus, WalletBalance, StampCard, normalizeWebOrderStatus } from '@/lib/types';
import { useTrack } from '@/lib/analytics/events';
import { formatINR } from '@/lib/utils/currency';
import { getUICopy } from '@/lib/utils/storeType';
import { subscribeToPush } from '@/lib/utils/pushNotifications';
import { buildOrderShareMessage } from '@/lib/utils/share';
import Button from '@/components/ui/Button';
import ShareButton from '@/components/ui/ShareButton';
import Spinner from '@/components/ui/Spinner';
import LoyaltyWidget from '@/components/order/LoyaltyWidget';
import GoogleMapsReviewCTA from '@/components/order/GoogleMapsReviewCTA';
import DisputeModal from '@/components/order/DisputeModal';
import RatingModal from '@/components/order/RatingModal';
import CancelOrderModal from '@/components/order/CancelOrderModal';

// NW-HIGH-015 FIX: Include pending_payment so the progress bar shows a "waiting" state
// for orders where payment is pending. Without this, users see a spinner with no context.
const STATUS_STEPS: WebOrderStatus[] = ['pending_payment', 'confirmed', 'preparing', 'ready', 'completed'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for future display
const STATUS_LABELS: Record<WebOrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  placed: 'Order placed',
  confirmed: 'Order confirmed',
  preparing: 'Being prepared',
  ready: 'Ready for pickup',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function OrderConfirmPage({ params }: { params: Promise<{ storeSlug: string; orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const router = useRouter();
  const { store } = useStore();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const uiCopy = getUICopy(store.storeType);
  const track = useTrack();

  const [order, setOrder] = useState<WebOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [coinsCredited, setCoinsCredited] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [receiptSending, setReceiptSending] = useState(false);
  const [stampCard, setStampCard] = useState<StampCard | null>(null);
  const [showGoogleCTA, setShowGoogleCTA] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelRefundInitiated, setCancelRefundInitiated] = useState<boolean | null>(null);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [paymentExpiresIn, setPaymentExpiresIn] = useState<number | null>(null);

  // MED-3: Show payment timeout countdown when in pending_payment state.
  // Razorpay's checkout window is ~15 min; we give 20 min to match the backend sweeper cutoff.
  useEffect(() => {
    if (!order || !order.createdAt) return;
    // DM-CRIT-01 FIX: Normalize backend canonical statuses to frontend display statuses inline
    const currentDisplayStatus = normalizeWebOrderStatus(order.status);
    if (currentDisplayStatus !== 'pending_payment') return;
    const PAYMENT_WINDOW_MS = 20 * 60 * 1000; // 20 minutes
    const expiresAt = new Date(order.createdAt).getTime() + PAYMENT_WINDOW_MS;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setPaymentExpiresIn(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order]);

  async function loadOrder() {
    try {
      const o = await getOrder(orderNumber);
      setOrder(o);
    } catch {
      showToast('Could not load order.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not including loadOrder
  useEffect(() => { loadOrder(); }, [orderNumber]);

  // Fire order_placed once after the order data loads
  useEffect(() => {
    if (!order) return;
    track({
      event: 'order_placed',
      storeSlug: store.slug,
      properties: {
        orderNumber,
        amount: order.total,
        itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, order !== null]);

  const handleStatusUpdate = useCallback((status: WebOrderStatus) => {
    setOrder((prev) => prev ? { ...prev, status } : prev);
  }, []);

  const handlePollingTimeout = useCallback(() => {
    setPollingTimedOut(true);
    showToast('Unable to get live updates. Ask the restaurant for your order status.', 'error');
  }, [showToast]);

  // Socket.IO for live updates
  // NW-MED-054: Pass storeSlug for storeId validation; NW-MED-049: socket carries auth token
  useOrderSocket(orderNumber, store.slug, (status) => {
    setSocketConnected(true);
    handleStatusUpdate(status);
  });

  // Fallback polling
  useOrderPolling(orderNumber, socketConnected, handleStatusUpdate, handlePollingTimeout);

  // Fire order_completed when status transitions to 'completed'
  useEffect(() => {
    if (order?.status === 'completed') {
      track({
        event: 'order_completed',
        storeSlug: store.slug,
        properties: {
          orderNumber,
          amount: order.total,
          itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  // Credit coins once order is completed
  useEffect(() => {
    if (order?.status === 'completed' && store.isProgramMerchant && !coinsCredited) {
      setCoinsCredited(true);
      creditCoins(orderNumber)
        .then(({ coinsEarned }) => {
          setCoinsEarned(coinsEarned);
          return getWalletBalance();
        })
        .then(setWallet)
        .catch(() => {});
    }
  }, [order?.status, store.isProgramMerchant, coinsCredited, orderNumber]);

  // Show push notification banner once order is confirmed (and browser supports push)
  useEffect(() => {
    if (
      order?.status === 'confirmed' &&
      !pushSubscribed &&
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      Notification.permission === 'default'
    ) {
      setShowPushBanner(true);
    }
  }, [order?.status, pushSubscribed]);

  // Auto-dismiss push banner after 10 seconds
  useEffect(() => {
    if (!showPushBanner) return;
    const timer = setTimeout(() => setShowPushBanner(false), 10000);
    return () => clearTimeout(timer);
  }, [showPushBanner]);

  // Auto-open rating modal once order is completed (if not yet rated)
  useEffect(() => {
    if (order?.status === 'completed' && !order.rating && !hasRated) {
      // Small delay so the status card animation settles first
      const t = setTimeout(() => setRatingOpen(true), 1200);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  // Load loyalty stamps once order is completed (program merchants only)
  useEffect(() => {
    if (order?.status === 'completed' && store.isProgramMerchant && !stampCard) {
      getLoyaltyStamps(store.slug)
        .then(setStampCard)
        .catch(() => {});
    }
  }, [order?.status, store.isProgramMerchant, store.slug, stampCard]);

  async function handleSendReceipt(via: 'whatsapp' | 'email') {
    setReceiptSending(true);
    try {
      await sendReceipt(orderNumber, via);
      showToast(`Receipt sent via ${via === 'whatsapp' ? 'WhatsApp' : 'email'}!`, 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to send receipt', 'error');
    } finally {
      setReceiptSending(false);
    }
  }

  function handleRatingSuccess() {
    setHasRated(true);
    setRatingOpen(false);
    setShowGoogleCTA(true);
  }

  function handleRatingSkip() {
    setRatingOpen(false);
    setShowGoogleCTA(true);
  }

  async function handleEnablePush() {
    setShowPushBanner(false);
    const sub = await subscribeToPush();
    if (sub) {
      setPushSubscribed(true);
      showToast('Push notifications enabled!', 'success');
    }
  }

  function handleCancelled(refundInitiated: boolean) {
    setCancelModalOpen(false);
    setCancelRefundInitiated(refundInitiated);
    handleStatusUpdate('cancelled');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-500">Order not found.</p>
        <Button onClick={() => router.push(`/${store.slug}`)}>Back to Menu</Button>
      </div>
    );
  }

  // DM-CRIT-01 FIX: Normalize backend canonical statuses to frontend display statuses.
  // Backend sends 'placed'/'delivered'; frontend uses 'pending_payment'/'completed'.
  const displayStatus = normalizeWebOrderStatus(order.status);
  const currentStepIndex = STATUS_STEPS.indexOf(displayStatus);
  const isTerminal = displayStatus === 'completed' || displayStatus === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <span className="text-xs text-gray-500">{store.name}</span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Status card */}
        <div className={`bg-white rounded-xl px-4 py-4 ${displayStatus === 'cancelled' ? 'border border-red-100' : ''}`}>
          {displayStatus === 'cancelled' ? (
            <div className="text-center py-2">
              <p className="text-2xl mb-2">❌</p>
              <p className="font-bold text-red-700">Order Cancelled</p>
              {cancelRefundInitiated && (
                <p className="text-xs text-gray-500 mt-1">
                  Refund will be credited in 3-5 business days
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Live status message */}
              <div className="text-center mb-4">
                {displayStatus === 'pending_payment' && (
                  <div>
                    <p className="text-lg">⏳ Awaiting payment confirmation</p>
                    {paymentExpiresIn !== null && paymentExpiresIn > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Payment window closes in{' '}
                        <span className={paymentExpiresIn < 120 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {Math.floor(paymentExpiresIn / 60)}:{String(paymentExpiresIn % 60).padStart(2, '0')}
                        </span>
                        {paymentExpiresIn < 120 && ' — please complete payment'}
                      </p>
                    )}
                    {paymentExpiresIn === 0 && (
                      <p className="text-sm text-red-600 font-medium mt-1">
                        Payment window has expired. Your order will be automatically cancelled.
                      </p>
                    )}
                  </div>
                )}
                {displayStatus === 'confirmed' && <p className="text-lg">✅ {uiCopy.orderConfirmMessage}</p>}
                {displayStatus === 'preparing' && (
                  <p className="text-lg flex items-center justify-center gap-2">
                    <span className="animate-pulse">🔥</span> {uiCopy.preparingMessage}
                  </p>
                )}
                {displayStatus === 'ready' && <p className="text-lg">🎉 {uiCopy.readyMessage}</p>}
                {displayStatus === 'completed' && <p className="text-lg">✅ All done! Thank you.</p>}
              </div>

              {/* Progress bar */}
              {displayStatus !== 'pending_payment' && (
                <div className="flex items-center gap-1">
                  {STATUS_STEPS.slice(0, -1).map((step, i) => (
                    <div key={step} className="flex-1 flex items-center gap-1">
                      <div className={`flex-1 h-1.5 rounded-full transition-colors ${i <= currentStepIndex - 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${i < currentStepIndex ? 'bg-indigo-600' : i === currentStepIndex ? 'bg-indigo-600 ring-2 ring-indigo-200' : 'bg-gray-200'}`} />
                    </div>
                  ))}
                </div>
              )}

              {pollingTimedOut && !socketConnected && !isTerminal && (
                <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 mt-3">
                  Live updates unavailable. Please ask the restaurant for your order status.
                </p>
              )}
            </>
          )}
        </div>

        {/* Push notification opt-in banner */}
        {showPushBanner && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">🔔</span>
              <p className="text-sm text-indigo-900 font-medium truncate">
                Get notified when your order is ready
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleEnablePush}
                className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg px-3 py-1.5 transition-colors"
              >
                Enable
              </button>
              <button
                onClick={() => setShowPushBanner(false)}
                className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">Order Items</h3>
            {order.tableNumber ? (
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                Dine-in · Table {order.tableNumber}
              </span>
            ) : (
              <span className="inline-flex items-center bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                Takeaway
              </span>
            )}
          </div>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-gray-600 py-1">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-sm font-bold text-gray-900">
            <span>Total</span><span>{formatINR(order.total)}</span>
          </div>
        </div>

        {/* Coins earned */}
        {store.isProgramMerchant && coinsEarned > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🪙</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-900">You earned {coinsEarned} REZ coins!</p>
              {wallet && <p className="text-xs text-indigo-700">Total balance: {wallet.coins} coins</p>}
            </div>
          </div>
        )}

        {/* Open in REZ App — links to wallet so coins are visible in the consumer app */}
        {store.isProgramMerchant && coinsEarned > 0 && (
          <a
            href="rezapp://wallet"
            className="block bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold rounded-xl px-4 py-3 transition-colors"
          >
            View coins in REZ App
          </a>
        )}

        {/* Loyalty stamp card */}
        {store.isProgramMerchant && stampCard && (
          <LoyaltyWidget
            stamps={stampCard.totalStamps}
            maxStamps={stampCard.stampsRequired}
            rewardDescription={stampCard.rewardDescription}
          />
        )}

        {/* Actions */}
        <div className="bg-white rounded-xl px-4 py-3 space-y-2">
          <ShareButton
            text={buildOrderShareMessage(store.name, order.orderNumber, order.total)}
            url={`${typeof window !== 'undefined' ? window.location.origin : 'https://reznow.in'}/${store.slug}/order/${order.orderNumber}`}
            title={`Order #${order.orderNumber} — ${store.name}`}
            label="Share Order"
            variant="full"
          />
          {user?.phone && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" fullWidth loading={receiptSending} onClick={() => handleSendReceipt('whatsapp')}>
                📱 Receipt on WhatsApp
              </Button>
              <Button variant="secondary" size="sm" fullWidth loading={receiptSending} onClick={() => handleSendReceipt('email')}>
                ✉️ Email Receipt
              </Button>
            </div>
          )}
          {!hasRated && !order.rating && isTerminal && displayStatus === 'completed' && (
            <Button variant="ghost" fullWidth onClick={() => setRatingOpen(true)}>
              ⭐ Rate your experience
            </Button>
          )}
          {(displayStatus === 'pending_payment' || displayStatus === 'confirmed') && (
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={() => setCancelModalOpen(true)}
            >
              Cancel Order
            </Button>
          )}
        </div>

        {/* Google Maps review CTA — shown after rating modal is submitted or dismissed */}
        {showGoogleCTA && (
          <GoogleMapsReviewCTA
            storeName={store.name}
            googleMapsPlaceId={store.googlePlaceId}
          />
        )}

        {/* Receipt + issue links */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => router.push(`/${store.slug}/receipt/${orderNumber}`)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View receipt
          </button>
          <button
            onClick={() => setDisputeModalOpen(true)}
            className="text-sm text-gray-400 hover:text-gray-700"
          >
            Report an issue
          </button>
        </div>

        <Button variant="secondary" fullWidth onClick={() => router.push(`/${store.slug}`)}>
          Back to Menu
        </Button>
      </div>

      {/* Rating modal */}
      <RatingModal
        open={ratingOpen}
        orderNumber={orderNumber}
        onSuccess={handleRatingSuccess}
        onSkip={handleRatingSkip}
      />

      {/* Dispute modal */}
      <DisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        orderNumber={orderNumber}
        onDisputeSubmitted={() => setDisputeModalOpen(false)}
      />

      {/* Cancel order modal */}
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        orderNumber={orderNumber}
        onCancelled={handleCancelled}
      />
    </div>
  );
}
