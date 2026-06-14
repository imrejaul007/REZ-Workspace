/**
 * REZ Mind - Complete Integration Hooks
 * All-in-one hooks for Do App ↔ REZ Intelligence
 */

import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useUserStore, useChatStore } from '@/stores';
import { rezMind, DormantStatus, BehavioralProfile, Recommendation } from '@/services/rezMindService';
import { agentOrchestrator, AgentInsight, DormancyAlert, TrendAlert } from '@/services/agentOrchestrator';
import { eventTracking } from '@/services/eventTracking';
import { nudgeEngine, Nudge } from '@/services/nudgeEngine';
import { attributionService } from '@/services/attributionTracking';

// ============================================
// INTENT TRACKING
// ============================================

export function useIntentTracking() {
  const { profile } = useUserStore();
  const { sessionId, location } = useChatStore();
  const userId = profile?.id;

  const trackChatIntent = useCallback(
    async (message: string, detectedIntent?: string) => {
      if (!userId) return;
      await eventTracking.trackChatMessage(message, detectedIntent);
    },
    [userId]
  );

  const trackEntityView = useCallback(
    async (
      entityId: string,
      entityType: string,
      entityName: string,
      position: number,
      distance?: number
    ) => {
      if (!userId) return;
      await eventTracking.trackEntityView(entityId, entityType, entityName, position, distance);
    },
    [userId]
  );

  const trackEntitySave = useCallback(
    async (entityId: string, entityType: string, entityName: string) => {
      if (!userId) return;
      await eventTracking.trackEntitySave(entityId, entityType, entityName);
    },
    [userId]
  );

  const trackSearch = useCallback(
    async (query: string, resultsCount: number, category?: string) => {
      if (!userId) return;
      await eventTracking.trackSearch(query, resultsCount, category);
    },
    [userId]
  );

  const trackBookingStart = useCallback(
    async (entityId: string, entityType: string, entityName: string) => {
      if (!userId) return;
      await eventTracking.trackBookingStart(entityId, entityType, entityName);
    },
    [userId]
  );

  const trackBookingCompleted = useCallback(
    async (
      bookingId: string,
      entityId: string,
      entityType: string,
      entityName: string,
      amount: number,
      karmaEarned: number
    ) => {
      if (!userId) return;
      await eventTracking.trackBookingCompleted(
        bookingId,
        entityId,
        entityType,
        entityName,
        amount,
        karmaEarned
      );
      await attributionService.trackConversion(bookingId, amount);
    },
    [userId]
  );

  const trackPaymentSuccess = useCallback(
    async (transactionId: string, amount: number, method: string) => {
      if (!userId) return;
      await eventTracking.trackPaymentSuccess(transactionId, amount, method);
    },
    [userId]
  );

  const trackWalletTransaction = useCallback(
    async (
      type: 'credit' | 'debit',
      amount: number,
      reason: string,
      transactionId: string
    ) => {
      if (!userId) return;
      await eventTracking.trackWalletTransaction(type, amount, reason, transactionId);
    },
    [userId]
  );

  const trackOnboardingComplete = useCallback(async () => {
    if (!userId) return;
    await eventTracking.trackOnboardingComplete();
  }, [userId]);

  const trackAppOpen = useCallback(async () => {
    await eventTracking.trackAppOpen();
    // Check for nudges on app open
    nudgeEngine.triggerAutomatedRevival(userId || '');
  }, [userId]);

  const trackAppClose = useCallback(async () => {
    await eventTracking.trackAppClose();
  }, []);

  return {
    trackChatIntent,
    trackEntityView,
    trackEntitySave,
    trackSearch,
    trackBookingStart,
    trackBookingCompleted,
    trackPaymentSuccess,
    trackWalletTransaction,
    trackOnboardingComplete,
    trackAppOpen,
    trackAppClose,
  };
}

// ============================================
// DORMANCY DETECTION
// ============================================

