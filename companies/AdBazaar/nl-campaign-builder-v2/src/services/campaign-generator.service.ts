import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from 'utils/logger.js';
import {
  ParsedIntent,
  GeneratedCampaign,
  CampaignAd,
  ABTestConfig,
  GoalType,
  ChannelType
} from '../types';

interface CampaignSuggestions {
  suggestions: string[];
  warnings: string[];
}

export class CampaignGeneratorService {
  async generate(parsed: ParsedIntent, advertiserId: string): Promise<{
    campaign: GeneratedCampaign;
    suggestions: string[];
    warnings: string[];
  }> {
    const startTime = Date.now();

    try {
      // Generate campaign name
      const campaignName = this.generateCampaignName(parsed);

      // Generate budget allocation
      const budgetAllocation = this.allocateBudget(parsed.budget.amount, parsed.channels);

      // Generate targeting
      const targeting = this.generateTargeting(parsed.audience);

      // Generate ads
      const ads = this.generateAds(parsed, campaignName);

      // Generate bid strategy
      const bidStrategy = this.generateBidStrategy(parsed.goal.type, parsed.budget.amount);

      // Generate A/B test configuration
      const abTestConfig = this.generateABTestConfig(parsed.goal.type);

      // Build full campaign
      const campaign: GeneratedCampaign = {
        name: campaignName,
        objective: parsed.goal.type,
        status: 'draft',
        budget: {
          ...parsed.budget,
          allocation: budgetAllocation
        },
        targeting,
        ads,
        schedule: {
          startDate: new Date(),
          endDate: this.calculateEndDate(parsed.timeline)
        },
        bidStrategy,
        tracking: this.generateTrackingConfig(advertiserId),
        optimization: {
          bidOptimization: true,
          audienceExpansion: parsed.goal.type === 'sales' || parsed.goal.type === 'leads',
          placements: this.getRecommendedPlacements(parsed.goal.type)
        }
      };

      // Generate suggestions
      const { suggestions, warnings } = this.generateSuggestions(campaign, parsed);

      // Calculate confidence based on campaign completeness
      const confidence = this.calculateConfidence(campaign, parsed);

      logger.info(`Campaign generated in ${Date.now() - startTime}ms`, {
        campaignName,
        confidence,
        goalType: parsed.goal.type
      });

      return { campaign, suggestions, warnings };
    } catch (error) {
      logger.error('Campaign generation failed:', error);
      throw error;
    }
  }

  private generateCampaignName(parsed: ParsedIntent): string {
    const productName = parsed.products?.[0]?.name || 'Product';
    const location = parsed.audience.location[0] || 'India';
    const goalType = parsed.goal.type;

    const prefixes = {
      sales: 'Sell',
      leads: 'Leads',
      bookings: 'Book',
      traffic: 'Drive',
      awareness: 'Brand'
    };

    const prefix = prefixes[goalType] || 'Campaign';
    const timestamp = new Date().toISOString().split('T')[0];

    return `${prefix} ${productName} - ${location} - ${timestamp}`;
  }

  private allocateBudget(amount: number, channels?: ChannelType[]): {
    channels: Record<string, number>;
    creative: number;
    testing: number;
  } {
    const channelBudgets: Record<string, number> = {};
    const numChannels = channels?.length || 3;

    // Distribute budget based on channel effectiveness
    const channelWeights: Record<ChannelType, number> = {
      'google': 0.35,
      'facebook': 0.30,
      'instagram': 0.15,
      'youtube': 0.10,
      'linkedin': 0.05,
      'twitter': 0.03,
      'tiktok': 0.01,
      'display': 0.005,
      'native': 0.005
    };

    const effectiveChannels = channels?.length
      ? channels.filter(c => channelWeights[c])
      : (['google', 'facebook', 'instagram'] as ChannelType[]);

    // Normalize weights for selected channels
    const totalWeight = effectiveChannels.reduce((sum, ch) => sum + (channelWeights[ch] || 0.1), 0);

    for (const channel of effectiveChannels) {
      const weight = channelWeights[channel] || 0.1;
      channelBudgets[channel] = Math.round((amount * weight / totalWeight) * 100) / 100;
    }

    // Reserve for creative and testing
    const creative = Math.round(amount * 0.15);
    const testing = Math.round(amount * 0.10);

    return {
      channels: channelBudgets,
      creative,
      testing
    };
  }

