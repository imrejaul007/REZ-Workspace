'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../StoreContextProvider';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useCartStore } from '@/lib/store/cartStore';
import { getOrderHistory, getOrder } from '@/lib/api/orders';
import { OrderHistoryItem, CartItem } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import { buildStoreShareMessage } from '@/lib/utils/share';
import Button from '@/components/ui/Button';
import ShareButton from '@/components/ui/ShareButton';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { logger } from '@/lib/utils/logger';

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'blue'> = {
  completed: 'green', preparing: 'yellow', ready: 'blue',
  confirmed: 'blue', cancelled: 'red', pending_payment: 'gray',
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { store } = useStore();
  const { isLoggedIn, user } = useAuthStore();
  const { openLoginModal, showToast } = useUIStore();
  const { items: cartItems, storeSlug: cartStoreSlug, clearCart, setStore, addItem } = useCartStore();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState<string | null>(null);
  const [conflictOrder, setConflictOrder] = useState<OrderHistoryItem | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => router.refresh());
      setLoading(false);
      return;
    }
    getOrderHistory()
      .then((result) => setOrders(result.orders))
      .catch((err) => {
        logger.error('Failed to load order history', { error: err });
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn, openLoginModal, router]);

  async function doReorder(order: OrderHistoryItem) {
    setReordering(order.orderNumber);
    try {
      const fullOrder = await getOrder(order.orderNumber);
      setStore(order.storeSlug);
      // addItem adds 1 quantity per call; call once per item × quantity
      fullOrder.items.forEach((item) => {
        const cartItem: Omit<CartItem, 'quantity'> = {
          itemId: item.name, // history items only carry name; use name as best-effort id
          name: item.name,
          price: item.price,
          basePrice: item.price,
          customizations: item.customizations ?? {},
          customizationTotal: 0,
          isVeg: false,
        };
        for (let q = 0; q < item.quantity; q++) {
          addItem(cartItem);
        }
      });
      showToast('Items added to cart', 'success');
      router.push(`/${order.storeSlug}/cart`);
    } catch {
      showToast('Could not load order details. Please try again.', 'error');
    } finally {
      setReordering(null);
    }
  }

  function handleReorder(order: OrderHistoryItem) {
    // If cart already has items from a different store, prompt to clear first
    if (cartItems.length > 0 && cartStoreSlug && cartStoreSlug !== order.storeSlug) {
      setConflictOrder(order);
      return;
    }
    doReorder(order);
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="text-xl font-bold text-gray-900">Login to view history</h2>
        <p className="text-sm text-gray-500">Scan the QR code at the store to log in and view your order history.</p>
        <Button onClick={() => openLoginModal()}>Login</Button>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" className="text-indigo-600" /></div>;

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">📋</span>
        <h2 className="text-xl font-bold text-gray-900">No orders yet</h2>
        <p className="text-sm text-gray-500">Your order history will appear here after your first order.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Order History</h1>
        </div>
      </div>
      <div className="px-4 pt-4 space-y-3">
        {/* Referral code card */}
        {user?.referralCode && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-4">
            <p className="text-xs text-indigo-500 font-medium uppercase tracking-wider mb-1">Your referral code</p>
            <p className="text-2xl font-bold text-indigo-700 tracking-widest mb-3">{user.referralCode}</p>
            <ShareButton
              text={buildStoreShareMessage(store.name, store.slug, user.referralCode)}
              url={`https://reznow.in/${store.slug}?ref=${user.referralCode}`}
              title={`Join ${store.name} on REZ Now`}
              label="Share & earn coins"
              variant="full"
            />
          </div>
        )}

        {orders.map((order) => (
          <div
            key={order.orderNumber}
            className="bg-white rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
          >
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => router.push(`/${order.storeSlug}/order/${order.orderNumber}`)}
            >
              <div>
                <p className="text-sm font-bold text-gray-900">#{order.orderNumber}</p>
                <p className="text-xs text-gray-500 mt-0.5">{order.storeName} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold">{formatINR(order.total)}</span>
                <Badge variant={STATUS_COLOR[order.status] || 'gray'}>{order.status.replace('_', ' ')}</Badge>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50">
              <Button
                variant="secondary"
                size="sm"
                loading={reordering === order.orderNumber}
                onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
              >
                Reorder
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Store conflict confirmation modal */}
      <Modal
        open={conflictOrder !== null}
        onClose={() => setConflictOrder(null)}
        title="Replace current cart?"
      >
        <p className="text-sm text-gray-600 mb-5">
          Your cart has items from a different store. Reordering will clear your current cart.
        </p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={() => setConflictOrder(null)}
          >
            Keep cart
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => {
              if (conflictOrder) {
                clearCart();
                const pending = conflictOrder;
                setConflictOrder(null);
                doReorder(pending);
              }
            }}
          >
            Clear &amp; reorder
          </Button>
        </div>
      </Modal>
    </div>
  );
}
