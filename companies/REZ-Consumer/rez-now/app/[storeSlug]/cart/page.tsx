'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/lib/store/cartStore';
import { useStore } from '../StoreContextProvider';
import { validateCart } from '@/lib/api/cart';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatINR } from '@/lib/utils/currency';
import Button from '@/components/ui/Button';
import CouponInput from '@/components/cart/CouponInput';
import { CouponValidateResponse } from '@/lib/types';

export default function CartPage() {
  const router = useRouter();
  const t = useTranslations('cart');
  const { store } = useStore();
  const { items, updateQuantity, removeItem, subtotal, storeSlug, tableNumber } = useCartStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { openLoginModal, showToast } = useUIStore();

  const [couponApplied, setCouponApplied] = useState<CouponValidateResponse | null>(null);
  const [validating, setValidating] = useState(false);

  const sub = subtotal();
  const gst = store.gstEnabled ? Math.round(sub * (store.gstPercent / 100)) : 0;
  const discount = couponApplied?.discountAmount || 0;
  const total = sub + gst - discount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6">
        <span className="text-5xl">🛒</span>
        <h2 className="text-xl font-bold text-gray-900">{t('empty')}</h2>
        <p className="text-sm text-gray-500">{t('emptyHint')}</p>
        <Button onClick={() => router.push(`/${storeSlug}`)}>{t('continueShopping')}</Button>
      </div>
    );
  }

  async function handleCheckout() {
    setValidating(true);
    try {
      const { unavailableItems } = await validateCart(store.slug, items);
      if (unavailableItems.length > 0) {
        showToast(`Some items are unavailable: ${unavailableItems.join(', ')}`, 'error');
        return;
      }
    } catch {
      showToast('Could not validate cart. Please try again.', 'error');
      return;
    } finally {
      setValidating(false);
    }

    if (!isLoggedIn) {
      openLoginModal(() => router.push(`/${store.slug}/checkout${couponApplied ? `?coupon=${couponApplied.couponCode}` : ''}`));
      return;
    }
    router.push(`/${store.slug}/checkout${couponApplied ? `?coupon=${couponApplied.couponCode}` : ''}`);
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
        {/* Cart items */}
        <div className="bg-white rounded-xl divide-y divide-gray-50 px-4">
          {items.map((item) => (
            <div key={`${item.itemId}-${JSON.stringify(item.customizations)}`} className="flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">{formatINR(item.price)}</p>
              </div>
              <div
                role="group"
                aria-label={`${item.name} quantity`}
                className="flex items-center gap-2 bg-indigo-600 rounded-lg px-1"
              >
                <button
                  onClick={() => updateQuantity(item.itemId, item.quantity - 1, item.customizations)}
                  aria-label={`Decrease quantity of ${item.name}`}
                  className="w-7 h-7 text-white font-bold text-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-indigo-600 rounded"
                >
                  <span aria-hidden="true">−</span>
                </button>
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={`${item.quantity} in cart`}
                  className="text-white font-bold text-sm w-4 text-center"
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.itemId, item.quantity + 1, item.customizations)}
                  aria-label={`Increase quantity of ${item.name}`}
                  className="w-7 h-7 text-white font-bold text-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-indigo-600 rounded"
                >
                  <span aria-hidden="true">+</span>
                </button>
              </div>
              <button
                onClick={() => removeItem(item.itemId, item.customizations)}
                aria-label={`Remove ${item.name} from cart`}
                className="text-gray-500 hover:text-red-500 ml-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className="bg-white rounded-xl px-4 py-3">
          <CouponInput
            storeSlug={store.slug}
            cartTotal={sub}
            appliedCoupon={couponApplied}
            onApply={setCouponApplied}
            onRemove={() => setCouponApplied(null)}
          />
        </div>

        {/* Bill summary */}
        <div className="bg-white rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">Bill Summary</h3>
            {tableNumber && (
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                Dine-in · Table {tableNumber}
              </span>
            )}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('subtotal')}</span><span>{formatINR(sub)}</span>
          </div>
          {gst > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>GST ({store.gstPercent}%)</span><span>{formatINR(gst)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t('discount')}</span><span>−{formatINR(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>{t('total')}</span><span>{formatINR(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <Button fullWidth size="lg" loading={validating} onClick={handleCheckout}>
          {t('proceedToCheckout')} · {formatINR(total)}
        </Button>
      </div>
    </div>
  );
}
