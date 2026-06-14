'use client';

import { useState, useCallback } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import { formatINR } from '@/lib/utils/currency';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface GiftCard {
  id: string;
  code: string;
  balance: number; // in paise
  originalAmount: number;
  expiresAt?: string;
  merchantSlug?: string;
}

interface GiftCardRedemptionProps {
  totalAmount: number; // in paise
  onApply: (giftCard: GiftCard, discountAmount: number) => void;
  onRemove: () => void;
  appliedGiftCard?: GiftCard | null;
}

export default function GiftCardRedemption({
  totalAmount,
  onApply,
  onRemove,
  appliedGiftCard,
}: GiftCardRedemptionProps) {
  const { showToast } = useUIStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(false);

  const validateGiftCard = useCallback(async (giftCardCode: string) => {
    if (giftCardCode.length < 6) {
      setError('Please enter a valid gift card code');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { authClient } = await import('@/lib/api/client');
      const { data } = await authClient.post('/api/gift-card/validate', {
        code: giftCardCode,
        amount: totalAmount,
      });

      if (!data.success) {
        setError(data.message || 'Invalid gift card');
        return null;
      }

      const giftCard: GiftCard = {
        id: data.data.id,
        code: data.data.code,
        balance: data.data.balance,
        originalAmount: data.data.originalAmount,
        expiresAt: data.data.expiresAt,
        merchantSlug: data.data.merchantSlug,
      };

      return giftCard;
    } catch (err) {
      setError('Failed to validate gift card. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [totalAmount]);

  const handleApply = async () => {
    const trimmedCode = code.trim().toUpperCase();
    const giftCard = await validateGiftCard(trimmedCode);

    if (giftCard) {
      const discountAmount = Math.min(giftCard.balance, totalAmount);
      onApply(giftCard, discountAmount);
      setCode('');
      setError(null);
      showToast(`Gift card applied: ${formatINR(discountAmount)} off`, 'success');
    }
  };

  const handleRemove = () => {
    onRemove();
    showToast('Gift card removed', 'info');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  const discountAmount = appliedGiftCard
    ? Math.min(appliedGiftCard.balance, totalAmount)
    : 0;

  // Format gift card code with spacing (XXXX-XXXX)
  const formatCodeDisplay = (c: string) => {
    const cleaned = c.replace(/-/g, '');
    if (cleaned.length <= 4) return cleaned;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎁</span>
        <div>
          <p className="text-sm font-bold text-gray-900">Gift Card</p>
          <p className="text-xs text-gray-500">Apply a gift card to your order</p>
        </div>
      </div>

      {/* Applied gift card */}
      {appliedGiftCard ? (
        <div className="bg-white rounded-xl px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-lg">🎁</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 font-mono">
                  {formatCodeDisplay(appliedGiftCard.code)}
                </p>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-xs text-purple-600 hover:text-purple-800"
                >
                  {showBalance
                    ? `Balance: ${formatINR(appliedGiftCard.balance)}`
                    : 'View balance'}
                </button>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove gift card"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Discount amount */}
          <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
            <span className="text-sm text-green-700">Discount applied</span>
            <span className="text-sm font-bold text-green-700">
              -{formatINR(discountAmount)}
            </span>
          </div>

          {/* Remaining balance */}
          {appliedGiftCard.balance > discountAmount && (
            <p className="text-xs text-gray-500">
              Remaining gift card balance: {formatINR(appliedGiftCard.balance - discountAmount)}
            </p>
          )}

          {/* Expiry */}
          {appliedGiftCard.expiresAt && (
            <p className="text-xs text-gray-500">
              Expires: {new Date(appliedGiftCard.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        /* Gift card input */
        <>
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                // Auto-format: add dash after every 4 characters
                let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (val.length > 8) val = val.slice(0, 8);
                if (val.length > 4) val = `${val.slice(0, 4)}-${val.slice(4)}`;
                setCode(val);
                setError(null);
              }}
              onKeyPress={handleKeyPress}
              placeholder="XXXX-XXXX"
              maxLength={9} // 8 chars + 1 dash
              className={cn(
                'w-full px-4 py-3 rounded-xl border bg-white text-gray-900 font-mono text-lg tracking-wider',
                'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400',
                'placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal',
                error ? 'border-red-400' : 'border-purple-200',
              )}
            />
            {code && (
              <button
                onClick={() => setCode('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Apply button */}
          <Button
            variant="secondary"
            size="md"
            fullWidth
            disabled={code.replace(/-/g, '').length < 6 || loading}
            loading={loading}
            onClick={handleApply}
            className="bg-white border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {loading ? 'Validating...' : 'Apply Gift Card'}
          </Button>

          {/* Help text */}
          <p className="text-xs text-gray-500 text-center">
            Enter the 8-character code from your gift card
          </p>
        </>
      )}

      {/* Gift card benefits */}
      {!appliedGiftCard && (
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No expiry
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Multiple use
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Any merchant
          </span>
        </div>
      )}
    </div>
  );
}

// Utility function to check gift card balance
export async function checkGiftCardBalance(code: string): Promise<{
  valid: boolean;
  balance?: number;
  error?: string;
}> {
  try {
    const { authClient } = await import('@/lib/api/client');
    const { data } = await authClient.post('/api/gift-card/balance', { code });
    return {
      valid: data.success,
      balance: data.data?.balance,
      error: data.message,
    };
  } catch {
    return {
      valid: false,
      error: 'Failed to check balance',
    };
  }
}
