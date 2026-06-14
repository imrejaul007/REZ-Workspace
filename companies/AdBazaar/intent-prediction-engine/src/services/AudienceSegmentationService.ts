import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';
import { IntentSegment, IIntentSegment } from '../models/IntentSegment.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';
import { IntentCategory, SegmentStatus, AudienceSegmentRequest } from '../types.js';

interface SegmentCreationOptions {
  name: string;
  description: string;
  category: IntentCategory;
  criteria: {
    minConfidence: number;
    maxDaysDormant?: number;
    sources?: string[];
    geoFilters?: string[];
  };
}

export class AudienceSegmentationService {
  /**
   * Generate audience segment based on criteria
   */
  async generateAudienceSegment(
    request: AudienceSegmentRequest
  ): Promise<{ segment: IIntentSegment; userIds: string[] }> {
    try {
      const { category, minConfidence, maxDaysDormant, geoFilters, limit } = request;

      // Build query for scoring service integration
      const query: Record<string, unknown> = {};

      if (category) {
        query.category = category;
      }

      if (minConfidence !== undefined) {
        query['criteria.minConfidence'] = { $lte: minConfidence };
      }

      if (maxDaysDormant !== undefined) {
        query['criteria.maxDaysDormant'] = { $lte: maxDaysDormant };
      }

      // Get matching segments
      const segments = await IntentSegment.find(query)
        .sort({ qualityScore: -1 })
        .limit(limit);

      // Calculate aggregate statistics
      const userIds = this.extractUserIdsFromSegments(segments);
      const avgConfidence =
        segments.length > 0 ? segments.reduce((sum, s) => sum + s.avgConfidence, 0) / segments.length : 0;
      const avgQuality = segments.length > 0 ? segments.reduce((sum, s) => sum + s.qualityScore, 0) / segments.length : 0;

      logger.info('Audience segment generated', {
        segmentCount: segments.length,
        userCount: userIds.length,
        avgConfidence,
      });

      return {
        segment: {
          segmentId: uuidv4(),
          name: `Audience Segment - ${category || 'All'}`,
          description: `Generated audience segment with ${userIds.length} users`,
          category: category || 'GENERAL',
          criteria: {
            minConfidence: minConfidence || 0,
            maxDaysDormant,
            geoFilters,
          },
          userCount: userIds.length,
          avgConfidence,
          qualityScore: avgQuality,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as IIntentSegment,
        userIds,
      };
    } catch (error) {
      logger.error('Error generating audience segment', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Create a new segment definition
   */
  async createSegment(options: SegmentCreationOptions): Promise<IIntentSegment> {
    try {
      const segment = new IntentSegment({
        segmentId: uuidv4(),
        ...options,
        userCount: 0,
        avgConfidence: options.criteria.minConfidence,
        qualityScore: 5,
        status: 'active',
      });

      await segment.save();

      logger.info('Segment created', { segmentId: segment.segmentId, name: segment.name });
      return segment;
    } catch (error) {
      logger.error('Error creating segment', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * List all segments with filtering
   */
  async listSegments(options: {
    category?: IntentCategory;
    status?: SegmentStatus;
    limit?: number;
    page?: number;
  } = {}): Promise<{ segments: IIntentSegment[]; total: number }> {
    const { category, status, limit = 50, page = 1 } = options;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [segments, total] = await Promise.all([
      IntentSegment.find(query).sort({ qualityScore: -1 }).skip(skip).limit(limit),
      IntentSegment.countDocuments(query),
    ]);

    return { segments, total };
  }

  /**
   * Get segment by ID
   */
  async getSegment(segmentId: string): Promise<IIntentSegment | null> {
    const cacheKey = `segment:${segmentId}`;

    try {
      const cached = await cacheGet<IIntentSegment>(cacheKey);
      if (cached) {
        return cached;
      }

      const segment = await IntentSegment.findOne({ segmentId });
      if (segment) {
        await cacheSet(cacheKey, segment, 300);
      }

      return segment;
    } catch (error) {
      logger.error('Error getting segment', { segmentId, error: (error as Error).message });
      return await IntentSegment.findOne({ segmentId });
    }
  }

  /**
   * Update segment
   */
  async updateSegment(
    segmentId: string,
    updates: Partial<SegmentCreationOptions & { status: SegmentStatus }>
  ): Promise<IIntentSegment | null> {
    try {
      const segment = await IntentSegment.findOneAndUpdate(
        { segmentId },
        { $set: updates },
        { new: true }
      );

      if (segment) {
        await cacheDelete(`segment:${segmentId}`);
        logger.info('Segment updated', { segmentId });
      }

      return segment;
    } catch (error) {
      logger.error('Error updating segment', { segmentId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Archive a segment
   */
  async archiveSegment(segmentId: string): Promise<boolean> {
    try {
      const result = await IntentSegment.updateOne({ segmentId }, { $set: { status: 'archived' } });

      if (result.modifiedCount > 0) {
        await cacheDelete(`segment:${segmentId}`);
        logger.info('Segment archived', { segmentId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error archiving segment', { segmentId, error: (error as Error).message });
      throw false;
    }
  }

  /**
   * Update segment statistics
   */
  async refreshSegmentStats(segmentId: string): Promise<IIntentSegment | null> {
    try {
      const segment = await IntentSegment.findOne({ segmentId });
      if (!segment) return null;

      // In production, this would query the scoring service to get current stats
      // For now, simulate refreshing
      const newUserCount = Math.max(0, segment.userCount + Math.floor(Math.random() * 100 - 50));
      const newAvgConfidence = Math.min(1, Math.max(0, segment.avgConfidence + (Math.random() * 0.1 - 0.05)));

      segment.userCount = newUserCount;
      segment.avgConfidence = Math.round(newAvgConfidence * 1000) / 1000;
      await segment.save();

      await cacheDelete(`segment:${segmentId}`);

      logger.info('Segment stats refreshed', { segmentId, newUserCount, newAvgConfidence });
      return segment;
    } catch (error) {
      logger.error('Error refreshing segment stats', { segmentId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get segment performance metrics
   */
  async getSegmentMetrics(segmentId: string): Promise<{
    segmentId: string;
    performance: {
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      conversionRate: number;
    };
    trends: {
      dailyActiveUsers: number[];
      confidenceTrend: number[];
    };
  }> {
    const segment = await this.getSegment(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    // Simulate metrics (in production, query analytics service)
    return {
      segmentId,
      performance: {
        impressions: Math.floor(Math.random() * 100000),
        clicks: Math.floor(Math.random() * 5000),
        conversions: Math.floor(Math.random() * 500),
        ctr: Math.round((Math.random() * 0.1) * 1000) / 1000,
        conversionRate: Math.round((Math.random() * 0.05) * 1000) / 1000,
      },
      trends: {
        dailyActiveUsers: Array.from({ length: 7 }, () => Math.floor(Math.random() * 1000)),
        confidenceTrend: Array.from({ length: 7 }, () => Math.round(Math.random() * 1000) / 1000),
      },
    };
  }

  /**
   * Extract user IDs from segments (simulated)
   */
  private extractUserIdsFromSegments(segments: IIntentSegment[]): string[] {
    // In production, this would query user data based on segment criteria
    // For now, return empty array
    return [];
  }
}

export const audienceSegmentationService = new AudienceSegmentationService();