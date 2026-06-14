'use client';

import { useLoyalty } from '@/lib/hooks/useLoyalty';

interface CoinsDisplayProps {
  variant?: 'badge' | 'card' | 'inline';
  showHistory?: boolean;
}

export default function CoinsDisplay({
  variant = 'inline',
  showHistory = false,
}: CoinsDisplayProps) {
  const { coins, loading } = useLoyalty();

  if (loading || !coins) {
    return <span className="text-gray-400">-- RC</span>;
  }

  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
        <span>🪙</span>
        <span className="font-bold">{coins.available}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">REZ Coins</div>
            <div className="text-2xl font-bold text-yellow-600">{coins.available}</div>
          </div>
          <span className="text-4xl">🪙</span>
        </div>

        {coins.expiring > 0 && (
          <div className="mt-2 text-sm text-orange-600">
            ⚠️ {coins.expiring} expiring soon
          </div>
        )}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span>🪙</span>
      <span className="font-bold text-yellow-600">{coins.available}</span>
    </span>
  );
}
