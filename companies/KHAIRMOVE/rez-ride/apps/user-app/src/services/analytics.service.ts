import { logger } from '../../shared/logger';
/**
 * Analytics Service - Track user events
 */

import Constants from 'expo-constants';
import { API_BASE_URL } from '../api/client';

export interface EventProperties {
  [key: string]: string | number | boolean;
}

export interface UserProperties {
  [key: string]: string | number | boolean;
}

class AnalyticsService {
  private userId: string | null = null;
  private traits: UserProperties = {};
  private queue: { event: string; properties: EventProperties }[] = [];
  private enabled: boolean = true;
  private flushTimer: NodeJS.Timeout | null = null;

  initialize(): void {
    logger.info('Analytics initialized');
    // Start periodic flush
    this.flushTimer = setInterval(() => this.flush(), 30000);
  }

  setUser(userId: string, traits?: UserProperties): void {
    this.userId = userId;
    this.traits = traits || {};
    this.track('user_identified', { userId, ...traits });
  }

  resetUser(): void {
    this.userId = null;
    this.traits = {};
    this.track('user_logged_out');
  }

  track(event: string, properties?: EventProperties): void {
    if (!this.enabled) return;

    const payload = {
      event,
      userId: this.userId,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: 'ios',
        appVersion: Constants.expoConfig?.version || '1.0.0',
      },
    };

    this.queue.push(payload);

    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  // User events
  trackLogin(method: 'phone' | 'google' | 'apple'): void {
    this.track('login_completed', { method });
  }

  trackSignup(method: 'phone' | 'google' | 'apple'): void {
    this.track('user_signed_up', { method });
  }

  // Ride events
  trackRideSearch(pickup: string, drop: string, vehicleType: string): void {
    this.track('ride_searched', { pickup, drop, vehicleType });
  }

  trackRideBooked(rideId: string, vehicleType: string, fare: number): void {
    this.track('ride_booked', { rideId, vehicleType, fare });
  }

  trackRideCompleted(rideId: string, fare: number, duration: number, distance: number): void {
    this.track('ride_completed', { rideId, fare, duration, distance });
  }

  trackRideCancelled(rideId: string, reason: string): void {
    this.track('ride_cancelled', { rideId, reason });
  }

  trackDriverArrived(rideId: string, eta: number): void {
    this.track('driver_arrived', { rideId, eta });
  }

  // Rating events
  trackRatingSubmitted(rideId: string, rating: number, comment?: string): void {
    this.track('rating_submitted', { rideId, rating, hasComment: !!comment });
  }

  // Payment events
  trackPaymentInitiated(amount: number, method: string): void {
    this.track('payment_initiated', { amount, method });
  }

  trackPaymentCompleted(amount: number, method: string): void {
    this.track('payment_completed', { amount, method });
  }

  trackPaymentFailed(amount: number, method: string, error: string): void {
    this.track('payment_failed', { amount, method, error });
  }

  // Wallet events
  trackMoneyAdded(amount: number): void {
    this.track('money_added_to_wallet', { amount });
  }

  trackVoucherApplied(code: string, discount: number): void {
    this.track('voucher_applied', { code, discount });
  }

  // Screen events
  trackScreenView(screenName: string, params?: Record<string, string>): void {
    this.track('screen_viewed', { screenName, ...params });
  }

  // Location events
  trackLocationPermission(granted: boolean): void {
    this.track('location_permission_response', { granted });
  }

  // Error tracking
  trackError(error: string, context?: Record<string, any>): void {
    this.track('error_occurred', { error, ...context });
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

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
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
