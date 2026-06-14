import { Wedding } from '../models/Wedding';
import { Guest } from '../models/Guest';
import { Vendor } from '../models/Vendor';
import { Campaign } from '../models/WeddingAnalytics';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface TargetingData {
  weddingId: string;
  audience: {
    size: number;
    demographics: {
      ageRange: { min: number; max: number };
      gender: string[];
      locations: string[];
    };
    interests: string[];
    behaviors: string[];
  };
  targeting: {
    platforms: string[];
    adFormats: string[];
    budget: {
      recommended: number;
      min: number;
      max: number;
    };
    duration: {
      startDate: Date;
      endDate: Date;
      weeks: number;
    };
  };
  segments: {
    primary: AudienceSegment;
    secondary: AudienceSegment[];
    lookalike: LookalikeAudience[];
  };
  recommendations: TargetingRecommendation[];
}

export interface AudienceSegment {
  name: string;
  size: number;
  description: string;
  characteristics: string[];
}

export interface LookalikeAudience {
  source: string;
  similarity: number;
  estimatedSize: number;
}

export interface TargetingRecommendation {
  type: 'platform' | 'format' | 'timing' | 'budget' | 'creative';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  expectedImpact: string;
}

class TargetingService {
  /**
   * Get comprehensive targeting data for a wedding
   */
  async getTargetingData(weddingId: string): Promise<TargetingData | null> {
    try {
      const wedding = await Wedding.findOne({ weddingId });
      if (!wedding) return null;

      const [guests, vendors, campaigns] = await Promise.all([
        Guest.find({ weddingId }),
        Vendor.find({ weddingId }),
        Campaign.find({ weddingId })
      ]);

      const audience = this.buildAudience(wedding, guests);
      const segments = this.buildSegments(wedding, guests, vendors);
      const recommendations = this.generateRecommendations(wedding, guests, audience);

      return {
        weddingId,
        audience,
        targeting: this.buildTargetingConfig(wedding, audience),
        segments,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting targeting data:', error);
      throw error;
    }
  }

  /**
   * Build audience profile
   */
  private buildAudience(wedding: any, guests: any[]): TargetingData['audience'] {
    const locations: string[] = [];
    const interests: string[] = [];
    const behaviors: string[] = [];

    // Extract locations from guests
    guests.forEach((guest) => {
      if (guest.address?.city) locations.push(guest.address.city);
      if (guest.address?.state) locations.push(guest.address.state);
    });

    // Add wedding-specific interests
    if (wedding.theme) interests.push(wedding.theme);
    if (wedding.style) interests.push(wedding.style);

    // Common wedding interests
    interests.push('Wedding Planning');
    interests.push('Wedding Photography');
    interests.push('Wedding Catering');
    interests.push('Bridal Fashion');
    interests.push('Wedding Decor');

    // Behavioral signals
    if (guests.length > 50) behaviors.push('High-value wedding (50+ guests)');
    if (wedding.budget?.total > 500000) behaviors.push('Premium budget segment');
    if (wedding.venue?.capacity) behaviors.push('Large venue capacity');

    // Calculate age range from wedding style
    const ageRange = {
      min: 25,
      max: 45
    };

    return {
      size: wedding.guestCount?.expected || guests.length,
      demographics: {
        ageRange,
        gender: ['male', 'female'],
        locations: [...new Set(locations)].slice(0, 20)
      },
      interests: [...new Set(interests)],
      behaviors: [...new Set(behaviors)]
    };
  }

  /**
   * Build audience segments
   */
  private buildSegments(
    wedding: any,
    guests: any[],
    vendors: any[]
  ): TargetingData['segments'] {
    // Primary segment - Close family and friends
    const closeContacts = guests.filter((g) =>
      ['family', 'friend'].includes(g.category) && g.rsvp === 'confirmed'
    );

    // Secondary segments
    const colleagueGuests = guests.filter((g) => g.category === 'colleague');
    const outOfTownGuests = guests.filter((g) => {
      if (!g.address?.city) return false;
      return g.address.city.toLowerCase() !== wedding.venue?.city?.toLowerCase();
    });

    // Lookalike audiences
    const lookalikes: LookalikeAudience[] = [];

    if (closeContacts.length >= 30) {
      lookalikes.push({
        source: 'confirmed_guests',
        similarity: 0.85,
        estimatedSize: closeContacts.length * 10
      });
    }

    if (wedding.venue?.city) {
      lookalikes.push({
        source: `wedding_venue_${wedding.venue.city}`,
        similarity: 0.75,
        estimatedSize: 1000
      });
    }

    return {
      primary: {
        name: 'Close Contacts',
        size: closeContacts.length,
        description: 'Family members and confirmed friends',
        characteristics: [
          'High engagement probability',
          'Personal relationships',
          'Gift-giving likelihood'
        ]
      },
      secondary: [
        {
          name: 'Colleagues',
          size: colleagueGuests.length,
          description: 'Work colleagues and business associates',
          characteristics: [
            'Professional relationship',
            'Potential networking',
            'Corporate gift options'
          ]
        },
        {
          name: 'Out-of-Town Guests',
          size: outOfTownGuests.length,
          description: 'Guests traveling from other cities',
          characteristics: [
            'Hotel/accommodation needs',
            'Transportation requirements',
            'Extended celebration interest'
          ]
        }
      ],
      lookalike: lookalikes
    };
  }

  /**
   * Build targeting configuration
   */
  private buildTargetingConfig(
    wedding: any,
    audience: TargetingData['audience']
  ): TargetingData['targeting'] {
    const daysUntilWedding = Math.ceil(
      (wedding.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Determine campaign duration
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.max(0, daysUntilWedding - 60));

    const endDate = new Date(wedding.weddingDate);
    endDate.setDate(endDate.getDate() + 7); // Continue for a week after

    const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Calculate budget based on guest count and wedding value
    const baseBudget = Math.max(5000, wedding.guestCount?.expected * 100 || 5000);
    const premiumMultiplier = wedding.budget?.total > 1000000 ? 2 : 1;

    return {
      platforms: this.recommendPlatforms(wedding),
      adFormats: this.recommendAdFormats(wedding),
      budget: {
        recommended: baseBudget * premiumMultiplier,
        min: baseBudget * 0.5,
        max: baseBudget * 3
      },
      duration: {
        startDate,
        endDate,
        weeks
      }
    };
  }

  /**
   * Recommend platforms based on wedding characteristics
   */
  private recommendPlatforms(wedding: any): string[] {
    const platforms = ['facebook', 'instagram'];

    // Add Google for venue searches
    if (wedding.budget?.total > 500000) {
      platforms.push('google');
    }

    // Add YouTube for video content
    if (wedding.venue?.capacity && wedding.venue.capacity > 200) {
      platforms.push('youtube');
    }

    // Add TikTok for younger demographics
    if (wedding.hashtags?.some((h: string) => h.includes('modern') || h.includes('trendy'))) {
      platforms.push('tiktok');
    }

    return platforms;
  }

  /**
   * Recommend ad formats
   */
  private recommendAdFormats(wedding: any): string[] {
    const formats = ['carousel', 'stories'];

    if (wedding.budget?.total > 500000) {
      formats.push('video');
      formats.push('collection');
    }

    if (wedding.hashtags?.length > 0) {
      formats.push('ugc');
    }

    return formats;
  }

  /**
   * Generate targeting recommendations
   */
  private generateRecommendations(
    wedding: any,
    guests: any[],
    audience: TargetingData['audience']
  ): TargetingRecommendation[] {
    const recommendations: TargetingRecommendation[] = [];

    // Budget timing recommendations
    const daysUntilWedding = Math.ceil(
      (wedding.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilWedding > 90) {
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        recommendation: 'Start awareness campaigns early to build anticipation',
        expectedImpact: 'Higher engagement and share rates'
      });
    } else if (daysUntilWedding <= 30) {
      recommendations.push({
        type: 'timing',
        priority: 'high',
        recommendation: 'Focus on retargeting with urgency messaging',
        expectedImpact: 'Faster conversions and confirmations'
      });
    }

    // Platform recommendations
    if (wedding.instagramHandle) {
      recommendations.push({
        type: 'platform',
        priority: 'high',
        recommendation: 'Leverage Instagram integration for UGC campaigns',
        expectedImpact: 'Authentic content and higher trust'
      });
    }

    // Format recommendations
    if (wedding.hashtags && wedding.hashtags.length > 0) {
      recommendations.push({
        type: 'format',
        priority: 'medium',
        recommendation: `Create hashtag-specific campaigns for ${wedding.hashtags[0]}`,
        expectedImpact: 'Community building and organic reach'
      });
    }

    // Budget recommendations
    if (audience.size > 200) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        recommendation: 'Increase budget for larger audience segmentation',
        expectedImpact: 'Better frequency and reach'
      });
    }

    // Creative recommendations
    const confirmedGuests = guests.filter((g) => g.rsvp === 'confirmed').length;
    if (confirmedGuests > 50) {
      recommendations.push({
        type: 'creative',
        priority: 'medium',
        recommendation: 'Create social proof campaigns showcasing confirmed guests',
        expectedImpact: 'Increased trust and FOMO effect'
      });
    }

    return recommendations;
  }

  /**
   * Create a campaign for a wedding
   */
  async createCampaign(data: {
    weddingId: string;
    name: string;
    type: 'awareness' | 'conversion' | 'retargeting' | 'lookalike';
    platform: 'google' | 'facebook' | 'instagram' | 'meta' | 'youtube' | 'tiktok';
    budget: number;
    targeting?: any;
  }): Promise<any> {
    try {
      const campaignId = `CMP-${uuidv4().substring(0, 8).toUpperCase()}`;

      const campaign = new Campaign({
        campaignId,
        weddingId: data.weddingId,
        name: data.name,
        type: data.type,
        platform: data.platform,
        budget: {
          total: data.budget,
          spent: 0,
          currency: 'INR'
        },
        targeting: data.targeting || {},
        startDate: new Date(),
        status: 'draft'
      });

      await campaign.save();

      logger.info('Campaign created', {
        campaignId,
        weddingId: data.weddingId,
        name: data.name
      });

      return campaign;
    } catch (error) {
      logger.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<any> {
    try {
      const campaign = await Campaign.findOne({ campaignId });
      if (!campaign) return null;

      // Calculate derived metrics
      const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
      const cpm = campaign.impressions > 0 ? (campaign.cost.total / campaign.impressions) * 1000 : 0;
      const cpc = campaign.clicks > 0 ? campaign.cost.total / campaign.clicks : 0;
      const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0;

      return {
        campaignId: campaign.campaignId,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        metrics: {
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          conversions: campaign.conversions,
          reach: campaign.reach,
          ctr: ctr.toFixed(2),
          cpm: cpm.toFixed(2),
          cpc: cpc.toFixed(2),
          conversionRate: conversionRate.toFixed(2),
          roas: campaign.roas
        },
        engagement: campaign.engagement,
        budget: {
          total: campaign.budget.total,
          spent: campaign.budget.spent,
          remaining: campaign.budget.total - campaign.budget.spent
        },
        dateRange: {
          start: campaign.startDate,
          end: campaign.endDate
        }
      };
    } catch (error) {
      logger.error('Error getting campaign performance:', error);
      throw error;
    }
  }

  /**
   * Get all campaigns for a wedding
   */
  async getWeddingCampaigns(weddingId: string): Promise<Campaign[]> {
    try {
      return await Campaign.find({ weddingId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error getting wedding campaigns:', error);
      throw error;
    }
  }

  /**
   * Update campaign metrics
   */
  async updateCampaignMetrics(
    campaignId: string,
    metrics: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      reach?: number;
      spend?: number;
    }
  ): Promise<Campaign | null> {
    try {
      const updateData: any = {};
      if (metrics.impressions !== undefined) updateData.impressions = metrics.impressions;
      if (metrics.clicks !== undefined) updateData.clicks = metrics.clicks;
      if (metrics.conversions !== undefined) updateData.conversions = metrics.conversions;
      if (metrics.reach !== undefined) updateData.reach = metrics.reach;
      if (metrics.spend !== undefined) updateData['budget.spent'] = metrics.spend;

      const campaign = await Campaign.findOneAndUpdate(
        { campaignId },
        { $set: updateData },
        { new: true }
      );

      if (campaign) {
        // Recalculate derived metrics
        const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
        const cpm = campaign.impressions > 0 ? (campaign.cost.total / campaign.impressions) * 1000 : 0;
        const cpc = campaign.clicks > 0 ? campaign.cost.total / campaign.clicks : 0;

        await Campaign.updateOne(
          { campaignId },
          {
            $set: {
              ctr,
              cpm,
              cpc,
              conversionRate: campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0
            }
          }
        );
      }

      return campaign;
    } catch (error) {
      logger.error('Error updating campaign metrics:', error);
      throw error;
    }
  }

  /**
   * Get lookalike audiences for targeting
   */
  async getLookalikeAudiences(weddingId: string): Promise<LookalikeAudience[]> {
    try {
      const wedding = await Wedding.findOne({ weddingId });
      if (!wedding) return [];

      const lookalikes: LookalikeAudience[] = [];

      // Create lookalike from confirmed guests
      const confirmedGuests = await Guest.countDocuments({
        weddingId,
        rsvp: 'confirmed'
      });

      if (confirmedGuests >= 20) {
        lookalikes.push({
          source: 'confirmed_guests',
          similarity: 0.85,
          estimatedSize: confirmedGuests * 15
        });
      }

      // Create lookalike from venue city
      if (wedding.venue?.city) {
        lookalikes.push({
          source: `venue_city_${wedding.venue.city}`,
          similarity: 0.7,
          estimatedSize: 5000
        });
      }

      // Create lookalike from budget tier
      if (wedding.budget?.total > 1000000) {
        lookalikes.push({
          source: 'premium_wedding_segment',
          similarity: 0.65,
          estimatedSize: 10000
        });
      }

      return lookalikes;
    } catch (error) {
      logger.error('Error getting lookalike audiences:', error);
      throw error;
    }
  }
}

export const targetingService = new TargetingService();