import { Injectable, Logger } from '@nestjs/common';

/**
 * Predictive Demand Engine
 * Uses ReZ Intelligence for demand forecasting
 */

export interface DemandPrediction {
  zoneId: string;
  zoneName: string;
  predictions: HourlyPrediction[];
  confidence: number;
  factors: DemandFactor[];
}

export interface HourlyPrediction {
  hour: number;
  predictedDemand: number;
  confidence: number;
  surge: number;
  driversNeeded: number;
  supplyForecast: number;
}

export interface DemandFactor {
  type: string;
  impact: number; // -1 to +1
  description: string;
}

@Injectable()
export class PredictiveDemandService {
  private readonly logger = new Logger(PredictiveDemandService.name);

  // Historical patterns (from ReZ Intelligence)
  private readonly DEMAND_PATTERNS = {
    weekday: [0.1, 0.05, 0.05, 0.05, 0.1, 0.3, 0.7, 0.9, 1.0, 0.9, 0.8, 0.9, 1.0, 0.8, 0.7, 0.8, 1.0, 1.2, 1.5, 1.3, 1.0, 0.8, 0.5, 0.3, 0.2],
    weekend: [0.1, 0.05, 0.05, 0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 0.9, 0.9, 0.8, 0.7, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.7, 0.5, 0.4, 0.3, 0.2],
  };

  constructor() {}

  // ===========================================
  // DEMAND PREDICTION
  // ===========================================

  /**
   * Predict demand for zone
   */
  async predictDemand(
    zoneId: string,
    date?: Date
  ): Promise<DemandPrediction> {
    const targetDate = date || new Date();
    const dayOfWeek = targetDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Get base pattern
    const pattern = isWeekend ? this.DEMAND_PATTERNS.weekend : this.DEMAND_PATTERNS.weekday;

    // Get weather factor
    const weatherFactor = await this.getWeatherFactor();

    // Get event factor
    const eventFactor = await this.getEventFactor(targetDate);

    // Get historical demand data
    const historicalBase = await this.getHistoricalDemand(zoneId);

    // Generate hourly predictions
    const predictions: HourlyPrediction[] = [];
    let totalDemand = 0;

    for (let hour = 0; hour < 24; hour++) {
      const baseDemand = pattern[hour] * historicalBase * weatherFactor * eventFactor;
      const surge = this.calculateSurge(baseDemand, hour);
      const driversNeeded = Math.ceil(baseDemand * 1.2);
      const supplyForecast = await this.forecastSupply(zoneId, hour);

      predictions.push({
        hour,
        predictedDemand: Math.round(baseDemand),
        confidence: hour >= 8 && hour <= 21 ? 0.85 : 0.70,
        surge,
        driversNeeded,
        supplyForecast,
      });

      totalDemand += baseDemand;
    }

    // Calculate factors
    const factors = this.identifyDemandFactors(targetDate, weatherFactor, eventFactor);

    return {
      zoneId,
      zoneName: this.getZoneName(zoneId),
      predictions,
      confidence: 0.85,
      factors,
    };
  }

  // ===========================================
  // WEATHER INTEGRATION
  // ===========================================

  private async getWeatherFactor(): Promise<number> {
    // In production, call weather API
    // Call ReZ Intelligence for weather prediction
    const hour = new Date().getHours();

    // Mock weather patterns
    if (hour >= 6 && hour <= 9 && new Date().getMonth() >= 5 && new Date().getMonth() <= 8) {
      return 1.3; // Rainy season morning
    }

    return 1.0; // Normal
  }

  // ===========================================
  // EVENTS INTEGRATION
  // ===========================================

  private async getEventFactor(date: Date): Promise<number> {
    // Check for events (from ReZ Intelligence calendar)
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    // Fridays and Saturdays +1.2
    if (dayOfWeek === 5 || dayOfWeek === 6) return 1.2;

    // Payday (1st and 15th)
    if (day === 1 || day === 15) return 1.15;

    // Festival days
    if (month === 9 && day >= 20 && day <= 30) return 1.5; // Diwali
    if (month === 10 && day >= 1 && day <= 5) return 1.5; // Diwali continuation

    // Monday after long weekend -0.8
    if (dayOfWeek === 1) return 0.8;

    return 1.0;
  }

  // ===========================================
  // HISTORICAL DATA
  // ===========================================

