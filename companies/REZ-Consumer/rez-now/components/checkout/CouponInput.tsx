'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Coupon, getStoreCoupons, calculateCouponDiscount } from '@/lib/api/coupons';
import { formatINR } from '@/lib/utils/currency';

interface CouponInputProps {
  storeSlug: string;
  subtotal: number;
  onApply: (coupon: Coupon | null, discount: number) => void;
}

export default function CouponInput({ storeSlug, subtotal, onApply }: CouponInputProps) {
  const t = useTranslations('coupon');

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoaded, setCouponsLoaded] = useState(false);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && !couponsLoaded) {
      try {
        const list = await getStoreCoupons(storeSlug);
        setCoupons(list);
      } catch {
        // Non-fatal — pills just won't show
      } finally {
        setCouponsLoaded(true);
      }
    }
  }

  function applyCode(targetCode: string) {
    const trimmed = targetCode.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError('');

    // Find the coupon in the fetched list (client-side validation)
    const match = coupons.find((c) => c.code.toUpperCase() === trimmed);

    if (!match) {
      setError(t('invalid'));
      setLoading(false);
      return;
    }

    if (match.minOrderValue != null && subtotal < match.minOrderValue) {
      setError(t('minOrder', { amount: Math.round(match.minOrderValue / 100) }));
      setLoading(false);
      return;
    }

    const computed = calculateCouponDiscount(match, subtotal);
    setApplied(match);
    setDiscount(computed);
    onApply(match, computed);
    setCode('');
    setLoading(false);
  }

  function handleApply() {
    applyCode(code);
  }

  function handleRemove() {
    setApplied(null);
    setDiscount(0);
    setCode('');
    setError('');
    onApply(null, 0);
  }

  return (
    <div className="bg-white rounded-xl px-4 py-3">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
        aria-expanded={open}
      >
        <span>{t('label')}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {applied ? (
            /* Applied state */
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="w-4 h-4 text-green-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
                <span className="text-sm font-bold text-green-700 tracking-wide">
                  {t('applied', { code: applied.code })} — {formatINR(discount)} off
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                aria-label={`Remove coupon ${applied.code}`}
                className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors shrink-0 ml-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              >
                {t('remove')}
              </button>
            </div>
          ) : (
            /* Input row */
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('placeholder')}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                className={`flex-1 text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}
                aria-label={t('placeholder')}
                aria-describedby={error ? 'checkout-coupon-error' : undefined}
              />
              <button
                type="button"
                onClick={handleApply}
                disabled={!code.trim() || loading}
                className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {t('apply')}
              </button>
            </div>
          )}

          {error && (
            <p
              id="checkout-coupon-error"
              role="alert"
              className="text-xs text-red-600 flex items-center gap-1"
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          )}

          {/* Available coupon pills */}
          {!applied && couponsLoaded && coupons.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500">{t('available')}</p>
              <div className="flex flex-wrap gap-2">
                {coupons.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => applyCode(c.code)}
                    aria-label={`Apply coupon ${c.code}${c.description ? `: ${c.description}` : ''}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    title={c.description || c.code}
                  >
                    {c.code}
                    <span className="text-indigo-400">
                      {c.discountType === 'percent'
                        ? `${c.discountValue}% off`
                        : `${formatINR(c.discountValue)} off`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
