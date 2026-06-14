/**
 * AnalyticsService — aggregates REZ operational data + peer benchmarks
 * into dashboard-ready responses and ranked operational gaps.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RezAnalyticsClient } from '@restopapa/rez-client';
import type {
  AnalyticsDashboard,
  BenchmarkData,
  OperationalGap,
  OwnMetrics,
  PeerGroupStatsResponse,
} from './analytics.dto';

// Gap threshold: merchant must be this many percentage points below peer avg
// to generate an OperationalGap entry.
const GAP_THRESHOLD_PCT = 5;

// Severity bands (gap as % of peer avg)
const HIGH_SEVERITY_THRESHOLD = 15;
const MEDIUM_SEVERITY_THRESHOLD = 5;

// Slug map: maps internal metric keys to Agent A7 training module slugs
const TRAINING_SLUG_MAP: Record<string, string> = {
  foodCostPct: 'food-cost-engineering',
  staffCostPct: 'team-retention',
  avgOrderValue: 'upsell-techniques',
  monthlyRevenue: 'revenue-growth-fundamentals',
  repeatCustomerRate: 'customer-loyalty-playbook',
};

// Human-readable labels for each metric key
const METRIC_LABELS: Record<string, string> = {
  foodCostPct: 'Food Cost %',
  staffCostPct: 'Staff Cost %',
  avgOrderValue: 'Avg Order Value (₹)',
  monthlyRevenue: 'Monthly Revenue (₹)',
  repeatCustomerRate: 'Repeat Customer Rate %',
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly analyticsEventsUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly rezAnalyticsClient: RezAnalyticsClient,
    private readonly config: ConfigService,
  ) {
    this.analyticsEventsUrl = this.config.get<string>(
      'ANALYTICS_EVENTS_URL',
      'https://analytics-events-37yy.onrender.com',
    );
    this.internalToken = this.config.get<string>('INTERNAL_SERVICE_TOKEN', '');
  }

  // ── Internal helpers ─────────────────────────────────────────────────────────

  private analyticsHeaders(): Record<string, string> {
    return { 'x-internal-token': this.internalToken };
  }

  private async fetchBenchmarks(rezMerchantId: string): Promise<BenchmarkData | null> {
    try {
      const response = await axios.get<{
        success: boolean;
        data: BenchmarkData | null;
        insufficient_data?: boolean;
      }>(
        `${this.analyticsEventsUrl}/benchmarks/${encodeURIComponent(rezMerchantId)}`,
        { headers: this.analyticsHeaders(), timeout: 8000 },
      );

      if (response.data?.insufficient_data) return null;
      return response.data?.data ?? null;
    } catch (err: unknown) {
      this.logger.warn('[AnalyticsService] fetchBenchmarks failed — continuing without peer data', {
        rezMerchantId,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  // ── Gap computation ───────────────────────────────────────────────────────────

  private computeGaps(benchmarks: BenchmarkData): OperationalGap[] {
    const costMetrics: Array<keyof typeof TRAINING_SLUG_MAP> = ['foodCostPct', 'staffCostPct'];
    const valueMetrics: Array<keyof typeof TRAINING_SLUG_MAP> = [
      'avgOrderValue',
      'monthlyRevenue',
      'repeatCustomerRate',
    ];

    const gaps: OperationalGap[] = [];

    // For cost metrics: higher own value relative to peer avg = negative gap
    for (const key of costMetrics) {
      const point = benchmarks[key as keyof BenchmarkData] as { value: number; peerAvg: number; percentile: number } | undefined;
      if (!point || point.peerAvg === 0) continue;

      // Gap = how much higher our cost is vs peer avg
      const gapPct = ((point.value - point.peerAvg) / point.peerAvg) * 100;
      if (gapPct <= GAP_THRESHOLD_PCT) continue;

      gaps.push({
        metric: METRIC_LABELS[key] ?? key,
        yourValue: point.value,
        peerAvg: point.peerAvg,
        gapPercent: Math.round(gapPct * 10) / 10,
        severity: gapPct >= HIGH_SEVERITY_THRESHOLD ? 'high' : gapPct >= MEDIUM_SEVERITY_THRESHOLD ? 'medium' : 'low',
        trainingModuleSlug: TRAINING_SLUG_MAP[key] ?? key,
      });
    }

    // For value metrics: lower own value relative to peer avg = negative gap
    for (const key of valueMetrics) {
      const point = benchmarks[key as keyof BenchmarkData] as { value: number; peerAvg: number; percentile: number } | undefined;
      if (!point || point.peerAvg === 0) continue;

      const gapPct = ((point.peerAvg - point.value) / point.peerAvg) * 100;
      if (gapPct <= GAP_THRESHOLD_PCT) continue;

      gaps.push({
        metric: METRIC_LABELS[key] ?? key,
        yourValue: point.value,
        peerAvg: point.peerAvg,
        gapPercent: Math.round(gapPct * 10) / 10,
        severity: gapPct >= HIGH_SEVERITY_THRESHOLD ? 'high' : gapPct >= MEDIUM_SEVERITY_THRESHOLD ? 'medium' : 'low',
        trainingModuleSlug: TRAINING_SLUG_MAP[key] ?? key,
      });
    }

    // Sort: high first, then by gap size descending
    return gaps.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      const diff = severityOrder[a.severity] - severityOrder[b.severity];
      return diff !== 0 ? diff : b.gapPercent - a.gapPercent;
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  async getMerchantDashboard(rezMerchantId: string): Promise<AnalyticsDashboard> {
    // Fan out all three REZ data calls + benchmark call concurrently
    const [analytics, revenueMetrics, foodCostMetrics, benchmarks] = await Promise.all([
      this.rezAnalyticsClient.getMerchantAnalytics(rezMerchantId, '30d'),
      this.rezAnalyticsClient.getRevenueMetrics(rezMerchantId),
      this.rezAnalyticsClient.getFoodCostMetrics(rezMerchantId),
      this.fetchBenchmarks(rezMerchantId),
    ]);

    const ownMetrics: OwnMetrics = {
      merchantId: rezMerchantId,
      period: analytics?.period ?? '30d',
      totalRevenue: analytics?.totalRevenue ?? 0,
      totalTransactions: analytics?.totalTransactions ?? 0,
      uniqueCustomers: analytics?.uniqueCustomers ?? 0,
      averageTransactionValue: analytics?.averageTransactionValue ?? 0,
      currentMonthRevenue: revenueMetrics?.currentMonthRevenue ?? 0,
      previousMonthRevenue: revenueMetrics?.previousMonthRevenue ?? 0,
      revenueGrowthPercent: revenueMetrics?.revenueGrowthPercent ?? 0,
      foodCostPercentage: foodCostMetrics?.foodCostPercentage ?? 0,
      wastePercentage: foodCostMetrics?.wastePercentage ?? 0,
      topProducts: analytics?.topProducts ?? [],
      revenueByDay: analytics?.revenueByDay ?? [],
    };

    const gaps = benchmarks ? this.computeGaps(benchmarks) : [];

    return {
      ownMetrics,
      benchmarks,
      insufficientPeerData: benchmarks === null,
      gaps,
    };
  }

  async getTopGaps(rezMerchantId: string): Promise<OperationalGap[]> {
    const benchmarks = await this.fetchBenchmarks(rezMerchantId);
    if (!benchmarks) return [];
    return this.computeGaps(benchmarks).slice(0, 3);
  }

  async getPeerGroupStats(city: string, cuisine: string): Promise<PeerGroupStatsResponse> {
    try {
      const response = await axios.get<{ success: boolean; data: PeerGroupStatsResponse }>(
        `${this.analyticsEventsUrl}/benchmarks/peer-group`,
        {
          params: { city, cuisine },
          headers: this.analyticsHeaders(),
          timeout: 8000,
        },
      );
      return response.data?.data;
    } catch (err: unknown) {
      this.logger.warn('[AnalyticsService] getPeerGroupStats failed', { city, cuisine, error: err instanceof Error ? err.message : String(err) });
      return {
        city,
        cuisineType: cuisine,
        merchantCount: 0,
        avgFoodCostPct: 0,
        avgOrderValue: 0,
        avgStaffCostPct: 0,
        avgMonthlyRevenue: 0,
        avgRepeatCustomerRate: 0,
        insufficient: true,
      };
    }
  }
}
