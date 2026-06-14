import { ISportsEventDocument } from '../models/sports-event.model.js';
import { FootfallPrediction, EventImpactQuery } from '../types/index.js';
import { placeGraphService } from './ecosystem.service.js';
import logger from '../config/logger.js';
import { footfallPredictionTotal } from '../config/metrics.js';

interface MerchantImpact {
  category: string;
  expectedIncrease: number;
  peakHours: number[];
}

interface NearbyMerchantCount {
  restaurants: number;
  bars: number;
  hotels: number;
  retail: number;
  entertainment: number;
}

export class FootfallPredictionService {
  /**
   * Predict footfall for a sports event based on venue capacity and historical data
   */
  predictFootfall(event: ISportsEventDocument): FootfallPrediction {
    const baseCapacity = event.venue.capacity;
    const expectedFootfall = event.expectedFootfall || this.calculateExpectedFootfall(event);

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(event);

    // Generate peak hours based on event time
    const peakHours = this.generatePeakHours(event);

    // Calculate merchant impact
    const nearbyMerchantImpact = this.calculateMerchantImpact(expectedFootfall);

    const prediction: FootfallPrediction = {
      eventId: event._id.toString(),
      predictedCrowd: expectedFootfall,
      confidence,
      peakHours,
      nearbyMerchantImpact,
      calculatedAt: new Date().toISOString()
    };

    footfallPredictionTotal.inc({ event_type: event.sport });
    logger.info('Footfall prediction generated', {
      eventId: event._id,
      predictedCrowd: expectedFootfall,
      confidence
    });

    return prediction;
  }

  /**
   * Calculate expected footfall based on venue and event characteristics
   */
  private calculateExpectedFootfall(event: ISportsEventDocument): number {
    let multiplier = 1.0;

    // Cricket events typically have higher attendance
    if (event.sport === 'cricket') {
      multiplier = 0.85; // 85% of capacity
    } else if (event.sport === 'football') {
      multiplier = 0.75; // 75% of capacity
    } else if (event.sport === 'tennis' || event.sport === 'badminton') {
      multiplier = 0.60; // 60% of capacity
    } else {
      multiplier = 0.70; // 70% default
    }

    // Tournament finals often have higher attendance
    if (event.metadata?.isFinal) {
      multiplier *= 1.15;
    }

    // IPL/major tournaments have higher draw
    if (event.tournament?.toLowerCase().includes('ipl') ||
        event.tournament?.toLowerCase().includes('world cup')) {
      multiplier *= 1.1;
    }

    return Math.round(baseCapacity * multiplier);
  }

