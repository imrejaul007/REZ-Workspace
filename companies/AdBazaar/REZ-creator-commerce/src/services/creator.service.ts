import { Types } from 'mongoose';
import { Creator } from '../models';
import { cacheService } from './cache.service';
import { logger } from './logger.service';
import config from '../config';
import {
  ICreator,
  ICreatorDocument,
  CreateCreatorDTO,
  UpdateCreatorDTO,
  PaginatedResponse,
  CreatorStatus,
} from '../types';

class CreatorService {
  /**
   * Create a new creator
   */
  async create(data: CreateCreatorDTO): Promise<ICreatorDocument> {
    const creator = new Creator({
      name: data.name,
      email: data.email,
      bio: data.bio || '',
      avatar: data.avatar || '',
      socialLinks: data.socialLinks || {},
      categories: data.categories || [],
      bankDetails: data.bankDetails,
      status: CreatorStatus.ACTIVE,
      onboardingComplete: false,
    });

    await creator.save();
    logger.info(`Creator created: ${creator._id}`);

    // Invalidate list cache
    await cacheService.delByPattern('creators:*');

    return creator;
  }

  /**
   * Get creator by ID
   */
  async getById(id: string): Promise<ICreatorDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    // Try cache first
    const cached = await cacheService.get<ICreatorDocument>(cacheService.keys.creator(id));
    if (cached) {
      return cached;
    }

    const creator = await Creator.findById(id);
    if (creator) {
      await cacheService.set(cacheService.keys.creator(id), creator, config.cache.creatorTtl);
    }

    return creator;
  }

  /**
   * Get creator by email
   */
  async getByEmail(email: string): Promise<ICreatorDocument | null> {
    return Creator.findByEmail(email);
  }

  /**
   * List creators with pagination
   */
  async list(params: {
    page?: number;
    limit?: number;
    status?: CreatorStatus;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<ICreatorDocument>> {
    const {
      page = 1,
      limit = config.pagination.defaultLimit,
      status,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.categories = category.toLowerCase();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const [creators, total] = await Promise.all([
      Creator.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(Math.min(limit, config.pagination.maxLimit)),
      Creator.countDocuments(query),
    ]);

    return {
      data: creators,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Update creator
   */
  async update(id: string, data: UpdateCreatorDTO): Promise<ICreatorDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const creator = await Creator.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (creator) {
      await cacheService.invalidateCreatorCache(id);
      logger.info(`Creator updated: ${id}`);
    }

    return creator;
  }

  /**
   * Delete creator
   */
  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await Creator.findByIdAndDelete(id);
    if (result) {
      await cacheService.invalidateCreatorCache(id);
      logger.info(`Creator deleted: ${id}`);
      return true;
    }

    return false;
  }

  /**
   * Update creator stats after order
   */
  async updateStats(
    id: string,
    orderAmount: number,
    commissionAmount: number
  ): Promise<ICreatorDocument | null> {
    const creator = await Creator.findById(id);
    if (!creator) {
      return null;
    }

    creator.totalOrders += 1;
    creator.totalEarnings += orderAmount - commissionAmount;
    creator.pendingPayout += orderAmount - commissionAmount;

    await creator.save();
    await cacheService.invalidateCreatorCache(id);

    return creator;
  }

  /**
   * Increment product count
   */
  async incrementProductCount(id: string): Promise<ICreatorDocument | null> {
    const creator = await Creator.findByIdAndUpdate(
      id,
      { $inc: { totalProducts: 1 } },
      { new: true }
    );

    if (creator) {
      await cacheService.invalidateCreatorCache(id);
    }

    return creator;
  }

  /**
   * Decrement product count
   */
  async decrementProductCount(id: string): Promise<ICreatorDocument | null> {
    const creator = await Creator.findByIdAndUpdate(
      id,
      { $inc: { totalProducts: -1 } },
      { new: true }
    );

    if (creator) {
      await cacheService.invalidateCreatorCache(id);
    }

    return creator;
  }

  /**
   * Add to pending payout
   */
  async addPendingPayout(id: string, amount: number): Promise<ICreatorDocument | null> {
    const creator = await Creator.findByIdAndUpdate(
      id,
      { $inc: { pendingPayout: amount } },
      { new: true }
    );

    if (creator) {
      await cacheService.invalidateCreatorCache(id);
    }

    return creator;
  }

  /**
   * Deduct from pending payout
   */
  async deductPendingPayout(id: string, amount: number): Promise<ICreatorDocument | null> {
    const creator = await Creator.findByIdAndUpdate(
      id,
      { $inc: { pendingPayout: -amount } },
      { new: true, runValidators: true }
    );

    if (creator) {
      await cacheService.invalidateCreatorCache(id);
    }

    return creator;
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(id: string): Promise<ICreatorDocument | null> {
    const creator = await Creator.findByIdAndUpdate(
      id,
      { $set: { onboardingComplete: true } },
      { new: true }
    );

    if (creator) {
      await cacheService.invalidateCreatorCache(id);
    }

    return creator;
  }

  /**
   * Get creator stats
   */
  async getStats(id: string): Promise<{
    totalProducts: number;
    totalOrders: number;
    totalEarnings: number;
    pendingPayout: number;
    paidOut: number;
  } | null> {
    const creator = await Creator.findById(id);
    if (!creator) {
      return null;
    }

    return {
      totalProducts: creator.totalProducts,
      totalOrders: creator.totalOrders,
      totalEarnings: creator.totalEarnings,
      pendingPayout: creator.pendingPayout,
      paidOut: creator.totalEarnings - creator.pendingPayout,
    };
  }

  /**
   * Get top creators by earnings
   */
  async getTopCreators(limit: number = 10): Promise<ICreatorDocument[]> {
    return Creator.find({ status: CreatorStatus.ACTIVE })
      .sort({ totalEarnings: -1 })
      .limit(limit);
  }

  /**
   * Get creators by category
   */
  async getByCategory(category: string): Promise<ICreatorDocument[]> {
    return Creator.find({
      categories: category.toLowerCase(),
      status: CreatorStatus.ACTIVE,
    }).sort({ rating: -1 });
  }
}

export const creatorService = new CreatorService();
export default creatorService;
