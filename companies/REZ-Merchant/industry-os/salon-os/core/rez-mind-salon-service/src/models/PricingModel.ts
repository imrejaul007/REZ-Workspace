/**
 * Pricing ML Model Module
 *
 * This module contains placeholder classes for ML models used in pricing optimization.
 * In production, these would be replaced with trained models (TensorFlow, PyTorch, etc.)
 */

export interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  factors: {
    name: string;
    impact: number;
  }[];
}

export class PricingModel {
  private weights: Map<string, number> = new Map();

  constructor() {
    // Initialize with default weights
    this.weights.set('time_of_day', 0.25);
    this.weights.set('day_of_week', 0.20);
    this.weights.set('seasonality', 0.15);
    this.weights.set('competitor_price', 0.20);
    this.weights.set('demand', 0.20);
  }

  /**
   * Predict optimal price based on input features
   */
  predict(features: {
    basePrice: number;
    timeOfDay: number;
    dayOfWeek: number;
    seasonality: number;
    competitorAvg: number;
    demand: number;
  }): PricePrediction {
    const weights = this.weights;

    // Calculate weighted factors
    let adjustment = 0;
    const factors: { name: string; impact: number }[] = [];

    // Time of day factor (10am-2pm, 5pm-8pm are peak)
    const timeFactor = this.getTimeOfDayFactor(features.timeOfDay);
    adjustment += timeFactor * (weights.get('time_of_day') || 0);
    factors.push({ name: 'time_of_day', impact: timeFactor });

    // Day of week factor (weekends are busier)
    const dowFactor = this.getDayOfWeekFactor(features.dayOfWeek);
    adjustment += dowFactor * (weights.get('day_of_week') || 0);
    factors.push({ name: 'day_of_week', impact: dowFactor });

    // Seasonality factor
    adjustment += features.seasonality * (weights.get('seasonality') || 0);
    factors.push({ name: 'seasonality', impact: features.seasonality });

    // Competitor adjustment
    const competitorDiff = (features.competitorAvg - features.basePrice) / features.basePrice;
    adjustment += competitorDiff * (weights.get('competitor_price') || 0);
    factors.push({ name: 'competitor_price', impact: competitorDiff });

    // Demand factor
    adjustment += features.demand * (weights.get('demand') || 0);
    factors.push({ name: 'demand', impact: features.demand });

    const predictedPrice = features.basePrice * (1 + adjustment);
    const confidence = this.calculateConfidence(factors);

    return {
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      confidence,
      factors,
    };
  }

  private getTimeOfDayFactor(hour: number): number {
    if (hour >= 10 && hour <= 14) return 0.15; // Lunch peak
    if (hour >= 17 && hour <= 20) return 0.20; // Evening peak
    if (hour >= 9 && hour < 10) return -0.10; // Early morning
    if (hour > 14 && hour < 17) return -0.05; // Afternoon lull
    return -0.15; // Off hours
  }

  private getDayOfWeekFactor(day: number): number {
    if (day === 0 || day === 6) return 0.15; // Weekend
    if (day === 5) return 0.10; // Friday
    if (day === 1) return -0.05; // Monday dip
    return 0;
  }

  private calculateConfidence(factors: { name: string; impact: number }[]): number {
    // Simple confidence based on factor variance
    const impacts = factors.map((f) => f.impact);
    const avg = impacts.reduce((a, b) => a + b, 0) / impacts.length;
    const variance =
      impacts.reduce((sum, i) => sum + Math.pow(i - avg, 2), 0) / impacts.length;

    return Math.max(0.5, Math.min(0.95, 0.85 - variance));
  }

  /**
   * Update model weights based on training data
   */
  updateWeights(newWeights: Map<string, number>): void {
    for (const [key, value] of newWeights) {
      this.weights.set(key, value);
    }
  }
}

export const pricingModel = new PricingModel();
