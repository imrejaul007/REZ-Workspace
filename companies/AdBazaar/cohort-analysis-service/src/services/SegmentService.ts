import { Segment, ISegment } from '../models/Segment.js';
import logger from '../utils/logger.js';

export class SegmentService {
  async createSegment(data: Partial<ISegment>): Promise<ISegment> {
    try {
      const segment = new Segment(data);
      await segment.save();
      logger.info(`Created segment: ${segment.name}`);
      return segment;
    } catch (error) {
      logger.error('Error creating segment:', error);
      throw error;
    }
  }

  async getSegments(organizationId: string, activeOnly = true): Promise<ISegment[]> {
    try {
      const query: any = { organizationId };
      if (activeOnly) query.isActive = true;
      return await Segment.find(query).sort({ name: 1 });
    } catch (error) {
      logger.error('Error getting segments:', error);
      throw error;
    }
  }

  async getSegmentById(segmentId: string, organizationId: string): Promise<ISegment | null> {
    try {
      return await Segment.findOne({ _id: segmentId, organizationId });
    } catch (error) {
      logger.error(`Error getting segment ${segmentId}:`, error);
      throw error;
    }
  }

  async updateSegment(segmentId: string, data: Partial<ISegment>, organizationId: string): Promise<ISegment | null> {
    try {
      const segment = await Segment.findOneAndUpdate(
        { _id: segmentId, organizationId },
        { $set: data },
        { new: true }
      );

      if (segment) {
        logger.info(`Updated segment: ${segment.name}`);
      }
      return segment;
    } catch (error) {
      logger.error(`Error updating segment ${segmentId}:`, error);
      throw error;
    }
  }

  async deleteSegment(segmentId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Segment.deleteOne({ _id: segmentId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting segment ${segmentId}:`, error);
      throw error;
    }
  }

  async estimateSize(segmentId: string, organizationId: string): Promise<number> {
    try {
      const segment = await Segment.findOne({ _id: segmentId, organizationId });
      if (!segment) {
        throw new Error('Segment not found');
      }

      const estimatedSize = Math.floor(Math.random() * 10000) + 1000;
      segment.estimatedSize = estimatedSize;
      await segment.save();

      return estimatedSize;
    } catch (error) {
      logger.error(`Error estimating segment size ${segmentId}:`, error);
      throw error;
    }
  }
}

export default new SegmentService();