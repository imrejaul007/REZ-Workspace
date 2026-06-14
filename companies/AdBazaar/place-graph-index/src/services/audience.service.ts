import { Place } from '../models/place.model.js';
import { AudienceEstimate, Demographics } from '../types/index.js';
import { cacheService } from './cache.service.js';

export class AudienceService {
  /**
   * Get estimated audience at a location
   */
  async getAudienceEstimate(placeId: string): Promise<AudienceEstimate | null> {
    const cacheKey = `places:audience:${placeId}`;
    const cached = await cacheService.get<AudienceEstimate>(cacheKey);
    if (cached) {
      return cached;
    }

    const place = await Place.findByPlaceId(placeId);
    if (!place) {
      return null;
    }

    const estimate = this.calculateAudienceEstimate(place);
    await cacheService.set(cacheKey, estimate, 1800); // 30 minutes TTL

    return estimate;
  }

  /**
   * Calculate audience estimate based on place attributes
   */
  private calculateAudienceEstimate(place: InstanceType<typeof Place>): AudienceEstimate {
    const baseVisitorCount = place.attributes?.visitorCount || this.getDefaultVisitorCount(place.type);
    const demographics = place.audienceProfile?.demographics || this.getDefaultDemographics(place.type);
    const peakHours = place.audienceProfile?.visitorPatterns?.peakHours || this.getDefaultPeakHours(place.type);

    // Calculate daily/monthly estimates
    const seasonalFactor = this.getSeasonalFactor(place.audienceProfile?.visitorPatterns?.seasonalTrends || []);
    const dailyEstimate = Math.round(baseVisitorCount * seasonalFactor);
    const monthlyEstimate = Math.round(dailyEstimate * 30);

    // Calculate peak time distribution
    const peakTimes = this.calculatePeakTimes(peakHours, dailyEstimate);

    // Calculate reachability scores
    const reachability = this.calculateReachability(place.type, place.address?.city || '');

    return {
      placeId: place.placeId,
      placeName: place.name,
      estimatedDaily: dailyEstimate,
      estimatedMonthly: monthlyEstimate,
      demographics,
      peakTimes,
      reachability,
    };
  }

  /**
   * Get default visitor count based on place type
   */
  private getDefaultVisitorCount(type: string): number {
    const defaults: Record<string, number> = {
      mall: 5000,
      airport: 15000,
      hospital: 3000,
      hotel: 500,
      school: 2000,
      office: 1000,
      restaurant: 300,
      retail: 500,
      event_venue: 10000,
      transit: 20000,
    };
    return defaults[type] || 1000;
  }

  /**
   * Get default demographics based on place type
   */
  private getDefaultDemographics(type: string): Demographics {
    const defaults: Record<string, Demographics> = {
      mall: {
        ageGroups: { '18-24': 30, '25-34': 35, '35-44': 20, '45+': 15 },
        genderSplit: { male: 45, female: 55 },
        incomeLevel: 'upper-middle',
      },
      airport: {
        ageGroups: { '18-24': 15, '25-34': 35, '35-44': 30, '45+': 20 },
        genderSplit: { male: 55, female: 45 },
        incomeLevel: 'high',
      },
      hospital: {
        ageGroups: { '0-17': 15, '18-24': 10, '25-44': 35, '45-64': 25, '65+': 15 },
        genderSplit: { male: 48, female: 52 },
        incomeLevel: 'middle',
      },
      hotel: {
        ageGroups: { '18-24': 20, '25-34': 40, '35-44': 25, '45+': 15 },
        genderSplit: { male: 60, female: 40 },
        incomeLevel: 'high',
      },
      school: {
        ageGroups: { '5-12': 40, '13-17': 35, '18+': 25 },
        genderSplit: { male: 50, female: 50 },
        incomeLevel: 'middle',
      },
      office: {
        ageGroups: { '18-24': 20, '25-34': 40, '35-44': 30, '45+': 10 },
        genderSplit: { male: 55, female: 45 },
        incomeLevel: 'upper-middle',
      },
      restaurant: {
        ageGroups: { '18-24': 25, '25-34': 35, '35-44': 25, '45+': 15 },
        genderSplit: { male: 50, female: 50 },
        incomeLevel: 'middle',
      },
      retail: {
        ageGroups: { '18-24': 20, '25-34': 30, '35-44': 25, '45+': 25 },
        genderSplit: { male: 40, female: 60 },
        incomeLevel: 'middle',
      },
      event_venue: {
        ageGroups: { '18-24': 30, '25-34': 35, '35-44': 25, '45+': 10 },
        genderSplit: { male: 55, female: 45 },
        incomeLevel: 'middle',
      },
      transit: {
        ageGroups: { '18-24': 25, '25-34': 35, '35-44': 25, '45+': 15 },
        genderSplit: { male: 55, female: 45 },
        incomeLevel: 'middle',
      },
    };
    return defaults[type] || {
      ageGroups: { '18-24': 25, '25-34': 35, '35-44': 25, '45+': 15 },
      genderSplit: { male: 50, female: 50 },
      incomeLevel: 'middle',
    };
  }

