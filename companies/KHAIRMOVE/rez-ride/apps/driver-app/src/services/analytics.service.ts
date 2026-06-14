import { logger } from '../../shared/logger';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../api/client';

interface EventProperties {
  [key: string]: string | number | boolean;
}

class AnalyticsService {
  private userId: string | null = null;
  private queue: { event: string; properties: EventProperties }[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  initialize(): void {
    logger.info('Driver Analytics initialized');
    this.flushTimer = setInterval(() => this.flush(), 30000);
  }

  setUser(userId: string): void {
    this.userId = userId;
  }

  track(event: string, properties?: EventProperties): void {
    const payload = {
      event,
      userId: this.userId,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: 'driver-app',
        appVersion: Constants.expoConfig?.version || '1.0.0',
      },
    };

    this.queue.push(payload);

    if (this.queue.length >= 10) {
      this.flush();
    }

    logger.info('Analytics:', event, properties);
  }

  trackLogin(): void {
    this.track('driver_login');
  }

  trackGoOnline(): void {
    this.track('driver_went_online');
  }

  trackGoOffline(): void {
    this.track('driver_went_offline');
  }

  trackRideAccepted(rideId: string): void {
    this.track('ride_accepted', { rideId });
  }

  trackRideStarted(rideId: string): void {
    this.track('ride_started', { rideId });
  }

  trackRideCompleted(rideId: string, earnings: number): void {
    this.track('ride_completed', { rideId, earnings });
  }

  trackRideCancelled(rideId: string, reason: string): void {
    this.track('ride_cancelled_by_driver', { rideId, reason });
  }

  trackScreenView(screenName: string): void {
    this.track('screen_viewed', { screenName });
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await fetch(`${API_BASE_URL}/api/analytics/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
    } catch (error) {
      this.queue = [...batch, ...this.queue];
    }
  }

  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

export const analytics = new AnalyticsService();
export default analytics;
