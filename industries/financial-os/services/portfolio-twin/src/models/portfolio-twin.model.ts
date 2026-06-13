import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// PORTFOLIO TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IPortfolioTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  portfolio_id: string;
  twin_id: string;
  investor_id: string;

  // Core Info
  name: string;
  type: 'equity' | 'fixed_income' | 'mixed' | 'alternative' | 'islamic' | 'retirement' | 'trust';
  strategy: string;
  inception_date: Date;
  status: 'active' | 'closed' | 'archived';

  // Holdings
  holdings: Array<{
    asset_id: string;
    ticker: string;
    name: string;
    quantity: number;
    cost_basis: number;
    current_value: number;
    weight: number;
    unrealized_gain_loss: number;
    unrealized_gain_loss_pct: number;
  }>;

  // Cash
  cash: {
    available: number;
    pending: number;
    currency: string;
  };

  // Performance
  performance: {
    total_value: number;
    total_cost: number;
    total_gain_loss: number;
    total_gain_loss_pct: number;
    day_change: number;
    day_change_pct: number;
    mtd_return: number;
    ytd_return: number;
    '1yr_return': number;
    '3yr_return': number;
    '5yr_return': number;
    since_inception: number;
  };

  // Risk Metrics
  risk_metrics: {
    volatility: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown: number;
    var_95: number;
    beta: number;
    correlation_to_benchmark: number;
  };

  // Allocation
  allocation: {
    by_asset_class: {
      equity: number;
      fixed_income: number;
      cash: number;
      alternatives: number;
      real_estate: number;
    };
    by_sector: Record<string, number>;
    by_geography: Record<string, number>;
    by_currency: Record<string, number>;
  };

  // Compliance
  compliance: {
    concentration_limit: number;
    largest_position_pct: number;
    sector_concentration_pct: number;
    compliant: boolean;
    violations: string[];
  };

  // Benchmark
  benchmark: {
    name: string;
    ytd_return: number;
    tracking_error: number;
  };

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// PORTFOLIO TWIN SCHEMA
// ============================================================================

const HoldingSchema = new Schema({
  asset_id: { type: String, required: true },
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  cost_basis: { type: Number, required: true },
  current_value: { type: Number, required: true },
  weight: { type: Number, required: true },
  unrealized_gain_loss: { type: Number, default: 0 },
  unrealized_gain_loss_pct: { type: Number, default: 0 },
}, { _id: false });

const CashSchema = new Schema({
  available: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
}, { _id: false });

const PerformanceSchema = new Schema({
  total_value: { type: Number, default: 0 },
  total_cost: { type: Number, default: 0 },
  total_gain_loss: { type: Number, default: 0 },
  total_gain_loss_pct: { type: Number, default: 0 },
  day_change: { type: Number, default: 0 },
  day_change_pct: { type: Number, default: 0 },
  mtd_return: { type: Number, default: 0 },
  ytd_return: { type: Number, default: 0 },
  '1yr_return': { type: Number, default: 0 },
  '3yr_return': { type: Number, default: 0 },
  '5yr_return': { type: Number, default: 0 },
  since_inception: { type: Number, default: 0 },
}, { _id: false });

const RiskMetricsSchema = new Schema({
  volatility: { type: Number, default: 0 },
  sharpe_ratio: { type: Number, default: 0 },
  sortino_ratio: { type: Number, default: 0 },
  max_drawdown: { type: Number, default: 0 },
  var_95: { type: Number, default: 0 },
  beta: { type: Number, default: 1 },
  correlation_to_benchmark: { type: Number, default: 1 },
}, { _id: false });

const AllocationAssetClassSchema = new Schema({
  equity: { type: Number, default: 0 },
  fixed_income: { type: Number, default: 0 },
  cash: { type: Number, default: 0 },
  alternatives: { type: Number, default: 0 },
  real_estate: { type: Number, default: 0 },
}, { _id: false });

const ComplianceSchema = new Schema({
  concentration_limit: { type: Number, default: 10 },
  largest_position_pct: { type: Number, default: 0 },
  sector_concentration_pct: { type: Number, default: 0 },
  compliant: { type: Boolean, default: true },
  violations: [{ type: String }],
}, { _id: false });

const BenchmarkSchema = new Schema({
  name: { type: String, default: 'S&P 500' },
  ytd_return: { type: Number, default: 0 },
  tracking_error: { type: Number, default: 0 },
}, { _id: false });

const PortfolioTwinSchema = new Schema<IPortfolioTwin>({
  portfolio_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  twin_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  investor_id: {
    type: String,
    required: true,
    index: true,
  },

  // Core Info
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['equity', 'fixed_income', 'mixed', 'alternative', 'islamic', 'retirement', 'trust'],
    default: 'mixed',
  },
  strategy: { type: String, default: 'balanced' },
  inception_date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active',
  },

  // Holdings
  holdings: [HoldingSchema],

  // Cash
  cash: { type: CashSchema, default: () => ({}) },

  // Performance
  performance: { type: PerformanceSchema, default: () => ({}) },

  // Risk Metrics
  risk_metrics: { type: RiskMetricsSchema, default: () => ({}) },

  // Allocation
  allocation: {
    by_asset_class: { type: AllocationAssetClassSchema, default: () => ({}) },
    by_sector: { type: Map, of: Number, default: {} },
    by_geography: { type: Map, of: Number, default: {} },
    by_currency: { type: Map, of: Number, default: {} },
  },

  // Compliance
  compliance: { type: ComplianceSchema, default: () => ({}) },

  // Benchmark
  benchmark: { type: BenchmarkSchema, default: () => ({}) },

  // Metadata
  version: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
PortfolioTwinSchema.index({ investor_id: 1, status: 1 });
PortfolioTwinSchema.index({ 'performance.ytd_return': -1 });
PortfolioTwinSchema.index({ 'risk_metrics.sharpe_ratio': -1 });
PortfolioTwinSchema.index({ type: 1, status: 1 });

// Virtual for id
PortfolioTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

PortfolioTwinSchema.set('toJSON', { virtuals: true });
PortfolioTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const PortfolioTwinModel: Model<IPortfolioTwin> = mongoose.model<IPortfolioTwin>('PortfolioTwin', PortfolioTwinSchema);
