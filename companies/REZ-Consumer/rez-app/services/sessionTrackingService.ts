/**
 * Session Tracking Service
 * CARLOS: retention — track app foreground/background events for cohort analysis
 *
 * Session depth (time in app, feature usage) correlates with 90-day retention.
 * Early sessions that visit wallet → makes first purchase → sees first reward
 * have 3x higher lifetime value than passive users.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { logger } from '@/utils/logger';

export interface SessionMetadata {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number; // milliseconds
  featuresTouched: string[]; // 'wallet', 'earn', 'mall', 'book', etc
  eventsCount: number;
  purchaseMade: boolean;
  firstRewardSeen: boolean;
}

const SESSION_STORAGE_KEY = '@rez_session_tracking';

class SessionTrackingService {
  private currentSession: Partial<SessionMetadata> | null = null;

  /**
   * Start a new session when app comes to foreground
   * CARLOS: retention — measure app engagement depth
   */
  startSession(userId?: string): SessionMetadata {
    const sessionId = this.generateSessionId();
    this.currentSession = {
      sessionId,
      userId,
      startTime: Date.now(),
      featuresTouched: [],
      eventsCount: 0,
      purchaseMade: false,
      firstRewardSeen: false,
    };

    logger.debug('[SessionTracking] Session started', { sessionId }, 'SessionTracking');
    return this.currentSession as SessionMetadata;
  }

  /**
   * End current session when app goes background
   * CARLOS: retention — persist session data for cohort analysis
   */
  async endSession(): Promise<SessionMetadata | null> {
    if (!this.currentSession) return null;

    const session: SessionMetadata = {
      sessionId: this.currentSession.sessionId!,
      userId: this.currentSession.userId,
      startTime: this.currentSession.startTime!,
      endTime: Date.now(),
      duration: Date.now() - this.currentSession.startTime!,
      featuresTouched: this.currentSession.featuresTouched || [],
      eventsCount: this.currentSession.eventsCount || 0,
      purchaseMade: this.currentSession.purchaseMade || false,
      firstRewardSeen: this.currentSession.firstRewardSeen || false,
    };

    // Persist to local storage for batch upload to analytics
    await this.persistSession(session);

    logger.debug('[SessionTracking] Session ended', {
      sessionId: session.sessionId,
      duration: session.duration,
      features: session.featuresTouched,
    }, 'SessionTracking');

    this.currentSession = null;
    return session;
  }

  /**
   * Track feature touch (navigation to specific screen/feature)
   * CARLOS: retention — what users do in their first session predicts LTV
   */
  trackFeatureTouch(feature: string): void {
    if (!this.currentSession) return;

    if (!this.currentSession.featuresTouched?.includes(feature)) {
      this.currentSession.featuresTouched?.push(feature);
    }
    this.currentSession.eventsCount = (this.currentSession.eventsCount || 0) + 1;

    logger.debug('[SessionTracking] Feature touched', { feature }, 'SessionTracking');
  }

  /**
   * Mark that user made a purchase in this session
   * CARLOS: retention — first purchase in early sessions = higher retention
   */
  markPurchase(): void {
    if (this.currentSession) {
      this.currentSession.purchaseMade = true;
      logger.debug('[SessionTracking] Purchase recorded in session', {}, 'SessionTracking');
    }
  }

  /**
   * Mark that user saw their first reward
   * CARLOS: retention — first reward notification is critical habit trigger
   */
  markFirstRewardSeen(): void {
    if (this.currentSession) {
      this.currentSession.firstRewardSeen = true;
      logger.debug('[SessionTracking] First reward seen in session', {}, 'SessionTracking');
    }
  }

  /**
   * Get all persisted sessions for batch analytics upload
   * CARLOS: retention — cohort analysis feeds re-engagement timing strategy
   */
  async getPersistedSessions(): Promise<SessionMetadata[]> {
    try {
      const data = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.warn('[SessionTracking] Failed to read persisted sessions:', error);
      return [];
    }
  }

  /**
   * Clear persisted sessions after successful upload to backend
   */
  async clearPersistedSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      logger.debug('[SessionTracking] Cleared persisted sessions');
    } catch (error) {
      logger.warn('[SessionTracking] Failed to clear sessions:', error);
    }
  }

  /**
   * Get current active session data
   */
  getCurrentSession(): SessionMetadata | null {
    if (!this.currentSession) return null;
    return {
      sessionId: this.currentSession.sessionId!,
      userId: this.currentSession.userId,
      startTime: this.currentSession.startTime!,
      featuresTouched: this.currentSession.featuresTouched || [],
      eventsCount: this.currentSession.eventsCount || 0,
      purchaseMade: this.currentSession.purchaseMade || false,
      firstRewardSeen: this.currentSession.firstRewardSeen || false,
    };
  }

  // --- Private helpers ---

  private generateSessionId(): string {
    return `session_${Date.now()}_${uuid.v4()}`;
  }

  private async persistSession(session: SessionMetadata): Promise<void> {
    try {
      const existing = await this.getPersistedSessions();
      const updated = [...existing, session];
      // Keep last 50 sessions
      const trimmed = updated.slice(-50);
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      logger.warn('[SessionTracking] Failed to persist session:', error);
    }
  }
}

export default new SessionTrackingService();