  private generateTargeting(audience: ParsedIntent['audience']) {
    const targeting: GeneratedCampaign['targeting'] = {
      locations: audience.location,
      interests: audience.interests || [],
      behaviors: [],
      ageRange: this.parseAgeRange(audience.demographics?.age),
      gender: audience.demographics?.gender ? [audience.demographics.gender] : undefined,
      deviceTypes: ['mobile', 'desktop']
    };

    // Add interests based on demographics
    if (audience.interests && audience.interests.length > 0) {
      targeting.interests = audience.interests;
    }

    // Add income-based behaviors
    if (audience.income) {
      targeting.behaviors.push(`Income: ${audience.income}`);
    }

    return targeting;
  }

  private parseAgeRange(ageStr?: string): { min: number; max: number } | undefined {
    if (!ageStr) return undefined;

    // Parse formats like "25-35", "18-24", "35-44"
    const match = ageStr.match(/(\d+)-(\d+)/);
    if (match) {
      return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
    }

    // Parse single age
    const singleMatch = ageStr.match(/(\d+)/);
    if (singleMatch) {
      const age = parseInt(singleMatch[1], 10);
      return { min: age, max: Math.min(age + 10, 65) };
    }

    return undefined;
  }

  private generateAds(parsed: ParsedIntent, campaignName: string): CampaignAd[] {
    const ads: CampaignAd[] = [];
    const products = parsed.products || [];
    const goalType = parsed.goal.type;

    // Primary ad
    const primaryAd: CampaignAd = {
      id: uuidv4(),
      type: this.getAdTypeForGoal(goalType),
      headline: this.generateHeadline(parsed, campaignName),
      description: this.generateDescription(parsed),
      callToAction: this.getCallToActionForGoal(goalType),
      creativeAssets: {
        images: this.getPlaceholderImages(goalType),
        copyVariants: this.generateCopyVariants(parsed, goalType)
      }
    };
    ads.push(primaryAd);

    // Secondary ad for variety
    const secondaryAd: CampaignAd = {
      id: uuidv4(),
      type: this.getAdTypeForGoal(goalType) === 'image' ? 'carousel' : 'image',
      headline: this.generateAlternativeHeadline(parsed),
      description: this.generateDescription(parsed, true),
      callToAction: this.getCallToActionForGoal(goalType),
      creativeAssets: {
        images: this.getPlaceholderImages(goalType, 'variant'),
        copyVariants: []
      }
    };
    ads.push(secondaryAd);

    return ads;
  }

  private getAdTypeForGoal(goalType: GoalType): CampaignAd['type'] {
    const typeMap: Record<GoalType, CampaignAd['type']> = {
      'sales': 'carousel',
      'leads': 'image',
      'bookings': 'image',
      'traffic': 'video',
      'awareness': 'video'
    };
    return typeMap[goalType];
  }