  /**
   * Calculate confidence score based on data availability
   */
  private calculateConfidence(event: ISportsEventDocument): number {
    let score = 0.5; // Base score

    // Known expected footfall increases confidence
    if (event.expectedFootfall) score += 0.2;

    // Historical data in metadata
    if (event.metadata?.historicalAttendance) score += 0.15;

    // TV broadcast rights indicate popularity
    if (event.broadcastChannels && event.broadcastChannels.length > 0) score += 0.1;

    // Prize pool indicates importance
    if (event.prizePool && event.prizePool > 10000000) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Generate peak hours based on event timing
   */
  private generatePeakHours(event: ISportsEventDocument): { hour: number; expectedCount: number }[] {
    const eventDate = new Date(event.startDate);
    const eventHour = eventDate.getHours();
    const peaks: { hour: number; expectedCount: number }[] = [];

    // Pre-event rush (2-3 hours before)
    for (let i = 3; i >= 1; i--) {
      const hour = (eventHour - i + 24) % 24;
      peaks.push({
        hour,
        expectedCount: Math.round(0.3 * this.calculateExpectedFootfall(event) / 3)
      });
    }

    // During event peak
    peaks.push({
      hour: eventHour,
      expectedCount: this.calculateExpectedFootfall(event)
    });

    // Post-event (1-2 hours after)
    for (let i = 1; i <= 2; i++) {
      const hour = (eventHour + i) % 24;
      peaks.push({
        hour,
        expectedCount: Math.round(0.5 * this.calculateExpectedFootfall(event) / 2)
      });
    }

    return peaks;
  }

  /**
   * Calculate merchant impact based on expected footfall
   */
  private calculateMerchantImpact(
    expectedFootfall: number
  ): FootfallPrediction['nearbyMerchantImpact'] {
    // Base percentages of crowd that might visit each merchant type
    const restaurantRate = 0.35; // 35% of crowd
    const barRate = 0.20; // 20% of crowd
    const hotelRate = 0.15; // 15% of crowd
    const retailRate = 0.40; // 40% of crowd

    return {
      restaurants: {
        expectedIncrease: Math.round(expectedFootfall * restaurantRate),
        peakHours: [17, 18, 19, 20, 21] // Dinner hours
      },
      bars: {
        expectedIncrease: Math.round(expectedFootfall * barRate),
        peakHours: [18, 19, 20, 21, 22] // Evening hours
      },
      hotels: {
        expectedIncrease: Math.round(expectedFootfall * hotelRate),
        peakHours: [14, 15, 16, 17, 18] // Afternoon check-in
      },
      retail: {
        expectedIncrease: Math.round(expectedFootfall * retailRate),
        peakHours: [10, 11, 12, 13, 14, 15, 16, 17] // All day
      }
    };
  }

  /**
   * Get impact on nearby merchants for an event
   */
  async getEventImpact(
    event: ISportsEventDocument,
    query: EventImpactQuery = {}
  ): Promise<{
    event: ISportsEventDocument;
    prediction: FootfallPrediction;
    nearbyMerchants: NearbyMerchantCount;
    impactByCategory: MerchantImpact[];
  }> {
    const radiusKm = query.radiusKm || 5;

    // Get nearby places from place graph service
    const nearbyPlaces = await placeGraphService.getNearbyPlaces(
      event.venue.latitude,
      event.venue.longitude,
      radiusKm
    );

    // Count merchants by category
    const merchantCounts = this.countMerchantsByCategory(nearbyPlaces);

    // Generate footfall prediction
    const prediction = this.predictFootfall(event);

    // Calculate impact by category
    const impactByCategory = this.calculateImpactByCategory(
      prediction.nearbyMerchantImpact,
      merchantCounts
    );

    logger.info('Event impact calculated', {
      eventId: event._id,
      radiusKm,
      totalMerchants: nearbyPlaces.length
    });

    return {
      event,
      prediction,
      nearbyMerchants: merchantCounts,
      impactByCategory
    };
  }

  /**
   * Count merchants by category from nearby places
   */
  private countMerchantsByCategory(
    places: { category: string }[]
  ): NearbyMerchantCount {
    const counts: NearbyMerchantCount = {
      restaurants: 0,
      bars: 0,
      hotels: 0,
      retail: 0,
      entertainment: 0
    };

    for (const place of places) {
      const category = place.category.toLowerCase();
      if (category.includes('restaurant') || category.includes('food')) {
        counts.restaurants++;
      } else if (category.includes('bar') || category.includes('pub')) {
        counts.bars++;
      } else if (category.includes('hotel')) {
        counts.hotels++;
      } else if (category.includes('retail') || category.includes('shop')) {
        counts.retail++;
      } else if (category.includes('entertainment')) {
        counts.entertainment++;
      }
    }

    return counts;
  }

  /**
   * Calculate impact for each merchant category
   */
  private calculateImpactByCategory(
    merchantImpact: FootfallPrediction['nearbyMerchantImpact'],
    merchantCounts: NearbyMerchantCount
  ): MerchantImpact[] {
    const impacts: MerchantImpact[] = [];

    const categoryMapping: { key: keyof typeof merchantImpact; countKey: keyof NearbyMerchantCount }[] = [
      { key: 'restaurants', countKey: 'restaurants' },
      { key: 'bars', countKey: 'bars' },
      { key: 'hotels', countKey: 'hotels' },
      { key: 'retail', countKey: 'retail' }
    ];

    for (const { key, countKey } of categoryMapping) {
      const count = merchantCounts[countKey];
      if (count > 0) {
        impacts.push({
          category: key,
          expectedIncrease: Math.round(merchantImpact[key].expectedIncrease / count),
          peakHours: merchantImpact[key].peakHours
        });
      }
    }

    return impacts;
  }
}

export const footfallPredictionService = new FootfallPredictionService();