export function useDormancyDetection() {
  const { profile } = useUserStore();
  const userId = profile?.id;

  const [dormancyAlert, setDormancyAlert] = useState<DormancyAlert | null>(null);
  const [isDormant, setIsDormant] = useState(false);

  const checkDormantStatus = useCallback(async (): Promise<DormantStatus> => {
    if (!userId) return { isDormant: false };

    const status = await rezMind.getDormantStatus(userId);
    setIsDormant(status.isDormant);
    return status;
  }, [userId]);

  const triggerRevival = useCallback(
    async (options?: {
      channel?: 'push' | 'sms' | 'email' | 'whatsapp';
      offer?: { coins?: number; discountPercent?: number };
    }) => {
      if (!userId) return { success: false };

      const result = await rezMind.triggerRevival(userId, options);

      if (result.success) {
        attributionService.track('nudge_clicked', options?.channel || 'push', {
          campaignId: result.campaignId,
        });
      }

      return result;
    },
    [userId]
  );

  const checkForAlerts = useCallback(async () => {
    if (!userId) return null;

    const alert = await agentOrchestrator.checkDormancyAlerts(userId);
    setDormancyAlert(alert);
    return alert;
  }, [userId]);

  return {
    dormancyAlert,
    isDormant,
    checkDormantStatus,
    triggerRevival,
    checkForAlerts,
  };
}

// ============================================
// RECOMMENDATIONS
// ============================================

export function useRecommendations() {
  const { profile } = useUserStore();
  const { location } = useChatStore();
  const userId = profile?.id;

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const getRecommendations = useCallback(
    async (options: { types?: string[]; limit?: number } = {}) => {
      if (!userId) return [];

      setLoading(true);
      try {
        const recs = await rezMind.getRecommendations(userId, {
          ...options,
          location: location || undefined,
        });
        setRecommendations(recs);
        return recs;
      } finally {
        setLoading(false);
      }
    },
    [userId, location]
  );

  const getIntentScores = useCallback(
    async (categories: string[]) => {
      if (!userId) return [];
      return rezMind.getIntentScores(userId, categories);
    },
    [userId]
  );

  const getTrendRecommendations = useCallback(async () => {
    const trends = await agentOrchestrator.getTrendAlerts(location);
    return trends;
  }, [location]);

  return {
    recommendations,
    loading,
    getRecommendations,
    getIntentScores,
    getTrendRecommendations,
  };
}

// ============================================
// BEHAVIORAL PROFILE
// ============================================

export function useBehavioralProfile() {
  const { profile, setProfile } = useUserStore();
  const { token } = useUserStore();
  const userId = profile?.id;

  const [behavioralProfile, setBehavioralProfile] = useState<BehavioralProfile | null>(null);

  const syncProfile = useCallback(async () => {
    if (!userId || !token) return null;

    const bp = await rezMind.getBehavioralProfile(userId);
    setBehavioralProfile(bp);

    if (bp?.stylePreferences) {
      setProfile({
        ...profile,
        stylePreferences: bp.stylePreferences,
      } as unknown);
    }

    return bp;
  }, [userId, token, profile, setProfile]);

  const getPersonalizationInsights = useCallback(async () => {
    if (!userId) return null;
    return agentOrchestrator.getPersonalizationInsights(userId);
  }, [userId]);

  const updatePreferences = useCallback(
    async (preferences: Record<string, unknown>) => {
      if (!userId || !token) return false;

      const success = await rezMind.updateUserPreferences(userId, preferences, token);

      if (success) {
        await eventTracking.trackStylePreferencesSet(preferences as unknown);
      }

      return success;
    },
    [userId, token]
  );

  return {
    behavioralProfile,
    syncProfile,
    getPersonalizationInsights,
    updatePreferences,
  };
}

// ============================================
// PREDICTIVE SCORING
// ============================================

export function usePredictiveScoring() {
  const { profile } = useUserStore();
  const userId = profile?.id;

  const getBookingProbability = useCallback(
    async (entityId: string) => {
      if (!userId) return { probability: 0.5, factors: [] };
      return agentOrchestrator.getBookingProbability(userId, entityId);
    },
    [userId]
  );

  const getChurnRisk = useCallback(async () => {
    if (!userId) return { score: 0, level: 'low' as const, factors: [] };
    return agentOrchestrator.getChurnRiskScore(userId);
  }, [userId]);

  const getLTV = useCallback(async () => {
    if (!userId) return { ltv: 0, tier: 'standard' as const, confidence: 0 };
    return agentOrchestrator.getLTVPrediction(userId);
  }, [userId]);

  return {
    getBookingProbability,
    getChurnRisk,
    getLTV,
  };
}

