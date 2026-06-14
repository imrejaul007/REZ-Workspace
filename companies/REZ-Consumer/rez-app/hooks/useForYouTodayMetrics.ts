// @ts-nocheck
/**
 * For You Today V2 - Analytics Tracking Hook
 *
 * Tracks all metrics for the A/B test:
 * - Smart card views and interactions
 * - Memory reference interactions
 * - Time-to-first-action
 * - Session intelligence score
 *
 * Success Metrics:
 * - Smart action rate: >40%
 * - Recommendation interaction: >60%
 * - Session intelligence score: >70
 * - Day-7 retention: >40%
 */

import { useCallback, useRef, useEffect } from 'react';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';

const ANALYTICS_URL = process.env.EXPO_PUBLIC_ANALYTICS_URL || 'https://REZ-analytics.onrender.com';

interface SmartCardEvent {
  cardId: string;
  cardType: 'savings' | 'insight' | 'action';
  action: 'view' | 'tap' | 'dismiss';
  timestamp: number;
}

interface SessionMetrics {
  smartCardViews: number;
  smartCardTaps: number;
  memoryInteractions: number;
  timeToFirstAction: number | null;
  sessionStartTime: number;
  liveDataRefreshes: number;
}

const DEFAULT_METRICS: SessionMetrics = {
  smartCardViews: 0,
  smartCardTaps: 0,
  memoryInteractions: 0,
  timeToFirstAction: null,
  sessionStartTime: Date.now(),
  liveDataRefreshes: 0,
};

export function useForYouTodayMetrics() {
  const user = useAuthUser();
  const metricsRef = useRef<SessionMetrics>({ ...DEFAULT_METRICS });

  // Reset metrics on mount
  useEffect(() => {
    metricsRef.current = {
      ...DEFAULT_METRICS,
      sessionStartTime: Date.now(),
    };
  }, []);

  // Track smart card view
  const trackCardView = useCallback((cardId: string, cardType: SmartCardEvent['cardType']) => {
    metricsRef.current.smartCardViews++;

    apiClient.post(`${ANALYTICS_URL}/events`, {
      userId: user?.id,
      event: 'smart_card_view',
      properties: {
        cardId,
        cardType,
        testId: 'for-you-today-v2-test',
      },
    }).catch((e) => logger.error('[Metrics] API error:', e));
  }, [user?.id]);

  // Track smart card tap
  const trackCardTap = useCallback((cardId: string, cardType: SmartCardEvent['cardType']) => {
    metricsRef.current.smartCardTaps++;

    // Calculate time to first action
    if (metricsRef.current.timeToFirstAction === null) {
      metricsRef.current.timeToFirstAction =
        Date.now() - metricsRef.current.sessionStartTime;
    }

    apiClient.post(`${ANALYTICS_URL}/events`, {
      userId: user?.id,
      event: 'smart_card_tap',
      properties: {
        cardId,
        cardType,
        testId: 'for-you-today-v2-test',
        timeToAction: metricsRef.current.timeToFirstAction,
      },
    }).catch((e) => logger.error('[Metrics] API error:', e));
  }, [user?.id]);

  // Track smart card dismiss
  const trackCardDismiss = useCallback((cardId: string, cardType: SmartCardEvent['cardType']) => {
    apiClient.post(`${ANALYTICS_URL}/events`, {
      userId: user?.id,
      event: 'smart_card_dismiss',
      properties: {
        cardId,
        cardType,
        testId: 'for-you-today-v2-test',
      },
    }).catch((e) => logger.error('[Metrics] API error:', e));
  }, [user?.id]);

  // Track memory interaction
  const trackMemoryInteraction = useCallback((memoryId: string, memoryType: string) => {
    metricsRef.current.memoryInteractions++;

    apiClient.post(`${ANALYTICS_URL}/events`, {
      userId: user?.id,
      event: 'memory_interaction',
      properties: {
        memoryId,
        memoryType,
        testId: 'for-you-today-v2-test',
      },
    }).catch((e) => logger.error('[Metrics] API error:', e));
  }, [user?.id]);

  // Track live data refresh
  const trackLiveDataRefresh = useCallback(() => {
    metricsRef.current.liveDataRefreshes++;

    apiClient.post(`${ANALYTICS_URL}/events`, {
      userId: user?.id,
      event: 'live_data_refresh',
      properties: {
        testId: 'for-you-today-v2-test',
        refreshCount: metricsRef.current.liveDataRefreshes,
      },
    }).catch((e) => logger.error('[Metrics] API error:', e));
  }, [user?.id]);

  // Calculate session intelligence score
  const getSessionIntelligenceScore = useCallback((): number => {
    const metrics = metricsRef.current;
    let score = 0;

    // Smart card views: 1 point each (max 10)
    score += Math.min(metrics.smartCardViews, 10);

    // Smart card taps: 3 points each (max 15)
    score += Math.min(metrics.smartCardTaps * 3, 15);

    // Memory interactions: 2 points each (max 10)
    score += Math.min(metrics.memoryInteractions * 2, 10);

    // Time to first action bonus
    if (metrics.timeToFirstAction !== null) {
      if (metrics.timeToFirstAction < 30000) score += 10; // < 30 seconds
      else if (metrics.timeToFirstAction < 60000) score += 5; // < 1 minute
      else if (metrics.timeToFirstAction < 120000) score += 2; // < 2 minutes
    }

    // Normalize to 0-100
    return Math.min(score, 100);
  }, []);

  // Track session end
  const trackSessionEnd = useCallback(() => {
    const metrics = metricsRef.current;

    apiClient.post(`${ANALYTICS_URL}/events`, {
      userId: user?.id,
      event: 'for_you_today_session_end',
      properties: {
        testId: 'for-you-today-v2-test',
        ...metrics,
        sessionIntelligenceScore: getSessionIntelligenceScore(),
        smartActionRate: metrics.smartCardViews > 0
          ? metrics.smartCardTaps / metrics.smartCardViews
          : 0,
        sessionDuration: Date.now() - metrics.sessionStartTime,
      },
    }).catch((e) => logger.error('[Metrics] API error:', e));
  }, [user?.id, getSessionIntelligenceScore]);

  // Calculate smart action rate
  const getSmartActionRate = useCallback((): number => {
    const metrics = metricsRef.current;
    if (metrics.smartCardViews === 0) return 0;
    return (metrics.smartCardTaps / metrics.smartCardViews) * 100;
  }, []);

  return {
    // Tracking functions
    trackCardView,
    trackCardTap,
    trackCardDismiss,
    trackMemoryInteraction,
    trackLiveDataRefresh,
    trackSessionEnd,

    // Computed metrics
    getSessionIntelligenceScore,
    getSmartActionRate,

    // Raw metrics (for debugging)
    metrics: metricsRef.current,
  };
}
