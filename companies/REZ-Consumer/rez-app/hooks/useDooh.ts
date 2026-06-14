/**
 * DOOH Hooks
 * React hooks for proximity-based DOOH advertising
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { logger } from '@/utils/logger';
import {
  getNearbyScreens,
  getScreenPlaylist,
  recordProximityEvent,
  recordImpression,
  DOOHScreen,
  DOOHPlaylist,
  PROXIMITY_THRESHOLDS,
} from '@/services/doohService';
import { useAuthUser } from '@/stores/selectors';

// ============================================================================
// NEARBY SCREENS HOOK
// ============================================================================

interface UseNearbyScreensReturn {
  screens: DOOHScreen[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  distanceToScreen: (screen: DOOHScreen) => number;
}

export function useNearbyScreens(radiusKm = 5): UseNearbyScreensReturn {
  const [screens, setScreens] = useState<DOOHScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchScreens = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getNearbyScreens(location.lat, location.lng, radiusKm);
      if (response.success && response.data) {
        setScreens(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screens');
    } finally {
      setLoading(false);
    }
  }, [location, radiusKm]);

  // Get user location
  useEffect(() => {
    async function getLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        });
      } catch (err) {
        logger.error('[DOOH] Location error:', err);
        setError('Failed to get location');
      }
    }

    getLocation();
  }, []);

  // Fetch screens when location changes
  useEffect(() => {
    if (location) {
      fetchScreens();
    }
  }, [location, fetchScreens]);

  // Calculate distance to a screen (simplified)
  const distanceToScreen = useCallback(
    (screen: DOOHScreen) => {
      if (!location) return Infinity;
      const dx = location.lat - screen.location.coordinates.lat;
      const dy = location.lng - screen.location.coordinates.lng;
      return Math.sqrt(dx * dx + dy * dy) * 111; // approx km
    },
    [location]
  );

  return {
    screens,
    loading,
    error,
    refresh: fetchScreens,
    distanceToScreen,
  };
}

// ============================================================================
// SCREEN PLAYLIST HOOK
// ============================================================================

interface UseScreenPlaylistReturn {
  playlist: DOOHPlaylist | null;
  loading: boolean;
  currentAd: number;
  nextAd: () => void;
}

export function useScreenPlaylist(screenId: string): UseScreenPlaylistReturn {
  const [playlist, setPlaylist] = useState<DOOHPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    async function fetchPlaylist() {
      setLoading(true);
      try {
        const response = await getScreenPlaylist(screenId);
        if (response.success && response.data) {
          setPlaylist(response.data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    if (screenId) {
      fetchPlaylist();
    }
  }, [screenId]);

  const nextAd = useCallback(() => {
    if (playlist && playlist.ads.length > 0) {
      setCurrentAd((prev) => (prev + 1) % playlist.ads.length);
    }
  }, [playlist]);

  return {
    playlist,
    loading,
    currentAd,
    nextAd,
  };
}

// ============================================================================
// PROXIMITY TRACKING HOOK
// ============================================================================

interface UseProximityTrackingReturn {
  isTracking: boolean;
  nearbyScreens: DOOHScreen[];
  triggerImpression: (screenId: string, adId: string) => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

export function useProximityTracking(): UseProximityTrackingReturn {
  const user = useAuthUser();
  const [isTracking, setIsTracking] = useState(false);
  const [nearbyScreens, setNearbyScreens] = useState<DOOHScreen[]>([]);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      setIsTracking(true);

      // Subscribe to location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Every 30 seconds
          distanceInterval: 50, // Or every 50 meters
        },
        async (location) => {
          const { latitude, longitude } = location.coords;

          // Check for nearby screens
          const response = await getNearbyScreens(latitude, longitude, 0.5); // 500m radius
          if (response.success && response.data) {
            const newScreens = response.data.filter(
              (s) => !nearbyScreens.find((ns) => ns.id === s.id)
            );

            // Record proximity events for new screens
            for (const screen of newScreens) {
              await recordProximityEvent({
                userId: user.id,
                screenId: screen.id,
                timestamp: new Date().toISOString(),
                location: { lat: latitude, lng: longitude },
              });
            }

            setNearbyScreens((prev) => [...prev, ...newScreens]);
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (err) {
      logger.error('[DOOH] Tracking error:', err);
      setIsTracking(false);
    }
  }, [user?.id, nearbyScreens]);

  const stopTracking = useCallback(() => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsTracking(false);
  }, [locationSubscription]);

  const triggerImpression = useCallback(
    async (screenId: string, adId: string) => {
      if (!user?.id) return;

      await recordImpression({
        impressionId: `${user.id}_${screenId}_${adId}_${Date.now()}`,
        screenId,
        userId: user.id,
        adId,
        campaignId: '',
        attributionWindow: 24,
      });
    },
    [user?.id]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    isTracking,
    nearbyScreens,
    triggerImpression,
    startTracking,
    stopTracking,
  };
}

// ============================================================================
// DOOH AD REWARDS HOOK
// ============================================================================

interface UseDOOHRewardsReturn {
  history: Array<{
    timestamp: string;
    screenName: string;
    rewardEarned?: number;
  }>;
  totalRewards: number;
  loading: boolean;
}

export function useDOOHRewards(): UseDOOHRewardsReturn {
  const user = useAuthUser();
  const [history, setHistory] = useState<UseDOOHRewardsReturn['history']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user?.id) {
        setHistory([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Import the function
        const { getUserAdHistory } = await import('@/services/doohService');
        const response = await getUserAdHistory(user.id);
        if (response.success && response.data) {
          setHistory(
            response.data.map((item) => ({
              timestamp: item.timestamp,
              screenName: item.screenName,
              rewardEarned: item.rewardEarned,
            }))
          );
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [user?.id]);

  const totalRewards = history.reduce((sum, item) => sum + (item.rewardEarned || 0), 0);

  return {
    history,
    totalRewards,
    loading,
  };
}
