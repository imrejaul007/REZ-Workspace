import { VideoCampaign, IVideoCampaignDocument } from '../models';
import { SetTargetingRequest } from '../types';
import { logger } from '../utils/logger';

export interface TargetingMatch {
  campaignId: string;
  score: number;
  reason: string;
}

export interface TargetingCriteria {
  demographics?: {
    ageRange?: { min: number; max: number };
    gender?: string[];
    location?: string[];
    interests?: string[];
  };
  devices?: string[];
  platforms?: string[];
  timeSlots?: { start: string; end: string }[];
  customRules?: Record<string, any>;
}

export class TargetingService {
  /**
   * Check if a user matches campaign targeting
   */
  async matchesTargeting(
    campaignId: string,
    userData: {
      age?: number;
      gender?: string;
      location?: string;
      interests?: string[];
      device?: string;
      platform?: string;
      timestamp?: Date;
    }
  ): Promise<{ matches: boolean; score: number; reasons: string[] }> {
    const campaign = await VideoCampaign.findById(campaignId);
    if (!campaign) {
      return { matches: false, score: 0, reasons: ['Campaign not found'] };
    }

    const reasons: string[] = [];
    let score = 0;
    let totalCriteria = 0;

    // Check demographics
    if (campaign.targeting?.demographics) {
      const demo = campaign.targeting.demographics;
      totalCriteria++;

      if (demo.ageRange && userData.age) {
        if (userData.age >= demo.ageRange.min && userData.age <= demo.ageRange.max) {
          score += 1;
          reasons.push(`Age ${userData.age} within range ${demo.ageRange.min}-${demo.ageRange.max}`);
        }
      }

      if (demo.gender && demo.gender.length > 0 && userData.gender) {
        if (demo.gender.includes(userData.gender.toLowerCase())) {
          score += 1;
          reasons.push(`Gender ${userData.gender} matches`);
        }
      }

      if (demo.location && demo.location.length > 0 && userData.location) {
        if (demo.location.some((l) => userData.location?.toLowerCase().includes(l.toLowerCase()))) {
          score += 1;
          reasons.push(`Location ${userData.location} matches`);
        }
      }

      if (demo.interests && demo.interests.length > 0 && userData.interests) {
        const matchingInterests = userData.interests.filter((i) =>
          demo.interests?.includes(i.toLowerCase())
        );
        if (matchingInterests.length > 0) {
          score += matchingInterests.length / demo.interests.length;
          reasons.push(`${matchingInterests.length} interests match`);
        }
      }
    }

    // Check devices
    if (campaign.targeting?.devices && campaign.targeting.devices.length > 0) {
      totalCriteria++;
      if (userData.device && campaign.targeting.devices.includes(userData.device)) {
        score += 1;
        reasons.push(`Device ${userData.device} matches`);
      }
    }

    // Check platforms
    if (campaign.targeting?.platforms && campaign.targeting.platforms.length > 0) {
      totalCriteria++;
      if (userData.platform && campaign.targeting.platforms.includes(userData.platform)) {
        score += 1;
        reasons.push(`Platform ${userData.platform} matches`);
      }
    }

    // Check time slots
    if (campaign.targeting?.timeSlots && campaign.targeting.timeSlots.length > 0 && userData.timestamp) {
      const hour = userData.timestamp.getHours();
      const timeMatch = campaign.targeting.timeSlots.some((slot) => {
        const [startHour] = slot.start.split(':').map(Number);
        const [endHour] = slot.end.split(':').map(Number);
        return hour >= startHour && hour <= endHour;
      });

      if (timeMatch) {
        score += 1;
        reasons.push(`Time slot matches current hour ${hour}`);
      }
    }

    const normalizedScore = totalCriteria > 0 ? score / (totalCriteria + 1) : 1;
    return {
      matches: normalizedScore > 0.3,
      score: normalizedScore,
      reasons,
    };
  }

