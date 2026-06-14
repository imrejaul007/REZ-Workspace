/**
 * Session timeout service - MA-AUT-017
 * Implements 30-minute inactivity timeout with automatic logout.
 *
 * NOTE: This service's initialize() is NOT called from AuthContext.tsx.
 * The active session timeout is the JWT-based 60-minute timeout in
 * AuthContext.tsx (scheduleSessionExpiry). This inactivity-based service
 * is currently unused and kept for potential future use (e.g., combining
 * inactivity detection with the JWT-based ceiling).
 */

import { AppState, AppStateStatus, Alert } from 'react-native';
import { logger } from '../utils/logger';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SESSION_WARNING_MS = 25 * 60 * 1000;

class SessionTimeoutService {
  private inactivityTimeoutRef: NodeJS.Timeout | null = null;
  private appStateSubscription: unknown = null;
  private lastActivityTime: number = Date.now();
  private isEnabled: boolean = false;
  private onTimeoutCallback?: () => Promise<void>;

  public initialize(onTimeout: () => Promise<void>): void {
    if (this.isEnabled) return;
    this.onTimeoutCallback = onTimeout;
    this.isEnabled = true;
    this.lastActivityTime = Date.now();

    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    this.resetInactivityTimer();
    logger.info('[SessionTimeout] Initialized');
  }

  public shutdown(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.clearInactivityTimer();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    logger.info('[SessionTimeout] Shutdown');
  }

  public recordActivity(): void {
    if (!this.isEnabled) return;
    this.lastActivityTime = Date.now();
    this.resetInactivityTimer();
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (!this.isEnabled) return;
    if (nextAppState === 'active') {
      const timeSinceLastActivity = Date.now() - this.lastActivityTime;
      if (timeSinceLastActivity > SESSION_TIMEOUT_MS) {
        logger.warn('[SessionTimeout] Session expired');
        await this.handleSessionTimeout();
      }
      this.resetInactivityTimer();
    } else {
      this.clearInactivityTimer();
    }
  };

  private resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.inactivityTimeoutRef = setTimeout(async () => {
      logger.warn('[SessionTimeout] Timeout reached');
      await this.handleSessionTimeout();
    }, SESSION_TIMEOUT_MS);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimeoutRef) {
      clearTimeout(this.inactivityTimeoutRef);
      this.inactivityTimeoutRef = null;
    }
  }

  private async handleSessionTimeout(): Promise<void> {
    this.clearInactivityTimer();
    Alert.alert(
      'Session Expired',
      'Your session has expired due to inactivity. Please log in again.',
      [{ text: 'OK', onPress: () => {} }],
      { cancelable: false }
    );
    if (this.onTimeoutCallback) await this.onTimeoutCallback();
  }

  public getTimeUntilTimeout(): number {
    const elapsed = Date.now() - this.lastActivityTime;
    return Math.max(0, SESSION_TIMEOUT_MS - elapsed);
  }

  public isAboutToTimeout(): boolean {
    return this.getTimeUntilTimeout() < SESSION_WARNING_MS;
  }
}

export const sessionTimeoutService = new SessionTimeoutService();
export default sessionTimeoutService;