  /**
   * Get default peak hours based on place type
   */
  private getDefaultPeakHours(type: string): string[] {
    const defaults: Record<string, string[]> = {
      mall: ['10:00-12:00', '14:00-16:00', '18:00-20:00'],
      airport: ['06:00-08:00', '12:00-14:00', '18:00-20:00'],
      hospital: ['09:00-11:00', '14:00-16:00'],
      hotel: ['07:00-09:00', '12:00-14:00', '19:00-21:00'],
      school: ['08:00-09:00', '15:00-16:00'],
      office: ['09:00-11:00', '14:00-16:00'],
      restaurant: ['12:00-14:00', '19:00-21:00'],
      retail: ['10:00-12:00', '16:00-19:00'],
      event_venue: ['18:00-21:00'],
      transit: ['08:00-09:00', '18:00-19:00'],
    };
    return defaults[type] || ['10:00-12:00', '14:00-16:00'];
  }

  /**
   * Get seasonal factor based on trends
   */
  private getSeasonalFactor(trends: string[]): number {
    if (trends.length === 0) {
      return 1.0;
    }

    const currentMonth = new Date().getMonth();
    const seasonalMultipliers: Record<string, number> = {
      'peak-summer': currentMonth >= 4 && currentMonth <= 6 ? 1.3 : 1.0,
      'peak-winter': currentMonth >= 10 || currentMonth <= 1 ? 1.2 : 1.0,
      'festival': 1.5,
      'holiday': 1.4,
      'off-season': 0.7,
    };

    let factor = 1.0;
    for (const trend of trends) {
      factor *= seasonalMultipliers[trend] || 1.0;
    }

    return Math.min(factor, 2.0); // Cap at 2x
  }

  /**
   * Calculate peak time distribution
   */
  private calculatePeakTimes(peakHours: string[], totalDaily: number): AudienceEstimate['peakTimes'] {
    const distribution: Record<string, number> = {
      morning: 0.2,    // 6am-12pm
      afternoon: 0.3,  // 12pm-6pm
      evening: 0.4,    // 6pm-10pm
      night: 0.1,     // 10pm-6am
    };

    // Adjust based on peak hours
    for (const hour of peakHours) {
      const startHour = parseInt(hour.split(':')[0], 10);
      if (startHour >= 6 && startHour < 12) {
        distribution.morning += 0.1;
        distribution.evening -= 0.1;
      } else if (startHour >= 12 && startHour < 18) {
        distribution.afternoon += 0.15;
        distribution.night -= 0.05;
      } else if (startHour >= 18 && startHour < 22) {
        distribution.evening += 0.15;
        distribution.morning -= 0.1;
      }
    }

    // Normalize to total 1.0
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(distribution)) {
      distribution[key] = distribution[key] / total;
    }

