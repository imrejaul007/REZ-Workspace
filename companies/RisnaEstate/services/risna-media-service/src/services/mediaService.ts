import { Campaign, ICampaign, Influencer, IInfluencer, PropertyAd, IPropertyAd, CampaignStatus, InfluencerTier } from '../models/Media';
import { logger } from '../config/logger';

export interface CreateCampaignInput {
  name: string;
  type: string;
  brokerId?: string;
  propertyId?: string;
  budget: number;
  targeting?: {
    countries?: string[];
    cities?: string[];
    segments?: string[];
    ageMin?: number;
    ageMax?: number;
    interests?: string[];
  };
  creatives: Array<{
    type: 'image' | 'video' | 'carousel';
    url: string;
    headline?: string;
    cta?: string;
  }>;
  startDate: string | Date;
  endDate?: string | Date;
}

export interface CreateInfluencerInput {
  userId: string;
  name: string;
  phone: string;
  email?: string;
  platform: string;
  handle: string;
  followers: number;
  niche: string[];
  location?: string;
}

export interface CreatePropertyAdInput {
  propertyId: string;
  brokerId: string;
  type: string;
  budget: number;
  startDate: string | Date;
  endDate?: string | Date;
}

export class MediaService {
  // Campaigns

  async createCampaign(input: CreateCampaignInput): Promise<ICampaign> {
    const campaign = new Campaign({
      ...input,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate as string) : undefined,
      status: CampaignStatus.DRAFT,
      metrics: {
        impressions: 0,
        clicks: 0,
        leads: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        roas: 0
      }
    });
    await campaign.save();
    logger.info('Campaign created', { campaignId: campaign._id, name: input.name });
    return campaign;
  }

  async getCampaign(id: string): Promise<ICampaign | null> {
    return Campaign.findOne({ _id: id, deletedAt: null });
  }

  async getCampaigns(filters: {
    brokerId?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ campaigns: ICampaign[]; total: number }> {
    const { brokerId, type, status, page = 1, limit = 20 } = filters;
    const query: Record<string, any> = { deletedAt: null };
    if (brokerId) query.brokerId = brokerId;
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [campaigns, total] = await Promise.all([
      Campaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Campaign.countDocuments(query)
    ]);
    return { campaigns: campaigns as ICampaign[], total };
  }

  async activateCampaign(id: string): Promise<ICampaign | null> {
    return Campaign.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: CampaignStatus.ACTIVE } },
      { new: true }
    );
  }

  async pauseCampaign(id: string): Promise<ICampaign | null> {
    return Campaign.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: CampaignStatus.PAUSED } },
      { new: true }
    );
  }

  async updateCampaignMetrics(id: string, metrics: {
    impressions?: number;
    clicks?: number;
    leads?: number;
    conversions?: number;
  }): Promise<ICampaign | null> {
    const campaign = await Campaign.findById(id);
    if (!campaign) return null;

    const updates: any = { ...metrics };
    if (metrics.clicks && metrics.impressions) {
      updates['metrics.ctr'] = (metrics.clicks / metrics.impressions) * 100;
    }
    if (metrics.spent && metrics.clicks) {
      updates['metrics.cpc'] = metrics.spent / metrics.clicks;
    }

    return Campaign.findByIdAndUpdate(id, { $inc: updates }, { new: true });
  }

  // Influencers

  async registerInfluencer(input: CreateInfluencerInput): Promise<IInfluencer> {
    const tier = this.calculateTier(input.followers);
    const payoutRate = this.calculatePayoutRate(tier);

    const influencer = new Influencer({
      ...input,
      tier,
      payoutRate,
      verified: false,
      stats: {
        totalCampaigns: 0,
        totalLeads: 0,
        totalConversions: 0,
        avgEngagement: 0,
        rating: 0
      },
      status: 'active'
    });
    await influencer.save();
    logger.info('Influencer registered', { influencerId: influencer._id, handle: input.handle });
    return influencer;
  }

  async getInfluencer(id: string): Promise<IInfluencer | null> {
    return Influencer.findOne({ _id: id, deletedAt: null });
  }

  async getInfluencers(filters: {
    tier?: string;
    platform?: string;
    niche?: string;
    minFollowers?: number;
    page?: number;
    limit?: number;
  }): Promise<{ influencers: IInfluencer[]; total: number }> {
    const { tier, platform, niche, minFollowers, page = 1, limit = 20 } = filters;
    const query: Record<string, any> = { deletedAt: null, status: 'active' };
    if (tier) query.tier = tier;
    if (platform) query.platform = platform;
    if (niche) query.niche = niche;
    if (minFollowers) query.followers = { $gte: minFollowers };

    const skip = (page - 1) * limit;
    const [influencers, total] = await Promise.all([
      Influencer.find(query).sort({ stats.rating: -1, followers: -1 }).skip(skip).limit(limit).lean(),
      Influencer.countDocuments(query)
    ]);
    return { influencers: influencers as IInfluencer[], total };
  }

  async updateInfluencerStats(id: string, leads: number, conversions: number): Promise<IInfluencer | null> {
    const influencer = await Influencer.findById(id);
    if (!influencer) return null;

    influencer.stats.totalLeads += leads;
    influencer.stats.totalConversions += conversions;
    await influencer.save();
    return influencer;
  }

  // Property Ads

  async createPropertyAd(input: CreatePropertyAdInput): Promise<IPropertyAd> {
    const ad = new PropertyAd({
      ...input,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate as string) : undefined,
      status: 'active'
    });
    await ad.save();
    logger.info('Property ad created', { adId: ad._id, propertyId: input.propertyId });
    return ad;
  }

  async getPropertyAd(id: string): Promise<IPropertyAd | null> {
    return PropertyAd.findOne({ _id: id, deletedAt: null });
  }

  async getPropertyAds(filters: {
    brokerId?: string;
    propertyId?: string;
    type?: string;
    status?: string;
  }): Promise<{ ads: IPropertyAd[]; total: number }> {
    const query: Record<string, any> = { deletedAt: null };
    if (filters.brokerId) query.brokerId = filters.brokerId;
    if (filters.propertyId) query.propertyId = filters.propertyId;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;

    const [ads, total] = await Promise.all([
      PropertyAd.find(query).sort({ createdAt: -1 }).lean(),
      PropertyAd.countDocuments(query)
    ]);
    return { ads: ads as IPropertyAd[], total };
  }

  async updatePropertyAdMetrics(id: string, metrics: {
    impressions?: number;
    clicks?: number;
    leads?: number;
    spent?: number;
  }): Promise<IPropertyAd | null> {
    return PropertyAd.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $inc: metrics },
      { new: true }
    );
  }

  async pausePropertyAd(id: string): Promise<IPropertyAd | null> {
    return PropertyAd.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'paused' } },
      { new: true }
    );
  }

  // Analytics

  async getPropertyAdAnalytics(propertyId: string): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalLeads: number;
    avgCtr: number;
    activeAds: number;
  }> {
    const ads = await PropertyAd.find({ propertyId, deletedAt: null }).lean();
    const activeAds = ads.filter(a => a.status === 'active').length;
    const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
    const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const totalLeads = ads.reduce((sum, a) => sum + (a.leads || 0), 0);

    return {
      totalImpressions,
      totalClicks,
      totalLeads,
      avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      activeAds
    };
  }

  async getROIAnalytics(brokerId: string): Promise<{
    totalSpent: number;
    totalLeads: number;
    totalConversions: number;
    avgCostPerLead: number;
    roas: number;
  }> {
    const [campaigns, ads] = await Promise.all([
      Campaign.find({ brokerId, deletedAt: null }).lean(),
      PropertyAd.find({ brokerId, deletedAt: null }).lean()
    ]);

    const totalSpent = (campaigns.reduce((sum, c) => sum + (c.spent || 0), 0) +
                       ads.reduce((sum, a) => sum + (a.spent || 0), 0));
    const totalLeads = (campaigns.reduce((sum, c) => sum + ((c.metrics?.leads) || 0), 0) +
                       ads.reduce((sum, a) => sum + (a.leads || 0), 0));
    const totalConversions = campaigns.reduce((sum, c) => sum + ((c.metrics?.conversions) || 0), 0);

    return {
      totalSpent,
      totalLeads,
      totalConversions,
      avgCostPerLead: totalLeads > 0 ? totalSpent / totalLeads : 0,
      roas: totalSpent > 0 ? (totalConversions * 50000) / totalSpent : 0 // Assuming avg deal value of 50K
    };
  }

  // Private methods

  private calculateTier(followers: number): InfluencerTier {
    if (followers >= 1000000) return InfluencerTier.CELEBRITY;
    if (followers >= 100000) return InfluencerTier.MEGA;
    if (followers >= 10000) return InfluencerTier.MACRO;
    return InfluencerTier.MICRO;
  }

  private calculatePayoutRate(tier: InfluencerTier): number {
    switch (tier) {
      case InfluencerTier.CELEBRITY: return 50000;
      case InfluencerTier.MEGA: return 20000;
      case InfluencerTier.MACRO: return 5000;
      case InfluencerTier.MICRO: return 1000;
      default: return 1000;
    }
  }
}

export const mediaService = new MediaService();