  /**
   * Find campaigns matching user targeting
   */
  async findMatchingCampaigns(
    userData: {
      age?: number;
      gender?: string;
      location?: string;
      interests?: string[];
      device?: string;
      platform?: string;
    },
    limit: number = 10
  ): Promise<TargetingMatch[]> {
    const activeCampaigns = await VideoCampaign.find({
      status: 'active',
      'budget.spent': { $lt: '$budget.total' },
    }).sort({ priority: -1, 'budget.spent': 1 });

    const matches: TargetingMatch[] = [];

    for (const campaign of activeCampaigns) {
      const result = await this.matchesTargeting(campaign._id.toString(), {
        ...userData,
        timestamp: new Date(),
      });

      if (result.matches) {
        matches.push({
          campaignId: campaign._id.toString(),
          score: result.score,
          reason: result.reasons.join(', ') || 'Matches general targeting',
        });
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Validate targeting configuration
   */
  validateTargeting(targeting: SetTargetingRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate age range
    if (targeting.demographics?.ageRange) {
      const { min, max } = targeting.demographics.ageRange;
      if (min < 13) errors.push('Minimum age must be at least 13');
      if (max > 100) errors.push('Maximum age cannot exceed 100');
      if (min > max) errors.push('Minimum age cannot exceed maximum age');
    }

    // Validate gender values
    if (targeting.demographics?.gender && targeting.demographics.gender.length > 0) {
      const validGenders = ['male', 'female', 'other', 'non-binary'];
      const invalidGenders = targeting.demographics.gender.filter(
        (g) => !validGenders.includes(g.toLowerCase())
      );
      if (invalidGenders.length > 0) {
        errors.push(`Invalid gender values: ${invalidGenders.join(', ')}`);
      }
    }

    // Validate time slots
    if (targeting.timeSlots && targeting.timeSlots.length > 0) {
      for (const slot of targeting.timeSlots) {
        if (!slot.start || !slot.end) {
          errors.push('Time slot must have start and end times');
          continue;
        }

        const startHour = parseInt(slot.start.split(':')[0]);
        const endHour = parseInt(slot.end.split(':')[0]);

        if (isNaN(startHour) || isNaN(endHour)) {
          errors.push('Invalid time format in time slot');
        }

        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
          errors.push('Hours must be between 0 and 23');
        }
      }
    }

    // Validate devices
    if (targeting.devices && targeting.devices.length > 0) {
      const validDevices = ['mobile', 'tablet', 'desktop', 'tv', 'smartwatch'];
      const invalidDevices = targeting.devices.filter(
        (d) => !validDevices.includes(d.toLowerCase())
      );
      if (invalidDevices.length > 0) {
        errors.push(`Invalid device types: ${invalidDevices.join(', ')}`);
      }
    }

    // Validate platforms
    if (targeting.platforms && targeting.platforms.length > 0) {
      const validPlatforms = ['ios', 'android', 'web', 'tvos', 'roku', 'firetv'];
      const invalidPlatforms = targeting.platforms.filter(
        (p) => !validPlatforms.includes(p.toLowerCase())
      );
      if (invalidPlatforms.length > 0) {
        errors.push(`Invalid platform types: ${invalidPlatforms.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get targeting suggestions for a campaign
   */
  async getTargetingSuggestions(campaignId: string): Promise<{
    similarCampaigns: Array<{
      campaignId: string;
      targeting: any;
      performance: number;
    }>;
    suggestedTargeting: SetTargetingRequest;
  }> {
    logger.info('Getting targeting suggestions', { campaignId });

    const campaign = await VideoCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Find similar campaigns (same video category, active status)
    const similarCampaigns = await VideoCampaign.find({
      _id: { $ne: campaignId },
      status: 'active',
    })
      .select('targeting')
      .limit(5);

    // Generate suggestions based on high-performing campaigns
    const suggestion: SetTargetingRequest = {
      demographics: campaign.targeting?.demographics,
      devices: ['mobile', 'tablet', 'desktop'],
      platforms: ['ios', 'android', 'web'],
      timeSlots: [
        { start: '09:00', end: '12:00' },
        { start: '18:00', end: '22:00' },
      ],
    };

    return {
      similarCampaigns: similarCampaigns.map((c) => ({
        campaignId: c._id.toString(),
        targeting: c.targeting,
        performance: 0, // Would be calculated from analytics
      })),
      suggestedTargeting: suggestion,
    };
  }

  /**
   * Estimate audience size for targeting criteria
   */
  async estimateAudienceSize(targeting: SetTargetingRequest): Promise<{
    estimatedReach: number;
    confidence: 'high' | 'medium' | 'low';
    breakdown: Record<string, number>;
  }> {
    logger.info('Estimating audience size');

    // Simulated audience estimation based on targeting criteria
    let baseReach = 1000000; // Base of 1M users
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    // Age range impact
    if (targeting.demographics?.ageRange) {
      const range = targeting.demographics.ageRange.max - targeting.demographics.ageRange.min;
      baseReach *= range / 87; // Normalize against full age range (13-100)
      confidence = 'low';
    }

    // Gender filter
    if (targeting.demographics?.gender && targeting.demographics.gender.length > 0) {
      baseReach *= targeting.demographics.gender.length / 4;
    }

    // Location filter
    if (targeting.demographics?.location && targeting.demographics.location.length > 0) {
      baseReach *= targeting.demographics.location.length / 30; // India has ~30 major cities
    }

    // Interest filter
    if (targeting.demographics?.interests && targeting.demographics.interests.length > 0) {
      baseReach *= Math.min(targeting.demographics.interests.length / 5, 1);
    }

    // Device filter
    if (targeting.devices && targeting.devices.length > 0) {
      baseReach *= targeting.devices.length / 5;
    }

    // Platform filter
    if (targeting.platforms && targeting.platforms.length > 0) {
      baseReach *= targeting.platforms.length / 6;
    }

    const breakdown: Record<string, number> = {
      estimated: Math.round(baseReach),
      byAge: Math.round(baseReach * 0.6),
      byLocation: Math.round(baseReach * 0.8),
      byInterest: Math.round(baseReach * 0.5),
    };

    return {
      estimatedReach: Math.round(baseReach),
      confidence,
      breakdown,
    };
  }

  /**
   * Expand targeting to increase reach
   */
  expandTargeting(currentTargeting: SetTargetingRequest): SetTargetingRequest {
    const expanded: SetTargetingRequest = { ...currentTargeting };

    // Expand age range
    if (expanded.demographics?.ageRange) {
      expanded.demographics.ageRange = {
        min: Math.max(13, expanded.demographics.ageRange.min - 5),
        max: Math.min(100, expanded.demographics.ageRange.max + 5),
      };
    }

    // Add more locations
    if (expanded.demographics?.location && expanded.demographics.location.length < 10) {
      expanded.demographics.location = [
        ...expanded.demographics.location,
        'Pan India',
        'Tier 2 Cities',
      ];
    }

    // Add more devices
    if (expanded.devices && expanded.devices.length < 5) {
      const allDevices = ['mobile', 'tablet', 'desktop', 'tv', 'smartwatch'];
      expanded.devices = [...new Set([...expanded.devices, ...allDevices])];
    }

    // Add more platforms
    if (expanded.platforms && expanded.platforms.length < 6) {
      const allPlatforms = ['ios', 'android', 'web', 'tvos', 'roku', 'firetv'];
      expanded.platforms = [...new Set([...expanded.platforms, ...allPlatforms])];
    }

    return expanded;
  }

  /**
   * Narrow targeting to improve relevance
   */
  narrowTargeting(currentTargeting: SetTargetingRequest): SetTargetingRequest {
    const narrowed: SetTargetingRequest = { ...currentTargeting };

    // Narrow age range
    if (narrowed.demographics?.ageRange) {
      const range = narrowed.demographics.ageRange.max - narrowed.demographics.ageRange.min;
      if (range > 20) {
        narrowed.demographics.ageRange = {
          min: narrowed.demographics.ageRange.min + 5,
          max: narrowed.demographics.ageRange.max - 5,
        };
      }
    }

    // Reduce locations
    if (narrowed.demographics?.location && narrowed.demographics.location.length > 3) {
      narrowed.demographics.location = narrowed.demographics.location.slice(0, 3);
    }

    // Reduce interests
    if (narrowed.demographics?.interests && narrowed.demographics.interests.length > 3) {
      narrowed.demographics.interests = narrowed.demographics.interests.slice(0, 3);
    }

    return narrowed;
  }
}

export const targetingService = new TargetingService();
export default targetingService;