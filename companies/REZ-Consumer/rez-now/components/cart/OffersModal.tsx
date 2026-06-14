'use client';

import { useEffect, useState, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { getAvailableCoupons } from '@/lib/api/cart';
import { Coupon } from '@/lib/api/coupons';
import { formatINR } from '@/lib/utils/currency';
import { useCartStore } from '@/lib/store/cartStore';

interface OffersModalProps {
  open: boolean;
  storeSlug: string;
  onClose: () => void;
  onApply: (code: string) => void;
}

function CouponSkeleton() {
  return (
    <div className="border border-gray-100 rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-40" />
          <div className="h-3 bg-gray-100 rounded w-32" />
        </div>
        <div className="h-8 bg-gray-200 rounded-lg w-16 shrink-0" />
      </div>
    </div>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available — silent fail
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
      aria-label={`Copy code ${code}`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function OffersModal({ open, storeSlug, onClose, onApply }: OffersModalProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const subtotal = useCartStore((s) => s.subtotal);

  // NW-MED-016: Cache coupons with a 5-minute TTL to avoid re-fetching on every modal open.
  const cacheRef = useRef<{ coupons: Coupon[]; fetchedAt: number } | null>(null);
  const CACHE_TTL_MS = 5 * 60 * 1000;

  useEffect(() => {
    if (!open) return;

    // Using setTimeout to defer state updates and avoid cascading renders (react-hooks/set-state-in-effect)
    const timeoutId = setTimeout(() => {
      setLoading(true);
      setError('');

      // Return cached coupons if fresh
      if (cacheRef.current && Date.now() - cacheRef.current.fetchedAt < CACHE_TTL_MS) {
        setCoupons(cacheRef.current.coupons);
        setLoading(false);
        return;
      }

      getAvailableCoupons(storeSlug)
        .then((data) => {
          cacheRef.current = { coupons: data, fetchedAt: Date.now() };
          setCoupons(data);
        })
        .catch(() => setError('Could not load offers. Please try again.'))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [open, storeSlug, CACHE_TTL_MS]);

  function formatDiscount(coupon: Coupon): string {
    if (coupon.discountType === 'percent') return `${coupon.discountValue}% off`;
    return `${formatINR(coupon.discountValue)} off`;
  }

  return (
    <Modal open={open} onClose={onClose} title="Available Offers">
      <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2 space-y-3">
        {loading && (
          <>
            <CouponSkeleton />
            <CouponSkeleton />
            <CouponSkeleton />
          </>
        )}

        {!loading && error && (
          <div className="text-center py-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && coupons.length === 0 && (
          <div className="text-center py-10">
            <span className="text-4xl block mb-3">🎟️</span>
            <p className="text-sm font-semibold text-gray-700">No active offers right now</p>
            <p className="text-xs text-gray-400 mt-1">Check back later for deals</p>
          </div>
        )}

        {!loading && !error && coupons.map((coupon) => (
          <div
            key={coupon.code}
            className="border border-dashed border-indigo-200 rounded-xl p-4 bg-indigo-50/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-indigo-700 tracking-widest bg-white border border-indigo-200 rounded px-2 py-0.5">
                    {coupon.code}
                  </span>
                  <CopyButton code={coupon.code} />
                </div>

                <p className="text-sm font-semibold text-gray-800 mt-1.5">
                  {formatDiscount(coupon)}
                </p>

                {coupon.description && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{coupon.description}</p>
                )}

                {coupon.minOrderValue != null && coupon.minOrderValue > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Min order: {formatINR(coupon.minOrderValue)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onApply(coupon.code)}
                disabled={coupon.minOrderValue != null && coupon.minOrderValue > subtotal()}
                className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
