import { GuestTwin, IGuestTwin, IGuestPreferences, IStayHistory, ISentimentData } from '../models';
import { logger } from '../utils/logger';
import axios from 'axios';

export interface CreateGuestTwinDTO {
  guestId: string;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality?: string;
    dateOfBirth?: Date;
    vipStatus?: boolean;
    corporateAccount?: string;
  };
  preferences?: Partial<IGuestPreferences>;
  loyalty?: {
    tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    points?: number;
    lifetimePoints?: number;
    memberSince?: Date;
    benefits?: string[];
    qualifiedNights?: number;
  };
  tags?: string[];
}

export interface GuestTwinFilters {
  vipStatus?: boolean;
  tier?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export class GuestTwinService {
  /**
   * Create a new guest twin
   */
  async create(dto: CreateGuestTwinDTO): Promise<IGuestTwin> {
    logger.info(`Creating guest twin for guestId: ${dto.guestId}`);

    const existingTwin = await GuestTwin.findOne({ guestId: dto.guestId });
    if (existingTwin) {
      throw new Error(`Guest twin with guestId ${dto.guestId} already exists`);
    }

    const guestTwin = new GuestTwin({
      guestId: dto.guestId,
      profile: dto.profile,
      preferences: dto.preferences || {},
      loyalty: dto.loyalty || { tier: 'bronze', points: 0, lifetimePoints: 0, memberSince: new Date(), benefits: [], qualifiedNights: 0 },
      sentiment: { overallScore: 0, lastUpdated: new Date(), sources: [], positiveKeywords: [], negativeKeywords: [], recentMentions: [] },
      tags: dto.tags || [],
      status: 'active',
    });

    await guestTwin.save();
    logger.info(`Guest twin created successfully: ${guestTwin._id}`);
    return guestTwin;
  }

  /**
   * Get guest twin by ID
   */
  async getById(guestId: string): Promise<IGuestTwin | null> {
    logger.debug(`Getting guest twin for guestId: ${guestId}`);
    return GuestTwin.findOne({ guestId, status: { $ne: 'archived' } });
  }

  /**
   * Get guest twin by ID with external service enrichment
   */
  async getByIdEnriched(guestId: string): Promise<IGuestTwin | null> {
    const guestTwin = await this.getById(guestId);
    if (!guestTwin) return null;

    // Enrich with data from Guest Memory service
    try {
      const guestMemoryUrl = process.env.GUEST_MEMORY_SERVICE_URL;
      if (guestMemoryUrl) {
        const response = await axios.get(`${guestMemoryUrl}/api/guests/${guestId}`, {
          timeout: 5000,
        });
        if (response.data) {
          logger.debug(`Enriched guest twin from Guest Memory service`);
        }
      }
    } catch (error) {
      logger.warn(`Failed to enrich guest twin from Guest Memory service: ${error}`);
    }

    return guestTwin;
  }

  /**
   * Update guest preferences
   */
  async updatePreferences(guestId: string, preferences: Partial<IGuestPreferences>): Promise<IGuestTwin | null> {
    logger.info(`Updating preferences for guestId: ${guestId}`);

    const guestTwin = await GuestTwin.findOne({ guestId });
    if (!guestTwin) {
      throw new Error(`Guest twin not found for guestId: ${guestId}`);
    }

    // Update preferences using dot notation
    Object.keys(preferences).forEach((key) => {
      const value = preferences[key as keyof IGuestPreferences];
      if (value !== undefined) {
        (guestTwin.preferences as Record<string, unknown>)[key] = value;
      }
    });

    guestTwin.metadata.lastActivity = new Date();
    await guestTwin.save();

    logger.info(`Preferences updated for guestId: ${guestId}`);
    return guestTwin;
  }

  /**
   * Add stay history entry
   */
  async addStayHistory(guestId: string, stay: Omit<IStayHistory, 'propertyId' | 'propertyName' | 'roomId' | 'roomType' | 'checkIn' | 'checkOut'> & { propertyId: string; propertyName: string; roomId: string; roomType: string; checkIn: Date; checkOut: Date }): Promise<IGuestTwin | null> {
    logger.info(`Adding stay history for guestId: ${guestId}`);

    const guestTwin = await GuestTwin.findOne({ guestId });
    if (!guestTwin) {
      throw new Error(`Guest twin not found for guestId: ${guestId}`);
    }

    guestTwin.stayHistory.push(stay);

    // Update loyalty points based on stay
    if (stay.totalSpent) {
      const pointsEarned = Math.floor(stay.totalSpent / 10);
      guestTwin.loyalty.points += pointsEarned;
      guestTwin.loyalty.lifetimePoints += pointsEarned;
      guestTwin.loyalty.qualifiedNights += 1;
    }

    guestTwin.metadata.lastActivity = new Date();
    await guestTwin.save();

    logger.info(`Stay history added for guestId: ${guestId}`);
    return guestTwin;
  }

  /**
   * Update sentiment data
   */
  async updateSentiment(guestId: string, sentiment: Partial<ISentimentData>): Promise<IGuestTwin | null> {
    logger.info(`Updating sentiment for guestId: ${guestId}`);

    const guestTwin = await GuestTwin.findOne({ guestId });
    if (!guestTwin) {
      throw new Error(`Guest twin not found for guestId: ${guestId}`);
    }

    if (sentiment.overallScore !== undefined) {
      guestTwin.sentiment.overallScore = sentiment.overallScore;
    }
    if (sentiment.sources) {
      guestTwin.sentiment.sources = [...new Set([...guestTwin.sentiment.sources, ...sentiment.sources])];
    }
    if (sentiment.positiveKeywords) {
      guestTwin.sentiment.positiveKeywords = sentiment.positiveKeywords;
    }
    if (sentiment.negativeKeywords) {
      guestTwin.sentiment.negativeKeywords = sentiment.negativeKeywords;
    }
    if (sentiment.recentMentions) {
      guestTwin.sentiment.recentMentions = sentiment.recentMentions;
    }
    guestTwin.sentiment.lastUpdated = new Date();

    guestTwin.metadata.lastActivity = new Date();
    await guestTwin.save();

    logger.info(`Sentiment updated for guestId: ${guestId}`);
    return guestTwin;
  }

  /**
   * Query guest twins with filters
   */
  async query(filters: GuestTwinFilters): Promise<{ guests: IGuestTwin[]; total: number }> {
    const { vipStatus, tier, tag, limit = 20, offset = 0 } = filters;

    const query: Record<string, unknown> = { status: { $ne: 'archived' } };

    if (vipStatus !== undefined) {
      query['profile.vipStatus'] = vipStatus;
    }
    if (tier) {
      query['loyalty.tier'] = tier;
    }
    if (tag) {
      query.tags = tag;
    }

    const [guests, total] = await Promise.all([
      GuestTwin.find(query).skip(offset).limit(limit).sort({ 'metadata.lastActivity': -1 }),
      GuestTwin.countDocuments(query),
    ]);

    return { guests, total };
  }

  /**
   * Update loyalty information
   */
  async updateLoyalty(
    guestId: string,
    loyalty: Partial<IGuestTwin['loyalty']>
  ): Promise<IGuestTwin | null> {
    logger.info(`Updating loyalty for guestId: ${guestId}`);

    const guestTwin = await GuestTwin.findOne({ guestId });
    if (!guestTwin) {
      throw new Error(`Guest twin not found for guestId: ${guestId}`);
    }

    Object.keys(loyalty).forEach((key) => {
      const value = (loyalty as Record<string, unknown>)[key];
      if (value !== undefined) {
        (guestTwin.loyalty as Record<string, unknown>)[key] = value;
      }
    });

    guestTwin.metadata.lastActivity = new Date();
    await guestTwin.save();

    logger.info(`Loyalty updated for guestId: ${guestId}`);
    return guestTwin;
  }

  /**
   * Add tags to guest twin
   */
  async addTags(guestId: string, tags: string[]): Promise<IGuestTwin | null> {
    const guestTwin = await GuestTwin.findOne({ guestId });
    if (!guestTwin) {
      throw new Error(`Guest twin not found for guestId: ${guestId}`);
    }

    guestTwin.tags = [...new Set([...guestTwin.tags, ...tags])];
    guestTwin.metadata.lastActivity = new Date();
    await guestTwin.save();

    return guestTwin;
  }

  /**
   * Archive guest twin
   */
  async archive(guestId: string): Promise<IGuestTwin | null> {
    logger.info(`Archiving guest twin for guestId: ${guestId}`);

    const guestTwin = await GuestTwin.findOne({ guestId });
    if (!guestTwin) {
      throw new Error(`Guest twin not found for guestId: ${guestId}`);
    }

    guestTwin.status = 'archived';
    guestTwin.metadata.lastActivity = new Date();
    await guestTwin.save();

    logger.info(`Guest twin archived: ${guestId}`);
    return guestTwin;
  }

  /**
   * Get guest statistics
   */
  async getStatistics(): Promise<{
    totalGuests: number;
    activeGuests: number;
    vipGuests: number;
    tierDistribution: Record<string, number>;
    averageSentiment: number;
  }> {
    const stats = await GuestTwin.aggregate([
      {
        $facet: {
          counts: [
            { $count: 'totalGuests' },
            { $match: { status: 'active' } },
            { $count: 'activeGuests' },
            { $match: { 'profile.vipStatus': true } },
            { $count: 'vipGuests' },
          ],
          tierDistribution: [{ $group: { _id: '$loyalty.tier', count: { $sum: 1 } } }],
          avgSentiment: [{ $group: { _id: null, avg: { $avg: '$sentiment.overallScore' } } }],
        },
      },
    ]);

    const result = stats[0] || {};

    return {
      totalGuests: result.counts?.[0]?.totalGuests || 0,
      activeGuests: result.counts?.[1]?.activeGuests || 0,
      vipGuests: result.counts?.[2]?.vipGuests || 0,
      tierDistribution: Object.fromEntries(
        (result.tierDistribution || []).map((t: { _id: string; count: number }) => [t._id, t.count])
      ),
      averageSentiment: result.avgSentiment?.[0]?.avg || 0,
    };
  }
}

export const guestTwinService = new GuestTwinService();
