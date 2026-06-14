// @ts-nocheck
/**
 * Merchant AI Pricing Hook
 *
 * Hook for getting AI-powered pricing suggestions for trials.
 * Helps merchants optimize their trial pricing for maximum conversion.
 */

import { useState, useCallback } from 'react';
import { rezMindClient, PricingSuggestion } from '@/services/ReZMIND_CLIENT';

interface UseMerchantPricingAIResult {
  suggestion: PricingSuggestion | null;
  loading: boolean;
  error: string | null;
  getSuggestion: (params: PricingSuggestionParams) => Promise<PricingSuggestion | null>;
  clearSuggestion: () => void;
}

interface PricingSuggestionParams {
  category: string;
  merchantQuality: number;
  competitorPrices: number[];
  targetConversion: number;
  originalPrice: number;
}

/**
 * Hook for AI-powered merchant pricing suggestions
 *
 * @returns Pricing suggestion state and methods
 *
 * @example
 * ```typescript
 * const { suggestion, loading, getSuggestion } = useMerchantPricingAI();
 *
 * const result = await getSuggestion({
 *   category: 'Food & Dining',
 *   merchantQuality: 4.5,
 *   competitorPrices: [60, 70, 80],
 *   targetConversion: 40,
 *   originalPrice: 200,
 * });
 * ```
 */
export function useMerchantPricingAI(): UseMerchantPricingAIResult {
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestion = useCallback(async (params: PricingSuggestionParams): Promise<PricingSuggestion | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await rezMindClient.suggestTrialPricing({
        category: params.category,
        merchantQuality: params.merchantQuality,
        competitorPrices: params.competitorPrices,
        targetConversion: params.targetConversion,
      });

      setSuggestion(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pricing suggestion';
      setError(errorMessage);
      logger.error('[useMerchantPricingAI] Error getting suggestion:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setError(null);
  }, []);

  return {
    suggestion,
    loading,
    error,
    getSuggestion,
    clearSuggestion,
  };
}

/**
 * Calculate price tier for display
 *
 * @param coinPrice - Suggested coin price
 * @param originalPrice - Original merchant price
 * @returns Price tier label
 */
export function getPriceTier(coinPrice: number, originalPrice: number): {
  label: string;
  color: string;
} {
  const ratio = coinPrice / originalPrice;

  if (ratio < 0.2) {
    return { label: 'Deep Discount', color: '#22C55E' }; // Green
  } else if (ratio < 0.4) {
    return { label: 'Great Deal', color: '#10B981' }; // Emerald
  } else if (ratio < 0.6) {
    return { label: 'Good Value', color: '#3B82F6' }; // Blue
  } else {
    return { label: 'Premium', color: '#8B5CF6' }; // Purple
  }
}

/**
 * Calculate potential earnings from a trial
 *
 * @param coinPrice - Trial coin price
 * @param commitmentFee - Trial commitment fee
 * @param expectedBookings - Expected number of bookings per month
 * @returns Estimated monthly earnings
 */
export function calculatePotentialEarnings(
  coinPrice: number,
  commitmentFee: number,
  expectedBookings: number = 100,
): {
  coinRevenue: number;
  commitmentFeeRevenue: number;
  totalMonthlyRevenue: number;
  annualProjection: number;
} {
  const coinRevenue = coinPrice * expectedBookings * 0.1; // 10% platform fee
  const commitmentFeeRevenue = commitmentFee * expectedBookings * 0.5; // 50% of commitment fees

  return {
    coinRevenue: Math.round(coinRevenue),
    commitmentFeeRevenue: Math.round(commitmentFeeRevenue),
    totalMonthlyRevenue: Math.round(coinRevenue + commitmentFeeRevenue),
    annualProjection: Math.round((coinRevenue + commitmentFeeRevenue) * 12),
  };
}

export default useMerchantPricingAI;