  private async getHistoricalDemand(zoneId: string): Promise<number> {
    // In production, query ReZ Intelligence for historical data
    // Mock base demand per hour for zone
    return 50; // 50 rides per hour baseline
  }

  // ===========================================
  // SURGE CALCULATION
  // ===========================================

  private calculateSurge(demand: number, hour: number): number {
    const supply = 40; // Mock base supply

    const ratio = demand / supply;

    if (ratio >= 3) return 2.0;
    if (ratio >= 2.5) return 1.75;
    if (ratio >= 2.0) return 1.5;
    if (ratio >= 1.5) return 1.25;
    if (ratio >= 1.2) return 1.1;

    return 1.0;
  }

  private async forecastSupply(zoneId: string, hour: number): Promise<number> {
    // In production, use ML model from ReZ Intelligence
    // Forecast available drivers based on historical patterns
    const pattern = [20, 10, 5, 5, 10, 30, 50, 70, 80, 75, 70, 75, 80, 70, 65, 70, 80, 90, 85, 70, 50, 40, 30, 25, 20];

    return pattern[hour] || 40;
  }

  // ===========================================
  // DEMAND FACTORS
  // ===========================================

  private identifyDemandFactors(
    date: Date,
    weather: number,
    events: number
  ): DemandFactor[] {
    const factors: DemandFactor[] = [];
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Time of day
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      factors.push({
        type: 'peak_hours',
        impact: 0.3,
        description: 'Peak commute hours',
      });
    }

    // Weather
    if (weather > 1.1) {
      factors.push({
        type: 'weather',
        impact: 0.2,
        description: 'Rainy/foul weather increases demand',
      });
    }

    // Events
    if (events > 1.1) {
      factors.push({
        type: 'events',
        impact: 0.2,
        description: 'Special occasion or festival',
      });
    }

    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      factors.push({
        type: 'weekend',
        impact: 0.1,
        description: 'Weekend leisure trips',
      });
    }

    return factors;
  }

  private getZoneName(zoneId: string): string {
    const names: Record<string, string> = {
      'zone_bangalore_mg_road': 'MG Road',
      'zone_bangalore_koramangala': 'Koramangala',
      'zone_bangalore_indiranagar': 'Indiranagar',
      'zone_bangalore_whitefield': 'Whitefield',
    };

    return names[zoneId] || 'Central Zone';
  }

  // ===========================================
  // PREEMPTIVE DISPATCH
  // ===========================================

  /**
   * Suggest preemptive driver dispatch
   */
  async suggestPreemptiveDispatch(zoneId: string): Promise<{
    suggestion: string;
    driversNeeded: number;
    confidence: number;
  }> {
    const prediction = await this.predictDemand(zoneId);
    const currentHour = new Date().getHours();

    const currentPrediction = prediction.predictions[currentHour];
    const nextHourPrediction = prediction.predictions[currentHour + 1] || currentPrediction;

    const demandIncrease = nextHourPrediction.predictedDemand - currentPrediction.predictedDemand;
    const supplyGap = nextHourPrediction.driversNeeded - currentPrediction.supplyForecast;

    if (supplyGap > 5) {
      return {
        suggestion: `Dispatch ${supplyGap} more drivers to ${prediction.zoneName}`,
        driversNeeded: supplyGap,
        confidence: 0.85,
      };
    }

    return {
      suggestion: 'Supply adequate for predicted demand',
      driversNeeded: 0,
      confidence: 0.90,
    };
  }

  // ===========================================
  // ZONE COMPARISON
  // ===========================================

  /**
   * Compare demand across zones
   */
  async compareZones(): Promise<{
    zones: {
      zoneId: string;
      zoneName: string;
      demand: number;
      supply: number;
      ratio: number;
      surge: number;
    }[];
  }> {
    const zones = ['zone_1', 'zone_2', 'zone_3'];

    const comparisons = [];

    for (const zoneId of zones) {
      const prediction = await this.predictDemand(zoneId);
      const currentHour = new Date().getHours();
      const current = prediction.predictions[currentHour];

      comparisons.push({
        zoneId,
        zoneName: this.getZoneName(zoneId),
        demand: current.predictedDemand,
        supply: current.supplyForecast,
        ratio: current.predictedDemand / current.supplyForecast,
        surge: current.surge,
      });
    }

    return { zones: comparisons };
  }
}
