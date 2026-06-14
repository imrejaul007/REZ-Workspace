// @ts-nocheck
/**
 * Customer Data Platform (CDP) Hook
 * Connects to REZ-cdp-service (Port 4056)
 * Unified customer data aggregation and segmentation
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';

const CDP_URL = process.env.EXPO_PUBLIC_CDP_URL || 'https://REZ-cdp.onrender.com';

// Response types
interface CDPProfileResponse {
  profile: CustomerProfile;
  segments: SegmentMembership[];
}

interface CDPActivitiesResponse {
  activities: CustomerActivity[];
}

interface CDPSegmentsResponse {
  segments: SegmentMembership[];
}

interface CDPLifetimeResponse {
  totalSpend: number;
  orderCount: number;
  averageOrderValue: number;
  firstPurchaseDate?: string;
  lastPurchaseDate?: string;
}

export interface CustomerProfile {
  odId: string;
  identifiers: {
    email?: string;
    phone?: string;
    deviceId?: string;
    userId?: string;
  };
  attributes: {
    demographics?: {
      age?: number;
      gender?: string;
      location?: string;
    };
    preferences: Record<string, unknown>;
    lifetime: {
      totalSpend: number;
      orderCount: number;
      averageOrderValue: number;
      firstPurchaseDate?: string;
      lastPurchaseDate?: string;
    };
  };
  segments: string[];
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  createdAt: string;
  updatedAt: string;
}

export interface SegmentMembership {
  segmentId: string;
  segmentName: string;
  joinedAt: string;
  score: number;
}

export interface CustomerActivity {
  type: 'purchase' | 'view' | 'cart' | 'wishlist' | 'review' | 'search';
  timestamp: string;
  data: Record<string, unknown>;
}

export function useCDP() {
  const user = useAuthUser();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [segments, setSegments] = useState<SegmentMembership[]>([]);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<CDPProfileResponse>(`${CDP_URL}/profile/${user.id}`);

      if (response.success && response.data) {
        setProfile(response.data.profile);
        setSegments(response.data.segments || []);
      } else {
        setError(response.error || 'Failed to fetch profile');
      }
    } catch {
      setError('Network error fetching customer profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchActivities = useCallback(async (
    type?: CustomerActivity['type'],
    limit = 50
  ) => {
    if (!user?.id) return [];

    try {
      const response = await apiClient.get<CDPActivitiesResponse>(`${CDP_URL}/activities/${user.id}`, {
        type,
        limit,
      });

      if (response.success && response.data) {
        setActivities(response.data.activities || []);
        return response.data.activities || [];
      }
      return [];
    } catch {
      return [];
    }
  }, [user?.id]);

  const updatePreferences = useCallback(async (
    preferences: Record<string, unknown>
  ) => {
    if (!user?.id) return { success: false };

    try {
      const response = await apiClient.patch(`${CDP_URL}/profile/${user.id}/preferences`, {
        preferences,
      });

      return response;
    } catch {
      return { success: false, error: 'Failed to update preferences' };
    }
  }, [user?.id]);

  const trackEvent = useCallback(async (
    event: CustomerActivity
  ) => {
    if (!user?.id) return;

    try {
      await apiClient.post(`${CDP_URL}/events`, {
        odId: user.id,
        ...event,
      });
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    segments,
    activities,
    loading,
    error,
    fetchProfile,
    fetchActivities,
    updatePreferences,
    trackEvent,
  };
}

export function useCustomerSegments() {
  const user = useAuthUser();
  const [segments, setSegments] = useState<SegmentMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    apiClient.get<CDPSegmentsResponse>(`${CDP_URL}/segments/${user.id}`)
      .then(res => {
        if (res.success && res.data) {
          setSegments(res.data.segments || []);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const isInSegment = useCallback((segmentName: string) => {
    return segments.some(s => s.segmentName === segmentName);
  }, [segments]);

  const getSegmentScore = useCallback((segmentId: string) => {
    const segment = segments.find(s => s.segmentId === segmentId);
    return segment?.score ?? 0;
  }, [segments]);

  return { segments, loading, isInSegment, getSegmentScore };
}

export function useCustomerLifetime() {
  const user = useAuthUser();
  const [lifetime, setLifetime] = useState<{
    totalSpend: number;
    orderCount: number;
    averageOrderValue: number;
    firstPurchaseDate?: string;
    lastPurchaseDate?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    apiClient.get<CDPLifetimeResponse>(`${CDP_URL}/lifetime/${user.id}`)
      .then(res => {
        if (res.success && res.data) {
          setLifetime(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  return { lifetime, loading };
}
