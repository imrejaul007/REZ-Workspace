import { v4 as uuidv4 } from 'uuid';
import {
  Platform,
  AttributionData,
  AttributionModel,
  UnifiedMetrics,
  DateRange,
} from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('Attribution');

interface Touchpoint {
  platform: Platform;
  contentId: string;
  timestamp: Date;
  interactionType: 'view' | 'click' | 'engagement' | 'conversion';
  revenue?: number;
}

interface AttributionResult {
  attributionId: string;
  model: AttributionModel;
  totalRevenue: number;
  attributionByPlatform: Map<Platform, { revenue: number; weight: number; touchpoints: number }>;
  touchpointAttribution: TouchpointAttribution[];
  generatedAt: Date;
}

interface TouchpointAttribution {
  platform: Platform;
  contentId: string;
  timestamp: Date;
  attributedRevenue: number;
  weight: number;
}

export class AttributionService {
  /**
   * Calculate attribution for a conversion across touchpoints
   */
  calculateAttribution(
    touchpoints: Touchpoint[],
    revenue: number,
    model: AttributionModel
  ): AttributionResult {
    const attributionId = uuidv4();
    const generatedAt = new Date();

    logger.logAttribution(model, touchpoints.length);

    let attributionByPlatform: Map<Platform, { revenue: number; weight: number; touchpoints: number }>;
    let touchpointAttribution: TouchpointAttribution[];

    switch (model) {
      case 'first-touch':
        touchpointAttribution = this.firstTouchAttribution(touchpoints, revenue);
        break;
      case 'last-touch':
        touchpointAttribution = this.lastTouchAttribution(touchpoints, revenue);
        break;
      case 'linear':
        touchpointAttribution = this.linearAttribution(touchpoints, revenue);
        break;
      case 'time-decay':
        touchpointAttribution = this.timeDecayAttribution(touchpoints, revenue);
        break;
      case 'position-based':
        touchpointAttribution = this.positionBasedAttribution(touchpoints, revenue);
        break;
      default:
        touchpointAttribution = this.linearAttribution(touchpoints, revenue);
    }

    // Aggregate by platform
    attributionByPlatform = this.aggregateByPlatform(touchpointAttribution);

    const totalRevenue = touchpointAttribution.reduce((sum, t) => sum + t.attributedRevenue, 0);

    return {
      attributionId,
      model,
      totalRevenue,
      attributionByPlatform,
      touchpointAttribution,
      generatedAt,
    };
  }

  /**
   * First-touch attribution: 100% credit to first touchpoint
   */
  private firstTouchAttribution(touchpoints: Touchpoint[], revenue: number): TouchpointAttribution[] {
    if (touchpoints.length === 0) return [];

    const sorted = [...touchpoints].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sorted.map((tp, index) => ({
      platform: tp.platform,
      contentId: tp.contentId,
      timestamp: tp.timestamp,
      attributedRevenue: index === 0 ? revenue : 0,
      weight: index === 0 ? 1 : 0,
    }));
  }

  /**
   * Last-touch attribution: 100% credit to last touchpoint
   */
  private lastTouchAttribution(touchpoints: Touchpoint[], revenue: number): TouchpointAttribution[] {
    if (touchpoints.length === 0) return [];

    const sorted = [...touchpoints].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sorted.map((tp, index) => ({
      platform: tp.platform,
      contentId: tp.contentId,
      timestamp: tp.timestamp,
      attributedRevenue: index === 0 ? revenue : 0,
      weight: index === 0 ? 1 : 0,
    }));
  }

  /**
   * Linear attribution: Equal credit to all touchpoints
   */
  private linearAttribution(touchpoints: Touchpoint[], revenue: number): TouchpointAttribution[] {
    if (touchpoints.length === 0) return [];

    const weight = 1 / touchpoints.length;
    const attributedRevenue = revenue * weight;

    return touchpoints.map((tp) => ({
      platform: tp.platform,
      contentId: tp.contentId,
      timestamp: tp.timestamp,
      attributedRevenue,
      weight,
    }));
  }

