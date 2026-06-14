import { FloorPrice, IFloorPrice, FloorHistory } from '../models';
import { createLogger } from 'utils/logger.js';
import { floorPricingMetrics } from '../utils/metrics';
import { config } from '../config';
import { z } from 'zod';
import mongoose from 'mongoose';

const logger = createLogger('FloorService');

// Zod schemas for validation
export const CreateFloorSchema = z.object({
  inventoryId: z.string().min(1),
  price: z.number().min(config.floorPricing.minFloorPrice).max(config.floorPricing.maxFloorPrice),
  currency: z.string().default('INR'),
  type: z.enum(['fixed', 'dynamic', 'market', 'competitor', 'ai_optimized']),
  status: z.enum(['active', 'inactive', 'pending', 'archived']).default('pending'),
  effectiveDate: z.string().datetime().or(z.date()),
  expirationDate: z.string().datetime().optional(),
  constraints: z.object({
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    maxDailyChange: z.number().optional(),
    timeWindows: z.array(z.object({
      start: z.string(),
      end: z.string(),
      priceModifier: z.number().optional()
    })).optional()
  }).optional(),
  metadata: z.object({
    createdBy: z.string(),
    source: z.string().default('manual'),
    campaignId: z.string().optional(),
    advertiserId: z.string().optional(),
    priority: z.number().optional()
  })
});

export const UpdateFloorSchema = z.object({
  price: z.number().min(config.floorPricing.minFloorPrice).max(config.floorPricing.maxFloorPrice).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'archived']).optional(),
  effectiveDate: z.string().datetime().or(z.date()).optional(),
  expirationDate: z.string().datetime().or(z.date()).optional(),
  constraints: z.object({
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    maxDailyChange: z.number().optional(),
    timeWindows: z.array(z.object({
      start: z.string(),
      end: z.string(),
      priceModifier: z.number().optional()
    })).optional()
  }).optional()
});

export type CreateFloorInput = z.infer<typeof CreateFloorSchema>;
export type UpdateFloorInput = z.infer<typeof UpdateFloorSchema>;

export class FloorService {
  /**
   * Create a new floor price
   */
  async createFloor(input: CreateFloorInput): Promise<IFloorPrice> {
    logger.info('Creating floor price', { inventoryId: input.inventoryId, price: input.price });

    try {
      const floor = new FloorPrice({
        ...input,
        effectiveDate: new Date(input.effectiveDate),
        expirationDate: input.expirationDate ? new Date(input.expirationDate) : undefined
      });

      await floor.save();
      floorPricingMetrics.activeFloorsGauge.inc({ type: input.type, status: input.status });
      floorPricingMetrics.currentFloorPrices.set({ inventory_id: input.inventoryId, type: input.type }, input.price);
      floorPricingMetrics.floorOperationsTotal.inc({ operation: 'create', status: 'success' });

      logger.info('Floor price created', { floorId: floor._id, inventoryId: input.inventoryId });
      return floor;
    } catch (error) {
      floorPricingMetrics.floorOperationsTotal.inc({ operation: 'create', status: 'error' });
      logger.error('Failed to create floor price', { error, inventoryId: input.inventoryId });
      throw error;
    }
  }

  /**
   * Get floor by inventory ID
   */
  async getFloorByInventoryId(inventoryId: string): Promise<IFloorPrice | null> {
    logger.debug('Getting floor by inventory ID', { inventoryId });

    const floor = await FloorPrice.findOne({
      inventoryId,
      status: 'active',
      effectiveDate: { $lte: new Date() },
      $or: [
        { expirationDate: { $exists: false } },
        { expirationDate: { $gt: new Date() } }
      ]
    }).sort({ effectiveDate: -1 });

    return floor;
  }

  /**
   * Get floor by ID
   */
  async getFloorById(floorId: string): Promise<IFloorPrice | null> {
    logger.debug('Getting floor by ID', { floorId });

    if (!mongoose.Types.ObjectId.isValid(floorId)) {
      return null;
    }

    return FloorPrice.findById(floorId);
  }

