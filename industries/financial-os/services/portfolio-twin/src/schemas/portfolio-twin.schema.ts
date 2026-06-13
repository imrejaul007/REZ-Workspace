import { z } from 'zod';

// ============================================================================
// PORTFOLIO TWIN SCHEMAS
// ============================================================================

// Enums
export const PortfolioTypeSchema = z.enum(['equity', 'fixed_income', 'mixed', 'alternative', 'islamic', 'retirement', 'trust']);
export const PortfolioStatusSchema = z.enum(['active', 'closed', 'archived']);
export const InvestorTypeSchema = z.enum(['individual', 'institutional', 'corporate', 'family_office']);
export const RiskRatingSchema = z.enum(['conservative', 'moderate', 'aggressive']);
export const TimeHorizonSchema = z.enum(['short_term', 'medium_term', 'long_term']);
export const LiquidityNeedsSchema = z.enum(['high', 'medium', 'low']);
export const KYCStatusSchema = z.enum(['pending', 'verified', 'expired', 'rejected']);
export const AMLCheckSchema = z.enum(['passed', 'pending', 'failed']);
export const AssetClassSchema = z.enum(['equity', 'fixed_income', 'etf', 'mutual_fund', 'commodity', 'crypto', 'forex']);
export const TrendSchema = z.enum(['bullish', 'bearish', 'neutral']);
export const SentimentSchema = z.enum(['positive', 'negative', 'neutral']);
export const IslamicComplianceStatusSchema = z.enum(['compliant', 'non_compliant', 'review']);

// ============================================================================
// HOLDING SCHEMA
// ============================================================================

export const HoldingSchema = z.object({
  asset_id: z.string().min(1, 'Asset ID is required'),
  ticker: z.string().min(1, 'Ticker is required'),
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  cost_basis: z.number().min(0, 'Cost basis must be non-negative'),
  current_value: z.number().min(0, 'Current value must be non-negative'),
  weight: z.number().min(0).max(100, 'Weight must be 0-100'),
  unrealized_gain_loss: z.number().default(0),
  unrealized_gain_loss_pct: z.number().default(0),
});

export type Holding = z.infer<typeof HoldingSchema>;

// ============================================================================
// CASH SCHEMA
// ============================================================================

export const CashSchema = z.object({
  available: z.number().min(0).default(0),
  pending: z.number().min(0).default(0),
  currency: z.string().default('USD'),
});

export type Cash = z.infer<typeof CashSchema>;

// ============================================================================
// PERFORMANCE SCHEMA
// ============================================================================

export const PerformanceSchema = z.object({
  total_value: z.number().min(0).default(0),
  total_cost: z.number().min(0).default(0),
  total_gain_loss: z.number().default(0),
  total_gain_loss_pct: z.number().default(0),
  day_change: z.number().default(0),
  day_change_pct: z.number().default(0),
  mtd_return: z.number().default(0),
  ytd_return: z.number().default(0),
  '1yr_return': z.number().default(0),
  '3yr_return': z.number().default(0),
  '5yr_return': z.number().default(0),
  since_inception: z.number().default(0),
});

export type Performance = z.infer<typeof PerformanceSchema>;

// ============================================================================
// RISK METRICS SCHEMA
// ============================================================================

export const RiskMetricsSchema = z.object({
  volatility: z.number().min(0).default(0),
  sharpe_ratio: z.number().default(0),
  sortino_ratio: z.number().default(0),
  max_drawdown: z.number().max(0).default(0),
  var_95: z.number().max(0).default(0),
  beta: z.number().default(1),
  correlation_to_benchmark: z.number().min(-1).max(1).default(1),
});

export type RiskMetrics = z.infer<typeof RiskMetricsSchema>;

// ============================================================================
// ALLOCATION SCHEMA
// ============================================================================

export const AllocationAssetClassSchema = z.object({
  equity: z.number().min(0).max(100).default(0),
  fixed_income: z.number().min(0).max(100).default(0),
  cash: z.number().min(0).max(100).default(0),
  alternatives: z.number().min(0).max(100).default(0),
  real_estate: z.number().min(0).max(100).default(0),
});

export const AllocationSchema = z.object({
  by_asset_class: AllocationAssetClassSchema.default({}),
  by_sector: z.record(z.string(), z.number()).default({}),
  by_geography: z.record(z.string(), z.number()).default({}),
  by_currency: z.record(z.string(), z.number()).default({}),
});

export type Allocation = z.infer<typeof AllocationSchema>;

// ============================================================================
// COMPLIANCE SCHEMA
// ============================================================================

export const ComplianceSchema = z.object({
  concentration_limit: z.number().min(1).max(100).default(10),
  largest_position_pct: z.number().min(0).max(100).default(0),
  sector_concentration_pct: z.number().min(0).max(100).default(0),
  compliant: z.boolean().default(true),
  violations: z.array(z.string()).default([]),
});