  private generateHeadline(parsed: ParsedIntent, campaignName: string): string {
    const product = parsed.products?.[0]?.name || 'our products';
    const location = parsed.audience.location[0] || 'your area';

    const templates: Record<GoalType, string[]> = {
      sales: [
        `Get ${product} at Best Prices in ${location}`,
        `${product} Sale - Limited Time Offer in ${location}`,
        `Shop ${product} - Free Delivery in ${location}`
      ],
      leads: [
        `Get Free Quote for ${product} in ${location}`,
        `Connect with Top ${product} Providers in ${location}`,
        `Request Demo - ${product} Solutions in ${location}`
      ],
      bookings: [
        `Book ${product} Services in ${location} Today`,
        `Reserve Your ${product} Appointment in ${location}`,
        `Schedule ${product} - Easy Online Booking in ${location}`
      ],
      traffic: [
        `Explore ${product} Collection in ${location}`,
        `Visit Our Store - ${product} in ${location}`,
        `Discover ${product} - Click to Learn More in ${location}`
      ],
      awareness: [
        `Introducing ${product} - Now in ${location}`,
        `${product} Launch Event in ${location}`,
        `Experience ${product} - Now Available in ${location}`
      ]
    };

    const options = templates[parsed.goal.type] || templates.awareness;
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateAlternativeHeadline(parsed: ParsedIntent): string {
    const product = parsed.products?.[0]?.name || 'our products';
    const target = parsed.goal.target;

    return `Get ${target} ${product} - Special Offer!`;
  }

  private generateDescription(parsed: ParsedIntent, short = false): string {
    const product = parsed.products?.[0]?.name || 'products';
    const budget = parsed.budget.amount;

    if (short) {
      return `Quality ${product} at competitive prices. Order now and save!`;
    }

    return `Discover our premium ${product}. ${parsed.goal.target} customers served in ${parsed.audience.location[0] || 'India'}. Starting at just ₹${Math.round(budget / 10)}. Free consultation available.`;
  }

  private generateCopyVariants(parsed: ParsedIntent, goalType: GoalType): string[] {
    const product = parsed.products?.[0]?.name || 'products';

    return [
      `${product} - Premium Quality Guaranteed`,
      `Special Deal on ${product} - Limited Stock`,
      `Trusted by ${parsed.goal.target} customers`,
      `${product} with Free Shipping`
    ];
  }

  private getCallToActionForGoal(goalType: GoalType): string {
    const ctaMap: Record<GoalType, string> = {
      sales: 'Shop Now',
      leads: 'Get Quote',
      bookings: 'Book Now',
      traffic: 'Learn More',
      awareness: 'Explore'
    };
    return ctaMap[goalType];
  }

  private getPlaceholderImages(goalType: GoalType, variant = 'primary'): string[] {
    const baseUrl = 'https://placehold.co/1200x628';

    const imageMap: Record<GoalType, string[]> = {
      sales: [`${baseUrl}/FF5722/FFFFFF?text=Shop+Now`],
      leads: [`${baseUrl}/2196F3/FFFFFF?text=Get+Quote`],
      bookings: [`${baseUrl}/4CAF50/FFFFFF?text=Book+Today`],
      traffic: [`${baseUrl}/9C27B0/FFFFFF?text=Learn+More`],
      awareness: [`${baseUrl}/00BCD4/FFFFFF?text=Explore`]
    };

    return imageMap[goalType] || [`${baseUrl}/607D8B/FFFFFF?text=Discover`];
  }

  private generateBidStrategy(goalType: GoalType, budget: number): GeneratedCampaign['bidStrategy'] {
    const avgDailyBudget = budget / 30;

    const strategyMap: Record<GoalType, GeneratedCampaign['bidStrategy']> = {
      sales: {
        type: 'cpa',
        targetCost: Math.round(avgDailyBudget / 10)
      },
      leads: {
        type: 'cpc',
        maxBid: Math.round(avgDailyBudget / 5),
        targetCost: Math.round(avgDailyBudget / 8)
      },
      bookings: {
        type: 'cpa',
        targetCost: Math.round(avgDailyBudget / 5)
      },
      traffic: {
        type: 'cpm',
        maxBid: Math.round(avgDailyBudget / 100)
      },
      awareness: {
        type: 'cpm',
        maxBid: Math.round(avgDailyBudget / 200)
      }
    };

    return strategyMap[goalType];
  }

  private generateABTestConfig(goalType: GoalType): ABTestConfig {
    return {
      enabled: goalType === 'sales' || goalType === 'leads',
      variants: [
        { id: uuidv4(), name: 'Variant A', weight: 50, changes: { headline: 'original' } },
        { id: uuidv4(), name: 'Variant B', weight: 50, changes: { headline: 'alternative' } }
      ],
      metric: goalType === 'sales' || goalType === 'leads' ? 'conversions' : 'engagement',
      sampleSize: 1000,
      confidence: 0.95
    };
  }

  private generateTrackingConfig(advertiserId: string): GeneratedCampaign['tracking'] {
    return {
      pixelIds: [`ADB_pixel_${advertiserId.slice(0, 8)}`],
      conversionEvents: ['page_view', 'add_to_cart', 'purchase'],
      utmParams: {
        source: 'adbazaar',
        campaign: 'nl_builder',
        medium: 'ai_generated'
      }
    };
  }

  private getRecommendedPlacements(goalType: GoalType): string[] {
    const placementsMap: Record<GoalType, string[]> = {
      sales: ['facebook_feed', 'instagram_explore', 'google_search'],
      leads: ['linkedin_feed', 'google_search', 'facebook_feed'],
      bookings: ['google_search', 'google_maps', 'facebook_feed'],
      traffic: ['display_network', 'youtube', 'native'],
      awareness: ['facebook_feed', 'instagram_stories', 'youtube_preroll', 'tiktok']
    };

    return placementsMap[goalType];
  }

  private calculateEndDate(timeline?: { duration?: string; endDate?: Date }): Date | undefined {
    if (timeline?.endDate) {
      return timeline.endDate;
    }

    if (timeline?.duration) {
      const match = timeline.duration.match(/(\d+)\s*(day|week|month)/i);
      if (match) {
        const amount = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        const endDate = new Date();

        switch (unit) {
          case 'day':
            endDate.setDate(endDate.getDate() + amount);
            break;
          case 'week':
            endDate.setDate(endDate.getDate() + amount * 7);
            break;
          case 'month':
            endDate.setMonth(endDate.getMonth() + amount);
            break;
        }

        return endDate;
      }
    }

    // Default 30 days
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    return defaultEnd;
  }

  private generateSuggestions(campaign: GeneratedCampaign, parsed: ParsedIntent): CampaignSuggestions {
    const suggestions: string[] = [];
    const warnings: string[] = [];

    // Budget suggestions
    if (campaign.budget.amount < 10000) {
      suggestions.push('Consider increasing budget to at least ₹10,000 for better reach and frequency');
    }

    if (campaign.budget.amount > 100000) {
      suggestions.push('For large budgets, consider splitting into multiple campaigns for better optimization');
    }

    // Channel suggestions
    if (!campaign.budget.allocation?.channels) {
      warnings.push('No specific channels allocated - using default allocation');
    }

    // Audience suggestions
    if (campaign.targeting.locations.length > 10) {
      suggestions.push('Consider narrowing down to top 5-10 locations for better ROI');
    }

    if (!campaign.targeting.ageRange) {
      suggestions.push('Add specific age targeting for better ad relevance');
    }

    // Goal-based suggestions
    switch (parsed.goal.type) {
      case 'sales':
        suggestions.push('Enable conversion tracking and set up retargeting for abandoned carts');
        suggestions.push('Consider adding product catalog ads for better performance');
        break;
      case 'leads':
        suggestions.push('Create a lead form with minimal fields for higher conversion rates');
        suggestions.push('Set up automated follow-up sequences for leads');
        break;
      case 'bookings':
        suggestions.push('Integrate with your booking system for seamless experience');
        suggestions.push('Add urgency elements like "limited slots" in ad copy');
        break;
      case 'awareness':
        suggestions.push('Run campaign for at least 2 weeks for meaningful reach metrics');
        suggestions.push('Consider video ads for better engagement');
        break;
      case 'traffic':
        suggestions.push('Ensure landing page is optimized for the traffic volume');
        suggestions.push('Consider adding site speed optimization');
        break;
    }

    // A/B testing suggestions
    if (campaign.ads.length < 2) {
      suggestions.push('Create at least 2 ad variations for A/B testing to optimize performance');
    }

    // Creative suggestions
    suggestions.push('Use high-quality images with clear value proposition in ad creative');
    suggestions.push('Test different call-to-action variations for better click-through rates');

    // Optimization suggestions
    if (parsed.goal.target > 1000) {
      suggestions.push('For high target volumes, enable automated bidding strategies');
    }

    return { suggestions, warnings };
  }

  private calculateConfidence(campaign: GeneratedCampaign, parsed: ParsedIntent): number {
    let confidence = 0.5;

    // Check campaign completeness
    if (campaign.name) confidence += 0.1;
    if (campaign.ads.length > 0) confidence += 0.1;
    if (campaign.targeting.locations.length > 0) confidence += 0.1;
    if (campaign.budget.amount > 0) confidence += 0.1;
    if (campaign.bidStrategy.type) confidence += 0.1;

    // Check parsed intent quality
    if (parsed.goal.target > 0) confidence += 0.05;
    if (parsed.audience.location.length > 0) confidence += 0.05;
    if (parsed.products && parsed.products.length > 0) confidence += 0.05;
    if (parsed.channels && parsed.channels.length > 0) confidence += 0.05;

    // Reduce confidence if warnings present
    if (campaign.budget.amount < 5000) confidence -= 0.1;
    if (campaign.ads.length < 2) confidence -= 0.05;

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  async adjust(campaign: GeneratedCampaign, feedback: string, changes?: Partial<GeneratedCampaign>): Promise<{
    campaign: GeneratedCampaign;
    appliedChanges: string[];
  }> {
    const appliedChanges: string[] = [];
    const feedbackLower = feedback.toLowerCase();

    // Parse feedback and apply adjustments
    if (feedbackLower.includes('increase budget')) {
      const increaseMatch = feedback.match(/(\d+)%/);
      if (increaseMatch) {
        const increase = parseInt(increaseMatch[1], 10) / 100;
        campaign.budget.amount = Math.round(campaign.budget.amount * (1 + increase));
        appliedChanges.push(`Increased budget by ${increaseMatch[1]}%`);
      }
    }

    if (feedbackLower.includes('decrease budget')) {
      const decreaseMatch = feedback.match(/(\d+)%/);
      if (decreaseMatch) {
        const decrease = parseInt(decreaseMatch[1], 10) / 100;
        campaign.budget.amount = Math.round(campaign.budget.amount * (1 - decrease));
        appliedChanges.push(`Decreased budget by ${decreaseMatch[1]}%`);
      }
    }

    if (feedbackLower.includes('change location') || feedbackLower.includes('target')) {
      const locationMatch = feedback.match(/in\s+([A-Za-z\s]+?)(?:\s+with|\s+for|$)/i);
      if (locationMatch) {
        campaign.targeting.locations = [locationMatch[1].trim()];
        appliedChanges.push(`Updated targeting locations to ${locationMatch[1].trim()}`);
      }
    }

    if (feedbackLower.includes('change headline') || feedbackLower.includes('different headline')) {
      if (campaign.ads[0]) {
        campaign.ads[0].headline = this.generateHeadline({ ...parsed, products: [{}] } as ParsedIntent, campaign.name);
        appliedChanges.push('Generated new headline for primary ad');
      }
    }

    if (feedbackLower.includes('more channels') || feedbackLower.includes('add channel')) {
      const channelMap: Record<string, ChannelType> = {
        'google': 'google',
        'facebook': 'facebook',
        'instagram': 'instagram',
        'youtube': 'youtube',
        'linkedin': 'linkedin'
      };

      for (const [keyword, channel] of Object.entries(channelMap)) {
        if (feedbackLower.includes(keyword) && !campaign.budget.allocation?.channels?.[channel]) {
          campaign.budget.allocation = campaign.budget.allocation || { channels: {} };
          campaign.budget.allocation.channels[channel] = Math.round(campaign.budget.amount * 0.2);
          appliedChanges.push(`Added ${channel} to channel allocation`);
        }
      }
    }

    // Apply explicit changes
    if (changes) {
      Object.assign(campaign, changes);
      appliedChanges.push('Applied explicit changes from request');
    }

    return { campaign, appliedChanges };
  }
}

export const campaignGeneratorService = new CampaignGeneratorService();
export default campaignGeneratorService;