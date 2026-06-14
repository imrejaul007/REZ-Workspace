/**
 * Campaign Orchestrator Service
 *
 * Central orchestrator for unified cross-platform campaigns.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  UnifiedCampaign,
  CampaignStatus,
  CampaignType,
  BudgetModel,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  PlatformBudget,
  AudienceEstimate,
  CampaignMetricsResponse,
} from '../types';
import {
  TenantContext,
  InventoryCategory,
  Platform,
  isInternalInventory,
  filterAccessibleInventory,
} from '@rez/tenant-middleware';

// ============================================================================
// CAMPAIGN ORCHESTRATOR
// ============================================================================

/**
 * Campaign Orchestrator Service
 * Manages the lifecycle of unified campaigns across all platforms
 */
export class CampaignOrchestrator {
  // In-memory storage (replace with MongoDB in production)
  private campaigns: Map<string, UnifiedCampaign> = new Map();

  // Campaign metrics storage
  private metrics: Map<string, Map<string, {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }>> = new Map();

  /**
   * Create a new unified campaign
   */
  async createCampaign(
    tenant: TenantContext,
    request: CreateCampaignRequest
  ): Promise<UnifiedCampaign> {
    // Validate inventory access
    const { allowed, denied } = filterAccessibleInventory(tenant, request.inventory.categories);

    if (allowed.length === 0) {
      throw new Error('NO_INVENTORY_ACCESS: No requested inventory is accessible');
    }

    // Validate minimum budget
    if (request.budget.totalBudget < tenant.pricing.minimumBudget) {
      throw new Error(
        `MIN_BUDGET_NOT_MET: Minimum budget is ₹${tenant.pricing.minimumBudget}`
      );
    }

    // Create budget allocation
    const allocation: PlatformBudget[] = request.inventory.platforms.map(platform => ({
      platform,
      budget: request.budget.allocation?.[platform] || 0,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    }));

    // Calculate daily budget if needed
    let dailyLimit = request.budget.dailyLimit;
    if (request.budget.model === BudgetModel.DAILY && !dailyLimit) {
      // Estimate based on schedule
      dailyLimit = request.budget.totalBudget * 0.1; // 10% default
    }

    // Create campaign
    const campaign: UnifiedCampaign = {
      id: `camp_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
      tenantId: tenant.tenantId,
      tenantType: tenant.tenantType,

      name: request.name,
      description: request.description,
      objective: request.objective,

      status: CampaignStatus.DRAFT,
      priority: 'normal',

      inventory: {
        categories: allowed,
        platforms: request.inventory.platforms,
      },

      budget: {
        totalBudget: request.budget.totalBudget,
        totalSpent: 0,
        model: request.budget.model,
        dailyLimit,
        allocation,
        currency: 'INR',
        minBudget: tenant.pricing.minimumBudget,
        maxBudget: tenant.rateLimits.budgetMaxCampaign > 0
          ? tenant.rateLimits.budgetMaxCampaign
          : undefined,
      },

      targeting: {
        geo: request.targeting.geo || {},
        demographic: request.targeting.demographic || {},
        behavioral: request.targeting.behavioral || {},
        device: request.targeting.device || {},
        time: request.targeting.time || {},
        customSegments: request.targeting.customSegments,
        lookalikeOf: request.targeting.lookalikeOf,
        lookalikeSimilarity: request.targeting.lookalikeSimilarity,
      },

      schedule: {
        startDate: new Date(request.schedule.startDate),
        endDate: request.schedule.endDate ? new Date(request.schedule.endDate) : undefined,
        timezone: request.schedule.timezone || 'Asia/Kolkata',
        allDay: request.schedule.allDay ?? true,
        slots: request.schedule.slots,
        frequencyCap: request.schedule.frequencyCap,
      },

      creative: request.creative,

      attribution: {
        window: request.attribution?.window || 30,
        model: request.attribution?.model || 'last_click',
        trackVisits: true,
        trackConversions: true,
        trackWallet: tenant.tenantType === 'rez_internal',
        ...request.attribution,
      },

      metrics: {
        impressions: 0,
        uniqueImpressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0,
        conversionRate: 0,
        spend: 0,
        cpm: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
        visits: 0,
        walletCredits: 0,
      },

      optimization: {
        autoOptimize: request.optimization?.autoOptimize ?? false,
        bidStrategy: request.optimization?.bidStrategy || 'lowest_cost',
        targetCpa: request.optimization?.targetCpa,
        targetRoi: request.optimization?.targetRoi,
      },

      metadata: {
        deniedInventory: denied,
        originalCategories: request.inventory.categories,
      },

      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };

    // Store campaign
    this.campaigns.set(campaign.id, campaign);
    this.metrics.set(campaign.id, new Map());

    return campaign;
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(
    tenant: TenantContext,
    campaignId: string,
    request: UpdateCampaignRequest
  ): Promise<UnifiedCampaign> {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    // Verify tenant owns campaign
    if (campaign.tenantId !== tenant.tenantId) {
      throw new Error('CAMPAIGN_ACCESS_DENIED');
    }

    // Validate status-based updates
    if (request.status) {
      this.validateStatusTransition(campaign.status, request.status);
    }

    // Update fields
    if (request.name) campaign.name = request.name;
    if (request.description) campaign.description = request.description;
    if (request.status) campaign.status = request.status;
    if (request.priority) campaign.priority = request.priority;

    if (request.budget) {
      campaign.budget = { ...campaign.budget, ...request.budget };
    }

    if (request.targeting) {
      campaign.targeting = { ...campaign.targeting, ...request.targeting };
    }

    if (request.schedule) {
      campaign.schedule = { ...campaign.schedule, ...request.schedule };
    }

    if (request.creative) {
      campaign.creative = { ...campaign.creative, ...request.creative };
    }

    if (request.optimization) {
      campaign.optimization = { ...campaign.optimization, ...request.optimization };
    }

    campaign.updatedAt = new Date();

    // Store updated campaign
    this.campaigns.set(campaignId, campaign);

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(
    tenant: TenantContext,
    campaignId: string
  ): Promise<UnifiedCampaign | null> {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return null;
    }

    // Verify tenant owns campaign
    if (campaign.tenantId !== tenant.tenantId) {
      throw new Error('CAMPAIGN_ACCESS_DENIED');
    }

    return campaign;
  }

  /**
   * List campaigns for tenant
   */
  async listCampaigns(
    tenant: TenantContext,
    options: {
      status?: CampaignStatus[];
      type?: CampaignType[];
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    campaigns: UnifiedCampaign[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { status, type, page = 1, limit = 20 } = options;

    // Filter campaigns by tenant
    let campaigns = Array.from(this.campaigns.values())
      .filter(c => c.tenantId === tenant.tenantId);

    // Apply filters
    if (status && status.length > 0) {
      campaigns = campaigns.filter(c => status.includes(c.status));
    }

    if (type && type.length > 0) {
      campaigns = campaigns.filter(c => type.includes(c.objective));
    }

    // Sort by updated date
    campaigns.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Paginate
    const total = campaigns.length;
    const startIndex = (page - 1) * limit;
    const paginatedCampaigns = campaigns.slice(startIndex, startIndex + limit);

    return {
      campaigns: paginatedCampaigns,
      total,
      page,
      limit,
    };
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(
    tenant: TenantContext,
    campaignId: string
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    if (campaign.tenantId !== tenant.tenantId) {
      throw new Error('CAMPAIGN_ACCESS_DENIED');
    }

    // Can only delete draft campaigns
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new Error('CANNOT_DELETE_ACTIVE_CAMPAIGN');
    }

    this.campaigns.delete(campaignId);
    this.metrics.delete(campaignId);
  }

  /**
   * Activate campaign (submit for review/start)
   */
  async activateCampaign(
    tenant: TenantContext,
    campaignId: string
  ): Promise<UnifiedCampaign> {
    const campaign = await this.getCampaign(tenant, campaignId);

    if (!campaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    // Validate campaign is ready
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.PAUSED) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    // Validate budget
    if (campaign.budget.totalBudget <= 0) {
      throw new Error('BUDGET_REQUIRED');
    }

    // Update status
    campaign.status = CampaignStatus.ACTIVE;
    campaign.updatedAt = new Date();

    this.campaigns.set(campaignId, campaign);

    return campaign;
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(
    tenant: TenantContext,
    campaignId: string
  ): Promise<UnifiedCampaign> {
    const campaign = await this.getCampaign(tenant, campaignId);

    if (!campaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new Error('ONLY_ACTIVE_CAMPAIGNS_CAN_BE_PAUSED');
    }

    campaign.status = CampaignStatus.PAUSED;
    campaign.updatedAt = new Date();

    this.campaigns.set(campaignId, campaign);

    return campaign;
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(
    tenant: TenantContext,
    campaignId: string
  ): Promise<CampaignMetricsResponse> {
    const campaign = await this.getCampaign(tenant, campaignId);

    if (!campaign) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    // Get trend data
    const trendData = this.metrics.get(campaignId) || new Map();
    const trend = Array.from(trendData.values()).map(d => ({
      date: d.date,
      impressions: d.impressions,
      clicks: d.clicks,
      conversions: d.conversions,
      spend: d.spend,
    }));

    // Calculate platform metrics
    const platformMetrics = campaign.budget.allocation.map(pb => ({
      platform: pb.platform,
      metrics: pb,
    }));

    return {
      campaignId,
      metrics: campaign.metrics,
      platformMetrics,
      trend,
    };
  }

  /**
   * Update campaign metrics (called by platform adapters)
   */
  async updateMetrics(
    campaignId: string,
    platform: Platform,
    delta: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      spend?: number;
    }
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    // Update aggregate metrics
    if (delta.impressions) campaign.metrics.impressions += delta.impressions;
    if (delta.clicks) campaign.metrics.clicks += delta.clicks;
    if (delta.conversions) campaign.metrics.conversions += delta.conversions;
    if (delta.spend) campaign.metrics.spend += delta.spend;

    // Update platform-specific metrics
    const platformBudget = campaign.budget.allocation.find(p => p.platform === platform);
    if (platformBudget) {
      if (delta.impressions) platformBudget.impressions += delta.impressions;
      if (delta.clicks) platformBudget.clicks += delta.clicks;
      if (delta.conversions) platformBudget.conversions += delta.conversions;
      if (delta.spend) platformBudget.spend += delta.spend;
    }

    // Calculate rates
    if (campaign.metrics.impressions > 0) {
      campaign.metrics.ctr = (campaign.metrics.clicks / campaign.metrics.impressions) * 100;
      campaign.metrics.cpm = (campaign.metrics.spend / campaign.metrics.impressions) * 1000;
    }
    if (campaign.metrics.clicks > 0) {
      campaign.metrics.cpc = campaign.metrics.spend / campaign.metrics.clicks;
    }
    if (campaign.metrics.conversions > 0) {
      campaign.metrics.cpa = campaign.metrics.spend / campaign.metrics.conversions;
    }

    // Store daily metrics
    const today = new Date().toISOString().split('T')[0];
    const dailyMetrics = this.metrics.get(campaignId) || new Map();
    const todayMetrics = dailyMetrics.get(today) || {
      date: today,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
    };

    if (delta.impressions) todayMetrics.impressions += delta.impressions;
    if (delta.clicks) todayMetrics.clicks += delta.clicks;
    if (delta.conversions) todayMetrics.conversions += delta.conversions;
    if (delta.spend) todayMetrics.spend += delta.spend;

    dailyMetrics.set(today, todayMetrics);
    this.metrics.set(campaignId, dailyMetrics);

    // Update campaign
    campaign.updatedAt = new Date();
    this.campaigns.set(campaignId, campaign);
  }

  /**
   * Estimate audience size for targeting
   */
  async estimateAudience(
    tenant: TenantContext,
    targeting: UnifiedCampaign['targeting']
  ): Promise<AudienceEstimate> {
    // This would integrate with Hojai AI / REZ Intelligence
    // For now, return mock estimates

    const baseAudience = tenant.tenantType === 'rez_internal' ? 1000000 : 100000;

    return {
      total: baseAudience,
      byPlatform: {
        app: Math.floor(baseAudience * 0.4),
        dooh: Math.floor(baseAudience * 0.2),
        qr: Math.floor(baseAudience * 0.15),
        whatsapp: Math.floor(baseAudience * 0.15),
        creator: Math.floor(baseAudience * 0.05),
        hospitality: Math.floor(baseAudience * 0.03),
        event: Math.floor(baseAudience * 0.02),
      },
      byDemographic: {
        age: {
          '18-24': Math.floor(baseAudience * 0.25),
          '25-34': Math.floor(baseAudience * 0.35),
          '35-44': Math.floor(baseAudience * 0.25),
          '45+': Math.floor(baseAudience * 0.15),
        },
        gender: {
          male: Math.floor(baseAudience * 0.55),
          female: Math.floor(baseAudience * 0.43),
          other: Math.floor(baseAudience * 0.02),
        },
      },
      byBehavior: {
        category: {
          'Food & Dining': Math.floor(baseAudience * 0.3),
          'Shopping': Math.floor(baseAudience * 0.25),
          'Travel': Math.floor(baseAudience * 0.2),
          'Health': Math.floor(baseAudience * 0.15),
          'Other': Math.floor(baseAudience * 0.1),
        },
        loyalty: {
          L1: Math.floor(baseAudience * 0.4),
          L2: Math.floor(baseAudience * 0.3),
          L3: Math.floor(baseAudience * 0.2),
          L4: Math.floor(baseAudience * 0.1),
        },
      },
    };
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    current: CampaignStatus,
    next: CampaignStatus
  ): void {
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      [CampaignStatus.DRAFT]: [CampaignStatus.PENDING_REVIEW, CampaignStatus.ACTIVE],
      [CampaignStatus.PENDING_REVIEW]: [CampaignStatus.DRAFT, CampaignStatus.ACTIVE, CampaignStatus.REJECTED],
      [CampaignStatus.ACTIVE]: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED],
      [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED],
      [CampaignStatus.COMPLETED]: [],
      [CampaignStatus.REJECTED]: [CampaignStatus.DRAFT],
    };

    if (!validTransitions[current].includes(next)) {
      throw new Error(`INVALID_STATUS_TRANSITION: ${current} -> ${next}`);
    }
  }
}

// Export singleton instance
export const campaignOrchestrator = new CampaignOrchestrator();
