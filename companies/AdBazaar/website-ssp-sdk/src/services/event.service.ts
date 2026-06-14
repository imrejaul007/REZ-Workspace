import { ImpressionModel, ClickModel, IImpression, IClick, PublisherModel } from '../models/index.js';
import { TrackImpressionRequest, TrackClickRequest } from '../types/index.js';
import { generateEventId, createLogger } from '../utils/index.js';
import { config } from '../config/index.js';

const logger = createLogger('EventService');

export class EventService {
  async trackImpression(
    publisherId: string,
    data: TrackImpressionRequest
  ): Promise<IImpression> {
    logger.debug(`Tracking impression for placement: ${data.placementId}`);

    const eventId = generateEventId();

    const impression = new ImpressionModel({
      eventId,
      placementId: data.placementId,
      publisherId,
      adId: data.adId,
      timestamp: new Date(),
      metadata: data.metadata,
    });

    await impression.save();

    // Update publisher stats
    await PublisherModel.updateOne(
      { publisherId },
      { $inc: { 'stats.totalImpressions': 1 } }
    );

    logger.info(`Impression tracked: ${eventId}`);
    return impression;
  }

  async trackClick(
    publisherId: string,
    impressionId: string,
    data: TrackClickRequest
  ): Promise<IClick> {
    logger.debug(`Tracking click for impression: ${impressionId}`);

    const eventId = generateEventId();

    const click = new ClickModel({
      eventId,
      impressionId,
      placementId: data.placementId,
      publisherId,
      adId: data.adId,
      timestamp: new Date(),
      metadata: data.metadata,
    });

    await click.save();

    // Update publisher stats
    await PublisherModel.updateOne(
      { publisherId },
      { $inc: { 'stats.totalClicks': 1 } }
    );

    logger.info(`Click tracked: ${eventId}`);
    return click;
  }

  async getImpressionById(eventId: string): Promise<IImpression | null> {
    return ImpressionModel.findOne({ eventId });
  }

  async getImpressionsByPublisher(
    publisherId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number }
  ): Promise<IImpression[]> {
    const query: Record<string, unknown> = { publisherId };

    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        (query.timestamp as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.timestamp as Record<string, Date>).$lte = options.endDate;
      }
    }

    return ImpressionModel.find(query)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 1000);
  }

  async getClicksByPublisher(
    publisherId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number }
  ): Promise<IClick[]> {
    const query: Record<string, unknown> = { publisherId };

    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        (query.timestamp as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.timestamp as Record<string, Date>).$lte = options.endDate;
      }
    }

    return ClickModel.find(query)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 1000);
  }

  async calculateEarnings(
    publisherId: string,
    impressions: number,
    cpm: number = config.sdk.defaultMinCPM
  ): Promise<number> {
    return (impressions / 1000) * cpm * config.sdk.defaultPayoutRate;
  }
}

export const eventService = new EventService();