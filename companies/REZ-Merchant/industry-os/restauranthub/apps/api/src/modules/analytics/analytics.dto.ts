/**
 * analytics.dto.ts — Response type definitions for the Analytics module.
 *
 * NOTE: OperationalGap is the cross-agent interface consumed by Agent A7 (Training).
 * Do NOT rename or restructure that interface without coordinating with A7.
 */

// ── Benchmark types ───────────────────────────────────────────────────────────

export interface BenchmarkPoint {
  value: number;
  peerAvg: number;
  percentile: number;
}

export interface PeerGroupInfo {
  city: string;
  cuisineType: string;
  sizeCategory: 'small' | 'medium' | 'large';
  merchantCount: number;
}

export interface BenchmarkData {
  merchantId: string;
  peerGroup: PeerGroupInfo;
  foodCostPct: BenchmarkPoint;
  avgOrderValue: BenchmarkPoint;
  staffCostPct: BenchmarkPoint;
  monthlyRevenue: BenchmarkPoint;
  repeatCustomerRate: BenchmarkPoint;
  computedAt: string;
}

// ── Own metrics ───────────────────────────────────────────────────────────────

export interface OwnMetrics {
  merchantId: string;
  period: string;
  totalRevenue: number;
  totalTransactions: number;
  uniqueCustomers: number;
  averageTransactionValue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowthPercent: number;
  foodCostPercentage: number;
  wastePercentage: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    quantity: number;
  }>;
  revenueByDay: Array<{ date: string; revenue: number; transactions: number }>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface AnalyticsDashboard {
  ownMetrics: OwnMetrics;
  benchmarks: BenchmarkData | null;
  insufficientPeerData: boolean;
  gaps: OperationalGap[];
}

// ── Operational gaps — cross-agent interface with Agent A7 ────────────────────

export interface OperationalGap {
  /** e.g. "Food Cost %", "Avg Order Value", "Staff Cost %" */
  metric: string;
  /** The merchant's own value */
  yourValue: number;
  /** The anonymized peer group average */
  peerAvg: number;
  /** How far below peer avg as a % (absolute, positive) */
  gapPercent: number;
  severity: 'high' | 'medium' | 'low';
  /**
   * Slug used by Agent A7's Training module to deep-link to the relevant
   * training content. Format: kebab-case string.
   * e.g. 'food-cost-engineering', 'team-retention', 'upsell-techniques'
   */
  trainingModuleSlug: string;
}

// ── Peer group (public endpoint) ──────────────────────────────────────────────

export interface PeerGroupStatsResponse {
  city: string;
  cuisineType: string;
  merchantCount: number;
  avgFoodCostPct: number;
  avgOrderValue: number;
  avgStaffCostPct: number;
  avgMonthlyRevenue: number;
  avgRepeatCustomerRate: number;
  insufficient: boolean;
}