  /**
   * Time-decay attribution: More credit to recent touchpoints
   */
  private timeDecayAttribution(touchpoints: Touchpoint[], revenue: number): TouchpointAttribution[] {
    if (touchpoints.length === 0) return [];

    const sorted = [...touchpoints].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate weights using exponential decay (half-life of 7 days)
    const halfLifeDays = 7;
    const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;
    const firstTimestamp = new Date(sorted[0].timestamp).getTime();

    const weights = sorted.map((tp) => {
      const age = new Date(tp.timestamp).getTime() - firstTimestamp;
      return Math.pow(0.5, age / halfLifeMs);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    return sorted.map((tp, index) => ({
      platform: tp.platform,
      contentId: tp.contentId,
      timestamp: tp.timestamp,
      attributedRevenue: revenue * (weights[index] / totalWeight),
      weight: weights[index] / totalWeight,
    }));
  }

  /**
   * Position-based attribution: 40% first, 40% last, 20% distributed among middle
   */
  private positionBasedAttribution(touchpoints: Touchpoint[], revenue: number): TouchpointAttribution[] {
    if (touchpoints.length === 0) return [];

    const sorted = [...touchpoints].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (sorted.length === 1) {
      return [{
        platform: sorted[0].platform,
        contentId: sorted[0].contentId,
        timestamp: sorted[0].timestamp,
        attributedRevenue: revenue,
        weight: 1,
      }];
    }

    if (sorted.length === 2) {
      return sorted.map((tp, index) => ({
        platform: tp.platform,
        contentId: tp.contentId,
        timestamp: tp.timestamp,
        attributedRevenue: revenue * 0.5,
        weight: 0.5,
      }));
    }

    // 40% first, 40% last, 20% distributed among middle
    const middleCount = sorted.length - 2;
    const middleWeight = 0.2 / middleCount;

    return sorted.map((tp, index) => {
      let weight: number;
      if (index === 0) {
        weight = 0.4;
      } else if (index === sorted.length - 1) {
        weight = 0.4;
      } else {
        weight = middleWeight;
      }

      return {
        platform: tp.platform,
        contentId: tp.contentId,
        timestamp: tp.timestamp,
        attributedRevenue: revenue * weight,
        weight,
      };
    });
  }

  /**
   * Aggregate attribution results by platform
   */
  private aggregateByPlatform(
    touchpointAttribution: TouchpointAttribution[]
  ): Map<Platform, { revenue: number; weight: number; touchpoints: number }> {
    const platformMap = new Map<Platform, { revenue: number; weight: number; touchpoints: number }>();

    touchpointAttribution.forEach((ta) => {
      const existing = platformMap.get(ta.platform) || { revenue: 0, weight: 0, touchpoints: 0 };
      existing.revenue += ta.attributedRevenue;
      existing.weight += ta.weight;
      existing.touchpoints += 1;
      platformMap.set(ta.platform, existing);
    });

    return platformMap;
  }

  /**
   * Calculate multi-touch attribution from engagement metrics
   */
  calculateEngagementAttribution(
    metrics: UnifiedMetrics[],
    model: AttributionModel
  ): Map<Platform, { engagementScore: number; attributionPercentage: number }> {
    const engagementByPlatform = new Map<Platform, number>();

    // Calculate raw engagement scores per platform
    metrics.forEach((m) => {
      const score = m.engagements + m.comments * 2 + m.shares * 3 + m.clicks * 1.5;
      const existing = engagementByPlatform.get(m.platform) || 0;
      engagementByPlatform.set(m.platform, existing + score);
    });

    // Normalize to percentages
    const totalEngagement = Array.from(engagementByPlatform.values()).reduce((sum, s) => sum + s, 0);
    const result = new Map<Platform, { engagementScore: number; attributionPercentage: number }>();

    engagementByPlatform.forEach((score, platform) => {
      result.set(platform, {
        engagementScore: score,
        attributionPercentage: totalEngagement > 0 ? (score / totalEngagement) * 100 : 0,
      });
    });

    return result;
  }

  /**
   * Calculate ROAS (Return on Ad Spend) by platform
   */
  calculateROAS(
    spendByPlatform: Map<Platform, number>,
    attributedRevenueByPlatform: Map<Platform, number>
  ): Map<Platform, { spend: number; revenue: number; roas: number }> {
    const result = new Map<Platform, { spend: number; revenue: number; roas: number }>();

    spendByPlatform.forEach((spend, platform) => {
      const revenue = attributedRevenueByPlatform.get(platform) || 0;
      result.set(platform, {
        spend,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
      });
    });

    return result;
  }

  /**
   * Calculate CPA (Cost Per Acquisition) by platform
   */
  calculateCPA(
    spendByPlatform: Map<Platform, number>,
    conversionsByPlatform: Map<Platform, number>
  ): Map<Platform, { spend: number; conversions: number; cpa: number }> {
    const result = new Map<Platform, { spend: number; conversions: number; cpa: number }>();

    spendByPlatform.forEach((spend, platform) => {
      const conversions = conversionsByPlatform.get(platform) || 0;
      result.set(platform, {
        spend,
        conversions,
        cpa: conversions > 0 ? spend / conversions : 0,
      });
    });

    return result;
  }

  /**
   * Generate attribution report
   */
  generateAttributionReport(
    touchpoints: Touchpoint[],
    revenue: number,
    models: AttributionModel[]
  ): {
    revenue: number;
    models: {
      model: AttributionModel;
      attributionByPlatform: Record<string, { revenue: number; percentage: number }>;
    }[];
  } {
    const modelResults = models.map((model) => {
      const result = this.calculateAttribution(touchpoints, revenue, model);
      const attributionByPlatform: Record<string, { revenue: number; percentage: number }> = {};

      result.attributionByPlatform.forEach((data, platform) => {
        attributionByPlatform[platform] = {
          revenue: data.revenue,
          percentage: revenue > 0 ? (data.revenue / revenue) * 100 : 0,
        };
      });

      return {
        model,
        attributionByPlatform,
      };
    });

    return {
      revenue,
      models: modelResults,
    };
  }
}

export const attributionService = new AttributionService();
export default attributionService;