export type Compliance = z.infer<typeof ComplianceSchema>;

// ============================================================================
// BENCHMARK SCHEMA
// ============================================================================

export const BenchmarkSchema = z.object({
  name: z.string().default('S&P 500'),
  ytd_return: z.number().default(0),
  tracking_error: z.number().default(0),
});

export type Benchmark = z.infer<typeof BenchmarkSchema>;

// ============================================================================
// PORTFOLIO TWIN FULL SCHEMA
// ============================================================================

export const PortfolioTwinSchema = z.object({
  portfolio_id: z.string().min(1, 'Portfolio ID is required'),
  twin_id: z.string().optional(),
  investor_id: z.string().min(1, 'Investor ID is required'),
  name: z.string().min(1, 'Name is required'),
  type: PortfolioTypeSchema.default('mixed'),
  strategy: z.string().default('balanced'),
  inception_date: z.string().datetime().or(z.date()).transform(val => new Date(val)),
  status: PortfolioStatusSchema.default('active'),
  holdings: z.array(HoldingSchema).default([]),
  cash: CashSchema.default({}),
  performance: PerformanceSchema.default({}),
  risk_metrics: RiskMetricsSchema.default({}),
  allocation: AllocationSchema.default({}),
  compliance: ComplianceSchema.default({}),
  benchmark: BenchmarkSchema.default({}),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  version: z.number().int().default(1),
});

export type PortfolioTwin = z.infer<typeof PortfolioTwinSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const CreatePortfolioTwinRequestSchema = PortfolioTwinSchema.omit({
  twin_id: true,
  created_at: true,
  updated_at: true,
  version: true,
  performance: true,
  risk_metrics: true,
  allocation: true,
  compliance: true,
}).extend({
  portfolio_id: z.string().min(1),
  investor_id: z.string().min(1),
  inception_date: z.string().datetime(),
});

export const UpdatePortfolioTwinRequestSchema = z.object({
  name: z.string().min(1).optional(),
  type: PortfolioTypeSchema.optional(),
  strategy: z.string().optional(),
  status: PortfolioStatusSchema.optional(),
  holdings: z.array(HoldingSchema).optional(),
  cash: CashSchema.optional(),
  benchmark: BenchmarkSchema.optional(),
});

export const AddHoldingRequestSchema = z.object({
  asset_id: z.string().min(1),
  ticker: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().min(0),
  cost_basis: z.number().min(0),
  current_value: z.number().min(0),
});

export const UpdateHoldingRequestSchema = z.object({
  quantity: z.number().min(0).optional(),
  cost_basis: z.number().min(0).optional(),
  current_value: z.number().min(0).optional(),
});

export const RebalanceRequestSchema = z.object({
  target_allocation: AllocationAssetClassSchema,
  threshold: z.number().min(0).max(100).default(5),
});

export const UpdatePerformanceRequestSchema = z.object({
  total_value: z.number().min(0).optional(),
  day_change: z.number().optional(),
  day_change_pct: z.number().optional(),
  mtd_return: z.number().optional(),
  ytd_return: z.number().optional(),
});

export const UpdateRiskMetricsRequestSchema = z.object({
  volatility: z.number().min(0).optional(),
  sharpe_ratio: z.number().optional(),
  sortino_ratio: z.number().optional(),
  max_drawdown: z.number().max(0).optional(),
  var_95: z.number().max(0).optional(),
  beta: z.number().optional(),
  correlation_to_benchmark: z.number().min(-1).max(1).optional(),
});

// API Response schemas
export const PortfolioTwinResponseSchema = PortfolioTwinSchema;
export const PortfolioTwinListResponseSchema = z.object({
  twins: z.array(PortfolioTwinSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type CreatePortfolioTwinRequest = z.infer<typeof CreatePortfolioTwinRequestSchema>;
export type UpdatePortfolioTwinRequest = z.infer<typeof UpdatePortfolioTwinRequestSchema>;
export type AddHoldingRequest = z.infer<typeof AddHoldingRequestSchema>;
export type UpdateHoldingRequest = z.infer<typeof UpdateHoldingRequestSchema>;
export type RebalanceRequest = z.infer<typeof RebalanceRequestSchema>;
export type UpdatePerformanceRequest = z.infer<typeof UpdatePerformanceRequestSchema>;
export type UpdateRiskMetricsRequest = z.infer<typeof UpdateRiskMetricsRequestSchema>;
export type PortfolioTwinResponse = z.infer<typeof PortfolioTwinSchema>;
export type PortfolioTwinListResponse = z.infer<typeof PortfolioTwinListResponseSchema>;
