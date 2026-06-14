'use client';

import { useState } from 'react';
import type { AxiosError } from 'axios';
import { CouponValidateResponse } from '@/lib/types';
import { validateCoupon } from '@/lib/api/cart';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatINR } from '@/lib/utils/currency';
import Button from '@/components/ui/Button';
import OffersModal from './OffersModal';

interface CouponInputProps {
  storeSlug: string;
  cartTotal: number;
  appliedCoupon: CouponValidateResponse | null;
  onApply: (coupon: CouponValidateResponse) => void;
  onRemove: () => void;
}

export default function CouponInput({
  storeSlug,
  cartTotal,
  appliedCoupon,
  onApply,
  onRemove,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offersOpen, setOffersOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  const { openLoginModal, showToast } = useUIStore();

  function handleApply() {
    applyCodeInternal(code);
  }

  function handleApplyFromModal(selectedCode: string) {
    setCode(selectedCode);
    setOffersOpen(false);
    applyCodeInternal(selectedCode);
  }

  async function applyCodeInternal(targetCode: string) {
    setLoading(true);
    setError('');
    try {
      const result = await validateCoupon(targetCode, storeSlug, cartTotal);
      onApply(result);
      showToast(`Coupon applied! Saved ${formatINR(result.discountAmount)}`, 'success');
      setCode('');
    } catch (e: unknown) {
      // NW-CRIT-011 PARTIAL: Show specific message for rate-limit (429) and auth (401) errors.
      // CAPTCHA enforcement requires backend support — this is the frontend complement.
      if (e instanceof Error && 'isAxiosError' in e) {
        const axiosErr = e as AxiosError<{ message?: string }>;
        if (axiosErr.response?.status === 429) {
          setError('Too many attempts. Please wait a few minutes.');
          return;
        }
        if (axiosErr.response?.status === 401) {
          setError('Please log in to apply coupons.');
          return;
        }
        setError(axiosErr.response?.data?.message || e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Invalid coupon code');
      }
    } finally {
      setLoading(false);
    }
  }

  if (appliedCoupon) {
    return (
      <div>
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Ticket icon */}
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <div className="min-w-0">
              <span className="text-sm font-bold text-green-700 tracking-wide">{appliedCoupon.couponCode}</span>
              <p className="text-xs text-green-600 mt-0.5">
                You save {formatINR(appliedCoupon.discountAmount)}
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors shrink-0 ml-3"
            aria-label="Remove coupon"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          className={`flex-1 text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
          }`}
          aria-label="Coupon code"
          aria-describedby={error ? 'coupon-error' : undefined}
        />
        <Button
          size="sm"
          variant="secondary"
          loading={loading}
          onClick={handleApply}
          disabled={!code.trim()}
          className="shrink-0"
        >
          Apply
        </Button>
      </div>

      {error && (
        <p id="coupon-error" role="alert" className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOffersOpen(true)}
        className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        View available offers
      </button>

      <OffersModal
        open={offersOpen}
        storeSlug={storeSlug}
        onClose={() => setOffersOpen(false)}
        onApply={handleApplyFromModal}
      />
    </div>
  );
}
