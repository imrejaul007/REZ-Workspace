/**
 * useSessionTracking Hook
 * React hook for session path tracking in React/React Native components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { sessionTrackingService } from '../services/sessionTrackingService';
import type { FeatureType, SessionMetadata } from '../../services/analytics/types';

/**
 * Hook options
 */
interface UseSessionTrackingOptions {
  /** Auto-initialize session on mount */
  autoInitialize?: boolean;
  /** User ID to associate with session */
  userId?: string | null;
  /** Feature name to track when component mounts */
  trackOnMount?: FeatureType;
}

/**
 * Hook return type
 */
interface UseSessionTrackingReturn {
  /** Current session data */
  session: SessionMetadata | null;
  /** Track a feature navigation */
  trackFeature: (feature: FeatureType) => Promise<void>;
  /** Initialize/start a new session */
  initialize: (userId?: string | null) => Promise<void>;
  /** End current session */
  endSession: () => Promise<void>;
  /** Get funnel analysis */
  getFunnel: (targetPath: FeatureType[]) => ReturnType<typeof sessionTrackingService.getFunnelAnalysis>;
  /** Get drop-off patterns */
  getDropOffPatterns: () => ReturnType<typeof sessionTrackingService.getDropOffPatterns>;
  /** Get quality report */
  getQualityReport: () => ReturnType<typeof sessionTrackingService.getSessionQualityReport>;
  /** Get transition statistics */
  getTransitionStats: () => ReturnType<typeof sessionTrackingService.getTransitionStats>;
  /** Export session data */
  exportData: () => Promise<Partial<SessionMetadata> | null>;
}

/**
 * Session tracking hook
 */
export function useSessionTracking(options: UseSessionTrackingOptions = {}): UseSessionTrackingReturn {
  const {
    autoInitialize = true,
    userId = null,
    trackOnMount,
  } = options;

  const [session, setSession] = useState<SessionMetadata | null>(null);
  const initializedRef = useRef(false);

  // Subscribe to session updates
  useEffect(() => {
    const unsubscribe = sessionTrackingService.subscribe((updatedSession) => {
      setSession(updatedSession);
    });

    // Get initial session state
    const currentSession = sessionTrackingService.getCurrentSession();
    if (currentSession) {
      setSession(currentSession);
    }

    return unsubscribe;
  }, []);

  // Auto-initialize and track on mount
  useEffect(() => {
    if (autoInitialize && !initializedRef.current) {
      initializedRef.current = true;

      sessionTrackingService.initializeSession(userId).then(() => {
        if (trackOnMount) {
          sessionTrackingService.trackFeatureAccess(trackOnMount);
        }
      });
    }
  }, [autoInitialize, userId, trackOnMount]);

  const trackFeature = useCallback(async (feature: FeatureType) => {
    await sessionTrackingService.trackFeatureAccess(feature);
  }, []);

  const initialize = useCallback(async (uid?: string | null) => {
    await sessionTrackingService.initializeSession(uid ?? userId);
  }, [userId]);

  const endSession = useCallback(async () => {
    await sessionTrackingService.endSession();
  }, []);

  const getFunnel = useCallback((targetPath: FeatureType[]) => {
    return sessionTrackingService.getFunnelAnalysis(targetPath);
  }, []);

  const getDropOffPatterns = useCallback(() => {
    return sessionTrackingService.getDropOffPatterns();
  }, []);

  const getQualityReport = useCallback(() => {
    return sessionTrackingService.getSessionQualityReport();
  }, []);

  const getTransitionStats = useCallback(() => {
    return sessionTrackingService.getTransitionStats();
  }, []);

  const exportData = useCallback(async () => {
    return sessionTrackingService.exportSessionData();
  }, []);

  return {
    session,
    trackFeature,
    initialize,
    endSession,
    getFunnel,
    getDropOffPatterns,
    getQualityReport,
    getTransitionStats,
    exportData,
  };
}

/**
 * Hook for tracking navigation to specific features
 * Lightweight wrapper that only tracks navigation without managing session lifecycle
 */
export function useFeatureTracking(feature: FeatureType) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!trackedRef.current) {
      trackedRef.current = true;
      sessionTrackingService.trackFeatureAccess(feature);
    }
  }, [feature]);

  return {
    trackTransition: (to: FeatureType) => sessionTrackingService.trackFeatureAccess(to),
  };
}

export default useSessionTracking;
