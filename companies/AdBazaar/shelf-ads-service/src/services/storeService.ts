import { Store, IStoreDocument } from '../models/Store.js';
import { Shelf } from '../models/Shelf.js';
import { createChildLogger } from 'utils/logger.js';
import { storeCount } from '../utils/metrics.js';
import { z } from 'zod';
import mongoose from 'mongoose';

const logger = createChildLogger('storeService');

// Validation schemas
export const CreateStoreSchema = z.object({
  name: z.string().min(1).max(200),
  retailerId: z.string().min(1),
  location: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  category: z.array(z.string()).optional().default([]),
  size: z.enum(['small', 'medium', 'large']).optional().default('medium'),
  zone: z.string().min(1),
  tier: z.enum(['premium', 'standard', 'economy']).optional().default('standard'),
  impressionsPerDay: z.number().min(0).optional().default(0),
  avgFootfall: z.number().min(0).optional().default(0),
  operatingHours: z.object({
    open: z.string().optional().default('09:00'),
    close: z.string().optional().default('21:00'),
    days: z.array(z.string()).optional().default(['Mon-Sun'])
  }).optional(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    manager: z.string().optional()
  }).optional()
});

export const UpdateStoreSchema = CreateStoreSchema.partial();

export const ListStoresQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  city: z.string().optional(),
  zone: z.string().optional(),
  tier: z.enum(['premium', 'standard', 'economy']).optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  category: z.string().optional(),
  retailerId: z.string().optional(),
  search: z.string().optional()
});

export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;
export type ListStoresQuery = z.infer<typeof ListStoresQuerySchema>;

export class StoreService {
  /**
   * Create a new store
   */
  async createStore(data: CreateStoreInput): Promise<IStoreDocument> {
    logger.info('Creating new store', { name: data.name, retailerId: data.retailerId });

    const store = new Store({
      ...data,
      status: 'pending',
      shelves: []
    });

    await store.save();
    storeCount.inc();

    logger.info('Store created successfully', { storeId: store._id });
    return store;
  }

  /**
   * Get store by ID
   */
  async getStoreById(id: string): Promise<IStoreDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Store.findById(id).populate('shelves');
  }

  /**
   * Update store
   */
  async updateStore(id: string, data: UpdateStoreInput): Promise<IStoreDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const store = await Store.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('shelves');

    if (store) {
      logger.info('Store updated', { storeId: id });
    }

    return store;
  }

  /**
   * Delete store
   */
  async deleteStore(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    // Delete all shelves associated with this store
    await Shelf.deleteMany({ storeId: id });

    const result = await Store.findByIdAndDelete(id);
    if (result) {
      storeCount.dec();
      logger.info('Store deleted', { storeId: id });
      return true;
    }
    return false;
  }

  /**
   * List stores with filtering and pagination
   */
  async listStores(query: ListStoresQuery): Promise<{
    stores: IStoreDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, status, city, zone, tier, size, category, retailerId, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (zone) filter.zone = zone;
    if (tier) filter.tier = tier;
    if (size) filter.size = size;
    if (category) filter.category = { $in: [category] };
    if (retailerId) filter.retailerId = retailerId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const [stores, total] = await Promise.all([
      Store.find(filter)
        .populate('shelves')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Store.countDocuments(filter)
    ]);

    return {
      stores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Activate store
   */
  async activateStore(id: string): Promise<IStoreDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const store = await Store.findByIdAndUpdate(
      id,
      { $set: { status: 'active' } },
      { new: true }
    );

    if (store) {
      logger.info('Store activated', { storeId: id });
    }

    return store;
  }

  /**
   * Deactivate store
   */
  async deactivateStore(id: string): Promise<IStoreDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const store = await Store.findByIdAndUpdate(
      id,
      { $set: { status: 'inactive' } },
      { new: true }
    );

    if (store) {
      logger.info('Store deactivated', { storeId: id });
    }

    return store;
  }

  /**
   * Get stores by retailer
   */
  async getStoresByRetailer(retailerId: string): Promise<IStoreDocument[]> {
    return Store.find({ retailerId }).populate('shelves').sort({ createdAt: -1 });
  }

  /**
   * Get stores by zone
   */
  async getStoresByZone(zone: string): Promise<IStoreDocument[]> {
    return Store.find({ zone, status: 'active' }).populate('shelves');
  }

  /**
   * Get stores by coordinates (geo query)
   */
  async getStoresNearLocation(lat: number, lng: number, radiusKm: number): Promise<IStoreDocument[]> {
    return Store.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radiusKm * 1000
        }
      },
      status: 'active'
    }).populate('shelves');
  }

  /**
   * Get store statistics
   */
  async getStoreStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
    byTier: Record<string, number>;
    bySize: Record<string, number>;
    byCity: Record<string, number>;
  }> {
    const [stores, active, inactive, pending] = await Promise.all([
      Store.countDocuments(),
      Store.countDocuments({ status: 'active' }),
      Store.countDocuments({ status: 'inactive' }),
      Store.countDocuments({ status: 'pending' })
    ]);

    const byTier = await Store.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 } } }
    ]).then(results => Object.fromEntries(results.map(r => [r._id, r.count])));

    const bySize = await Store.aggregate([
      { $group: { _id: '$size', count: { $sum: 1 } } }
    ]).then(results => Object.fromEntries(results.map(r => [r._id, r.count])));

    const byCity = await Store.aggregate([
      { $group: { _id: '$location.city', count: { $sum: 1 } } }
    ]).then(results => Object.fromEntries(results.map(r => [r._id, r.count])));

    return {
      total: stores,
      active,
      inactive,
      pending,
      byTier,
      bySize,
      byCity
    };
  }
}

export const storeService = new StoreService();
export default storeService;