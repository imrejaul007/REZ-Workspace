/**
 * Predictive Suggestions Service
 *
 * AI-powered ride predictions and suggestions:
 * - "Going home?"
 * - "Book your office cab?"
 * - "Rain surge starting in 10 mins"
 * - "Your usual café has 20% cashback"
 */

import { Logger } from '@nestjs/common';
import { randomInt } from 'crypto';

export interface UserPattern {
  homeLocation?: { lat: number; lng: number; address: string };
  officeLocation?: { lat: number; lng: number; address: string };
  frequentDestinations: {
    location: { lat: number; lng: number; address: string };
    type: 'home' | 'office' | 'restaurant' | 'gym' | 'mall' | 'other';
    count: number;
    avgTime: number; // hour of day
  }[];
  preferredVehicle: string;
  avgFare: number;
  rideCount: number;
  lastRide?: Date;
  usualPlaces: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    timePattern: string; // "every morning", "weekends only"
  }[];
}

export interface Prediction {
  type: 'destination' | 'time' | 'surge' | 'offer' | 'routine';
  title: string;
  message: string;
  action?: {
    label: string;
    type: 'book' | 'schedule' | 'dismiss';
  };
  confidence: number; // 0-100
  icon: string;
  expiresAt?: Date;
}

export class PredictiveSuggestionsService {
  private readonly logger = new Logger('PredictiveSuggestionsService');

  /**
   * Get personalized suggestions for user
   */
  async getSuggestions(userId: string): Promise<Prediction[]> {
    const suggestions: Prediction[] = [];

    // Get time-based suggestions
    suggestions.push(...this.getTimeBasedSuggestions());

    // Get routine suggestions
    suggestions.push(...await this.getRoutineSuggestions(userId));

    // Get surge warnings
    suggestions.push(...this.getSurgeWarnings());

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Predict destination based on time and location
   */
  async predictDestination(userId: string, currentLocation: { lat: number; lng: number }): Promise<{
    predictions: { address: string; lat: number; lng: number; probability: number; type: string }[];
  }> {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    const predictions = [];

    // Morning commute to office
    if (hour >= 7 && hour <= 9) {
      predictions.push({
        address: 'Your Office',
        lat: 12.9352,
        lng: 77.6245,
        probability: 85,
        type: 'office',
      });
    }

    // Evening commute home
    if (hour >= 17 && hour <= 19) {
      predictions.push({
        address: 'Home',
        lat: 12.9352,
        lng: 77.6245,
        probability: 90,
        type: 'home',
      });
    }

    // Weekend entertainment
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      predictions.push({
        address: 'Phoenix Marketcity',
        lat: 12.9352,
        lng: 77.6245,
        probability: 60,
        type: 'mall',
      });
    }

    return { predictions };
  }

  /**
   * Check for routine rides
   */
  async checkRoutineRide(userId: string): Promise<Prediction | null> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Office commute detection
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Weekday
      if (hour >= 8 && hour <= 9) {
        // Morning office commute
        return {
          type: 'routine',
          title: 'Good morning!',
          message: 'Ready for your office commute?',
          action: { label: 'Book Now', type: 'book' },
          confidence: 92,
          icon: 'briefcase',
        };
      }