// ============================================
// NUDGE ENGINE
// ============================================

export function useNudgeEngine() {
  const { profile } = useUserStore();
  const { location } = useChatStore();
  const userId = profile?.id;

  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [insights, setInsights] = useState<AgentInsight[]>([]);

  useEffect(() => {
    // Subscribe to nudges
    const unsubNudge = nudgeEngine.subscribe((nudge) => {
      setNudges((prev) => [nudge, ...prev].slice(0, 20));

      // Track nudge shown
      attributionService.trackNudgeShown(nudge.id, 'in_app');
    });

    // Subscribe to insights
    const unsubInsight = agentOrchestrator.subscribe((insight) => {
      setInsights((prev) => [insight, ...prev].slice(0, 50));
    });

    return () => {
      unsubNudge();
      unsubInsight();
    };
  }, []);

  const generateNudges = useCallback(async () => {
    if (!userId) return [];

    const generated = await nudgeEngine.generateNudges({
      userId,
      location: location || undefined,
    });

    return generated;
  }, [userId, location]);

  const dismissNudge = useCallback((nudgeId: string) => {
    nudgeEngine.dismissNudge(nudgeId);
    setNudges((prev) => prev.filter((n) => n.id !== nudgeId));
    attributionService.trackNudgeDismissed(nudgeId, 'in_app');
  }, []);

  const triggerRevival = useCallback(async () => {
    if (!userId) return;
    await nudgeEngine.triggerAutomatedRevival(userId);
  }, [userId]);

  return {
    nudges,
    insights,
    generateNudges,
    dismissNudge,
    triggerRevival,
  };
}

// ============================================
// ATTRIBUTION
// ============================================

export function useAttribution() {
  const { profile } = useUserStore();
  const { sessionId } = useChatStore();
  const userId = profile?.id;

  useEffect(() => {
    if (userId) {
      attributionService.init(userId, sessionId);
    }
  }, [userId, sessionId]);

  const trackConversion = useCallback(
    async (bookingId: string, amount: number) => {
      await attributionService.trackConversion(bookingId, amount);
    },
    []
  );

  const getSummary = useCallback(() => {
    return attributionService.getAttributionSummary();
  }, []);

  return {
    trackConversion,
    getSummary,
  };
}

// ============================================
// APP LIFECYCLE
// ============================================

export function useAppLifecycle() {
  const { profile } = useUserStore();
  const userId = profile?.id;
  const { trackAppOpen, trackAppClose } = useIntentTracking();
  const { checkForAlerts, triggerRevival } = useDormancyDetection();
  const { generateNudges } = useNudgeEngine();

  useEffect(() => {
    // Track app open
    trackAppOpen();

    // Check for dormancy on app open
    const checkOnOpen = async () => {
      const alert = await checkForAlerts();
      if (alert && alert.daysSinceActive > 14) {
        // Trigger revival for long-dormant users
        await triggerRevival({
          channel: 'push',
          offer: { coins: 50, discountPercent: 20 },
        });
      }
    };

    checkOnOpen();

    // Handle app state changes
    const subscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        if (nextState === 'background') {
          trackAppClose();
        } else if (nextState === 'active') {
          trackAppOpen();
          await generateNudges();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [userId]);
}

// ============================================
// COMPLETE SETUP HOOK
// ============================================

/**
 * Use this hook to set up complete REZ Mind integration
 * Call once in your root layout
 */
export function useReZMindSetup() {
  const { syncProfile } = useBehavioralProfile();
  const { generateNudges } = useNudgeEngine();

  useEffect(() => {
    // Sync profile on mount
    syncProfile();

    // Generate nudges on mount
    generateNudges();
  }, []);
}
