// @ts-nocheck
// usePersonalizedFeed Hook
// Fetches a personalized store feed for the authenticated user,
// combining their user ID, current location, and saved interests.

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useUserId } from '@/stores/selectors';
import feedApi, { FeedStore, getUserInterests } from '@/services/feedApi';

export interface UsePersonalizedFeedReturn {
  stores: FeedStore[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook that builds a personalized store feed by combining:
 * - The authenticated user's ID (from Zustand auth store)
 * - The user's current GPS location (expo-location, best-effort)
 * - The user's saved category interests (AsyncStorage key: rez_interests)
 *
 * Falls back gracefully when location is unavailable.
 */
export function usePersonalizedFeed(): UsePersonalizedFeedReturn {
  const userId = useUserId();

  const [stores, setStores] = useState<FeedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Read interests from AsyncStorage in parallel with location fetch
      const [interests, locationResult] = await Promise.allSettled([
        getUserInterests(),
        Location.getLastKnownPositionAsync(),
      ]);

      const resolvedInterests =
        interests.status === 'fulfilled' ? interests.value : [];

      let lat: number | undefined;
      let lng: number | undefined;

      if (
        locationResult.status === 'fulfilled' &&
        locationResult.value?.coords
      ) {
        lat = locationResult.value.coords.latitude;
        lng = locationResult.value.coords.longitude;
      }

      const result = await feedApi.getPersonalizedFeed({
        userId: userId ?? undefined,
        lat,
        lng,
        interests: resolvedInterests,
        limit: 20,
      });

      setStores(result);
    } catch (err) {
      setError(err?.message || 'Failed to load feed');
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return { stores, loading, error, refresh: fetchFeed };
}

export default usePersonalizedFeed;
