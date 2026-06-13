import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// ASSET TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IAssetTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  asset_id: string;
  twin_id: string;

  // Profile
  profile: {
    ticker: string;
    name: string;
    asset_class: 'equity' | 'fixed_income' | 'etf' | 'mutual_fund' | 'commodity' | 'crypto' | 'forex';
    exchange: string;
    cusip?: string;
    isin?: string;
  };

  // Pricing
  pricing: {
    last_price: number;
    bid: number;
    ask: number;
    bid_size: number;
    ask_size: number;
    volume: number;
    avg_volume_30d: number;
    updated_at: Date;
  };

  // Fundamentals
  fundamentals: {
    market_cap: number;
    enterprise_value: number;
    pe_ratio: number;
    forward_pe: number;
    peg_ratio: number;
    pb_ratio: number;
    ps_ratio: number;
    dividend_yield: number;
    dividend_amount: number;
    beta: number;
    revenue: number;
    ebitda: number;
    eps: number;
    eps_growth: number;
  };

  // Technical
  technical: {
    sma_50: number;
    sma_200: number;
    w52_high: number;
    w52_low: number;
    rsi_14: number;
    macd: string;
    trend: 'bullish' | 'bearish' | 'neutral';
  };

  // Ownership
  ownership: {
    institutions_pct: number;
    insiders_pct: number;
    public_float_pct: number;
    top_holders: Array<{
      holder: string;
      shares: number;
      pct: number;
    }>;
  };

  // Islamic Compliance
  islamic_compliance: {
    screened: boolean;
    compliance_status: 'compliant' | 'non_compliant' | 'review';
    debt_ratio: number;
    interest_income_pct: number;
    cash_flow_operations: string[];
  };

  // News
  news: Array<{
    headline: string;
    source: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    published_at: Date;
  }>;

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ASSET TWIN SCHEMA
// ============================================================================

const ProfileSchema = new Schema({
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  asset_class: {
    type: String,
    enum: ['equity', 'fixed_income', 'etf', 'mutual_fund', 'commodity', 'crypto', 'forex'],
    default: 'equity',
  },
  exchange: { type: String, required: true },
  cusip: { type: String },
  isin: { type: String },
}, { _id: false });

const PricingSchema = new Schema({
  last_price: { type: Number, default: 0 },
  bid: { type: Number, default: 0 },
  ask: { type: Number, default: 0 },
  bid_size: { type: Number, default: 0 },
  ask_size: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
  avg_volume_30d: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now },
}, { _id: false });

const FundamentalsSchema = new Schema({
  market_cap: { type: Number, default: 0 },
  enterprise_value: { type: Number, default: 0 },
  pe_ratio: { type: Number, default: 0 },
  forward_pe: { type: Number, default: 0 },
  peg_ratio: { type: Number, default: 0 },
  pb_ratio: { type: Number, default: 0 },
  ps_ratio: { type: Number, default: 0 },
  dividend_yield: { type: Number, default: 0 },
  dividend_amount: { type: Number, default: 0 },
  beta: { type: Number, default: 1 },
  revenue: { type: Number, default: 0 },
  ebitda: { type: Number, default: 0 },
  eps: { type: Number, default: 0 },
  eps_growth: { type: Number, default: 0 },
}, { _id: false });

const TechnicalSchema = new Schema({
  sma_50: { type: Number, default: 0 },
  sma_200: { type: Number, default: 0 },
  w52_high: { type: Number, default: 0 },
  w52_low: { type: Number, default: 0 },
  rsi_14: { type: Number, default: 50 },
  macd: { type: String, default: 'neutral' },
  trend: {
    type: String,
    enum: ['bullish', 'bearish', 'neutral'],
    default: 'neutral',
  },
}, { _id: false });

const TopHolderSchema = new Schema({
  holder: { type: String, required: true },
  shares: { type: Number, required: true },
  pct: { type: Number, required: true },
}, { _id: false });

const OwnershipSchema = new Schema({
  institutions_pct: { type: Number, default: 0 },
  insiders_pct: { type: Number, default: 0 },
  public_float_pct: { type: Number, default: 100 },
  top_holders: [TopHolderSchema],
}, { _id: false });

const IslamicComplianceSchema = new Schema({
  screened: { type: Boolean, default: false },
  compliance_status: {
    type: String,
    enum: ['compliant', 'non_compliant', 'review'],
    default: 'review',
  },
  debt_ratio: { type: Number, default: 0 },
  interest_income_pct: { type: Number, default: 0 },
  cash_flow_operations: [{ type: String }],
}, { _id: false });

const NewsItemSchema = new Schema({
  headline: { type: String, required: true },
  source: { type: String, required: true },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral',
  },
  published_at: { type: Date, required: true },
}, { _id: false });

const AssetTwinSchema = new Schema<IAssetTwin>({
  asset_id: {
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

  // Profile
  profile: { type: ProfileSchema, required: true },

  // Pricing
  pricing: { type: PricingSchema, default: () => ({}) },

  // Fundamentals
  fundamentals: { type: FundamentalsSchema, default: () => ({}) },

  // Technical
  technical: { type: TechnicalSchema, default: () => ({}) },

  // Ownership
  ownership: { type: OwnershipSchema, default: () => ({}) },

  // Islamic Compliance
  islamic_compliance: { type: IslamicComplianceSchema, default: () => ({}) },

  // News
  news: [NewsItemSchema],

  // Metadata
  version: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
AssetTwinSchema.index({ 'profile.ticker': 1 });
AssetTwinSchema.index({ 'profile.asset_class': 1 });
AssetTwinSchema.index({ 'pricing.last_price': -1 });
AssetTwinSchema.index({ 'technical.trend': 1 });

// Virtual for id
AssetTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

AssetTwinSchema.set('toJSON', { virtuals: true });
AssetTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const AssetTwinModel: Model<IAssetTwin> = mongoose.model<IAssetTwin>('AssetTwin', AssetTwinSchema);
