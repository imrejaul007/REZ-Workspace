'use client';

import { useState, useEffect, useCallback } from 'react';
import { MenuItem } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

interface DishRecommendation {
  item: MenuItem;
  reason: 'popular' | 'similar' | 'frequently_bought' | 'complementary' | 'seasonal' | 'personal';
  score: number;
}

interface DishRecommendationsProps {
  storeSlug: string;
  currentItems?: MenuItem[];
  maxDisplay?: number;
  onItemClick?: (item: MenuItem) => void;
  className?: string;
}

export default function DishRecommendations({
  storeSlug,
  currentItems = [],
  maxDisplay = 4,
  onItemClick,
  className,
}: DishRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<DishRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const { getDishRecommendations } = await import('@/lib/services/recommendationService');
      const currentItemIds = currentItems.map((item) => item.id);
      const recs = await getDishRecommendations(storeSlug, currentItemIds);
      setRecommendations(recs.slice(0, maxDisplay));
    } catch (error) {
      logger.error('Failed to fetch recommendations:', { error });
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, currentItems, maxDisplay]);

  useEffect(() => {
    if (storeSlug) {
      fetchRecommendations();
    }
  }, [fetchRecommendations]);

  if (loading || dismissed || recommendations.length === 0) {
    return null;
  }

  const getReasonLabel = (reason: DishRecommendation['reason']) => {
    switch (reason) {
      case 'popular':
        return 'Popular';
      case 'similar':
        return 'You might like';
      case 'frequently_bought':
        return 'Often ordered together';
      case 'complementary':
        return 'Goes great with';
      case 'seasonal':
        return 'Seasonal special';
      case 'personal':
        return 'Recommended for you';
      default:
        return 'Recommended';
    }
  };

  const getReasonColor = (reason: DishRecommendation['reason']) => {
    switch (reason) {
      case 'popular':
        return 'bg-orange-100 text-orange-700';
      case 'personal':
        return 'bg-purple-100 text-purple-700';
      case 'seasonal':
        return 'bg-green-100 text-green-700';
      case 'complementary':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="text-sm font-bold text-gray-900">You might also like</h3>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Dismiss
        </button>
      </div>

      {/* Recommendations grid */}
      <div className="grid grid-cols-2 gap-3">
        {recommendations.map((rec) => (
          <button
            key={rec.item.id}
            onClick={() => onItemClick?.(rec.item)}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {/* Image */}
            {rec.item.image && (
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img
                  src={rec.item.image}
                  alt={rec.item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-3 space-y-2">
              {/* Badge */}
              <span
                className={cn(
                  'inline-block text-xs px-2 py-0.5 rounded-full font-medium',
                  getReasonColor(rec.reason),
                )}
              >
                {getReasonLabel(rec.reason)}
              </span>

              {/* Name */}
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                {rec.item.name}
              </p>

              {/* Description */}
              {rec.item.description && (
                <p className="text-xs text-gray-500 line-clamp-1">
                  {rec.item.description}
                </p>
              )}

              {/* Price & veg indicator */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-gray-900">
                  {formatINR(rec.item.price)}
                </span>
                <span className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center">
                  {rec.item.isVeg ? (
                    <span className="w-2 h-2 rounded-full bg-green-600" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                  )}
                </span>
              </div>

              {/* Spicy level */}
              {(rec.item.spicyLevel ?? 0) > 0 && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'text-xs',
                        i < (rec.item.spicyLevel ?? 0) ? 'text-red-500' : 'text-gray-200',
                      )}
                    >
                      🌶
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Horizontal scrollable recommendations for cart/checkout
export function CartRecommendations({
  storeSlug,
  cartItemIds,
  maxDisplay = 3,
  onAddItem,
}: {
  storeSlug: string;
  cartItemIds: string[];
  maxDisplay?: number;
  onAddItem?: (item: MenuItem) => void;
}) {
  const [recommendations, setRecommendations] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { getComplementaryItems } = await import('@/lib/services/recommendationService');
        const recs = await getComplementaryItems(storeSlug, cartItemIds);
        setRecommendations(recs.slice(0, maxDisplay));
      } catch {
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [storeSlug, cartItemIds, maxDisplay]);

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-medium">Add to your order</p>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {recommendations.map((item) => (
          <button
            key={item.id}
            onClick={() => onAddItem?.(item)}
            className="shrink-0 w-32 bg-white rounded-lg border border-gray-100 p-2 text-left hover:shadow-md transition-shadow"
          >
            {item.image && (
              <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <p className="text-xs font-medium text-gray-900 line-clamp-2">{item.name}</p>
            <p className="text-xs font-semibold text-indigo-600 mt-1">
              {formatINR(item.price)}
            </p>
            <button className="mt-2 w-full text-xs bg-indigo-100 text-indigo-700 py-1 rounded-full hover:bg-indigo-200 transition-colors">
              Add
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
