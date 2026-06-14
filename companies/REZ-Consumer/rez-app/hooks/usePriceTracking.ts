// @ts-nocheck
/**
 * usePriceTracking Hook
 *
 * Manages price history, statistics, and price alerts
 *
 * Features:
 * - Fetch price history and stats
 * - Create and manage price alerts
 * - Check if user has active alerts
 * - View alert history
 * - Auto-refresh on focus
 */

import { useState, useEffect, useCallback } from 'react';
import priceTrackingApi, {
  PriceHistoryRecord,
  PriceStats,
  PriceAlert,
  CreatePriceAlertRequest,
} from '@/services/priceTrackingApi';
import { logger } from '@/utils/logger';

interface UsePriceTrackingProps {
  productId?: string;
  variantId?: string;
  autoLoad?: boolean;
}

interface UsePriceTrackingReturn {
  // Price History
  priceHistory: PriceHistoryRecord[];
  priceStats: PriceStats | null;
  isLoadingHistory: boolean;
  isLoadingStats: boolean;

  // Price Alerts
  hasActiveAlert: boolean;
  alerts: PriceAlert[];
  isLoadingAlerts: boolean;
  isCreatingAlert: boolean;
  error: string | null;

  // Actions
  loadPriceHistory: (options?: { limit?: number; days?: number }) => Promise<void>;
  loadPriceStats: (days?: number) => Promise<void>;
  createAlert: (data: Omit<CreatePriceAlertRequest, 'productId' | 'variantId'>) => Promise<void>;
  cancelAlert: (alertId: string) => Promise<void>;
  checkAlert: () => Promise<void>;
  loadAlerts: (params?: { page?: number; status?: 'cancelled' | 'active' | 'expired' | 'triggered' }) => Promise<void>;
  refresh: () => Promise<void>;
}

export const usePriceTracking = ({
  productId,
  variantId,
  autoLoad = true,
}: UsePriceTrackingProps = {}): UsePriceTrackingReturn => {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [hasActiveAlert, setHasActiveAlert] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load price history for product
   */
  const loadPriceHistory = useCallback(
    async (options?: { limit?: number; days?: number }) => {
      if (!productId) return;

      try {
        setIsLoadingHistory(true);
        setError(null);

        logger.debug('📊 [usePriceTracking] Loading price history');

        const startDate = options?.days
          ? new Date(Date.now() - options.days * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

        const response: unknown = await priceTrackingApi.getPriceHistory(productId, {
          variantId,
          limit: options?.limit || 30,
          startDate,
        });

        if (response.success) {
          setPriceHistory(response.data.history);
          logger.debug('✅ [usePriceTracking] History loaded:', response.data.count);
        }
      } catch (err) {
        logger.error('❌ [usePriceTracking] Load history error:', err);
        setError(err.message || 'Failed to load price history');
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [productId, variantId]
  );

  /**
   * Load price statistics
   */
  const loadPriceStats = useCallback(
    async (days: number = 30) => {
      if (!productId) return;

      try {
        setIsLoadingStats(true);
        setError(null);

        logger.debug('📈 [usePriceTracking] Loading price stats');

        const response: unknown = await priceTrackingApi.getPriceStats(productId, {
          variantId,
          days,
        });

        if (response.success) {
          setPriceStats(response.data);
          logger.debug('✅ [usePriceTracking] Stats loaded');
        }
      } catch (err) {
        logger.error('❌ [usePriceTracking] Load stats error:', err);
        setError(err.message || 'Failed to load price stats');
      } finally {
        setIsLoadingStats(false);
      }
    },
    [productId, variantId]
  );

  /**
   * Check if user has active alert
   */
  const checkAlert = useCallback(async () => {
    if (!productId) return;

    try {
      logger.debug('🔍 [usePriceTracking] Checking alert status');

      const response: unknown = await priceTrackingApi.checkAlert(productId, variantId);

      if (response.success) {
        setHasActiveAlert(response.data.hasActiveAlert);
        logger.debug('✅ [usePriceTracking] Has active alert:', response.data.hasActiveAlert);
      }
    } catch (err) {
      logger.error('❌ [usePriceTracking] Check alert error:', err);
    }
  }, [productId, variantId]);

  /**
   * Create a price alert
   */
  const createAlert = useCallback(
    async (data: Omit<CreatePriceAlertRequest, 'productId' | 'variantId'>) => {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      try {
        setIsCreatingAlert(true);
        setError(null);

        logger.debug('🔔 [usePriceTracking] Creating price alert');

        const response: unknown = await priceTrackingApi.createPriceAlert({
          productId,
          variantId,
          ...data,
        });

        if (response.success) {
          setHasActiveAlert(true);
          logger.debug('✅ [usePriceTracking] Alert created successfully');

          // Track analytics (no-op placeholder — wire up analyticsService if needed)
        }
      } catch (err) {
        logger.error('❌ [usePriceTracking] Create alert error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to create alert');
        throw err;
      } finally {
        setIsCreatingAlert(false);
      }
    },
    [productId, variantId]
  );

  /**
   * Cancel a price alert
   */
  const cancelAlert = useCallback(async (alertId: string) => {
    try {
      setIsLoadingAlerts(true);
      setError(null);

      logger.debug('🔕 [usePriceTracking] Cancelling alert');

      const response: unknown = await priceTrackingApi.cancelAlert(alertId);

      if (response.success) {
        setHasActiveAlert(false);

        // Remove from alerts list
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));

        logger.debug('✅ [usePriceTracking] Alert cancelled');
      }
    } catch (err) {
      logger.error('❌ [usePriceTracking] Cancel alert error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to cancel alert');
      throw err;
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  /**
   * Load user's alerts
   */
  const loadAlerts = useCallback(async (params?: { page?: number; status?: 'cancelled' | 'active' | 'expired' | 'triggered' }) => {
    try {
      setIsLoadingAlerts(true);
      setError(null);

      logger.debug('📋 [usePriceTracking] Loading alerts');

      const response: unknown = await priceTrackingApi.getMyAlerts(params);

      if (response.success) {
        setAlerts(response.data.alerts);
        logger.debug('✅ [usePriceTracking] Alerts loaded:', response.data.alerts.length);
      }
    } catch (err) {
      logger.error('❌ [usePriceTracking] Load alerts error:', err);
      setError(err.message || 'Failed to load alerts');
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    if (productId) {
      await Promise.all([
        loadPriceHistory(),
        loadPriceStats(),
        checkAlert(),
      ]);
    }
    await loadAlerts();
  }, [productId, loadPriceHistory, loadPriceStats, checkAlert, loadAlerts]);

  /**
   * Auto-load on mount if enabled
   */
  useEffect(() => {
    if (autoLoad && productId) {
      loadPriceHistory();
      loadPriceStats();
      checkAlert();
    }
  }, [autoLoad, productId, variantId, loadPriceHistory, loadPriceStats, checkAlert]);

  return {
    priceHistory,
    priceStats,
    isLoadingHistory,
    isLoadingStats,
    hasActiveAlert,
    alerts,
    isLoadingAlerts,
    isCreatingAlert,
    error,
    loadPriceHistory,
    loadPriceStats,
    createAlert,
    cancelAlert,
    checkAlert,
    loadAlerts,
    refresh,
  };
};

export default usePriceTracking;
