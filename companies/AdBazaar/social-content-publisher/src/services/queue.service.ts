import ContentQueueModel, { IContentQueueDocument } from '../models/content-queue.model';
import UnifiedPostModel from '../models/unified-post.model';
import { NotFoundError, ConflictError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { queueProcessingDuration, postsPublishedTotal } from '../config/metrics';

export interface QueueFilters {
  status?: string;
  platform?: string;
  startDate?: Date;
  endDate?: Date;
}

export class QueueService {
  async createQueueItems(postId: string, scheduledTime: Date, platforms: string[]): Promise<IContentQueueDocument[]> {
    const queueItems = platforms.map((platform) =>
      new ContentQueueModel({
        postId,
        platform,
        scheduledTime,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      })
    );

    const savedItems = await ContentQueueModel.insertMany(queueItems);
    logger.info('Queue items created', { postId, platforms, count: queueItems.length });

    return savedItems;
  }

  async findById(id: string): Promise<IContentQueueDocument> {
    const item = await ContentQueueModel.findById(id);
    if (!item) {
      throw new NotFoundError(`Queue item not found: ${id}`);
    }
    return item;
  }

  async findAll(filters: QueueFilters, page: number = 1, limit: number = 50) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.platform) {
      query.platform = filters.platform;
    }

    if (filters.startDate || filters.endDate) {
      query.scheduledTime = {};
      if (filters.startDate) query.scheduledTime.$gte = filters.startDate;
      if (filters.endDate) query.scheduledTime.$lte = filters.endDate;
    }

    const [items, total] = await Promise.all([
      ContentQueueModel.find(query)
        .populate('postId', 'title content platforms')
        .sort({ scheduledTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContentQueueModel.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingItems(limit: number = 10): Promise<IContentQueueDocument[]> {
    const now = new Date();
    return ContentQueueModel.find({
      status: 'pending',
      scheduledTime: { $lte: now },
    })
      .populate('postId')
      .sort({ scheduledTime: 1 })
      .limit(limit)
      .lean();
  }

  async markAsProcessing(id: string): Promise<IContentQueueDocument> {
    const item = await this.findById(id);

    if (item.status !== 'pending') {
      throw new ConflictError('Item is not in pending status');
    }

    item.status = 'processing';
    item.lastAttemptAt = new Date();
    await item.save();

    logger.info('Queue item processing', { queueId: id, platform: item.platform });
    return item;
  }

  async markAsPublished(id: string, publishedId: string): Promise<IContentQueueDocument> {
    const item = await this.findById(id);

    item.status = 'published';
    item.publishedId = publishedId;
    item.publishedAt = new Date();
    item.error = undefined;
    await item.save();

    postsPublishedTotal.inc({ platform: item.platform, status: 'success' });
    logger.info('Queue item published', { queueId: id, platform: item.platform, publishedId });

    // Update post analytics
    await this.updatePostAnalytics(item.postId.toString(), item.platform, {
      publishedId,
      publishedAt: item.publishedAt,
    });

    return item;
  }

  async markAsFailed(id: string, error: string): Promise<IContentQueueDocument> {
    const item = await this.findById(id);

    item.retryCount += 1;
    item.error = error;

    if (item.retryCount >= item.maxRetries) {
      item.status = 'failed';
      postsPublishedTotal.inc({ platform: item.platform, status: 'failed' });
      logger.error('Queue item permanently failed', { queueId: id, platform: item.platform, retries: item.retryCount });
    } else {
      item.status = 'pending';
      // Exponential backoff: retry in 5min * 2^retryCount
      const retryDelay = 5 * 60 * 1000 * Math.pow(2, item.retryCount);
      item.scheduledTime = new Date(Date.now() + retryDelay);
      logger.warn('Queue item scheduled for retry', { queueId: id, platform: item.platform, retryIn: retryDelay });
    }

    item.lastAttemptAt = new Date();
    await item.save();

    return item;
  }

  async deleteByPostId(postId: string): Promise<void> {
    await ContentQueueModel.deleteMany({ postId });
    logger.info('Queue items deleted', { postId });
  }

  async deleteByPlatform(postId: string, platform: string): Promise<void> {
    await ContentQueueModel.deleteOne({ postId, platform });
    logger.info('Queue item deleted', { postId, platform });
  }

  async reorderItems(items: { id: string; order: number }[]): Promise<void> {
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { scheduledTime: new Date(Date.now() + item.order * 60 * 1000) } },
      },
    }));

    await ContentQueueModel.bulkWrite(bulkOps);
    logger.info('Queue reordered', { count: items.length });
  }

  async retryFailed(id: string): Promise<IContentQueueDocument> {
    const item = await this.findById(id);

    if (item.status !== 'failed') {
      throw new ConflictError('Can only retry failed items');
    }

    item.status = 'pending';
    item.retryCount = 0;
    item.error = undefined;
    item.scheduledTime = new Date(); // Retry immediately
    await item.save();

    logger.info('Queue item retry initiated', { queueId: id, platform: item.platform });
    return item;
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    published: number;
    failed: number;
    byPlatform: Record<string, { pending: number; published: number; failed: number }>;
  }> {
    const stats = await ContentQueueModel.aggregate([
      {
        $group: {
          _id: { status: '$status', platform: '$platform' },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      pending: 0,
      processing: 0,
      published: 0,
      failed: 0,
      byPlatform: {} as Record<string, { pending: number; published: number; failed: number }>,
    };

    stats.forEach((stat) => {
      const { status, platform } = stat._id;
      result[status] = (result[status] || 0) + stat.count;

      if (!result.byPlatform[platform]) {
        result.byPlatform[platform] = { pending: 0, published: 0, failed: 0 };
      }
      result.byPlatform[platform][status] = stat.count;
    });

    return result;
  }

  private async updatePostAnalytics(
    postId: string,
    platform: string,
    data: { publishedId?: string; publishedAt?: Date }
  ): Promise<void> {
    const analyticsUpdate: any = {};
    if (data.publishedId) analyticsUpdate[`analytics.${platform}.publishedId`] = data.publishedId;
    if (data.publishedAt) analyticsUpdate[`analytics.${platform}.publishedAt`] = data.publishedAt;

    await UnifiedPostModel.findByIdAndUpdate(postId, analyticsUpdate);
  }
}

export const queueService = new QueueService();