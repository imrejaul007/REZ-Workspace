/**
 * Context Engine Hook
 * Connects to REZ-context-engine (Port 4060)
 * User context aggregation and enrichment
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';

const CONTEXT_URL = process.env.EXPO_PUBLIC_CONTEXT_URL || 'https://REZ-context-engine.onrender.com';

export interface UserContext {
  userId: string;
  sessionId: string;
  device: {
    type: 'mobile' | 'tablet' | 'web';
    os: string;
    browser?: string;
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  time: {
    local: string;
    timezone: string;
    dayOfWeek: number;
    hourOfDay: number;
  };
  behavior: {
    isReturningUser: boolean;
    sessionCount: number;
    lastVisit?: string;
    avgSessionDuration: number;
  };
  intent?: {
    currentIntent: string;
    confidence: number;
    alternatives: string[];
  };
  preferences: Record<string, unknown>;
}

export interface ContextEvent {
  type: string;
  source: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export function useContextEngine() {
  const user = useAuthUser();

  const getUserContext = useCallback(async (): Promise<UserContext | null> => {
    if (!user?.id) return null;

    try {
      const response = await apiClient.get(`${CONTEXT_URL}/context/${user.id}`);

      if (response.success && response.data) {
        return response.data as UserContext;
      }
      return null;
    } catch {
      return null;
    }
  }, [user?.id]);

  const updateContext = useCallback(async (
    updates: Partial<Omit<UserContext, 'userId' | 'sessionId'>>
  ) => {
    if (!user?.id) return { success: false };

    try {
      const response = await apiClient.patch(`${CONTEXT_URL}/context/${user.id}`, updates);
      return response;
    } catch {
      return { success: false, error: 'Failed to update context' };
    }
  }, [user?.id]);

  const trackContextEvent = useCallback(async (event: ContextEvent) => {
    if (!user?.id) return;

    try {
      await apiClient.post(`${CONTEXT_URL}/events`, {
        userId: user.id,
        ...event,
      });
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  return {
    getUserContext,
    updateContext,
    trackContextEvent,
  };
}

export function useSessionContext() {
  const user = useAuthUser();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const id = `session_${user.id}_${Date.now()}`;
    setSessionId(id);

    apiClient.post(`${CONTEXT_URL}/session/start`, {
      userId: user.id,
      sessionId: id,
      startTime: new Date().toISOString(),
    }).catch(() => {});

    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      apiClient.post(`${CONTEXT_URL}/session/end`, {
        userId: user.id,
        sessionId: id,
        endTime: new Date().toISOString(),
        activeDuration: isActive ? Date.now() - parseInt(id.split('_')[2]) : 0,
      }).catch(() => {});
    };
  }, [user?.id]);

  const trackEvent = useCallback((type: string, data?: Record<string, unknown>) => {
    if (!user?.id || !sessionId) return;

    apiClient.post(`${CONTEXT_URL}/session/event`, {
      userId: user.id,
      sessionId,
      type,
      data,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }, [user?.id, sessionId]);

  return { sessionId, isActive, trackEvent };
}

export function useLocationContext() {
  const [location, setLocation] = useState<{
    city?: string;
    state?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
          );
          const data = await response.json();

          setLocation({
            city: data.address?.city || data.address?.town || data.address?.village,
            state: data.address?.state,
            country: data.address?.country_code?.toUpperCase(),
            coordinates: coords,
          });
        } catch {
          setLocation({ coordinates: coords });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, loading, error, requestLocation };
}