  /**
   * List all floors with pagination
   */
  async listFloors(options: {
    status?: string;
    type?: string;
    inventoryId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ floors: IFloorPrice[]; total: number; page: number; limit: number }> {
    const { status, type, inventoryId, page = 1, limit = 20 } = options;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (inventoryId) query.inventoryId = inventoryId;

    const skip = (page - 1) * limit;

    const [floors, total] = await Promise.all([
      FloorPrice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FloorPrice.countDocuments(query)
    ]);

    return { floors, total, page, limit };
  }

  /**
   * Update floor price
   */
  async updateFloor(floorId: string, input: UpdateFloorInput, updatedBy: string): Promise<IFloorPrice | null> {
    logger.info('Updating floor price', { floorId, input });

    try {
      const floor = await FloorPrice.findById(floorId);
      if (!floor) {
        logger.warn('Floor not found', { floorId });
        return null;
      }

      const previousPrice = floor.price;

      // Apply updates
      if (input.price !== undefined) floor.price = input.price;
      if (input.status !== undefined) floor.status = input.status;
      if (input.effectiveDate !== undefined) floor.effectiveDate = new Date(input.effectiveDate);
      if (input.expirationDate !== undefined) floor.expirationDate = new Date(input.expirationDate);
      if (input.constraints !== undefined) {
        floor.constraints = { ...floor.constraints, ...input.constraints };
      }

      floor.metadata.updatedBy = updatedBy;

      await floor.save();

      // Record price change in history if price changed
      if (input.price !== undefined && input.price !== previousPrice) {
        await this.recordPriceChange(floor, previousPrice, input.price, 'manual', 'Floor updated');
      }

      floorPricingMetrics.floorOperationsTotal.inc({ operation: 'update', status: 'success' });
      logger.info('Floor price updated', { floorId, newPrice: input.price });
      return floor;
    } catch (error) {
      floorPricingMetrics.floorOperationsTotal.inc({ operation: 'update', status: 'error' });
      logger.error('Failed to update floor price', { error, floorId });
      throw error;
    }
  }

  /**
   * Delete floor (archive)
   */
  async deleteFloor(floorId: string): Promise<boolean> {
    logger.info('Archiving floor price', { floorId });

    try {
      const floor = await FloorPrice.findById(floorId);
      if (!floor) {
        return false;
      }

      floor.status = 'archived';
      await floor.save();

      floorPricingMetrics.activeFloorsGauge.dec({ type: floor.type, status: 'active' });
      floorPricingMetrics.floorOperationsTotal.inc({ operation: 'delete', status: 'success' });
      logger.info('Floor price archived', { floorId });
      return true;
    } catch (error) {
      floorPricingMetrics.floorOperationsTotal.inc({ operation: 'delete', status: 'error' });
      logger.error('Failed to archive floor price', { error, floorId });
      throw error;
    }
  }

  /**
   * Batch update floors
   */
  async batchUpdateFloors(updates: Array<{
    floorId: string;
    price: number;
    updatedBy: string;
  }>): Promise<{ success: string[]; failed: Array<{ floorId: string; error: string }> }> {
    logger.info('Batch updating floors', { count: updates.length });

    const success: string[] = [];
    const failed: Array<{ floorId: string; error: string }> = [];

    for (const update of updates) {
      try {
        await this.updateFloor(update.floorId, { price: update.price }, update.updatedBy);
        success.push(update.floorId);
      } catch (error) {
        failed.push({
          floorId: update.floorId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Batch update completed', { success: success.length, failed: failed.length });
    return { success, failed };
  }

  /**
   * Record price change in history
   */
  private async recordPriceChange(
    floor: IFloorPrice,
    previousPrice: number,
    newPrice: number,
    triggeredBy: 'manual' | 'automatic' | 'ai_optimization' | 'market_adjustment' | 'competitor_adjustment',
    reason: string,
    reasonCode: string = 'MANUAL_UPDATE',
    factors?: Record<string, number>
  ): Promise<void> {
    const priceChange = newPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;

    const history = new FloorHistory({
      floorId: floor._id.toString(),
      inventoryId: floor.inventoryId,
      previousPrice,
      newPrice,
      priceChange,
      priceChangePercent,
      timestamp: new Date(),
      reason,
      reasonCode,
      triggeredBy,
      factors: factors || {},
      metadata: {
        notes: `Floor ${triggeredBy === 'ai_optimization' ? 'AI optimized' : 'updated'} from ${previousPrice} to ${newPrice}`
      }
    });

    await history.save();

    // Record price change metric
    floorPricingMetrics.priceChangeDistribution.observe(priceChangePercent);
  }

  /**
   * Get active floors count
   */
  async getActiveFloorsCount(): Promise<{ total: number; byType: Record<string, number> }> {
    const floors = await FloorPrice.find({ status: 'active' });
    const byType: Record<string, number> = {};

    floors.forEach(floor => {
      byType[floor.type] = (byType[floor.type] || 0) + 1;
    });

    return { total: floors.length, byType };
  }
}

export const floorService = new FloorService();