'use client';

import { useEffect, useState, useCallback } from 'react';
import { recordVisit } from '@/lib/loyalty';
import { useLoyalty } from '@/lib/hooks/useLoyalty';
import type { RecordVisitResult } from '@/lib/loyalty';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

interface OrderSuccessProps {
  order: {
    id: string;
    userId: string;
    storeId: string;
    storeSlug: string;
    storeName: string;
    amount: number;
  };
  onLoyaltyEarned?: (result: RecordVisitResult) => void;
  className?: string;
}

interface EarnedRewards {
  points: number;
  coins: number;
  tier?: string;
  milestones: string[];
}

export default function OrderSuccess({
  order,
  onLoyaltyEarned,
  className,
}: OrderSuccessProps) {
  const { refresh: refreshLoyalty } = useLoyalty();
  const [earned, setEarned] = useState<EarnedRewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recordLoyalty = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await recordVisit({
        orderId: order.id,
        storeSlug: order.storeSlug,
        storeName: order.storeName,
        orderTotal: order.amount,
      });

      if (result.earnedPoints > 0 || result.earnedCoins > 0) {
        setEarned({
          points: result.earnedPoints,
          coins: result.earnedCoins,
          tier: result.newTier,
          milestones: result.unlockedMilestones.map((m) => m.name),
        });

        // Refresh loyalty data
        await refreshLoyalty();

        // Notify parent
        onLoyaltyEarned?.(result);
      }
    } catch (err) {
      logger.error('Failed to record loyalty:', { error: err });
      setError('Could not load rewards. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [order, refreshLoyalty, onLoyaltyEarned]);

  useEffect(() => {
    recordLoyalty();
  }, [recordLoyalty]);

  return (
    <div className={cn('order-success space-y-4', className)}>
      <h2 className="text-xl font-bold text-gray-900">Order Placed Successfully!</h2>

      {/* Order ID */}
      <p className="text-sm text-gray-500">
        Order ID: <span className="font-mono">{order.id}</span>
      </p>

      {/* Loyalty Rewards Earned */}
      {(loading || earned) && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 space-y-3">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-6 w-48 bg-gray-200 rounded" />
            </div>
          ) : earned ? (
            <>
              <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                <span className="text-lg">🎉</span>
                You earned rewards!
              </h3>

              <div className="flex flex-wrap gap-3">
                {earned.points > 0 && (
                  <div className="flex items-center gap-1 bg-white rounded-lg px-3 py-1.5">
                    <span>⭐</span>
                    <span className="font-bold text-indigo-700">{earned.points}</span>
                    <span className="text-xs text-gray-500">points</span>
                  </div>
                )}

                {earned.coins > 0 && (
                  <div className="flex items-center gap-1 bg-white rounded-lg px-3 py-1.5">
                    <span>🪙</span>
                    <span className="font-bold text-yellow-600">{earned.coins}</span>
                    <span className="text-xs text-gray-500">coins</span>
                  </div>
                )}

                {earned.tier && (
                  <div className="flex items-center gap-1 bg-white rounded-lg px-3 py-1.5">
                    <span>🚀</span>
                    <span className="font-bold text-purple-700">
                      {earned.tier.charAt(0).toUpperCase() + earned.tier.slice(1)} tier unlocked!
                    </span>
                  </div>
                )}
              </div>

              {earned.milestones.length > 0 && (
                <div className="pt-2 border-t border-indigo-100">
                  <p className="text-xs text-indigo-700 font-medium">New milestones unlocked:</p>
                  <ul className="mt-1 space-y-1">
                    {earned.milestones.map((milestone, index) => (
                      <li key={index} className="text-xs text-indigo-600 flex items-center gap-1">
                        <span>🏆</span>
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Existing success content slot */}
      <div className="text-gray-600">
        {/* Add more order success content here */}
      </div>
    </div>
  );
}
