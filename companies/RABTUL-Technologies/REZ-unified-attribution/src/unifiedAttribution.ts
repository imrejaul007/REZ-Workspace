/**
 * REZ Unified Attribution Service
 *
 * Consolidates all attribution services into one:
 * - REZ-attribution-system
 * - REZ-unified-attribution
 * - REZ-ltv-attribution
 * - REZ-dooh-attribution
 * - REZ-crosschannel-attribution
 *
 * This is the SINGLE SOURCE OF TRUTH for attribution data.
 *
 * Port: 4061
 */

import axios from 'axios';

// ============================================================================
// Service URLs (Downstream Services)
// ============================================================================

const ATTRIBUTION_SYSTEM_URL = process.env.ATTRIBUTION_SYSTEM_URL || 'https://REZ-attribution-system.onrender.com';
const DOOH_ATTRIBUTION_URL = process.env.DOOH_ATTRIBUTION_URL || 'https://REZ-dooh-attribution.onrender.com';
const LTV_ATTRIBUTION_URL = process.env.LTV_ATTRIBUTION_URL || 'https://REZ-ltv-attribution.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-token';

// ============================================================================
// Types
// ============================================================================

export interface AttributionEvent {
  type: 'impression' | 'click' | 'conversion' | 'engagement';
  channel: 'dooh' | 'qr' | 'app' | 'web' | 'sms' | 'email' | 'push';
  source: string;
  campaignId?: string;
  adId?: string;
  userId?: string;
  merchantId?: string;
  orderId?: string;
  value?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AttributionResult {
  attribution: {
    channel: string;
    campaign?: string;
    touchpoints: {
      channel: string;
      weight: number;
      contribution: number;
    }[];
  };
  confidence: number;
  method: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven';
}

export interface ConversionPath {
  userId: string;
  orderId: string;
  value: number;
  convertedAt: string;
  touchpoints: {
    channel: string;
    source: string;
    timestamp: string;
    interaction: 'impression' | 'click' | 'engagement';
    weight: number;
  }[];
}

export interface ChannelMetrics {
  channel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  cost: number;
  roi: number;
  attribution: {
    direct: number;
    assisted: number;
  };
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;

  metrics: {
    impressions: number;
    reach: number;
    clicks: number;
    ctr: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    cpa: number;
    roas: number;
  };

  byChannel: Record<string, ChannelMetrics>;
  attribution: {
    firstTouch: number;
    lastTouch: number;
    linear: number;
    timeDecay: number;
    dataDriven: number;
  };
}

// ============================================================================
// Unified Attribution Service
// ============================================================================

class UnifiedAttributionService {

  // ============================================
  // Event Ingestion
  // ============================================

