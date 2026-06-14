/**
 * Intelligence Metrics - New KPI Framework
 *
 * These metrics replace traditional product metrics with
 * "perceived intelligence" focused measurement.
 *
 * The goal: Measure how intelligently REZ feels, not just how much it does.
 */

import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface IntelligenceMetrics {
  // Time-to-Value Metrics
  timeToFirstValue: number; // seconds from app open to first action
  timeToFirstInsight: number; // seconds to see first personalized insight
  sessionIntelligenceScore: number; // 0-100 score per session

  // Engagement Quality Metrics
  smartActionRate: number; // % of actions that are "smart recommendations" vs search
  recommendationInteractionRate: number; // % of shown recommendations interacted with
  dailyInsightViews: number; // how many insights user sees per day

  // Trust & Perception Metrics
  perceivedIntelligenceScore: number; // user-reported "REZ gets me" score
  weeklySavingsViewed: number; // did user see their savings summary this week?
  aiConfidenceRate: number; // % of time user follows AI suggestions

  // Habit Formation Metrics
  dailyActiveStreak: number; // consecutive days with meaningful engagement
  returnIntent: number; // "Would you open REZ tomorrow?" score
  weeklySessions: number; // sessions per week

  // Emotional Metrics
  frustrationSignals: number; // search + no-result + back button frequency
  delightSignals: number; // share + screenshot + referral clicks
  premiumWillingness: number; // % likely to pay for premium
}

