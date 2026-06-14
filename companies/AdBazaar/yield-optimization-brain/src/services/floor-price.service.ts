import {
  FloorPriceRequest,
  FloorPriceResponse,
  UserContext,
} from '../types/index.js';
import { FloorPrice as FloorPriceModel } from '../models/index.js';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

export class FloorPriceService {
  /**
   * Calculate optimal floor price for an inventory slot
   */
  async calculateFloorPrice(request: FloorPriceRequest): Promise<FloorPriceResponse> {
    const { inventoryId, context, eligibleBidderCount = 1 } = request;

    logger.info('Calculating floor price', { inventoryId, eligibleBidderCount });

    try {
      // Gather factors for floor calculation
      const factors = await this.gatherFactors(inventoryId, context, eligibleBidderCount);

      // Calculate base floor price
      let baseFloor = config.yield.floorPrice.defaultFloor;

      // Apply factor adjustments
      let totalWeight = 0;
      let weightedFloor = 0;

      for (const factor of factors) {
        const adjustment = factor.impact * factor.weight;
        baseFloor += adjustment;
        weightedFloor += factor.impact * factor.weight;
        totalWeight += factor.weight;
      }

      // Normalize floor price
      const floorPrice = this.normalizeFloorPrice(baseFloor);

      // Generate recommendations
      const recommendations = this.generateRecommendations(factors, floorPrice);

      // Persist floor price
      await this.persistFloorPrice(inventoryId, floorPrice, factors, eligibleBidderCount);

      logger.info('Floor price calculated', {
        inventoryId,
        floorPrice,
        dynamicFloor: factors.length > 0,
      });

      return {
        inventoryId,
        floorPrice,
        dynamicFloor: factors.length > 0,
        factors,
        recommendations,
      };
    } catch (error) {
      logger.error('Error calculating floor price', {
        inventoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gather factors that affect floor price
   */
  private async gatherFactors(
    inventoryId: string,
    context?: Partial<UserContext>,
    eligibleBidderCount: number
  ): Promise<{ name: string; impact: number; weight: number }[]> {
    const factors: { name: string; impact: number; weight: number }[] = [];

    // 1. Competition factor (more bidders = higher floor)
    if (eligibleBidderCount > 0) {
      const competitionFactor = Math.min(eligibleBidderCount * 0.05, 0.5);
      factors.push({
        name: 'Competition',
        impact: competitionFactor,
        weight: 0.3,
      });
    }

    // 2. Intent score factor
    if (context?.intentScore !== undefined) {
      const intentFactor = (context.intentScore - 0.5) * 0.5;
      factors.push({
        name: 'Intent Score',
        impact: intentFactor,
        weight: 0.25,
      });
    }

    // 3. Segment value factor
    if (context?.segments && context.segments.length > 0) {
      const segmentValue = context.segments.length * 0.02;
      factors.push({
        name: 'Audience Segments',
        impact: segmentValue,
        weight: 0.2,
      });
    }

    // 4. Time-based factor
    if (context?.timeOfDay !== undefined) {
      const hourFactor = this.getTimeOfDayFactor(context.timeOfDay);
      factors.push({
        name: 'Time of Day',
        impact: hourFactor,
        weight: 0.15,
      });
    }

    // 5. Historical performance factor
    const historicalFactor = await this.getHistoricalPerformanceFactor(inventoryId);
    if (historicalFactor !== null) {
      factors.push({
        name: 'Historical Performance',
        impact: historicalFactor,
        weight: 0.1,
      });
    }

    return factors;
  }

  /**
   * Get time-of-day factor (premium hours have higher floors)
   */
  private getTimeOfDayFactor(hour: number): number {
    // Peak hours: 9-11 AM, 2-4 PM, 7-9 PM
    const peakHours = [9, 10, 14, 15, 19, 20, 21];
    const lowHours = [0, 1, 2, 3, 4, 5, 6];

    if (peakHours.includes(hour)) {
      return 0.15;
    } else if (lowHours.includes(hour)) {
      return -0.15;
    }
    return 0;
  }

  /**
   * Get historical performance factor from recent data
   */
  private async getHistoricalPerformanceFactor(inventoryId: string): Promise<number | null> {
    try {
      const recentFloor = await FloorPriceModel
        .findOne({ inventoryId })
        .sort({ timestamp: -1 })
        .lean();

      if (!recentFloor) {
        return null;
      }

      // If last floor was lower, increase current floor
      const defaultFloor = config.yield.floorPrice.defaultFloor;
      const diff = recentFloor.floorPrice - defaultFloor;

      return Math.min(Math.max(diff * 0.1, -0.2), 0.2);
    } catch {
      return null;
    }
  }

  /**
   * Normalize floor price to valid range
   */
  private normalizeFloorPrice(price: number): number {
    const { minFloor, maxFloor, defaultFloor } = config.yield.floorPrice;

    // Apply dynamic multiplier for inventory that's performing well
    let normalized = price;

    // Ensure within bounds
    normalized = Math.max(minFloor, Math.min(maxFloor, normalized));

    // Round to 2 decimal places
    return Math.round(normalized * 100) / 100;
  }

  /**
   * Generate recommendations based on factors
   */
  private generateRecommendations(
    factors: { name: string; impact: number; weight: number }[],
    floorPrice: number
  ): { action: string; expectedLift: number }[] {
    const recommendations: { action: string; expectedLift: number }[] = [];

    // Analyze each factor
    for (const factor of factors) {
      if (factor.impact > 0.1) {
        if (factor.name === 'Competition') {
          recommendations.push({
            action: 'Increase floor price slightly - high competition detected',
            expectedLift: factor.impact * 100,
          });
        } else if (factor.name === 'Intent Score') {
          recommendations.push({
            action: 'Premium audience detected - consider raising floor by 10-15%',
            expectedLift: 0.1,
          });
        }
      } else if (factor.impact < -0.1) {
        recommendations.push({
          action: `Consider lowering floor for ${factor.name} - below average performance`,
          expectedLift: factor.impact * 50,
        });
      }
    }

    // Always add a dynamic floor recommendation if factors are strong
    const totalImpact = factors.reduce((sum, f) => sum + Math.abs(f.impact), 0);
    if (totalImpact > 0.3) {
      recommendations.push({
        action: 'Enable dynamic floor pricing for this inventory',
        expectedLift: 0.15,
      });
    }

    return recommendations;
  }

  /**
   * Persist floor price to database
   */
  private async persistFloorPrice(
    inventoryId: string,
    floorPrice: number,
    factors: { name: string; impact: number; weight: number }[],
    eligibleBidders: number
  ): Promise<void> {
    try {
      const doc = new FloorPriceModel({
        inventoryId,
        inventoryType: 'dynamic',
        context: 'current',
        floorPrice,
        dynamic: factors.length > 0,
        factors,
        eligibleBidders,
        timestamp: new Date(),
      });

      await doc.save();
    } catch (error) {
      logger.error('Failed to persist floor price', {
        inventoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get floor price history for an inventory
   */
  async getFloorPriceHistory(
    inventoryId: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100
  ): Promise<FloorPriceResponse[]> {
    const query: Record<string, unknown> = { inventoryId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        (query.timestamp as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (query.timestamp as Record<string, Date>).$lte = endDate;
      }
    }

    const docs = await FloorPriceModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return docs.map(doc => ({
      inventoryId: doc.inventoryId,
      floorPrice: doc.floorPrice,
      dynamicFloor: doc.dynamic,
      factors: doc.factors,
      recommendations: [],
    }));
  }

  /**
   * Get current floor price for an inventory (cached)
   */
  async getCurrentFloorPrice(inventoryId: string): Promise<number> {
    try {
      const doc = await FloorPriceModel
        .findOne({ inventoryId })
        .sort({ timestamp: -1 })
        .lean();

      return doc?.floorPrice || config.yield.floorPrice.defaultFloor;
    } catch {
      return config.yield.floorPrice.defaultFloor;
    }
  }
}

export const floorPriceService = new FloorPriceService();