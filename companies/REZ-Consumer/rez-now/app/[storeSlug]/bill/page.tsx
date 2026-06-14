'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { useStore } from '../StoreContextProvider';
import { useUIStore } from '@/lib/store/uiStore';
import { formatINR } from '@/lib/utils/currency';
import { shareContent } from '@/lib/utils/share';
import Button from '@/components/ui/Button';

const MIN_SPLIT = 2;
const MAX_SPLIT = 10;
const BASE_URL = 'https://now.rez.money';

export default function BillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { store } = useStore();
  const { showToast } = useUIStore();
  const { items, subtotal, storeSlug } = useCartStore();

  // Seed splitCount from ?split= query param if present (deep-link support)
  const splitParam = parseInt(searchParams.get('split') ?? '1', 10);
  const initialSplit = isNaN(splitParam) || splitParam < MIN_SPLIT || splitParam > MAX_SPLIT
    ? 1
    : splitParam;

  const [splitCount, setSplitCount] = useState<number>(initialSplit);
  const [paidCount, setPaidCount] = useState<number>(0);

  const sub = subtotal();
  const gst = store.gstEnabled ? Math.round(sub * (store.gstPercent / 100)) : 0;
  const total = sub + gst;

  // Per-person amount: first person absorbs remainder paise
  const base = splitCount > 1 ? Math.floor(total / splitCount) : total;
  const remainder = splitCount > 1 ? total - base * splitCount : 0;
  const perPersonAmount = base + remainder; // this user (opener) pays remainder

  const isSplitting = splitCount >= MIN_SPLIT;
  const allPaid = isSplitting && paidCount >= splitCount;

  const orderId = searchParams.get('orderId') ?? undefined;

  function handleSplitCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setSplitCount(Math.min(MAX_SPLIT, Math.max(1, val)));
    }
  }

  function incrementSplit() {
    setSplitCount((n) => Math.min(MAX_SPLIT, n + 1));
  }

  function decrementSplit() {
    setSplitCount((n) => Math.max(1, n - 1));
  }

  function markOnePaid() {
    setPaidCount((n) => Math.min(splitCount, n + 1));
  }

  function resetPaid() {
    setPaidCount(0);
  }

  const handleShareBillLink = useCallback(async () => {
    const params = new URLSearchParams();
    if (orderId) params.set('orderId', orderId);
    if (isSplitting) params.set('split', String(splitCount));
    const query = params.toString();
    const url = `${BASE_URL}/${storeSlug}/bill${query ? `?${query}` : ''}`;

    const lines = [
      `Bill from ${store.name}`,
      '',
      'Items:',
      ...items.map((i) => `  ${i.name} x${i.quantity}  ${formatINR(i.price * i.quantity)}`),
      '',
      `Subtotal: ${formatINR(sub)}`,
    ];
    if (gst > 0) lines.push(`GST (${store.gstPercent}%): ${formatINR(gst)}`);
    lines.push(`Total: ${formatINR(total)}`);
    if (isSplitting) lines.push(`Your share (1 of ${splitCount}): ${formatINR(base)}`);

    await shareContent({
      title: `Bill – ${store.name}`,
      text: lines.join('\n'),
      url,
    });

    showToast('Bill link copied!', 'success');
  }, [storeSlug, orderId, splitCount, isSplitting, store, items, sub, gst, total, base, showToast]);

  function handleShareBillText() {
    const lines = [
      `Bill from ${store.name}`,
      '',
      'Items:',
      ...items.map((i) => `  ${i.name} x${i.quantity}  ${formatINR(i.price * i.quantity)}`),
      '',
      `Subtotal: ${formatINR(sub)}`,
    ];
    if (gst > 0) lines.push(`GST (${store.gstPercent}%): ${formatINR(gst)}`);
    lines.push(`Total: ${formatINR(total)}`);

    const text = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: `Bill – ${store.name}`, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6">
        <span className="text-5xl">🧾</span>
        <h2 className="text-xl font-bold text-gray-900">Your bill is empty</h2>
        <p className="text-sm text-gray-500">Add items to see your running tab</p>
        <Button onClick={() => router.push(`/${storeSlug}`)}>Browse Menu</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-900"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Current Bill</h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {/* Store name */}
        <div className="bg-white rounded-xl px-4 py-3 text-center">
          {store.logo && (
            <Image
              src={store.logo}
              alt={store.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover mx-auto mb-2"
            />
          )}
          <p className="text-sm font-semibold text-gray-700">{store.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">Running tab</p>
        </div>

        {/* Items list */}
        <div className="bg-white rounded-xl px-4 py-3">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Items</h3>
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div
                key={`${item.itemId}-${JSON.stringify(item.customizations)}`}
                className="flex justify-between text-sm text-gray-700 py-2"
              >
                <span>
                  {item.name}
                  <span className="text-gray-400 ml-1">x{item.quantity}</span>
                </span>
                <span>{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bill summary */}
        <div className="bg-white rounded-xl px-4 py-3 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Summary</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatINR(sub)}</span>
          </div>
          {gst > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>GST ({store.gstPercent}%)</span>
              <span>{formatINR(gst)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Estimated total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>

        {/* ── Split-bill section ── */}
        <div className="bg-white rounded-xl px-4 py-4 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Split the bill</h3>

          {/* Stepper + number input */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Number of people</span>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementSplit}
                disabled={splitCount <= 1}
                aria-label="Decrease split count"
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                min={1}
                max={MAX_SPLIT}
                value={splitCount}
                onChange={handleSplitCountChange}
                aria-label="Number of people splitting the bill"
                className="w-12 text-center text-lg font-bold text-gray-900 border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={incrementSplit}
                disabled={splitCount >= MAX_SPLIT}
                aria-label="Increase split count"
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Per-person large display — live update */}
          {isSplitting && (
            <div className="bg-indigo-50 rounded-xl px-4 py-4 text-center">
              <p className="text-sm text-indigo-600 font-medium mb-0.5">Per person</p>
              <p className="text-3xl font-extrabold text-indigo-700">{formatINR(base)}</p>
              {remainder > 0 && (
                <p className="text-xs text-indigo-400 mt-1">
                  First person pays {formatINR(perPersonAmount)} (incl. {formatINR(remainder)} remainder)
                </p>
              )}
            </div>
          )}

          {/* "All paid" tracker */}
          {isSplitting && (
            <div className="space-y-2">
              {allPaid ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-green-800">
                    All {splitCount} people have paid
                  </span>
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-700">
                    <span className="font-bold text-gray-900">{paidCount}</span> of{' '}
                    <span className="font-bold text-gray-900">{splitCount}</span> paid
                  </span>
                  <div className="flex gap-2">
                    {paidCount > 0 && (
                      <button
                        onClick={resetPaid}
                        aria-label="Reset paid count"
                        className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={markOnePaid}
                      disabled={paidCount >= splitCount}
                      aria-label="Mark one person as paid"
                      className="text-sm font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Mark paid
                    </button>
                  </div>
                </div>
              )}

              {/* Visual dots */}
              <div className="flex gap-1.5 justify-center pt-0.5">
                {Array.from({ length: splitCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i < paidCount ? 'bg-green-500' : 'bg-gray-200'}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Share bill link */}
          <Button variant="secondary" fullWidth onClick={handleShareBillLink}>
            Share bill link{isSplitting ? ` (split ${splitCount})` : ''}
          </Button>
        </div>

        {/* QR placeholder */}
        <div className="bg-white rounded-xl px-4 py-5 flex flex-col items-center gap-2">
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs text-center leading-tight px-2">QR</span>
          </div>
          <p className="text-xs text-gray-500 font-medium">Show QR at counter</p>
        </div>

        {/* Share bill text (existing) */}
        <Button variant="ghost" fullWidth onClick={handleShareBillText}>
          Share bill summary
        </Button>
      </div>

      {/* Checkout CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <Button
          fullWidth
          size="lg"
          onClick={() =>
            router.push(
              `/${storeSlug}/checkout${isSplitting ? `?split=${splitCount}` : ''}`
            )
          }
        >
          Proceed to checkout · {formatINR(isSplitting ? perPersonAmount : total)}
        </Button>
      </div>
    </div>
  );
}