      if (hour >= 17 && hour <= 18) {
        // Evening home commute
        return {
          type: 'routine',
          title: 'Heading home?',
          message: 'Book your ride home',
          action: { label: 'Book Home', type: 'book' },
          confidence: 94,
          icon: 'home',
        };
      }
    }

    // Weekend plans
    if (dayOfWeek === 6 && hour >= 10 && hour <= 12) {
      return {
        type: 'routine',
        title: 'Weekend plans?',
        message: 'Where to this Saturday?',
        action: { label: 'Book a Ride', type: 'book' },
        confidence: 78,
        icon: 'calendar',
      };
    }

    return null;
  }

  /**
   * Get surge prediction
   */
  async predictSurge(lat: number, lng: number): Promise<{
    isSurge: boolean;
    surgeMultiplier: number;
    reason: string;
    minutesUntilSurge?: number;
    suggestion?: Prediction;
  }> {
    const hour = new Date().getHours();

    // Peak hours prediction
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return {
        isSurge: true,
        surgeMultiplier: 1.3,
        reason: 'Peak commute hours',
        suggestion: {
          type: 'surge',
          title: 'Surge pricing in effect',
          message: 'Book now to avoid higher surge later',
          action: { label: 'Book Now', type: 'book' },
          confidence: 88,
          icon: 'trending-up',
        },
      };
    }

    // Rain prediction (would integrate with weather API)
    const rainChance = randomInt(0, 100) / 100; // Mock 0-1
    if (rainChance > 0.7) {
      return {
        isSurge: true,
        surgeMultiplier: 1.5,
        reason: 'Rain detected in your area',
        minutesUntilSurge: 15,
        suggestion: {
          type: 'surge',
          title: '⛈️ Rain surge incoming',
          message: 'Prices may increase in 15 mins - book now!',
          action: { label: 'Book Now', type: 'book' },
          confidence: 75,
          icon: 'cloud-rain',
        },
      };
    }

    return {
      isSurge: false,
      surgeMultiplier: 1.0,
      reason: 'Normal pricing',
    };
  }

  /**
   * Get contextual offers based on predictions
   */
  async getPredictedOffers(userId: string): Promise<Prediction[]> {
    const offers: Prediction[] = [];
    const hour = new Date().getHours();

    // Morning coffee offer
    if (hour >= 7 && hour <= 9) {
      offers.push({
        type: 'offer',
        title: 'Coffee cashback',
        message: 'Your usual café has 20% cashback',
        confidence: 85,
        icon: 'coffee',
      });
    }

    // Lunch offer
    if (hour >= 12 && hour <= 13) {
      offers.push({
        type: 'offer',
        title: 'Lunch deals',
        message: '20% off at restaurants near you',
        confidence: 80,
        icon: 'restaurant',
      });
    }

    // Evening entertainment
    if (hour >= 18 && hour <= 20) {
      offers.push({
        type: 'offer',
        title: 'Weekend plans?',
        message: 'Movie tickets @ ₹199 only',
        confidence: 72,
        icon: 'film',
      });
    }

    return offers;
  }

  // Private helpers

  private getTimeBasedSuggestions(): Prediction[] {
    const suggestions: Prediction[] = [];
    const hour = new Date().getHours();

    // Early morning
    if (hour >= 5 && hour <= 7) {
      suggestions.push({
        type: 'time',
        title: 'Early bird special',
        message: 'Book early, save more',
        action: { label: 'Book Now', type: 'book' },
        confidence: 70,
        icon: 'sunrise',
      });
    }

    // Late night
    if (hour >= 22 || hour <= 4) {
      suggestions.push({
        type: 'time',
        title: 'Night ride',
        message: 'Safe home, guaranteed',
        action: { label: 'Book Now', type: 'book' },
        confidence: 88,
        icon: 'moon',
      });
    }

    return suggestions;
  }

  private async getRoutineSuggestions(userId: string): Promise<Prediction[]> {
    const suggestions: Prediction[] = [];

    // Check last ride time
    const lastRide = await this.getLastRideTime(userId);
    if (lastRide) {
      const daysSince = Math.floor((Date.now() - lastRide.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince >= 3) {
        suggestions.push({
          type: 'routine',
          title: 'We miss you!',
          message: `It's been ${daysSince} days. Get 10% off your next ride`,
          action: { label: 'Book Now', type: 'book' },
          confidence: 85,
          icon: 'heart',
        });
      }
    }

    return suggestions;
  }

  private getSurgeWarnings(): Prediction[] {
    const warnings: Prediction[] = [];
    const hour = new Date().getHours();

    // Pre-surge warning
    if (hour === 7 || hour === 16 || hour === 19) {
      warnings.push({
        type: 'surge',
        title: '⏰ Surge in 1 hour',
        message: 'Book now to beat the rush',
        action: { label: 'Book Now', type: 'book' },
        confidence: 82,
        icon: 'alert-circle',
      });
    }

    return warnings;
  }

  private async getLastRideTime(userId: string): Promise<Date | null> {
    // Would query database
    return null;
  }
}

export const predictiveSuggestionsService = new PredictiveSuggestionsService();
