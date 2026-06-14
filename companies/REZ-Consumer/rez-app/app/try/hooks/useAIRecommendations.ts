// @ts-nocheck
/**
 * AI-Powered Trial Recommendations Hook
 * Part of ReZ Mind AI Layer for ReZ Try
 *
 * Personalizes trial feed based on user behavior signals:
 * - Category preferences from exploration/booking history
 * - Price sensitivity from past bookings
 * - Distance optimization
 * - Time of day patterns
 * - Seasonal/weather factors
 * - Mission alignment
 */

import { useState, useEffect, useCallback } from 'react';
import { tryApi, TrialCard } from '@/services/tryApi';
import { rezMindClient } from '@/services/ReZMIND_CLIENT';

interface AIRecommendation {
  trialId: string;
  score: number; // 0-100 AI relevance score
  reasons: string[]; // Why this was recommended
  category: string;
}

// Extended TrialCard with AI score metadata
interface ScoredTrial extends TrialCard {
  _aiScore: number;
}

interface UseAIRecommendationsResult {
  recommendations: TrialCard[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getAIRecommendation: (trialId: string) => AIRecommendation | undefined;
}

// Mock scoring for development - in production this calls ReZ Mind API
function calculateMockScore(trial: TrialCard): { score: number; reasons: string[] } {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Boost for good ratings
  if (trial.rating && trial.rating >= 4.5) {
    score += 15;
    reasons.push('Highly rated');
  } else if (trial.rating && trial.rating >= 4.0) {
    score += 10;
    reasons.push('Well rated');
  }

  // Boost for limited slots (urgency)
  if (trial.slotsRemaining <= 5) {
    score += 10;
    reasons.push('Limited availability');
  } else if (trial.slotsRemaining <= 10) {
    score += 5;
  }

  // Boost for trending (high review count)
  if (trial.ratingCount && trial.ratingCount > 50) {
    score += 15;
    reasons.push('Popular choice');
  }

  // Boost for value (high original price vs coin price)
  if (trial.originalPrice && trial.coinPrice) {
    const ratio = trial.coinPrice / trial.originalPrice;
    if (ratio < 0.3) {
      score += 10;
      reasons.push('Great deal');
    } else if (ratio < 0.5) {
      score += 5;
    }
  }

  // Boost for slots availability
  if (trial.slotsRemaining > 0) {
    score += 5;
  }

  return { score: Math.min(100, score), reasons };
}

/**
 * Hook for AI-powered trial recommendations
 *
 * @param trials - All available trials to score and rank
 * @returns Personalized trial feed with AI scores
 */
export function useAIRecommendations(trials: TrialCard[]): UseAIRecommendationsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<TrialCard[]>([]);
  const [aiRecommendations, setAIRecommendations] = useState<Map<string, AIRecommendation>>(new Map());

  const scoreTrials = useCallback((allTrials: TrialCard[]): ScoredTrial[] => {
    const scoredTrials = allTrials.map((trial): ScoredTrial => {
      const { score, reasons } = calculateMockScore(trial);

      // Store AI recommendation metadata
      setAIRecommendations(prev => {
        const updated = new Map(prev);
        updated.set(trial.id, {
          trialId: trial.id,
          score,
          reasons,
          category: trial.category,
        });
        return updated;
      });

      return {
        ...trial,
        _aiScore: score,
      };
    });

    return scoredTrials.sort((a, b) => b._aiScore - a._aiScore);
  }, []);

  useEffect(() => {
    if (trials.length > 0) {
      // Reset recommendations map for new trials
      const newAIRecommendations = new Map<string, AIRecommendation>();
      const scored = trials.map(trial => {
        const { score, reasons } = calculateMockScore(trial);
        newAIRecommendations.set(trial.id, {
          trialId: trial.id,
          score,
          reasons,
          category: trial.category,
        });
        return {
          ...trial,
          _aiScore: score,
        };
      });

      setAIRecommendations(newAIRecommendations);
      setRecommendations(scored.sort((a, b) => b._aiScore - a._aiScore));
    }
  }, [trials]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, this would call ReZ Mind API to refresh recommendations
      // const userId = await getCurrentUserId();
      // const newScores = await rezMindClient.getRecommendations(userId, trials, getContext());

      // For now, re-calculate mock scores
      if (trials.length > 0) {
        const scored = scoreTrials(trials);
        setRecommendations(scored);
      }
    } catch (err) {
      setError('Failed to refresh recommendations');
      logger.error('AI recommendation refresh failed:', err);
    } finally {
      setLoading(false);
    }
  }, [trials, scoreTrials]);

  const getAIRecommendation = useCallback(
    (trialId: string): AIRecommendation | undefined => {
      return aiRecommendations.get(trialId);
    },
    [aiRecommendations],
  );

  return {
    recommendations,
    loading,
    error,
    refresh,
    getAIRecommendation,
  };
}

/**
 * Context for AI recommendation scoring
 */
export function getRecommendationContext(): {
  timeOfDay: string;
  dayOfWeek: string;
  weather?: string;
} {
  const now = new Date();
  const hours = now.getHours();

  let timeOfDay: string;
  if (hours >= 5 && hours < 12) {
    timeOfDay = 'morning';
  } else if (hours >= 12 && hours < 17) {
    timeOfDay = 'afternoon';
  } else if (hours >= 17 && hours < 21) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[now.getDay()];

  return {
    timeOfDay,
    dayOfWeek,
    // Weather would come from a weather service integration
  };
}

export default useAIRecommendations;
