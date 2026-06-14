// @ts-nocheck
/**
 * REZ Mind Personalization Hook
 *
 * Provides personalized recommendations from REZ Mind Intelligence Hub
 *
 * Usage:
 *   const { recommendations, loading, refresh } = usePersonalization(userId);
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const PERSONALIZATION_API_URL = process.env.EXPO_PUBLIC_PERSONALIZATION_URL ||
  (__DEV__ ? 'http://localhost:4017' : 'https://rez-personalization.onrender.com');

const INTELLIGENCE_HUB_URL = process.env.EXPO_PUBLIC_INTELLIGENCE_HUB_URL ||
  (__DEV__ ? 'http://localhost:4020' : 'https://rez-intelligence-hub.onrender.com');

const INTENT_GRAPH_URL = process.env.EXPO_PUBLIC_INTENT_CAPTURE_URL ||
  (__DEV__ ? 'http://localhost:3007' : 'https://rez-intent-graph.onrender.com');

export interface PersonalizationRecommendation {
  id: string;
  type: 'store' | 'product' | 'service' | 'deal';
  name: string;
  image?: string;
  score: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfile {
  userId: string;
  affinities: string[];
  preferences: Record<string, unknown>;
  lastUpdated: string;
}

export interface UsePersonalizationResult {
  recommendations: PersonalizationRecommendation[];
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackInteraction: (itemId: string, type: string) => Promise<void>;
}

/**
 * Hook to get personalized recommendations from REZ Mind
 */
export function usePersonalization(): UsePersonalizationResult {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<PersonalizationRecommendation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  /**
   * Fetch personalized recommendations from REZ Mind
   */
  const fetchRecommendations = useCallback(async () => {
    if (!userId) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call Intelligence Hub for user profile
      const profileResponse = await fetch(
        `${INTELLIGENCE_HUB_URL}/api/intelligence/user/${userId}/profile`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.EXPO_PUBLIC_API_KEY || '',
          },
        }
      );

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

      // Call Personalization Engine for recommendations
      const recsResponse = await fetch(
        `${PERSONALIZATION_API_URL}/api/personalization/${userId}/recommendations`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.EXPO_PUBLIC_API_KEY || '',
          },
        }
      );

      if (recsResponse.ok) {
        const recsData = await recsResponse.json();
        setRecommendations(recsData.recommendations || []);
      }

      // Fallback: Get intents from Intent Graph and generate recommendations
      if (!recsResponse.ok) {
        const intentsResponse = await fetch(
          `${INTENT_GRAPH_URL}/api/intent/active/${userId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.EXPO_PUBLIC_API_KEY || '',
            },
          }
        );

        if (intentsResponse.ok) {
          const intents = await intentsResponse.json();
          // Generate recommendations from intents
          const generatedRecs = generateRecommendationsFromIntents(intents);
          setRecommendations(generatedRecs);
        }
      }
    } catch (err) {
      logger.error('[usePersonalization] Error fetching recommendations:', err);
      setError('Failed to load recommendations');
      setRecommendations([]);
    }

    setLoading(false);
  }, [userId]);

  /**
   * Track user interaction with a recommended item
   */
  const trackInteraction = useCallback(async (itemId: string, type: string) => {
    if (!userId) return;

    try {
      await fetch(`${INTENT_GRAPH_URL}/api/intent/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          eventType: 'view',
          intentKey: itemId,
          category: type.toUpperCase(),
          confidence: 0.25,
          metadata: { source: 'personalization' },
        }),
      });
    } catch (err) {
      logger.error('[usePersonalization] Error tracking interaction:', err);
    }
  }, [userId]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    userProfile,
    loading,
    error,
    refresh: fetchRecommendations,
    trackInteraction,
  };
}

/**
 * Generate recommendations from user intents (fallback when ML is unavailable)
 */
function generateRecommendationsFromIntents(intents: unknown[]): PersonalizationRecommendation[] {
  if (!intents || intents.length === 0) {
    return [];
  }

  // Group intents by category
  const categoryCounts: Record<string, number> = {};
  const intentMap: Record<string, unknown> = {};

  intents.forEach((intent) => {
    const category = intent.category || 'GENERAL';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    intentMap[category] = intent;
  });

  // Generate recommendations based on top categories
  const sortedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return sortedCategories.map(([category, count], index) => ({
    id: `rec-${category}-${index}`,
    type: getTypeFromCategory(category),
    name: getRecommendationName(category),
    score: count / intents.length,
    reason: `Based on your interest in ${getCategoryName(category)}`,
    metadata: intentMap[category],
  }));
}

function getTypeFromCategory(category: string): 'store' | 'product' | 'service' | 'deal' {
  const mapping: Record<string, 'store' | 'product' | 'service' | 'deal'> = {
    DINING: 'store',
    TRAVEL: 'service',
    HOTEL_SERVICE: 'service',
    RETAIL: 'product',
    GENERAL: 'deal',
  };
  return mapping[category] || 'deal';
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    DINING: 'dining & restaurants',
    TRAVEL: 'travel & hotels',
    HOTEL_SERVICE: 'hotel services',
    RETAIL: 'shopping',
    GENERAL: 'various categories',
  };
  return names[category] || 'recommended items';
}

function getRecommendationName(category: string): string {
  const names: Record<string, string> = {
    DINING: 'Recommended Restaurants',
    TRAVEL: 'Top Travel Deals',
    HOTEL_SERVICE: 'Hotel Services',
    RETAIL: 'Trending Products',
    GENERAL: 'Just For You',
  };
  return names[category] || 'Recommended For You';
}

export default usePersonalization;
