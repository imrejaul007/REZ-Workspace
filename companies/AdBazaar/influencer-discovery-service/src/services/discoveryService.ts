import { Influencer, IInfluencer } from '../models/Influencer';
import { Match } from '../models/Match';
import { Audience } from '../models/Audience';
import { logger } from '../utils/logger';
import { searchQueriesTotal, influencersDiscovered } from '../utils/metrics';

export interface SearchFilters {
  niche?: string[];
  platform?: string[];
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  location?: string;
  language?: string[];
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  minScore?: number;
  tags?: string[];
}

export interface DiscoveryResult {
  influencers: IInfluencer[];
  total: number;
  page: number;
  limit: number;
  matches: Map<string, number>;
}

export class DiscoveryService {
  /**
   * Create a new influencer profile
   */
  async createInfluencer(data: Partial<IInfluencer>): Promise<IInfluencer> {
    try {
      const influencer = new Influencer(data);
      await influencer.save();
      influencersDiscovered.inc();
      logger.info('Influencer created', { influencerId: influencer._id });
      return influencer;
    } catch (error) {
      logger.error('Failed to create influencer', { error, data });
      throw error;
    }
  }

  /**
   * Get influencer by ID
   */
  async getInfluencerById(id: string): Promise<IInfluencer | null> {
    return Influencer.findById(id).exec();
  }

  /**
   * Get all influencers with pagination
   */
  async getAllInfluencers(page: number = 1, limit: number = 20): Promise<{ influencers: IInfluencer[]; total: number }> {
    const skip = (page - 1) * limit;
    const [influencers, total] = await Promise.all([
      Influencer.find().skip(skip).limit(limit).sort({ score: -1 }).exec(),
      Influencer.countDocuments().exec()
    ]);
    return { influencers, total };
  }

  /**
   * Search influencers with filters
   */
  async searchInfluencers(filters: SearchFilters, page: number = 1, limit: number = 20): Promise<DiscoveryResult> {
    const query: any = {};

    if (filters.niche?.length) {
      query.niche = { $in: filters.niche };
    }

    if (filters.platform?.length) {
      query['platforms.platform'] = { $in: filters.platform };
    }

    if (filters.minFollowers || filters.maxFollowers) {
      query['platforms.followers'] = {};
      if (filters.minFollowers) query['platforms.followers'].$gte = filters.minFollowers;
      if (filters.maxFollowers) query['platforms.followers'].$lte = filters.maxFollowers;
    }

    if (filters.minEngagementRate) {
      query['platforms.engagementRate'] = { $gte: filters.minEngagementRate };
    }

    if (filters.location) {
      query.location = { $regex: filters.location, $options: 'i' };
    }

    if (filters.language?.length) {
      query.language = { $in: filters.language };
    }

    if (filters.verificationStatus) {
      query.verificationStatus = filters.verificationStatus;
    }

    if (filters.minScore) {
      query.score = { $gte: filters.minScore };
    }

    if (filters.tags?.length) {
      query.tags = { $in: filters.tags };
    }

    const skip = (page - 1) * limit;
    const [influencers, total] = await Promise.all([
      Influencer.find(query).skip(skip).limit(limit).sort({ score: -1 }).exec(),
      Influencer.countDocuments(query).exec()
    ]);

    // Track metrics
    filters.niche?.forEach(n => {
      filters.platform?.forEach(p => {
        searchQueriesTotal.inc({ niche: n, platform: p });
      });
    });

    return {
      influencers,
      total,
      page,
      limit,
      matches: new Map()
    };
  }

  /**
   * Get influencer profile with all details
   */
  async getInfluencerProfile(id: string): Promise<any> {
    const influencer = await Influencer.findById(id).exec();
    if (!influencer) return null;

    const [audience, matches] = await Promise.all([
      Audience.find({ influencerId: id }).exec(),
      Match.find({ influencerId: id }).sort({ matchScore: -1 }).limit(10).exec()
    ]);

    return {
      influencer,
      audience,
      recentMatches: matches,
      platformBreakdown: influencer.platforms.map(p => ({
        platform: p.platform,
        followers: p.followers,
        engagementRate: p.engagementRate
      }))
    };
  }