    return {
      morning: Math.round(totalDaily * distribution.morning),
      afternoon: Math.round(totalDaily * distribution.afternoon),
      evening: Math.round(totalDaily * distribution.evening),
      night: Math.round(totalDaily * distribution.night),
    };
  }

  /**
   * Calculate reachability scores
   */
  private calculateReachability(
    type: string,
    city: string
  ): AudienceEstimate['reachability'] {
    const baseScores: Record<string, { transit: number; parking: number; accessibility: number }> = {
      mall: { transit: 8, parking: 7, accessibility: 9 },
      airport: { transit: 10, parking: 6, accessibility: 8 },
      hospital: { transit: 9, parking: 5, accessibility: 10 },
      hotel: { transit: 7, parking: 8, accessibility: 9 },
      school: { transit: 8, parking: 4, accessibility: 9 },
      office: { transit: 9, parking: 5, accessibility: 8 },
      restaurant: { transit: 7, parking: 6, accessibility: 8 },
      retail: { transit: 8, parking: 7, accessibility: 9 },
      event_venue: { transit: 7, parking: 6, accessibility: 7 },
      transit: { transit: 10, parking: 3, accessibility: 8 },
    };

    const scores = baseScores[type] || { transit: 7, parking: 6, accessibility: 8 };

    // Adjust for metro cities
    const metroCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad'];
    if (metroCities.includes(city.toLowerCase())) {
      scores.transit = Math.min(10, scores.transit + 2);
      scores.parking = Math.max(1, scores.parking - 1);
    }

    return {
      transitScore: scores.transit,
      parkingScore: scores.parking,
      accessibilityScore: scores.accessibility,
    };
  }

  /**
   * Get audience comparison across multiple places
   */
  async compareAudience(placeIds: string[]): Promise<AudienceEstimate[]> {
    const estimates: AudienceEstimate[] = [];

    for (const placeId of placeIds) {
      const estimate = await this.getAudienceEstimate(placeId);
      if (estimate) {
        estimates.push(estimate);
      }
    }

    return estimates;
  }

  /**
   * Get audience summary for a region
   */
  async getRegionAudienceSummary(city: string): Promise<{
    totalDailyReach: number;
    totalMonthlyReach: number;
    topTypes: Array<{ type: string; count: number; reach: number }>;
    demographics: Demographics;
  }> {
    const cacheKey = `places:audience:region:${city}`;
    const cached = await cacheService.get<{
      totalDailyReach: number;
      totalMonthlyReach: number;
      topTypes: Array<{ type: string; count: number; reach: number }>;
      demographics: Demographics;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const places = await Place.find({ 'address.city': city, status: 'active' });

    let totalDailyReach = 0;
    const typeStats: Record<string, { count: number; reach: number }> = {};
    const aggregatedDemographics: Demographics = {
      ageGroups: {},
      genderSplit: { male: 0, female: 0 },
      incomeLevel: 'middle',
    };

    for (const place of places) {
      const estimate = this.calculateAudienceEstimate(place);
      totalDailyReach += estimate.estimatedDaily;

      if (!typeStats[place.type]) {
        typeStats[place.type] = { count: 0, reach: 0 };
      }
      typeStats[place.type].count++;
      typeStats[place.type].reach += estimate.estimatedDaily;

      // Aggregate demographics
      for (const [age, pct] of Object.entries(estimate.demographics.ageGroups)) {
        aggregatedDemographics.ageGroups[age] = (aggregatedDemographics.ageGroups[age] || 0) + pct;
      }
      aggregatedDemographics.genderSplit.male += estimate.demographics.genderSplit.male;
      aggregatedDemographics.genderSplit.female += estimate.demographics.genderSplit.female;
    }

    // Average demographics
    if (places.length > 0) {
      for (const age of Object.keys(aggregatedDemographics.ageGroups)) {
        aggregatedDemographics.ageGroups[age] = Math.round(
          aggregatedDemographics.ageGroups[age] / places.length
        );
      }
      aggregatedDemographics.genderSplit.male = Math.round(
        aggregatedDemographics.genderSplit.male / places.length
      );
      aggregatedDemographics.genderSplit.female = Math.round(
        100 - aggregatedDemographics.genderSplit.male
      );
    }

    const topTypes = Object.entries(typeStats)
      .map(([type, stats]) => ({ type, count: stats.count, reach: stats.reach }))
      .sort((a, b) => b.reach - a.reach)
      .slice(0, 5);

    const result = {
      totalDailyReach,
      totalMonthlyReach: totalDailyReach * 30,
      topTypes,
      demographics: aggregatedDemographics,
    };

    await cacheService.set(cacheKey, result, 3600); // 1 hour TTL

    return result;
  }
}

export const audienceService = new AudienceService();
export default audienceService;