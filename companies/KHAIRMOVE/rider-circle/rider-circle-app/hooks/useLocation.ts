/**
 * Location Tracking Hook
 * Uses expo-location for GPS tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { useRideStore } from '../stores/ride';
import { usePresenceStore } from '../stores/presence';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  trackingInterval?: number; // milliseconds
  distanceFilter?: number; // meters
  showBackground?: boolean;
}

export interface UseLocationReturn {
  location: LocationData | null;
  isTracking: boolean;
  hasPermission: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    enableHighAccuracy = true,
    trackingInterval = 3000,
    distanceFilter = 10,
    showBackground = false,
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rideStore = useRideStore();
  const presenceStore = usePresenceStore();

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';

      if (granted && showBackground) {
        const bgStatus = await Location.requestBackgroundPermissionsAsync();
        return bgStatus.status === 'granted';
      }

      setHasPermission(granted);
      return granted;
    } catch (err) {
      setError('Failed to request location permissions');
      return false;
    }
  }, [showBackground]);

  // Check permissions
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch {
      return false;
    }
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        setError('Location permission not granted');
        return null;
      }
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy
          ? Location.Accuracy.BestForNavigation
          : Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude ?? undefined,
        accuracy: loc.coords.accuracy ?? undefined,
        speed: loc.coords.speed ?? undefined,
        heading: loc.coords.heading ?? undefined,
        timestamp: loc.timestamp,
      };

      setLocation(locationData);
      setError(null);
      return locationData;
    } catch (err) {
      setError('Failed to get current location');
      return null;
    }
  }, [hasPermission, requestPermissions, enableHighAccuracy]);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (isTracking) return;

    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        setError('Location permission not granted');
        return;
      }
    }

    try {
      // Start watching location
      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: enableHighAccuracy
            ? Location.Accuracy.BestForNavigation
            : Location.Accuracy.Balanced,
          distanceInterval: distanceFilter,
          timeInterval: trackingInterval,
        },
        (loc) => {
          const locationData: LocationData = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude ?? undefined,
            accuracy: loc.coords.accuracy ?? undefined,
            speed: loc.coords.speed ?? undefined,
            heading: loc.coords.heading ?? undefined,
            timestamp: loc.timestamp,
          };

          setLocation(locationData);

          // Update ride store with location
          rideStore.updateLocation(locationData);

          // Update presence store
          presenceStore.updateLocation(
            [locationData.longitude, locationData.latitude],
            locationData.speed ? locationData.speed * 3.6 : undefined, // m/s to km/h
            locationData.heading ?? undefined
          );
        }
      );

      setIsTracking(true);
      presenceStore.startTracking();
      setError(null);
    } catch (err) {
      setError('Failed to start location tracking');
    }
  }, [isTracking, hasPermission, requestPermissions, enableHighAccuracy, distanceFilter, trackingInterval]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);
    presenceStore.stopTracking();
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    isTracking,
    hasPermission,
    error,
    startTracking,
    stopTracking,
    getCurrentLocation,
  };
}

// Hook for nearby riders
export function useNearbyRiders(radius = 10) {
  const { nearbyRiders, getNearbyRiders, currentLocation } = usePresenceStore();

  const fetchNearby = useCallback(async () => {
    if (currentLocation) {
      await getNearbyRiders(radius);
    }
  }, [currentLocation, getNearbyRiders, radius]);

  useEffect(() => {
    fetchNearby();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNearby, 30000);
    return () => clearInterval(interval);
  }, [fetchNearby]);

  return { nearbyRiders, refresh: fetchNearby };
}

// Hook for live stats
export function useLiveStats() {
  const { liveStats, getLiveStats } = usePresenceStore();

  useEffect(() => {
    getLiveStats();
    // Refresh every 30 seconds
    const interval = setInterval(getLiveStats, 30000);
    return () => clearInterval(interval);
  }, [getLiveStats]);

  return liveStats;
}
