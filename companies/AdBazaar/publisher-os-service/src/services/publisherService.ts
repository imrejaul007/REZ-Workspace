import { v4 as uuidv4 } from 'uuid';
import { Publisher, IPublisher, IPublisherContact, IPublisherSettings } from '../models/index.js';
import { logger } from 'utils/logger.js';

export interface CreatePublisherInput {
  name: string;
  domains: string[];
  contact: IPublisherContact;
  category: string;
  logo?: string;
  description?: string;
  settings?: Partial<IPublisherSettings>;
}

export interface UpdatePublisherInput {
  name?: string;
  domains?: string[];
  contact?: IPublisherContact;
  category?: string;
  logo?: string;
  description?: string;
  settings?: Partial<IPublisherSettings>;
  status?: 'active' | 'suspended' | 'inactive';
}

export interface PublisherFilters {
  status?: string;
  verified?: boolean;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

class PublisherService {
  /**
   * Create a new publisher
   */
  async create(input: CreatePublisherInput): Promise<IPublisher> {
    const slug = this.generateSlug(input.name);
    const apiKey = this.generateApiKey();

    const publisher = new Publisher({
      ...input,
      slug,
      apiKey,
      settings: {
        defaultFloorPrice: 0.5,
        currency: 'USD',
        timezone: 'UTC',
        revenueShare: 70,
        paymentTerms: 'NET30',
        autoPay: true,
        headerBiddingEnabled: true,
        dealPriority: 'CPM',
        allowedAdTypes: ['banner', 'video', 'native'],
        blockedAdvertisers: [],
        blockedCategories: [],
        brandSafety: {
          enabled: true,
          level: 'Moderate',
          customFilters: []
        },
        pacing: {
          enabled: false,
          dailyLimit: 0,
          monthlyLimit: 0
        },
        ...input.settings
      }
    });

    await publisher.save();
    logger.info(`Publisher created: ${publisher._id}`, { name: publisher.name, slug });
    return publisher;
  }

  /**
   * Get publisher by ID
   */
  async getById(id: string): Promise<IPublisher | null> {
    return Publisher.findById(id);
  }

  /**
   * Get publisher by slug
   */
  async getBySlug(slug: string): Promise<IPublisher | null> {
    return Publisher.findOne({ slug });
  }

  /**
   * Get publisher by API key
   */
  async getByApiKey(apiKey: string): Promise<IPublisher | null> {
    return Publisher.findOne({ apiKey });
  }

  /**
   * List publishers with filters and pagination
   */
  async list(filters: PublisherFilters): Promise<{
    publishers: IPublisher[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.verified !== undefined) {
      query.verified = filters.verified;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { slug: { $regex: filters.search, $options: 'i' } },
        { domains: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    const [publishers, total] = await Promise.all([
      Publisher.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Publisher.countDocuments(query)
    ]);

    return {
      publishers,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Update publisher
   */
  async update(id: string, input: UpdatePublisherInput): Promise<IPublisher | null> {
    const publisher = await Publisher.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (publisher) {
      logger.info(`Publisher updated: ${id}`, { name: publisher.name });
    }

    return publisher;
  }

  /**
   * Verify publisher
   */
  async verify(
    id: string,
    status: 'approved' | 'rejected',
    notes?: string,
    verifiedBy?: string
  ): Promise<IPublisher | null> {
    const publisher = await Publisher.findByIdAndUpdate(
      id,
      {
        $set: {
          verificationStatus: status,
          verified: status === 'approved',
          verificationNotes: notes,
          verifiedAt: new Date(),
          verifiedBy
        }
      },
      { new: true }
    );

    if (publisher) {
      logger.info(`Publisher ${status}: ${id}`, { name: publisher.name });
    }

    return publisher;
  }

  /**
   * Suspend publisher
   */
  async suspend(id: string, reason: string): Promise<IPublisher | null> {
    return this.update(id, {
      status: 'suspended',
      suspensionReason: reason,
      suspendedAt: new Date()
    });
  }

  /**
   * Reactivate publisher
   */
  async reactivate(id: string): Promise<IPublisher | null> {
    return this.update(id, {
      status: 'active',
      suspendedAt: undefined,
      suspensionReason: undefined
    });
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(id: string): Promise<string | null> {
    const newApiKey = this.generateApiKey();
    const publisher = await Publisher.findByIdAndUpdate(
      id,
      { $set: { apiKey: newApiKey } },
      { new: true }
    );

    if (publisher) {
      logger.info(`API key regenerated for publisher: ${id}`);
    }

    return publisher ? newApiKey : null;
  }

  /**
   * Update publisher stats
   */
  async updateStats(
    id: string,
    stats: Partial<IPublisher['stats']>
  ): Promise<void> {
    await Publisher.findByIdAndUpdate(id, {
      $inc: {
        'stats.totalImpressions': stats.totalImpressions || 0,
        'stats.totalRevenue': stats.totalRevenue || 0
      },
      $set: {
        'stats.fillRate': stats.fillRate,
        'stats.avgEcpm': stats.avgEcpm,
        'stats.activePlacements': stats.activePlacements
      }
    });
  }

  /**
   * Get publisher categories
   */
  async getCategories(): Promise<string[]> {
    const categories = await Publisher.distinct('category');
    return categories.filter(Boolean);
  }

  /**
   * Generate unique slug from name
   */
  private generateSlug(name: string): string {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return slug;
  }

  /**
   * Generate secure API key
   */
  private generateApiKey(): string {
    return `pub_${uuidv4().replace(/-/g, '')}`;
  }
}

export const publisherService = new PublisherService();