  /**
   * Match influencers to a campaign
   */
  async matchInfluencersToCampaign(campaignId: string, requirements: {
    niche?: string[];
    platform?: string[];
    minFollowers?: number;
    minEngagementRate?: number;
    budget?: number;
    targetAudience?: any;
  }): Promise<{ matches: any[]; total: number }> {
    const matches: any[] = [];

    // Build search query
    const filters: SearchFilters = {};
    if (requirements.niche) filters.niche = requirements.niche;
    if (requirements.platform) filters.platform = requirements.platform;
    if (requirements.minFollowers) filters.minFollowers = requirements.minFollowers;
    if (requirements.minEngagementRate) filters.minEngagementRate = requirements.minEngagementRate;
    filters.verificationStatus = 'verified';

    const result = await this.searchInfluencers(filters, 1, 100);

    // Calculate match scores
    for (const influencer of result.influencers) {
      const score = this.calculateMatchScore(influencer, requirements);
      matches.push({ influencer, matchScore: score });
    }

    // Sort by score and create match records
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Save top matches to database
    const topMatches = matches.slice(0, 20);
    await Promise.all(topMatches.map(async (m) => {
      await Match.create({
        influencerId: m.influencer._id,
        campaignId,
        matchScore: m.matchScore,
        matchFactors: {
          nicheAlignment: m.matchScore * 0.3,
          audienceAlignment: m.matchScore * 0.3,
          engagementAlignment: m.matchScore * 0.2,
          priceAlignment: m.matchScore * 0.2
        },
        reasons: [`Match score: ${m.matchScore}%`]
      });
    }));

    return { matches: topMatches, total: matches.length };
  }

  /**
   * Calculate match score based on requirements
   */
  private calculateMatchScore(influencer: IInfluencer, requirements: any): number {
    let score = 0;
    const factors = {
      niche: 30,
      audience: 30,
      engagement: 20,
      price: 20
    };

    // Niche alignment
    if (requirements.niche?.length) {
      const nicheMatch = influencer.niche.filter(n =>
        requirements.niche.includes(n)
      ).length;
      score += (nicheMatch / requirements.niche.length) * factors.niche;
    } else {
      score += factors.niche;
    }

    // Engagement rate
    const avgEngagement = influencer.platforms.reduce((sum, p) =>
      sum + (p.engagementRate || 0), 0
    ) / (influencer.platforms.length || 1);

    if (requirements.minEngagementRate) {
      score += Math.min(avgEngagement / requirements.minEngagementRate, 1) * factors.engagement;
    } else {
      score += Math.min(avgEngagement / 5, 1) * factors.engagement;
    }

    // Follower count
    const totalFollowers = influencer.platforms.reduce((sum, p) => sum + p.followers, 0);
    if (requirements.minFollowers) {
      score += Math.min(totalFollowers / requirements.minFollowers, 1) * factors.audience;
    } else {
      score += factors.audience;
    }

    // Budget fit
    if (requirements.budget && influencer.rates) {
      const avgRate = Object.values(influencer.rates).reduce((a, b) => (a || 0) + (b || 0), 0) /
        Object.values(influencer.rates).length;
      score += Math.min(requirements.budget / avgRate, 1) * factors.price;
    } else {
      score += factors.price;
    }

    // Verification bonus
    if (influencer.verificationStatus === 'verified') {
      score *= 1.1;
    }

    return Math.min(Math.round(score * 10) / 10, 100);
  }

  /**
   * Update influencer
   */
  async updateInfluencer(id: string, data: Partial<IInfluencer>): Promise<IInfluencer | null> {
    return Influencer.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  /**
   * Delete influencer
   */
  async deleteInfluencer(id: string): Promise<boolean> {
    const result = await Influencer.findByIdAndDelete(id).exec();
    if (result) {
      await Promise.all([
        Match.deleteMany({ influencerId: id }).exec(),
        Audience.deleteMany({ influencerId: id }).exec()
      ]);
    }
    return !!result;
  }
}

export const discoveryService = new DiscoveryService();
