// @ts-nocheck
/**
 * Session Path Tracking Service
 * Tracks feature-to-feature session paths, transition times, and session quality
 * Enables funnel analysis, drop-off pattern detection, and session quality scoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeatureType, TransitionTime, SessionMetadata, SessionExportData } from '../../services/analytics/types';

// Re-export types for convenience
export type { FeatureType, TransitionTime, SessionMetadata, SessionExportData } from '../../services/analytics/types';

// Session quality thresholds
const SESSION_QUALITY_THRESHOLDS = {
  low: 3,      // < 3 unique features = low quality
  medium: 6,   // 3-5 unique features = medium quality
  high: 7,     // 6+ unique features = high quality
};

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity = session ended
const STORAGE_KEY = '@session_tracking';

// Generate unique session ID
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Calculate session depth score based on path analysis
function calculateDepthScore(
  featurePath: FeatureType[],
  transitionTimes: TransitionTime[]
): number {
  const uniqueFeatures = new Set(featurePath).size;
  const totalTransitions = transitionTimes.length;

  // Weight: unique features + transitions + path length
  const pathLengthBonus = featurePath.length > 5 ? 2 : 0;
  const transitionRate = totalTransitions > 0 ? Math.min(totalTransitions / 10, 2) : 0;

  return Math.min(uniqueFeatures + Math.floor(transitionRate) + pathLengthBonus, 10);
}

// Determine session quality based on depth score
function determineSessionQuality(depthScore: number): 'low' | 'medium' | 'high' {
  if (depthScore >= SESSION_QUALITY_THRESHOLDS.high) return 'high';
  if (depthScore >= SESSION_QUALITY_THRESHOLDS.medium) return 'medium';
  return 'low';
}

// Main Session Tracking Service
class SessionTrackingService {
  private currentSession: SessionMetadata | null = null;
  private lastFeatureTime: number = 0;
  private listeners: Set<(session: SessionMetadata) => void> = new Set();

  /**
   * Initialize or resume a session
   */
  async initializeSession(userId: string | null = null): Promise<SessionMetadata> {
    const now = Date.now();

    // Check for existing active session
    const existingSession = await this.loadSession();
    if (existingSession && this.isSessionActive(existingSession, now)) {
      this.currentSession = existingSession;
      this.lastFeatureTime = now;
      return this.currentSession;
    }

    // Create new session
    this.currentSession = {
      sessionId: generateSessionId(),
      userId,
      startTime: now,
      lastActiveTime: now,
      featurePath: [],
      transitionTimes: [],
      sessionDepthScore: 0,
      sessionQuality: 'low',
      featureVisits: this.initializeFeatureVisits(),
      maxSessionDuration: 0,
      isActive: true,
    };

    await this.persistSession();
    this.notifyListeners();

    return this.currentSession;
  }

  /**
   * Track navigation to a new feature
   */
  async trackFeatureAccess(feature: FeatureType): Promise<SessionMetadata | null> {
    if (!this.currentSession || !this.currentSession.isActive) {
      logger.warn('[SessionTracking] No active session. Call initializeSession first.');
      return null;
    }

    const now = Date.now();
    const previousFeature = this.currentSession.featurePath[this.currentSession.featurePath.length - 1];

    // Record transition time if this isn't the first feature
    if (previousFeature && previousFeature !== feature) {
      const transitionTime: TransitionTime = {
        from: previousFeature,
        to: feature,
        ms: now - this.lastFeatureTime,
        timestamp: now,
      };
      this.currentSession.transitionTimes.push(transitionTime);
    }

    // Add to feature path
    if (!this.currentSession.featurePath.includes(feature)) {
      this.currentSession.featurePath.push(feature);
      this.currentSession.featureVisits[feature] = 1;
    } else {
      this.currentSession.featureVisits[feature]++;
    }

    // Update session metrics
    this.currentSession.lastActiveTime = now;
    this.currentSession.maxSessionDuration = Math.max(
      this.currentSession.maxSessionDuration,
      now - this.currentSession.startTime
    );
    this.currentSession.sessionDepthScore = calculateDepthScore(
      this.currentSession.featurePath,
      this.currentSession.transitionTimes
    );
    this.currentSession.sessionQuality = determineSessionQuality(
      this.currentSession.sessionDepthScore
    );

    this.lastFeatureTime = now;
    await this.persistSession();
    this.notifyListeners();

    return this.currentSession;
  }

  /**
   * Get current session state
   */
  getCurrentSession(): SessionMetadata | null {
    return this.currentSession;
  }

  /**
   * End the current session
   */
  async endSession(): Promise<SessionMetadata | null> {
    if (!this.currentSession) return null;

    this.currentSession.isActive = false;
    this.currentSession.lastActiveTime = Date.now();
    await this.persistSession();

    const session = this.currentSession;
    this.currentSession = null;
    this.notifyListeners();

    return session;
  }

  /**
   * Get funnel analysis for a given path
   */
  getFunnelAnalysis(targetPath: FeatureType[]): {
    totalSessions: number;
    completedFunnel: number;
    dropOffPoints: Map<FeatureType, number>;
    conversionRate: number;
  } {
    // This would typically query historical session data
    // For now, return current session analysis
    const session = this.currentSession;
    if (!session) {
      return {
        totalSessions: 0,
        completedFunnel: 0,
        dropOffPoints: new Map(),
        conversionRate: 0,
      };
    }

    const pathSet = new Set(session.featurePath);
    let completedSteps = 0;
    const dropOffPoints = new Map<FeatureType, number>();

    for (const step of targetPath) {
      if (pathSet.has(step)) {
        completedSteps++;
      } else {
        // Track drop-off points
        dropOffPoints.set(step, (dropOffPoints.get(step) || 0) + 1);
      }
    }

    const conversionRate = targetPath.length > 0
      ? (completedSteps / targetPath.length) * 100
      : 0;

    return {
      totalSessions: 1,
      completedFunnel: completedSteps === targetPath.length ? 1 : 0,
      dropOffPoints,
      conversionRate,
    };
  }

  /**
   * Get drop-off pattern analysis
   */
  getDropOffPatterns(): {
    commonExits: FeatureType[];
    averageDepthBeforeExit: number;
    criticalDropOffPoints: FeatureType[];
  } {
    const session = this.currentSession;
    if (!session || session.featurePath.length === 0) {
      return {
        commonExits: [],
        averageDepthBeforeExit: 0,
        criticalDropOffPoints: [],
      };
    }

    // Count transitions to less-engaging features or session end
    const exitCount = new Map<FeatureType, number>();
    const lastFeature = session.featurePath[session.featurePath.length - 1];

    // The last feature before session end is considered an exit point
    exitCount.set(lastFeature, (exitCount.get(lastFeature) || 0) + 1);

    const commonExits = Array.from(exitCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([feature]) => feature);

    // Critical drop-off: features with high exit rates
    const criticalDropOffPoints = commonExits.filter(
      f => exitCount.get(f)! > 1
    );

    return {
      commonExits,
      averageDepthBeforeExit: session.featurePath.length,
      criticalDropOffPoints,
    };
  }

  /**
   * Get session quality breakdown
   */
  getSessionQualityReport(): {
    quality: 'low' | 'medium' | 'high';
    depthScore: number;
    uniqueFeatures: number;
    avgTransitionTime: number;
    totalSessionTime: number;
  } | null {
    const session = this.currentSession;
    if (!session) return null;

    const totalTransitionTime = session.transitionTimes.reduce(
      (sum, t) => sum + t.ms, 0
    );
    const avgTransitionTime = session.transitionTimes.length > 0
      ? totalTransitionTime / session.transitionTimes.length
      : 0;

    return {
      quality: session.sessionQuality,
      depthScore: session.sessionDepthScore,
      uniqueFeatures: new Set(session.featurePath).size,
      avgTransitionTime: Math.round(avgTransitionTime),
      totalSessionTime: session.lastActiveTime - session.startTime,
    };
  }

  /**
   * Subscribe to session updates
   */
  subscribe(listener: (session: SessionMetadata) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get transition statistics
   */
  getTransitionStats(): {
    totalTransitions: number;
    avgTransitionTime: number;
    fastestTransition: TransitionTime | null;
    slowestTransition: TransitionTime | null;
    mostCommonPath: string | null;
  } {
    const session = this.currentSession;
    if (!session || session.transitionTimes.length === 0) {
      return {
        totalTransitions: 0,
        avgTransitionTime: 0,
        fastestTransition: null,
        slowestTransition: null,
        mostCommonPath: null,
      };
    }

    const transitions = session.transitionTimes;
    const totalTime = transitions.reduce((sum, t) => sum + t.ms, 0);

    // Find fastest and slowest
    const sorted = [...transitions].sort((a, b) => a.ms - b.ms);

    // Find most common path segment
    const pathCounts = new Map<string, number>();
    for (let i = 0; i < transitions.length - 1; i++) {
      const path = `${transitions[i].to}→${transitions[i + 1].to}`;
      pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
    }

    const mostCommon = Array.from(pathCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalTransitions: transitions.length,
      avgTransitionTime: Math.round(totalTime / transitions.length),
      fastestTransition: sorted[0] || null,
      slowestTransition: sorted[sorted.length - 1] || null,
      mostCommonPath: mostCommon ? `${mostCommon[0]} (${mostCommon[1]}x)` : null,
    };
  }

  /**
   * Export session data for analytics
   */
  async exportSessionData(): Promise<Partial<SessionMetadata> | null> {
    if (!this.currentSession) return null;

    return {
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
      startTime: this.currentSession.startTime,
      lastActiveTime: this.currentSession.lastActiveTime,
      featurePath: this.currentSession.featurePath,
      transitionTimes: this.currentSession.transitionTimes,
      sessionDepthScore: this.currentSession.sessionDepthScore,
      sessionQuality: this.currentSession.sessionQuality,
      featureVisits: this.currentSession.featureVisits,
      maxSessionDuration: this.currentSession.maxSessionDuration,
    };
  }

  // Private helpers
  private initializeFeatureVisits(): Record<FeatureType, number> {
    const features: FeatureType[] = [
      'home', 'search', 'store', 'product', 'cart', 'checkout',
      'profile', 'wallet', 'orders', 'offers', 'karma',
      'settings', 'notifications', 'onboarding', 'auth', 'splash'
    ];
    return features.reduce((acc, f) => ({ ...acc, [f]: 0 }), {} as Record<FeatureType, number>);
  }

  private isSessionActive(session: SessionMetadata, now: number): boolean {
    return session.isActive && (now - session.lastActiveTime) < SESSION_TIMEOUT_MS;
  }

  private async persistSession(): Promise<void> {
    try {
      if (this.currentSession) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSession));
      }
    } catch (error) {
      logger.error('[SessionTracking] Failed to persist session:', error);
    }
  }

  private async loadSession(): Promise<SessionMetadata | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as SessionMetadata;
      }
    } catch (error) {
      logger.error('[SessionTracking] Failed to load session:', error);
    }
    return null;
  }

  private notifyListeners(): void {
    if (this.currentSession) {
      this.listeners.forEach(listener => {
        try {
          listener(this.currentSession!);
        } catch (error) {
          logger.error('[SessionTracking] Listener error:', error);
        }
      });
    }
  }
}

// Singleton instance
export const sessionTrackingService = new SessionTrackingService();
export default sessionTrackingService;