export interface SessionEvent {
  type:
    | 'app_open'
    | 'smart_card_view'
    | 'smart_card_action'
    | 'search'
    | 'recommendation_view'
    | 'recommendation_action'
    | 'insight_view'
    | 'savings_view'
    | 'frustration'
    | 'delight';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface UserIntelligenceProfile {
  userId: string;
  profileCompleteness: number; // how much REZ knows about user
  topCategories: string[];
  behavioralPatterns: {
    diningFrequency: string;
    shoppingStyle: string;
    travelHabits: string;
    wellnessInterest: string;
  };
  preferencesSetAt: number;
  lastUpdated: number;
}

// ============================================================================
// DEFAULT METRICS
// ============================================================================

const DEFAULT_METRICS: IntelligenceMetrics = {
  timeToFirstValue: 0,
  timeToFirstInsight: 0,
  sessionIntelligenceScore: 0,

  smartActionRate: 0,
  recommendationInteractionRate: 0,
  dailyInsightViews: 0,

  perceivedIntelligenceScore: 0,
  weeklySavingsViewed: 0,
  aiConfidenceRate: 0,

  dailyActiveStreak: 0,
  returnIntent: 0,
  weeklySessions: 0,

  frustrationSignals: 0,
  delightSignals: 0,
  premiumWillingness: 0,
};

// ============================================================================
// HOOK
// ============================================================================

export function useIntelligenceMetrics() {
  const [metrics, setMetrics] = useState<IntelligenceMetrics>(DEFAULT_METRICS);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [firstValueTime, setFirstValueTime] = useState<number | null>(null);
  const [firstInsightTime, setFirstInsightTime] = useState<number | null>(null);

  // Track session events
  const trackEvent = useCallback((type: SessionEvent['type'], metadata?: Record<string, unknown>) => {
    const event: SessionEvent = {
      type,
      timestamp: Date.now(),
      metadata,
    };

    setSessionEvents((prev) => [...prev, event]);

    // Track first value time
    if (!firstValueTime && ['smart_card_action', 'recommendation_action', 'savings_view'].includes(type)) {
      setFirstValueTime(Date.now() - sessionStartTime);
    }

    // Track first insight time
    if (!firstInsightTime && ['insight_view', 'smart_card_view'].includes(type)) {
      setFirstInsightTime(Date.now() - sessionStartTime);
    }
  }, [firstValueTime, firstInsightTime, sessionStartTime]);

  // Calculate session intelligence score
  const calculateSessionScore = useCallback(() => {
    if (sessionEvents.length === 0) return 0;

    let score = 0;
    const total = sessionEvents.length;

    // Smart actions are worth more
    const smartActions = sessionEvents.filter((e) =>
      ['smart_card_action', 'recommendation_action'].includes(e.type)
    ).length;

    // Insights viewed
    const insights = sessionEvents.filter((e) =>
      ['insight_view', 'smart_card_view', 'recommendation_view'].includes(e.type)
    ).length;

    // Frustrations (reduce score)
    const frustrations = sessionEvents.filter((e) => e.type === 'frustration').length;

    score = ((smartActions * 3 + insights * 2) / total - frustrations * 0.5) * 33;
    return Math.max(0, Math.min(100, score));
  }, [sessionEvents]);

  // Update metrics
  const updateMetrics = useCallback(() => {
    const sessionScore = calculateSessionScore();
    const totalEvents = sessionEvents.length;
    const smartActions = sessionEvents.filter((e) =>
      ['smart_card_action', 'recommendation_action'].includes(e.type)
    ).length;
    const recommendations = sessionEvents.filter((e) =>
      ['recommendation_view', 'smart_card_view'].includes(e.type)
    ).length;
    const frustrations = sessionEvents.filter((e) => e.type === 'frustration').length;
    const delights = sessionEvents.filter((e) => e.type === 'delight').length;

    setMetrics((prev) => ({
      ...prev,

      // Time-to-Value
      timeToFirstValue: firstValueTime || prev.timeToFirstValue,
      timeToFirstInsight: firstInsightTime || prev.timeToFirstInsight,
      sessionIntelligenceScore: sessionScore,

      // Engagement Quality
      smartActionRate: totalEvents > 0 ? (smartActions / totalEvents) * 100 : prev.smartActionRate,
      recommendationInteractionRate: recommendations > 0
        ? (smartActions / recommendations) * 100
        : prev.recommendationInteractionRate,
      dailyInsightViews: recommendations,

      // Trust & Perception
      perceivedIntelligenceScore: sessionScore,
      weeklySavingsViewed: sessionEvents.filter((e) => e.type === 'savings_view').length,
      aiConfidenceRate: recommendations > 0
        ? (smartActions / recommendations) * 100
        : prev.aiConfidenceRate,

      // Habit Formation
      dailyActiveStreak: prev.dailyActiveStreak,
      returnIntent: calculateReturnIntent(),
      weeklySessions: prev.weeklySessions,

      // Emotional
      frustrationSignals: frustrations,
      delightSignals: delights,
      premiumWillingness: calculatePremiumWillingness(sessionScore),
    }));
  }, [sessionEvents, firstValueTime, firstInsightTime, calculateSessionScore]);

  // Recalculate on events
  useEffect(() => {
    if (sessionEvents.length > 0) {
      updateMetrics();
    }
  }, [sessionEvents, updateMetrics]);

  // Cleanup on unmount (could send to analytics)
  useEffect(() => {
    return () => {
      if (sessionEvents.length > 0) {
        // Send to analytics service
        logger.debug('Session metrics:', {
          duration: Date.now() - sessionStartTime,
          events: sessionEvents.length,
          score: calculateSessionScore(),
        });
      }
    };
  }, [sessionStartTime, sessionEvents, calculateSessionScore]);

  return {
    metrics,
    trackEvent,
    sessionEvents,
    calculateSessionScore,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateReturnIntent(): number {
  // In production, this would come from user survey or behavioral prediction
  // For now, estimate based on session quality
  return 75; // placeholder
}

function calculatePremiumWillingness(intelligenceScore: number): number {
  // Higher perceived intelligence = more willing to pay
  return Math.min(100, intelligenceScore * 1.2);
}

// ============================================================================
// METRICS GOALS
// ============================================================================

export const INTELLIGENCE_METRICS_GOALS = {
  // Time-to-Value (seconds)
  timeToFirstValue: { target: 30, warning: 60, critical: 120 },
  timeToFirstInsight: { target: 15, warning: 30, critical: 60 },

  // Engagement Quality (%)
  smartActionRate: { target: 40, warning: 25, critical: 10 },
  recommendationInteractionRate: { target: 60, warning: 40, critical: 20 },
  dailyInsightViews: { target: 5, warning: 3, critical: 1 },

  // Trust & Perception (0-100)
  perceivedIntelligenceScore: { target: 80, warning: 60, critical: 40 },
  weeklySavingsViewed: { target: 7, warning: 3, critical: 0 },
  aiConfidenceRate: { target: 70, warning: 50, critical: 30 },

  // Habit Formation
  dailyActiveStreak: { target: 14, warning: 7, critical: 0 },
  returnIntent: { target: 85, warning: 70, critical: 50 },
  weeklySessions: { target: 10, warning: 5, critical: 2 },

  // Emotional
  frustrationSignals: { target: 2, warning: 5, critical: 10 },
  delightSignals: { target: 10, warning: 5, critical: 2 },
  premiumWillingness: { target: 30, warning: 20, critical: 10 },
};

// ============================================================================
// METRICS INTERPRETATION
// ============================================================================

export function getMetricsHealth(metrics: IntelligenceMetrics): Record<keyof IntelligenceMetrics, 'good' | 'warning' | 'critical'> {
  const results = {} as Record<keyof IntelligenceMetrics, 'good' | 'warning' | 'critical'>;

  // Time-to-Value
  results.timeToFirstValue = metrics.timeToFirstValue <= INTELLIGENCE_METRICS_GOALS.timeToFirstValue.target
    ? 'good'
    : metrics.timeToFirstValue <= INTELLIGENCE_METRICS_GOALS.timeToFirstValue.warning
    ? 'warning'
    : 'critical';

  results.timeToFirstInsight = metrics.timeToFirstInsight <= INTELLIGENCE_METRICS_GOALS.timeToFirstInsight.target
    ? 'good'
    : metrics.timeToFirstInsight <= INTELLIGENCE_METRICS_GOALS.timeToFirstInsight.warning
    ? 'warning'
    : 'critical';

  results.sessionIntelligenceScore = metrics.sessionIntelligenceScore >= 70 ? 'good'
    : metrics.sessionIntelligenceScore >= 50 ? 'warning' : 'critical';

  // Engagement Quality
  results.smartActionRate = metrics.smartActionRate >= 40 ? 'good'
    : metrics.smartActionRate >= 25 ? 'warning' : 'critical';

  results.recommendationInteractionRate = metrics.recommendationInteractionRate >= 60 ? 'good'
    : metrics.recommendationInteractionRate >= 40 ? 'warning' : 'critical';

  results.dailyInsightViews = metrics.dailyInsightViews >= 5 ? 'good'
    : metrics.dailyInsightViews >= 3 ? 'warning' : 'critical';

  // Trust & Perception
  results.perceivedIntelligenceScore = metrics.perceivedIntelligenceScore >= 80 ? 'good'
    : metrics.perceivedIntelligenceScore >= 60 ? 'warning' : 'critical';

  results.weeklySavingsViewed = metrics.weeklySavingsViewed >= 7 ? 'good'
    : metrics.weeklySavingsViewed >= 3 ? 'warning' : 'critical';

  results.aiConfidenceRate = metrics.aiConfidenceRate >= 70 ? 'good'
    : metrics.aiConfidenceRate >= 50 ? 'warning' : 'critical';

  // Habit Formation
  results.dailyActiveStreak = metrics.dailyActiveStreak >= 14 ? 'good'
    : metrics.dailyActiveStreak >= 7 ? 'warning' : 'critical';

  results.returnIntent = metrics.returnIntent >= 85 ? 'good'
    : metrics.returnIntent >= 70 ? 'warning' : 'critical';

  results.weeklySessions = metrics.weeklySessions >= 10 ? 'good'
    : metrics.weeklySessions >= 5 ? 'warning' : 'critical';

  // Emotional
  results.frustrationSignals = metrics.frustrationSignals <= 2 ? 'good'
    : metrics.frustrationSignals <= 5 ? 'warning' : 'critical';

  results.delightSignals = metrics.delightSignals >= 10 ? 'good'
    : metrics.delightSignals >= 5 ? 'warning' : 'critical';

  results.premiumWillingness = metrics.premiumWillingness >= 30 ? 'good'
    : metrics.premiumWillingness >= 20 ? 'warning' : 'critical';

  return results;
}

// ============================================================================
// EXPORT DEFAULT ANALYTICS TRACKER
// ============================================================================

export default useIntelligenceMetrics;
