'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import { getWalletBalance } from '@/lib/api/wallet';
import { formatINR } from '@/lib/utils/currency';
import { WalletBalance } from '@/lib/types';
import Button from '@/components/ui/Button';

interface WalletPaymentProps {
  totalAmount: number; // in paise
  onPartialPayment?: (walletAmount: number, remainingAmount: number) => void;
  onFullPayment?: () => void;
  disabled?: boolean;
}

const COIN_TO_RUPEE_RATE = 100; // 100 coins = 1 rupee

export default function WalletPayment({
  totalAmount,
  onPartialPayment,
  onFullPayment,
  disabled = false,
}: WalletPaymentProps) {
  const { showToast } = useUIStore();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [useFullWallet, setUseFullWallet] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Load wallet balance on mount
  useEffect(() => {
    async function loadWallet() {
      try {
        const balance = await getWalletBalance();
        setWallet(balance);
      } catch {
        showToast('Failed to load wallet balance', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadWallet();
  }, [showToast]);

  // Calculate amounts
  const walletBalanceRupees = wallet ? wallet.coins / COIN_TO_RUPEE_RATE : 0;
  const walletBalancePaise = wallet ? wallet.coins * 100 : 0;
  const customAmountPaise = Math.round(parseFloat(customAmount || '0') * 100);
  const walletAmountToUse = useFullWallet
    ? Math.min(walletBalancePaise, totalAmount)
    : customAmountPaise;
  const remainingAmount = Math.max(0, totalAmount - walletAmountToUse);

  const canPayFully = walletBalancePaise >= totalAmount;
  const canPayPartially = walletBalancePaise > 0 && walletBalancePaise < totalAmount;

  const handleFullWalletPayment = async () => {
    if (!canPayFully) {
      showToast('Insufficient balance for full payment', 'error');
      return;
    }
    setProcessing(true);
    try {
      await useWalletCoins(walletAmountToUse / 100);
      showToast(`Paid ${formatINR(walletAmountToUse)} from wallet`, 'success');
      onFullPayment?.();
    } catch {
      showToast('Wallet payment failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePartialPayment = () => {
    if (walletAmountToUse <= 0) {
      showToast('Please enter an amount to use', 'error');
      return;
    }
    if (walletAmountToUse > walletBalancePaise) {
      showToast('Exceeds wallet balance', 'error');
      return;
    }
    onPartialPayment?.(walletAmountToUse, remainingAmount);
  };

  const presetAmounts = [
    { label: '25%', value: totalAmount * 0.25 },
    { label: '50%', value: totalAmount * 0.5 },
    { label: '75%', value: totalAmount * 0.75 },
  ].filter(p => p.value <= walletBalancePaise);

  if (loading) {
    return (
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-indigo-200 rounded w-24 mb-2" />
            <div className="h-3 bg-indigo-200 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!wallet || wallet.coins === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪙</span>
          <div>
            <p className="text-sm font-semibold text-gray-700">REZ Wallet</p>
            <p className="text-xs text-gray-500">No coins available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪙</span>
          <div>
            <p className="text-sm font-semibold text-indigo-900">REZ Wallet</p>
            <p className="text-xs text-indigo-700">
              {wallet.coins.toLocaleString()} coins · {formatINR(walletBalancePaise)}
            </p>
          </div>
        </div>
        {wallet.tier && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            wallet.tier === 'platinum' ? 'bg-gray-900 text-white' :
            wallet.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
            wallet.tier === 'silver' ? 'bg-gray-200 text-gray-700' :
            'bg-orange-100 text-orange-800'
          }`}>
            {wallet.tier.charAt(0).toUpperCase() + wallet.tier.slice(1)}
          </span>
        )}
      </div>

      {/* Balance info */}
      <div className="bg-white/60 rounded-lg px-3 py-2 flex justify-between text-sm">
        <span className="text-indigo-700">Order total</span>
        <span className="font-semibold text-indigo-900">{formatINR(totalAmount)}</span>
      </div>

      {/* Payment options */}
      <div className="space-y-3">
        {/* Use full balance */}
        {canPayFully && !useFullWallet && (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            disabled={disabled || processing}
            onClick={() => setUseFullWallet(true)}
          >
            Pay full amount with wallet
          </Button>
        )}

        {/* Custom amount input */}
        {!useFullWallet && (
          <>
            <div className="flex gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setCustomAmount((preset.value / 100).toFixed(0))}
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-700 font-medium">₹</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0"
                min={0}
                max={walletBalanceRupees}
                step={10}
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-indigo-200 bg-white text-indigo-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500">
                Max: {formatINR(Math.min(walletBalancePaise, totalAmount))}
              </span>
            </div>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              disabled={disabled || processing || customAmountPaise <= 0}
              onClick={handlePartialPayment}
            >
              Use {customAmount ? formatINR(customAmountPaise) : '₹0'}
            </Button>
          </>
        )}

        {/* Confirm full wallet payment */}
        {useFullWallet && (
          <div className="space-y-2">
            <div className="bg-white/60 rounded-lg px-3 py-2 flex justify-between text-sm">
              <span className="text-indigo-700">Wallet pays</span>
              <span className="font-semibold text-indigo-900">{formatINR(walletAmountToUse)}</span>
            </div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={disabled || processing}
              loading={processing}
              onClick={handleFullWalletPayment}
            >
              Confirm wallet payment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setUseFullWallet(false)}
            >
              Change amount
            </Button>
          </div>
        )}
      </div>

      {/* Coin breakdown */}
      <p className="text-xs text-indigo-600 text-center">
        Using {Math.round(walletAmountToUse / 100)} coins (at 100 coins = ₹1)
      </p>
    </div>
  );
}

// Hook for using wallet coins in API calls
export async function useWalletCoins(rupees: number): Promise<void> {
  const { authClient } = await import('@/lib/api/client');
  const coins = Math.round(rupees * 100); // Convert rupees to coins
  const { data } = await authClient.post('/api/wallet/use', { coins });
  if (!data.success) throw new Error(data.message || 'Failed to use wallet coins');
}
