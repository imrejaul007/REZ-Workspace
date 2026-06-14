/**
 * Taste Profile Hook
 * React hook for accessing REZ-taste-profile personalization
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import { locationService } from '@/services/locationService';
import {
  tasteProfileService,
  TasteProfile,
  TasteRecommendation,
  BehavioralScore,
} from '@/services/tasteProfileService';

interface UseTasteProfileReturn {
  profile: TasteProfile | null;
  loading: boolean;
  error: string | null;
  recommendations: TasteRecommendation[];
  refresh: () => Promise<void>;
  isDiscountSeeker: boolean;
  isQualitySeeker: boolean;
  engagementTier: string;
  topCategories: string[];
  recordAction: (
    action: 'view' | 'search' | 'wishlist' | 'share',
    data: { entityType: string; entityId: string; category?: string }
  ) => void;
}

export function useTasteProfile(): UseTasteProfileReturn {
  const user = useAuthUser();
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [recommendations, setRecommendations] = useState<TasteRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setRecommendations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user location for personalization
      let userLocation: { latitude: number; longitude: number } | undefined;
      try {
        const cachedLocation = await locationService.getCachedLocation();
        if (cachedLocation?.coordinates) {
          userLocation = cachedLocation.coordinates;
        }
      } catch {
        // Location not available, continue without it
      }

      // Get taste context with recommendations
      const response = await tasteProfileService.getTasteContext({
        userId: user.id,
        currentContext: {
          location: userLocation,
          time: new Date(),
        },
        requestedCategories: ['food', 'retail', 'entertainment'],
      });

      if (response.success && response.data) {
        setProfile(response.data.userProfile);
        setRecommendations(response.data.recommendations || []);
      } else {
        // Try getting just the profile
        const profileResponse = await tasteProfileService.getTasteProfile(user.id);
        if (profileResponse.success && profileResponse.data) {
          setProfile(profileResponse.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load taste profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const recordAction = useCallback(
    (
      action: 'view' | 'search' | 'wishlist' | 'share',
      data: { entityType: string; entityId: string; category?: string }
    ) => {
      if (!user?.id) return;

      // Fire and forget
      tasteProfileService.captureTasteSignal(user.id, {
        type: action,
        entityType: data.entityType as 'product' | 'store' | 'brand' | 'category',
        entityId: data.entityId,
      });
    },
    [user?.id]
  );

  return {
    profile,
    loading,
    error,
    recommendations,
    refresh: fetchProfile,
    isDiscountSeeker: profile ? tasteProfileService.isDiscountSeeker(profile) : false,
    isQualitySeeker: profile ? tasteProfileService.isQualitySeeker(profile) : false,
    engagementTier: profile ? tasteProfileService.getEngagementTier(profile) : 'bronze',
    topCategories: profile?.topCategories.slice(0, 5).map((c) => c.category) || [],
    recordAction,
  };
}

/**
 * Hook for behavioral insights only
 */
export function useBehavioralInsights() {
  const user = useAuthUser();
  const [insights, setInsights] = useState<{
    adventurousness: number;
    brandLoyalty: number;
    valueConsciousness: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setInsights(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    tasteProfileService.getTasteProfile(user.id).then((response) => {
      if (response.success && response.data) {
        setInsights(response.data.behavioralScores);
      }
      setLoading(false);
    });
  }, [user?.id]);

  return { insights, loading };
}

/**
 * Hook for category affinity
 */
export function useCategoryAffinity(category: string) {
  const user = useAuthUser();
  const [affinity, setAffinity] = useState<{
    score: number;
    avgOrderValue: number;
    purchaseFrequency: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !category) {
      setAffinity(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    tasteProfileService.getCategoryAffinity(user.id, category).then((response) => {
      if (response.success && response.data) {
        setAffinity({
          score: response.data.score,
          avgOrderValue: response.data.avgOrderValue,
          purchaseFrequency: response.data.purchaseFrequency,
        });
      }
      setLoading(false);
    });
  }, [user?.id, category]);

  return { affinity, loading };
}
