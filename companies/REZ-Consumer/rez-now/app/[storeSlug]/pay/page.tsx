'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useStore } from '../StoreContextProvider';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatINR } from '@/lib/utils/currency';
import Button from '@/components/ui/Button';

const QUICK_AMOUNTS = [100, 200, 500, 1000]; // in rupees

export default function ScanPayPage() {
  const { store } = useStore();
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const openLoginModal = useUIStore((s) => s.openLoginModal);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
  const _showToast = useUIStore((s) => s.showToast);

  const [amountRupees, setAmountRupees] = useState('');
  const [error, setError] = useState('');

  const parsedRupees = parseFloat(amountRupees);
  const validAmount = !isNaN(parsedRupees) && parsedRupees >= 1;

  function handleAmountInput(val: string) {
    // Allow digits and one decimal point, max 2 decimal places
    const cleaned = val.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmountRupees(cleaned);
    setError('');
  }

  function handleQuickAmount(rupees: number) {
    setAmountRupees(String(rupees));
    setError('');
  }

  function handleProceed() {
    if (!validAmount) { setError('Enter a valid amount'); return; }
    if (parsedRupees < 1) { setError('Minimum amount is ₹1'); return; }

    if (!isLoggedIn) {
      openLoginModal(() => router.push(`/${store.slug}/pay/checkout?amount=${Math.round(parsedRupees * 100)}`));
      return;
    }
    router.push(`/${store.slug}/pay/checkout?amount=${Math.round(parsedRupees * 100)}`);
  }

  // NOTE: This is a LOCAL PREVIEW only. The actual coins are computed by the backend
  // (via /api/store-payment/coins/credit after payment confirmation). Do not rely on
  // this value for any financial decisions. The backend is the single source of truth.
  // Formula: coins = floor((rupees) * (cashbackRate / 100))
  // e.g. ₹100 at 5% rate = floor(100 * (5/100)) = floor(5) = 5 coins
  // e.g. ₹500 at 5% rate = floor(500 * (5/100)) = floor(25) = 25 coins
  // NW-CROSS-01 FIX: Removed spurious / 10 that caused 12x discrepancy with checkout page.
  const estimatedCoins = validAmount
    ? Math.floor(parsedRupees * ((store.rewardRules.baseCashbackPercent || 0) / 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Store header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        {store.logo && (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
            <Image
                src={store.logo}
                alt={store.name}
                fill
                sizes="48px"
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-gray-900">{store.name}</h1>
          <p className="text-xs text-gray-500">{store.address}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
        {/* Amount input */}
        <div className="w-full max-w-xs text-center">
          <p className="text-sm text-gray-500 mb-3">Enter amount to pay</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-4xl font-light text-gray-400">₹</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amountRupees}
              onChange={(e) => handleAmountInput(e.target.value)}
              className="text-5xl font-bold text-gray-900 w-48 text-center bg-transparent border-none focus:outline-2 focus:outline-indigo-400 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 rounded-lg placeholder:text-gray-300"
              aria-label="Enter amount in rupees"
              autoFocus
            />
          </div>
          {validAmount && (
            <p className="text-sm text-gray-400 mt-1">{formatINR(Math.round(parsedRupees * 100))}</p>
          )}
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 flex-wrap justify-center">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => handleQuickAmount(amt)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              ₹{amt}
            </button>
          ))}
        </div>

        {/* Coin earn preview */}
        {store.isProgramMerchant && validAmount && estimatedCoins > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <span className="text-xl">🪙</span>
            <p className="text-sm text-indigo-700">
              You&apos;ll earn <strong>~{estimatedCoins} REZ coins</strong> for this payment
            </p>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handleProceed}
          disabled={!validAmount}
          className="max-w-xs"
        >
          Pay {validAmount ? formatINR(Math.round(parsedRupees * 100)) : ''}
        </Button>
      </div>
    </div>
  );
}
