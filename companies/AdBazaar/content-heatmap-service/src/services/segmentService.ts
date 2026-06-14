import { v4 as uuidv4 } from 'uuid';
import { Segment, ISegment } from '../models/Segment';
import { Heatmap } from '../models/Heatmap';
import { Analytics } from '../models/Analytics';
import { logger } from 'utils/logger.js';

export interface CreateSegmentInput {
  name: string;
  description?: string;
  criteria: {
    contentTypes?: string[];
    dateRange?: { start: Date; end: Date };
    minViews?: number;
    maxViews?: number;
    minEngagement?: number;
    maxEngagement?: number;
    countries?: string[];
    devices?: string[];
    referrers?: string[];
  };
  createdBy: string;
}

export class SegmentService {
  async create(input: CreateSegmentInput): Promise<ISegment> {
    try {
      const segmentId = `seg-${uuidv4()}`;
      const matchingContentIds = await this.findMatchingContent(input.criteria);

      const segment = new Segment({
        segmentId,
        name: input.name,
        description: input.description,
        criteria: input.criteria,
        matchingContentIds,
        contentCount: matchingContentIds.length,
        createdBy: input.createdBy
      });

      await segment.save();
      await this.updateSegmentMetrics(segmentId);

      logger.info('Segment created', { segmentId, name: input.name });
      return segment;
    } catch (error) {
      logger.error('Failed to create segment', { error, input });
      throw error;
    }
  }

  async findById(segmentId: string): Promise<ISegment | null> {
    return await Segment.findOne({ segmentId });
  }

  async findAll(): Promise<ISegment[]> {
    return await Segment.find({ isActive: true }).sort({ name: 1 });
  }

  async findMatchingContent(criteria: any): Promise<string[]> {
    try {
      const query: any = {};

      if (criteria.contentTypes?.length) query.contentType = { $in: criteria.contentTypes };
      if (criteria.dateRange) {
        query.date = { $gte: new Date(criteria.dateRange.start), $lte: new Date(criteria.dateRange.end) };
      }
      if (criteria.countries?.length) {
        query['locationBreakdown.country'] = { $in: criteria.countries };
      }
      if (criteria.devices?.length) {
        const deviceQuery: any = {};
        criteria.devices.forEach((d: string) => {
          if (d === 'desktop') deviceQuery.desktop = { $gt: 0 };
          if (d === 'mobile') deviceQuery.mobile = { $gt: 0 };
          if (d === 'tablet') deviceQuery.tablet = { $gt: 0 };
        });
        query.deviceBreakdown = { $or: Object.keys(deviceQuery).map(k => ({ [k]: deviceQuery[k] })) };
      }

      const heatmaps = await Heatmap.find(query, { contentId: 1, views: 1, engagementScore: 1 });

      let filtered = heatmaps.map(h => ({ contentId: h.contentId, views: h.views, engagement: h.engagementScore }));

      if (criteria.minViews) filtered = filtered.filter(h => h.views >= criteria.minViews);
      if (criteria.maxViews) filtered = filtered.filter(h => h.views <= criteria.maxViews);
      if (criteria.minEngagement) filtered = filtered.filter(h => h.engagement >= criteria.minEngagement);
      if (criteria.maxEngagement) filtered = filtered.filter(h => h.engagement <= criteria.maxEngagement);

      return filtered.map(h => h.contentId);
    } catch (error) {
      logger.error('Failed to find matching content', { error, criteria });
      return [];
    }
  }

  async updateSegmentMetrics(segmentId: string): Promise<void> {
    try {
      const segment = await Segment.findOne({ segmentId });
      if (!segment) return;

      const analytics = await Analytics.aggregate([
        { $match: { contentId: { $in: segment.matchingContentIds } } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$metrics.views' },
            avgEngagement: { $avg: '$metrics.engagementRate' }
          }
        }
      ]);

      if (analytics[0]) {
        segment.totalViews = analytics[0].totalViews;
        segment.avgEngagement = analytics[0].avgEngagement || 0;
        await segment.save();
      }
    } catch (error) {
      logger.error('Failed to update segment metrics', { error, segmentId });
    }
  }

  async delete(segmentId: string): Promise<boolean> {
    try {
      const result = await Segment.findOneAndUpdate(
        { segmentId },
        { $set: { isActive: false } },
        { new: true }
      );
      return !!result;
    } catch (error) {
      logger.error('Failed to delete segment', { error, segmentId });
      throw error;
    }
  }
}

export const segmentService = new SegmentService();