import { v4 as uuidv4 } from 'uuid';
import { ImpressionModel, ClickModel } from '../models/index.js';
import { publisherService } from './publisherService.js';
import type { Impression, Click } from '../types/index.js';

export class TrackingService {
  /**
   * Record an impression
   */
  async recordImpression(data: {
    requestId: string;
    adId: string;
    placementId: string;
    appId: string;
    publisherId: string;
    viewable?: boolean;
    viewableTime?: number;
  }): Promise<Impression> {
    const impressionId = `imp_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    const impression = await ImpressionModel.create({
      impressionId,
      requestId: data.requestId,
      adId: data.adId,
      placementId: data.placementId,
      appId: data.appId,
      publisherId: data.publisherId,
      timestamp: new Date(),
      viewable: data.viewable || false,
      viewableTime: data.viewableTime,
    });

    // Update publisher stats
    await publisherService.updateStats(data.publisherId, {
      impressions: 1,
      earnings: 0.001, // Example ECPM
    });

    return this.toImpression(impression);
  }

  /**
   * Record a click
   */
  async recordClick(data: {
    impressionId: string;
    requestId: string;
    adId: string;
    placementId: string;
    appId: string;
    publisherId: string;
    deviceType?: string;
  }): Promise<Click> {
    const clickId = `clk_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    const click = await ClickModel.create({
      clickId,
      impressionId: data.impressionId,
      requestId: data.requestId,
      adId: data.adId,
      placementId: data.placementId,
      appId: data.appId,
      publisherId: data.publisherId,
      timestamp: new Date(),
      deviceType: data.deviceType || 'mobile',
    });

    // Update publisher stats
    await publisherService.updateStats(data.publisherId, {
      clicks: 1,
      earnings: 0.05, // Higher value for clicks
    });

    return this.toClick(click);
  }

  /**
   * Get impression by ID
   */
  async getImpression(impressionId: string): Promise<Impression | null> {
    const impression = await ImpressionModel.findOne({ impressionId });
    return impression ? this.toImpression(impression) : null;
  }

  /**
   * Get click by ID
   */
  async getClick(clickId: string): Promise<Click | null> {
    const click = await ClickModel.findOne({ clickId });
    return click ? this.toClick(click) : null;
  }

  /**
   * Get impressions by publisher
   */
  async getImpressionsByPublisher(
    publisherId: string,
    options: { page?: number; limit?: number; startDate?: Date; endDate?: Date }
  ): Promise<{ impressions: Impression[]; total: number }> {
    const { page = 1, limit = 100, startDate, endDate } = options;

    const query: Record<string, unknown> = { publisherId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) (query.timestamp as Record<string, Date>).$gte = startDate;
      if (endDate) (query.timestamp as Record<string, Date>).$lte = endDate;
    }

    const [impressions, total] = await Promise.all([
      ImpressionModel.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ImpressionModel.countDocuments(query),
    ]);

    return {
      impressions: impressions.map((i) => this.toImpression(i)),
      total,
    };
  }

  /**
   * Get clicks by publisher
   */
  async getClicksByPublisher(
    publisherId: string,
    options: { page?: number; limit?: number; startDate?: Date; endDate?: Date }
  ): Promise<{ clicks: Click[]; total: number }> {
    const { page = 1, limit = 100, startDate, endDate } = options;

    const query: Record<string, unknown> = { publisherId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) (query.timestamp as Record<string, Date>).$gte = startDate;
      if (endDate) (query.timestamp as Record<string, Date>).$lte = endDate;
    }

    const [clicks, total] = await Promise.all([
      ClickModel.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ClickModel.countDocuments(query),
    ]);

    return {
      clicks: clicks.map((c) => this.toClick(c)),
      total,
    };
  }

  /**
   * Get impression/click stats
   */
  async getStats(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    impressions: number;
    clicks: number;
    CTR: number;
    viewableRate: number;
  }> {
    const impressions = await ImpressionModel.find({
      publisherId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const clicks = await ClickModel.find({
      publisherId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const viewableImpressions = impressions.filter((i) => i.viewable).length;
    const totalImpressions = impressions.length;

    return {
      impressions: totalImpressions,
      clicks: clicks.length,
      CTR: totalImpressions > 0 ? (clicks.length / totalImpressions) * 100 : 0,
      viewableRate: totalImpressions > 0 ? (viewableImpressions / totalImpressions) * 100 : 0,
    };
  }

  /**
   * Convert document to Impression type
   */
  private toImpression(doc: any): Impression {
    return {
      impressionId: doc.impressionId,
      requestId: doc.requestId,
      adId: doc.adId,
      placementId: doc.placementId,
      appId: doc.appId,
      publisherId: doc.publisherId,
      timestamp: doc.timestamp,
      viewable: doc.viewable,
      viewableTime: doc.viewableTime,
    };
  }

  /**
   * Convert document to Click type
   */
  private toClick(doc: any): Click {
    return {
      clickId: doc.clickId,
      impressionId: doc.impressionId,
      requestId: doc.requestId,
      adId: doc.adId,
      placementId: doc.placementId,
      appId: doc.appId,
      publisherId: doc.publisherId,
      timestamp: doc.timestamp,
      deviceType: doc.deviceType,
    };
  }
}

export const trackingService = new TrackingService();