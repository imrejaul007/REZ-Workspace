import { PublisherModel, IPublisher } from '../models/index.js';
import { CreatePublisherRequest, Publisher } from '../types/index.js';
import { generatePublisherId, generateAPIKey, createLogger } from '../utils/index.js';
import { config } from '../config/index.js';

const logger = createLogger('PublisherService');

export class PublisherService {
  async createPublisher(data: CreatePublisherRequest): Promise<IPublisher> {
    logger.info(`Creating publisher: ${data.name}`);

    const publisherId = generatePublisherId();
    const apiKey = generateAPIKey();

    const publisher = new PublisherModel({
      publisherId,
      name: data.name,
      website: data.website,
      category: data.category,
      contact: data.contact,
      settings: {
        adFormats: data.settings?.adFormats || ['banner', 'rectangle'],
        minCPM: data.settings?.minCPM || config.sdk.defaultMinCPM,
        headerBidding: data.settings?.headerBidding || false,
      },
      stats: {
        totalImpressions: 0,
        totalClicks: 0,
        totalEarnings: 0,
        pendingPayout: 0,
      },
      status: data.status || 'pending',
    });

    await publisher.save();
    logger.info(`Publisher created: ${publisherId}`);

    return publisher;
  }

  async getPublisherById(publisherId: string): Promise<IPublisher | null> {
    logger.debug(`Getting publisher: ${publisherId}`);
    return PublisherModel.findOne({ publisherId });
  }

  async getPublisherByApiKey(apiKey: string): Promise<IPublisher | null> {
    // For API key validation, we need to check the API key stored with publisher
    // This would require adding an apiKey field to the model
    logger.debug(`Getting publisher by API key`);
    return PublisherModel.findOne({ apiKey });
  }

  async updatePublisher(publisherId: string, updates: Partial<Publisher>): Promise<IPublisher | null> {
    logger.info(`Updating publisher: ${publisherId}`);

    const publisher = await PublisherModel.findOneAndUpdate(
      { publisherId },
      { $set: updates },
      { new: true }
    );

    if (publisher) {
      logger.info(`Publisher updated: ${publisherId}`);
    }

    return publisher;
  }

  async updatePublisherStatus(publisherId: string, status: 'active' | 'pending' | 'suspended'): Promise<IPublisher | null> {
    logger.info(`Updating publisher status: ${publisherId} -> ${status}`);

    return PublisherModel.findOneAndUpdate(
      { publisherId },
      { $set: { status } },
      { new: true }
    );
  }

  async updatePublisherStats(publisherId: string, stats: Partial<Publisher['stats']>): Promise<IPublisher | null> {
    logger.debug(`Updating publisher stats: ${publisherId}`);

    return PublisherModel.findOneAndUpdate(
      { publisherId },
      { $inc: Object.fromEntries(
        Object.entries(stats).map(([key, value]) => [`stats.${key}`, value as number])
      ) },
      { new: true }
    );
  }

  async getPublisherEarnings(publisherId: string): Promise<{
    publisherId: string;
    totalEarnings: number;
    pendingPayout: number;
    paidOut: number;
    impressions: number;
    clicks: number;
    ctr: number;
    avgCPM: number;
    lastUpdated: Date;
  }> {
    logger.debug(`Getting earnings for publisher: ${publisherId}`);

    const publisher = await PublisherModel.findOne({ publisherId });
    if (!publisher) {
      throw new Error('Publisher not found');
    }

    const stats = publisher.stats;
    const ctr = stats.totalImpressions > 0
      ? (stats.totalClicks / stats.totalImpressions) * 100
      : 0;
    const avgCPM = stats.totalImpressions > 0
      ? (stats.totalEarnings / stats.totalImpressions) * 1000
      : 0;

    return {
      publisherId,
      totalEarnings: stats.totalEarnings,
      pendingPayout: stats.pendingPayout,
      paidOut: stats.totalEarnings - stats.pendingPayout,
      impressions: stats.totalImpressions,
      clicks: stats.totalClicks,
      ctr: Math.round(ctr * 100) / 100,
      avgCPM: Math.round(avgCPM * 100) / 100,
      lastUpdated: publisher.updatedAt,
    };
  }

  async listPublishers(filter?: { status?: string; category?: string }): Promise<IPublisher[]> {
    logger.debug(`Listing publishers with filter: ${JSON.stringify(filter)}`);

    const query: Record<string, unknown> = {};
    if (filter?.status) query.status = filter.status;
    if (filter?.category) query.category = filter.category;

    return PublisherModel.find(query).sort({ createdAt: -1 });
  }

  async deletePublisher(publisherId: string): Promise<boolean> {
    logger.info(`Deleting publisher: ${publisherId}`);

    const result = await PublisherModel.deleteOne({ publisherId });
    return result.deletedCount > 0;
  }
}

export const publisherService = new PublisherService();