'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/lib/store/cartStore';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { useTrack } from '@/lib/analytics/events';
import { useFrequentItems, useLoyalty } from '@/lib/hooks/useLoyalty';

interface UsualItem {
  menuItemId: string;
  name: string;
  price: number;
  image?: string;
  orderCount: number;
  lastOrderedAt: string;
  category?: string;
  isAvailable?: boolean;
}

interface YourUsualProps {
  storeSlug: string;
  onReorder?: (items: UsualItem[]) => void;
  className?: string;
}

export default function YourUsual({
  storeSlug,
  onReorder,
  className,
}: YourUsualProps) {
  const [showAll, setShowAll] = useState(false);

  // Use the loyalty hook for frequent items and taste profile
  const { items: usualItems, tasteProfile, loading, error, refresh } = useFrequentItems(storeSlug, 5);

  // Also get user loyalty profile for tier/streak display
  const { profile: loyaltyProfile, streak } = useLoyalty();

  const addItem = useCartStore((s) => s.addItem);
  const track = useTrack();

  const handleAddToCart = (item: UsualItem) => {
    addItem({
      itemId: item.menuItemId,
      name: item.name,
      price: item.price,
      basePrice: item.price,
      customizations: {},
      customizationTotal: 0,
      isVeg: true, // Default, will be determined by menu
    });

    track({
      event: 'reorder_usual',
      storeSlug,
      properties: {
        itemId: item.menuItemId,
        itemName: item.name,
        price: item.price,
        previousOrderCount: item.orderCount,
      },
    });
  };

  const handleReorderAll = () => {
    const availableItems = usualItems.filter((item) => item.isAvailable !== false);
    availableItems.forEach((item) => {
      handleAddToCart(item);
    });

    track({
      event: 'reorder_all_usual',
      storeSlug,
      properties: {
        itemCount: availableItems.length,
        totalPrice: availableItems.reduce((sum, item) => sum + item.price, 0),
      },
    });

    onReorder?.(availableItems);
  };

  const displayedItems = showAll ? usualItems : usualItems.slice(0, 3);

  type OrderingFrequency = 'daily' | 'weekly' | 'monthly' | 'occasional';

  const getFrequencyLabel = (frequency: OrderingFrequency): string => {
    const labels: Record<OrderingFrequency, string> = {
      daily: 'You order daily',
      weekly: 'You order weekly',
      monthly: 'You order monthly',
      occasional: 'You order occasionally',
    };
    return labels[frequency];
  };

  if (loading) {
    return (
      <section className={cn('bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4', className)}>
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-gray-200 rounded mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || usualItems.length === 0) {
    return null; // Don't show section if no data or error
  }

  return (
    <section className={cn('bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">👋</span>
            Your Usual
          </h2>
          {tasteProfile && (
            <p className="text-xs text-gray-500 mt-0.5">
              {getFrequencyLabel(tasteProfile.orderingFrequency)}
            </p>
          )}
        </div>

        {/* Loyalty status badges */}
        {(loyaltyProfile || streak) && (
          <div className="flex items-center gap-2">
            {streak && streak.currentStreak > 0 && (
              <span className="text-xs text-orange-600 font-medium">
                🔥 {streak.currentStreak}
              </span>
            )}
            {loyaltyProfile?.tier && (
              <span className="text-xs bg-white/60 text-gray-700 px-2 py-0.5 rounded-full">
                {loyaltyProfile.tier.charAt(0).toUpperCase() + loyaltyProfile.tier.slice(1)}
              </span>
            )}
          </div>
        )}

        {usualItems.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showAll ? 'Show less' : `+${usualItems.length - 3} more`}
          </button>
        )}
      </div>

      {/* Usual Items */}
      <div className="space-y-2">
        {displayedItems.map((item) => (
          <div
            key={item.menuItemId}
            className="flex items-center gap-3 bg-white rounded-lg p-2 shadow-sm"
          >
            {/* Item Image */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-lg">🍽️</span>
                </div>
              )}
            </div>

            {/* Item Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">
                  {formatINR(item.price)}
                </span>
                <span className="text-xs text-gray-400">
                  • {item.orderCount}x ordered
                </span>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={() => handleAddToCart(item)}
              disabled={item.isAvailable === false}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex-shrink-0',
                item.isAvailable === false
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
            >
              {item.isAvailable === false ? 'Unavailable' : 'Add'}
            </button>
          </div>
        ))}
      </div>

      {/* Reorder All Button */}
      {usualItems.length > 1 && (
        <button
          onClick={handleReorderAll}
          className="w-full mt-3 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>🔄</span>
          <span>Order Your Usual ({usualItems.filter((i) => i.isAvailable !== false).length} items)</span>
        </button>
      )}

      {/* Taste Profile Summary */}
      {tasteProfile && tasteProfile.preferredCuisines.length > 0 && (
        <div className="mt-3 pt-3 border-t border-indigo-100">
          <p className="text-xs text-gray-500 mb-1.5">Your taste preferences:</p>
          <div className="flex flex-wrap gap-1">
            {tasteProfile.preferredCuisines.slice(0, 3).map((cuisine) => (
              <span
                key={cuisine}
                className="inline-flex items-center px-2 py-0.5 bg-white rounded-full text-[10px] text-gray-600 border border-indigo-100"
              >
                {cuisine}
              </span>
            ))}
            {tasteProfile.spiceTolerance > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-white rounded-full text-[10px] text-orange-600 border border-orange-100">
                🌶️ {tasteProfile.spiceTolerance > 2 ? 'Hot lover' : 'Some spice'}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
