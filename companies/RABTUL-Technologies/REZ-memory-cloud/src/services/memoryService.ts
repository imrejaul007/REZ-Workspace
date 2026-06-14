/**
 * REZ Memory Cloud - Memory Service
 */

import { v4 as uuidv4 } from 'uuid';
import { Memory, CreateMemoryInput, UpdateMemoryInput, IMemory } from '../models/Memory.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class MemoryService {
  /**
   * Create a new memory
   */
  async create(input: CreateMemoryInput): Promise<IMemory> {
    const memoryId = `mem_${uuidv4()}`;

    // Calculate TTL
    let expiresAt: Date | undefined;
    if (input.expiresAt) {
      expiresAt = new Date(input.expiresAt);
    } else {
      const ttlSeconds = this.getTTLForType(input.ttlType);
      if (ttlSeconds > 0) {
        expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      }
    }

    const memory = new Memory({
      memoryId,
      userId: input.userId,
      content: input.content,
      summary: input.summary,
      category: input.category,
      tags: input.tags,
      entities: input.entities,
      importance: input.importance,
      source: input.source,
      context: input.context,
      metadata: input.metadata,
      expiresAt,
    });

    await memory.save();

    logger.info({
      msg: 'Memory created',
      memoryId,
      userId: input.userId,
      category: input.category,
    });

    return memory;
  }

  /**
   * Get a memory by ID
   */
  async get(memoryId: string): Promise<IMemory | null> {
    return Memory.findOne({ memoryId });
  }

  /**
   * Get memories by user
   */
  async getByUser(
    userId: string,
    options: {
      limit?: number;
      skip?: number;
      category?: string;
      tags?: string[];
    } = {}
  ): Promise<IMemory[]> {
    const query: Record<string, unknown> = { userId };

    if (options.category) {
      query.category = options.category;
    }

    if (options.tags && options.tags.length > 0) {
      query.tags = { $all: options.tags };
    }

    return Memory.find(query)
      .sort({ createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 50);
  }

  /**
   * Update a memory
   */
  async update(memoryId: string, input: UpdateMemoryInput): Promise<IMemory | null> {
    const updateData: Record<string, unknown> = {};

    if (input.content !== undefined) updateData.content = input.content;
    if (input.summary !== undefined) updateData.summary = input.summary;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.importance !== undefined) updateData.importance = input.importance;
    if (input.context !== undefined) updateData.context = input.context;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    if (input.expiresAt !== undefined) {
      updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    }

    const memory = await Memory.findOneAndUpdate(
      { memoryId },
      { $set: updateData },
      { new: true }
    );

    if (memory) {
      logger.info({ msg: 'Memory updated', memoryId });
    }

    return memory;
  }

  /**
   * Delete a memory
   */
  async delete(memoryId: string): Promise<boolean> {
    const result = await Memory.deleteOne({ memoryId });
    logger.info({ msg: 'Memory deleted', memoryId, deleted: result.deletedCount > 0 });
    return result.deletedCount > 0;
  }

  /**
   * Increment recall count
   */
  async recall(memoryIds: string[]): Promise<void> {
    await Memory.updateMany(
      { memoryId: { $in: memoryIds } },
      {
        $inc: { recallCount: 1 },
        $set: { lastRecalled: new Date() },
      }
    );
  }

  /**
   * Link memories together
   */
  async linkMemories(memoryId: string, relatedMemoryIds: string[]): Promise<void> {
    await Memory.updateOne(
      { memoryId },
      { $addToSet: { relatedMemoryIds: { $each: relatedMemoryIds } } }
    );

    // Bidirectional link
    await Memory.updateMany(
      { memoryId: { $in: relatedMemoryIds } },
      { $addToSet: { relatedMemoryIds: memoryId } }
    );
  }

  /**
   * Add tags to a memory
   */
  async addTags(memoryId: string, tags: string[]): Promise<void> {
    await Memory.updateOne(
      { memoryId },
      { $addToSet: { tags: { $each: tags } } }
    );
  }

  /**
   * Get memory statistics for a user
   */
  async getStats(userId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byImportance: Record<string, number>;
    recent: number;
  }> {
    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [stats, recentCount] = await Promise.all([
      Memory.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byCategory: { $push: '$category' },
            byImportance: { $push: '$importance' },
          },
        },
        {
          $project: {
            total: 1,
            byCategory: {
              $reduce: {
                input: '$byCategory',
                initialValue: {},
                in: { $mergeObjects: ['$$value', { $literal: { count: 1 } }] },
              },
            },
          },
        },
      ]),
      Memory.countDocuments({ userId, createdAt: { $gte: oneDayAgo } }),
    ]);

    const result = stats[0] || { total: 0, byCategory: {}, byImportance: {} };

    // Count by category
    const byCategory: Record<string, number> = {};
    if (result.byCategory && Array.isArray(result.byCategory)) {
      for (const cat of result.byCategory) {
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
    }

    // Count by importance
    const byImportance: Record<string, number> = {};
    if (result.byImportance && Array.isArray(result.byImportance)) {
      for (const imp of result.byImportance) {
        byImportance[imp] = (byImportance[imp] || 0) + 1;
      }
    }

    return {
      total: result.total || 0,
      byCategory,
      byImportance,
      recent: recentCount,
    };
  }

  /**
   * Clean up expired memories
   */
  async cleanupExpired(): Promise<number> {
    const result = await Memory.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    if (result.deletedCount > 0) {
      logger.info({ msg: 'Cleaned up expired memories', count: result.deletedCount });
    }
    return result.deletedCount;
  }

  private getTTLForType(ttlType: string): number {
    switch (ttlType) {
      case 'short':
        return config.ttl.short;
      case 'long':
        return config.ttl.long;
      case 'never':
        return 0;
      default:
        return config.ttl.default;
    }
  }
}

export const memoryService = new MemoryService();
