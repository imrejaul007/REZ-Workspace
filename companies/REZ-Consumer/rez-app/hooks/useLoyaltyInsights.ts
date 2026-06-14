// @ts-nocheck
/**
 * Loyalty Insights Hook
 * Connects to REZ-loyalty-insights (Port 4060)
 * Loyalty program analytics and engagement tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';

const LOYALTY_URL = process.env.EXPO_PUBLIC_LOYALTY_URL || 'https://REZ-loyalty-insights.onrender.com';

// Response types
interface LoyaltyInsightsResponse {
  tier: LoyaltyTier;
  rewards: LoyaltyRewards;
  transactions: LoyaltyTransaction[];
}

interface LoyaltyTransactionsResponse {
  transactions: LoyaltyTransaction[];
}

interface RedemptionOptionsResponse {
  options: Array<{ id: string; name: string; pointsRequired: number }>;
}

interface PointsCalculationResponse {
  points: number;
  bonus: number;
  total: number;
}

interface LoyaltyEngagementResponse extends EngagementMetrics {}

export interface LoyaltyTier {
  current: 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip';
  next: string | null;
  progress: number;
  pointsToNextTier: number;
  benefits: string[];
}

export interface LoyaltyRewards {
  available: number;
  pending: number;
  lifetime: number;
  expires: {
    amount: number;
    expiresAt: string;
  } | null;
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'bonus' | 'refund';
  points: number;
  description: string;
  timestamp: string;
  relatedOrderId?: string;
}

export interface EngagementMetrics {
  visitFrequency: {
    weekly: number;
    monthly: number;
    lastVisit: string;
  };
  purchaseRecency: {
    daysSinceLastPurchase: number;
    averageDaysBetweenPurchases: number;
  };
  engagement: {
    wishlistItems: number;
    reviewsWritten: number;
    referrals: number;
  };
}

export function useLoyaltyInsights() {
  const user = useAuthUser();
  const [tier, setTier] = useState<LoyaltyTier | null>(null);
  const [rewards, setRewards] = useState<LoyaltyRewards | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoyaltyData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<LoyaltyInsightsResponse>(`${LOYALTY_URL}/insights/${user.id}`);

      if (response.success && response.data) {
        setTier(response.data.tier);
        setRewards(response.data.rewards);
        setTransactions(response.data.transactions || []);
      } else {
        setError(response.error || 'Failed to fetch loyalty data');
      }
    } catch {
      setError('Network error fetching loyalty insights');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchTransactions = useCallback(async (limit = 20) => {
    if (!user?.id) return [];

    try {
      const response = await apiClient.get<LoyaltyTransactionsResponse>(`${LOYALTY_URL}/transactions/${user.id}`, {
        limit,
      });

      if (response.success && response.data) {
        setTransactions(response.data.transactions || []);
        return response.data.transactions || [];
      }
      return [];
    } catch {
      return [];
    }
  }, [user?.id]);

  const trackEngagement = useCallback(async (
    action: 'purchase' | 'review' | 'referral' | 'social_share' | 'game',
    metadata?: Record<string, unknown>
  ) => {
    if (!user?.id) return;

    try {
      await apiClient.post(`${LOYALTY_URL}/engage`, {
        userId: user.id,
        action,
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  return {
    tier,
    rewards,
    transactions,
    loading,
    error,
    fetchLoyaltyData,
    fetchTransactions,
    trackEngagement,
  };
}

export function useEngagementMetrics() {
  const user = useAuthUser();
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    apiClient.get<LoyaltyEngagementResponse>(`${LOYALTY_URL}/engagement/${user.id}`)
      .then(res => {
        if (res.success && res.data) {
          setMetrics(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const isActive = useCallback(() => {
    if (!metrics) return false;
    return metrics.visitFrequency.weekly >= 2;
  }, [metrics]);

  const getChurnRisk = useCallback(() => {
    if (!metrics) return 'unknown';
    const daysSince = metrics.purchaseRecency.daysSinceLastPurchase;
    if (daysSince <= 7) return 'low';
    if (daysSince <= 30) return 'medium';
    return 'high';
  }, [metrics]);

  return { metrics, loading, isActive, getChurnRisk };
}

export function usePointsCalculator() {
  const user = useAuthUser();

  const calculateEarnable = useCallback(async (
    orderAmount: number,
    category?: string
  ) => {
    if (!user?.id) return { points: 0, bonus: 0, total: 0 };

    try {
      const response = await apiClient.post(`${LOYALTY_URL}/calculate`, {
        userId: user.id,
        orderAmount,
        category,
      });

      if (response.success && response.data) {
        return response.data;
      }
      return { points: 0, bonus: 0, total: 0 };
    } catch {
      // Fallback calculation: 1 point per ₹10
      const points = Math.floor(orderAmount / 10);
      return { points, bonus: 0, total: points };
    }
  }, [user?.id]);

  const getRedemptionOptions = useCallback(async (points: number) => {
    if (!user?.id) return [];

    try {
      const response = await apiClient.get<RedemptionOptionsResponse>(`${LOYALTY_URL}/redeem/${user.id}`, {
        points,
      });

      if (response.success && response.data) {
        return response.data.options || [];
      }
      return [];
    } catch {
      return [];
    }
  }, [user?.id]);

  return { calculateEarnable, getRedemptionOptions };
}
