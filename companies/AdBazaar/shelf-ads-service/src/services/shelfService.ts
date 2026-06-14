import { Shelf, IShelfDocument } from '../models/Shelf.js';
import { Store } from '../models/Store.js';
import { createChildLogger } from 'utils/logger.js';
import { shelfCount } from '../utils/metrics.js';
import { z } from 'zod';
import mongoose from 'mongoose';

const logger = createChildLogger('shelfService');

// Validation schemas
export const CreateShelfSchema = z.object({
  name: z.string().min(1).max(100),
  position: z.object({
    aisle: z.string().min(1),
    section: z.string().min(1),
    height: z.enum(['eye', 'reach', 'floor']).optional().default('eye'),
    side: z.enum(['left', 'right', 'center']).optional().default('center')
  }),
  category: z.string().min(1),
  capacity: z.number().min(1).max(10).optional().default(1),
  dimensions: z.object({
    width: z.number().min(1).optional().default(30),
    height: z.number().min(1).optional().default(20),
    depth: z.number().min(1).optional().default(10)
  }).optional(),
  visibility: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  pricing: z.object({
    daily: z.number().min(0),
    weekly: z.number().min(0),
    monthly: z.number().min(0)
  }),
  impressionsPerHour: z.number().min(0).optional().default(0),
  conversionRate: z.number().min(0).max(100).optional().default(0),
  avgDailyReach: z.number().min(0).optional().default(0)
});

export const UpdateShelfSchema = CreateShelfSchema.partial();

export const ListShelvesQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  category: z.string().optional(),
  visibility: z.enum(['high', 'medium', 'low']).optional(),
  minImpressionsPerHour: z.coerce.number().optional(),
  storeId: z.string().optional()
});

export type CreateShelfInput = z.infer<typeof CreateShelfSchema>;
export type UpdateShelfInput = z.infer<typeof UpdateShelfSchema>;
export type ListShelvesQuery = z.infer<typeof ListShelvesQuerySchema>;

export class ShelfService {
  /**
   * Add shelf to store
   */
  async addShelfToStore(storeId: string, data: CreateShelfInput): Promise<IShelfDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return null;
    }

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
      logger.warn('Store not found', { storeId });
      return null;
    }

    logger.info('Adding shelf to store', { storeId, shelfName: data.name });

    const shelf = new Shelf({
      ...data,
      storeId,
      status: 'available',
      ads: []
    });

    await shelf.save();

    // Add shelf reference to store
    await Store.findByIdAndUpdate(storeId, {
      $push: { shelves: shelf._id }
    });

    shelfCount.inc();
    logger.info('Shelf added successfully', { shelfId: shelf._id, storeId });

    return shelf;
  }

  /**
   * Get shelf by ID
   */
  async getShelfById(id: string): Promise<IShelfDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Shelf.findById(id).populate('ads');
  }

  /**
   * Update shelf
   */
  async updateShelf(id: string, data: UpdateShelfInput): Promise<IShelfDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const shelf = await Shelf.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('ads');

    if (shelf) {
      logger.info('Shelf updated', { shelfId: id });
    }

    return shelf;
  }

  /**
   * Delete shelf
   */
  async deleteShelf(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const shelf = await Shelf.findById(id);
    if (!shelf) {
      return false;
    }

    // Remove shelf reference from store
    await Store.findByIdAndUpdate(shelf.storeId, {
      $pull: { shelves: id }
    });

    await Shelf.findByIdAndDelete(id);
    shelfCount.dec();

    logger.info('Shelf deleted', { shelfId: id });
    return true;
  }

  /**
   * List shelves for a store
   */
  async listShelvesByStore(storeId: string, query: ListShelvesQuery): Promise<{
    shelves: IShelfDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return { shelves: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }

    const { page, limit, status, category, visibility, minImpressionsPerHour } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { storeId };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (visibility) filter.visibility = visibility;
    if (minImpressionsPerHour) filter.impressionsPerHour = { $gte: minImpressionsPerHour };

    const [shelves, total] = await Promise.all([
      Shelf.find(filter)
        .populate('ads')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Shelf.countDocuments(filter)
    ]);

    return {
      shelves,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * List all shelves with filtering
   */
  async listAllShelves(query: ListShelvesQuery): Promise<{
    shelves: IShelfDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, status, category, visibility, minImpressionsPerHour, storeId } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (visibility) filter.visibility = visibility;
    if (minImpressionsPerHour) filter.impressionsPerHour = { $gte: minImpressionsPerHour };
    if (storeId) filter.storeId = storeId;

    const [shelves, total] = await Promise.all([
      Shelf.find(filter)
        .populate('ads')
        .populate('storeId', 'name location')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Shelf.countDocuments(filter)
    ]);

    return {
      shelves,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get available shelves for ad placement
   */
  async getAvailableShelves(category?: string, minVisibility?: string): Promise<IShelfDocument[]> {
    const filter: Record<string, unknown> = {
      status: 'available'
    };

    if (category) filter.category = category;
    if (minVisibility) {
      const visibilityOrder = ['low', 'medium', 'high'];
      const minIndex = visibilityOrder.indexOf(minVisibility);
      filter.visibility = { $in: visibilityOrder.slice(minIndex) };
    }

    return Shelf.find(filter)
      .populate('storeId', 'name location zone tier')
      .sort({ visibility: -1, impressionsPerHour: -1 });
  }

  /**
   * Update shelf status
   */
  async updateShelfStatus(id: string, status: 'available' | 'occupied' | 'maintenance'): Promise<IShelfDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const shelf = await Shelf.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (shelf) {
      logger.info('Shelf status updated', { shelfId: id, status });
    }

    return shelf;
  }

  /**
   * Get shelf statistics
   */
  async getShelfStats(): Promise<{
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    byCategory: Record<string, number>;
    byVisibility: Record<string, number>;
    avgImpressionsPerHour: number;
  }> {
    const [total, available, occupied, maintenance] = await Promise.all([
      Shelf.countDocuments(),
      Shelf.countDocuments({ status: 'available' }),
      Shelf.countDocuments({ status: 'occupied' }),
      Shelf.countDocuments({ status: 'maintenance' })
    ]);

    const byCategory = await Shelf.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).then(results => Object.fromEntries(results.map(r => [r._id, r.count])));

    const byVisibility = await Shelf.aggregate([
      { $group: { _id: '$visibility', count: { $sum: 1 } } }
    ]).then(results => Object.fromEntries(results.map(r => [r._id, r.count])));

    const avgImpressions = await Shelf.aggregate([
      { $group: { _id: null, avg: { $avg: '$impressionsPerHour' } } }
    ]).then(results => results[0]?.avg || 0);

    return {
      total,
      available,
      occupied,
      maintenance,
      byCategory,
      byVisibility,
      avgImpressionsPerHour: avgImpressions
    };
  }

  /**
   * Get shelves by category
   */
  async getShelvesByCategory(category: string): Promise<IShelfDocument[]> {
    return Shelf.find({ category, status: 'available' })
      .populate('storeId', 'name location')
      .sort({ visibility: -1 });
  }
}

export const shelfService = new ShelfService();
export default shelfService;