  /**
   * Track attribution event
   */
  async trackEvent(event: AttributionEvent): Promise<void> {
    // Store in primary attribution system
    try {
      await axios.post(
        `${ATTRIBUTION_SYSTEM_URL}/api/events`,
        event,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
    } catch (e) {
      console.error('Failed to track event in attribution system:', e);
    }

    // Store in DOOH attribution if DOOH event
    if (event.channel === 'dooh') {
      try {
        await axios.post(
          `${DOOH_ATTRIBUTION_URL}/api/events`,
          event,
          { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
        );
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Track conversion
   */
  async trackConversion(conversion: {
    userId: string;
    orderId: string;
    value: number;
    channels: string[];
    merchantId?: string;
  }): Promise<void> {
    // Track in attribution system
    try {
      await axios.post(
        `${ATTRIBUTION_SYSTEM_URL}/api/conversions`,
        conversion,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
    } catch (e) {
      console.error('Failed to track conversion:', e);
    }

    // Update LTV attribution
    try {
      await axios.post(
        `${LTV_ATTRIBUTION_URL}/api/attribution`,
        conversion,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
    } catch (e) {
      // Ignore
    }
  }

  // ============================================
  // Attribution Calculation
  // ============================================

  /**
   * Attribute conversion to channels
   */
  async attributeConversion(userId: string, orderId: string, method: AttributionResult['method'] = 'data_driven'): Promise<AttributionResult> {
    try {
      const response = await axios.post(
        `${ATTRIBUTION_SYSTEM_URL}/api/attribute`,
        { userId, orderId, method },
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }
      );
      return response.data;
    } catch (e) {
      // Fallback to simple attribution
      return {
        attribution: {
          channel: 'direct',
          touchpoints: []
        },
        confidence: 0.5,
        method
      };
    }
  }

  /**
   * Get conversion path for user
   */
  async getConversionPath(userId: string, orderId: string): Promise<ConversionPath | null> {
    try {
      const response = await axios.get(
        `${ATTRIBUTION_SYSTEM_URL}/api/path/${userId}/${orderId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }
      );
      return response.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get multi-touch attribution
   */
  async getMultiTouchAttribution(userId: string, windowDays = 30): Promise<{
    channels: Record<string, number>;
    touchpoints: ConversionPath[];
  }> {
    try {
      const response = await axios.get(
        `${ATTRIBUTION_SYSTEM_URL}/api/multi-touch/${userId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }
      );
      return response.data;
    } catch (e) {
      return { channels: {}, touchpoints: [] };
    }
  }

  // ============================================
  // Channel Analytics
  // ============================================

  /**
   * Get channel metrics
   */
  async getChannelMetrics(channel: string, startDate: string, endDate: string): Promise<ChannelMetrics> {
    try {
      const response = await axios.get(
        `${ATTRIBUTION_SYSTEM_URL}/api/channels/${channel}/metrics`,
        {
          params: { startDate, endDate },
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000
        }
      );
      return response.data;
    } catch (e) {
      return {
        channel,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        cost: 0,
        roi: 0,
        attribution: { direct: 0, assisted: 0 }
      };
    }
  }

  /**
   * Get all channel metrics
   */
  async getAllChannelMetrics(startDate: string, endDate: string): Promise<ChannelMetrics[]> {
    const channels = ['dooh', 'qr', 'app', 'web', 'sms', 'email', 'push', 'organic'];
    const metrics = await Promise.all(
      channels.map(ch => this.getChannelMetrics(ch, startDate, endDate))
    );
    return metrics;
  }

  // ============================================
  // Campaign Analytics
  // ============================================

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<CampaignPerformance | null> {
    try {
      const response = await axios.get(
        `${ATTRIBUTION_SYSTEM_URL}/api/campaigns/${campaignId}/performance`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }
      );
      return response.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get top performing campaigns
   */
  async getTopCampaigns(limit = 10, sortBy: 'revenue' | 'conversions' | 'roas' = 'roas'): Promise<CampaignPerformance[]> {
    try {
      const response = await axios.get(
        `${ATTRIBUTION_SYSTEM_URL}/api/campaigns/top`,
        {
          params: { limit, sortBy },
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000
        }
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  // ============================================
  // DOOH Attribution
  // ============================================

  /**
   * Get DOOH attribution
   */
  async getDOOHAttribution(orderId: string): Promise<{
    screenIds: string[];
    campaignIds: string[];
    impressionCount: number;
    proximityScore: number;
    attributionWeight: number;
  } | null> {
    try {
      const response = await axios.get(
        `${DOOH_ATTRIBUTION_URL}/api/attribution/${orderId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }
      );
      return response.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Track DOOH exposure
   */
  async trackDOOHExposure(event: {
    screenId: string;
    userId?: string;
    campaignId: string;
    duration: number;
    timestamp: string;
  }): Promise<void> {
    try {
      await axios.post(
        `${DOOH_ATTRIBUTION_URL}/api/exposure`,
        event,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
    } catch (e) {
      console.error('Failed to track DOOH exposure:', e);
    }
  }

  // ============================================
  // LTV Attribution
  // ============================================

  /**
   * Get customer LTV attribution
   */
  async getCustomerLTV(userId: string): Promise<{
    totalRevenue: number;
    attributedByChannel: Record<string, number>;
    predictedLTV: number;
    customerAge: number;
    ordersCount: number;
  }> {
    try {
      const response = await axios.get(
        `${LTV_ATTRIBUTION_URL}/api/ltv/${userId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }
      );
      return response.data;
    } catch (e) {
      return {
        totalRevenue: 0,
        attributedByChannel: {},
        predictedLTV: 0,
        customerAge: 0,
        ordersCount: 0
      };
    }
  }

  // ============================================
  // Reports
  // ============================================

  /**
   * Generate attribution report
   */
  async generateReport(options: {
    startDate: string;
    endDate: string;
    groupBy: 'channel' | 'campaign' | 'merchant';
    metrics: string[];
  }): Promise<{
    summary: Record<string, unknown>;
    breakdown: Record<string, unknown>[];
    generatedAt: string;
  }> {
    try {
      const response = await axios.post(
        `${ATTRIBUTION_SYSTEM_URL}/api/reports`,
        options,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 10000 }
      );
      return response.data;
    } catch (e) {
      return {
        summary: {},
        breakdown: [],
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get attribution dashboard data
   */
  async getDashboardData(): Promise<{
    totalRevenue: number;
    revenueByChannel: Record<string, number>;
    topCampaigns: CampaignPerformance[];
    recentConversions: ConversionPath[];
    channelROI: Record<string, number>;
  }> {
    const channels = await this.getAllChannelMetrics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );

    const topCampaigns = await this.getTopCampaigns(5);

    const revenueByChannel: Record<string, number> = {};
    const channelROI: Record<string, number> = {};

    channels.forEach(ch => {
      revenueByChannel[ch.channel] = ch.revenue;
      channelROI[ch.channel] = ch.roi;
    });

    return {
      totalRevenue: channels.reduce((sum, ch) => sum + ch.revenue, 0),
      revenueByChannel,
      topCampaigns,
      recentConversions: [],
      channelROI
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const unifiedAttributionService = new UnifiedAttributionService();
export default unifiedAttributionService;
