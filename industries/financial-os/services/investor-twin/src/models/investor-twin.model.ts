import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  InvestorType,
  RiskTolerance,
  InvestmentHorizon,
  AssetClass,
  Sector,
  TransactionType,
  OrderStatus
} from '../schemas/investor-twin.schema';

// Document interface
export interface IInvestorTwinDocument extends Document {
  twinId: string;
  investorId: string;
  type: InvestorType;
  name: string;
  firmName?: string;
  description?: string;
  contact: {
    phone: string;
    email: string;
    website?: string;
    linkedIn?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  taxId?: string;
  riskProfile: {
    riskTolerance: RiskTolerance;
    investmentHorizon: InvestmentHorizon;
    maxDrawdownTolerance: number;
    liquidityNeeds: 'low' | 'medium' | 'high';
    incomeRequirement: number;
  };
  portfolioAllocations: Array<{
    assetClass: AssetClass;
    targetPercentage: number;
    currentPercentage: number;
    value: number;
    lastRebalanced?: string;
  }>;
  sectorAllocations: Array<{
    sector: Sector;
    percentage: number;
    value: number;
  }>;
  currentMetrics: {
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
    alpha: number;
    sortinoRatio: number;
    var95: number;
    cvar95: number;
    trackingError?: number;
    informationRatio?: number;
  };
  holdings: Array<{
    symbol: string;
    name: string;
    quantity: number;
    averageCost: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    dayChange: number;
    dayChangePercent: number;
    weight: number;
    sector: Sector;
    assetClass: AssetClass;
  }>;
  transactions: Array<{
    id: string;
    type: TransactionType;
    symbol?: string;
    quantity?: number;
    price?: number;
    amount: number;
    fees: number;
    timestamp: string;
    description?: string;
    status: OrderStatus;
  }>;
  watchlist: Array<{
    symbol: string;
    name: string;
    addedAt: string;
    targetPrice?: number;
    notes?: string;
  }>;
  investmentGoals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'active' | 'completed' | 'paused';
  }>;
  totalPortfolioValue: number;
  cashBalance: number;
  totalInvested: number;
  totalReturns: number;
  returnsPercent: number;
  documents: Array<{
    id: string;
    type: string;
    name: string;
    uploadedAt: string;
    expiresAt?: string;
    status: 'valid' | 'expired' | 'pending';
    url?: string;
  }>;
  preferences: {
    notifications: boolean;
    autoRebalance: boolean;
    rebalanceThreshold: number;
    taxLossHarvesting: boolean;
    dividendReinvestment: boolean;
  };
  status: 'active' | 'inactive' | 'suspended';
  lastUpdated: string;
  createdAt: Date;
  updatedAt: Date;
  toTwinOsEntityId(): string;
}

// Model interface with statics
export interface IInvestorTwinModel extends Model<IInvestorTwinDocument> {
  findByInvestorId(investorId: string): Promise<IInvestorTwinDocument | null>;
  findByType(type: InvestorType): Promise<IInvestorTwinDocument[]>;
  findByStatus(status: string): Promise<IInvestorTwinDocument[]>;
  findByRiskTolerance(riskTolerance: RiskTolerance): Promise<IInvestorTwinDocument[]>;
  findHighValueInvestors(minValue: number): Promise<IInvestorTwinDocument[]>;
  findByHoldingSymbol(symbol: string): Promise<IInvestorTwinDocument[]>;
  findByWatchlistSymbol(symbol: string): Promise<IInvestorTwinDocument[]>;
}

// Contact Info Schema
const ContactInfoSchema = new Schema({
  phone: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  linkedIn: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String }
  }
}, { _id: false });

// Risk Profile Schema
const RiskProfileSchema = new Schema({
  riskTolerance: {
    type: String,
    enum: Object.values(RiskTolerance),
    default: RiskTolerance.MODERATE
  },
  investmentHorizon: {
    type: String,
    enum: Object.values(InvestmentHorizon),
    default: InvestmentHorizon.MEDIUM_TERM
  },
  maxDrawdownTolerance: { type: Number, default: 15 },
  liquidityNeeds: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  incomeRequirement: { type: Number, default: 0 }
}, { _id: false });

// Portfolio Allocation Schema
const PortfolioAllocationSchema = new Schema({
  assetClass: {
    type: String,
    enum: Object.values(AssetClass),
    required: true
  },
  targetPercentage: { type: Number, required: true },
  currentPercentage: { type: Number, default: 0 },
  value: { type: Number, default: 0 },
  lastRebalanced: { type: String }
}, { _id: false });

// Sector Allocation Schema
const SectorAllocationSchema = new Schema({
  sector: {
    type: String,
    enum: Object.values(Sector),
    required: true
  },
  percentage: { type: Number, required: true },
  value: { type: Number, default: 0 }
}, { _id: false });

// Performance Metrics Schema
const PerformanceMetricsSchema = new Schema({
  totalReturn: { type: Number, default: 0 },
  annualizedReturn: { type: Number, default: 0 },
  volatility: { type: Number, default: 0 },
  sharpeRatio: { type: Number, default: 0 },
  maxDrawdown: { type: Number, default: 0 },
  beta: { type: Number, default: 1 },
  alpha: { type: Number, default: 0 },
  sortinoRatio: { type: Number, default: 0 },
  var95: { type: Number, default: 0 },
  cvar95: { type: Number, default: 0 },
  trackingError: { type: Number },
  informationRatio: { type: Number }
}, { _id: false });

// Holdings Schema
const HoldingsSchema = new Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  averageCost: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  marketValue: { type: Number, required: true },
  unrealizedPL: { type: Number, default: 0 },
  unrealizedPLPercent: { type: Number, default: 0 },
  dayChange: { type: Number, default: 0 },
  dayChangePercent: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  sector: { type: String, enum: Object.values(Sector), required: true },
  assetClass: { type: String, enum: Object.values(AssetClass), required: true }
}, { _id: false });

// Transaction Schema
const TransactionSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: true
  },
  symbol: { type: String },
  quantity: { type: Number },
  price: { type: Number },
  amount: { type: Number, required: true },
  fees: { type: Number, default: 0 },
  timestamp: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.EXECUTED
  }
}, { _id: false });

// Watchlist Schema
const WatchlistSchema = new Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  addedAt: { type: String, required: true },
  targetPrice: { type: Number },
  notes: { type: String }
}, { _id: false });

// Investment Goal Schema
const InvestmentGoalSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: String },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  }
}, { _id: false });

// Compliance Document Schema
const ComplianceDocumentSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  uploadedAt: { type: String, required: true },
  expiresAt: { type: String },
  status: {
    type: String,
    enum: ['valid', 'expired', 'pending'],
    default: 'valid'
  },
  url: { type: String }
}, { _id: false });

// Preferences Schema
const PreferencesSchema = new Schema({
  notifications: { type: Boolean, default: true },
  autoRebalance: { type: Boolean, default: false },
  rebalanceThreshold: { type: Number, default: 5 },
  taxLossHarvesting: { type: Boolean, default: true },
  dividendReinvestment: { type: Boolean, default: false }
}, { _id: false });

// Main Investor Twin Schema
const InvestorTwinSchema = new Schema(
  {
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    investorId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(InvestorType),
      required: true
    },
    name: {
      type: String,
      required: true,
      index: true
    },
    firmName: { type: String },
    description: { type: String },
    contact: {
      type: ContactInfoSchema,
      required: true
    },
    taxId: { type: String },
    riskProfile: {
      type: RiskProfileSchema,
      default: () => ({})
    },
    portfolioAllocations: [{
      type: PortfolioAllocationSchema
    }],
    sectorAllocations: [{
      type: SectorAllocationSchema
    }],
    currentMetrics: {
      type: PerformanceMetricsSchema,
      default: () => ({})
    },
    holdings: [{
      type: HoldingsSchema
    }],
    transactions: [{
      type: TransactionSchema
    }],
    watchlist: [{
      type: WatchlistSchema
    }],
    investmentGoals: [{
      type: InvestmentGoalSchema
    }],
    totalPortfolioValue: {
      type: Number,
      default: 0
    },
    cashBalance: {
      type: Number,
      default: 0
    },
    totalInvested: {
      type: Number,
      default: 0
    },
    totalReturns: {
      type: Number,
      default: 0
    },
    returnsPercent: {
      type: Number,
      default: 0
    },
    documents: [{
      type: ComplianceDocumentSchema
    }],
    preferences: {
      type: PreferencesSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    lastUpdated: { type: String }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for common queries
InvestorTwinSchema.index({ type: 1 });
InvestorTwinSchema.index({ 'riskProfile.riskTolerance': 1 });
InvestorTwinSchema.index({ totalPortfolioValue: 1 });
InvestorTwinSchema.index({ status: 1 });
InvestorTwinSchema.index({ 'holdings.symbol': 1 });
InvestorTwinSchema.index({ 'transactions.timestamp': -1 });
InvestorTwinSchema.index({ 'watchlist.symbol': 1 });

// Instance methods
InvestorTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.investor.${this.investorId}`;
};

// Static methods
InvestorTwinSchema.statics.findByInvestorId = function(investorId: string) {
  return this.findOne({ investorId });
};

InvestorTwinSchema.statics.findByType = function(type: InvestorType) {
  return this.find({ type });
};

InvestorTwinSchema.statics.findByStatus = function(status: string) {
  return this.find({ status });
};

InvestorTwinSchema.statics.findByRiskTolerance = function(riskTolerance: RiskTolerance) {
  return this.find({ 'riskProfile.riskTolerance': riskTolerance });
};

InvestorTwinSchema.statics.findHighValueInvestors = function(minValue: number) {
  return this.find({ totalPortfolioValue: { $gte: minValue } });
};

InvestorTwinSchema.statics.findByHoldingSymbol = function(symbol: string) {
  return this.find({ 'holdings.symbol': symbol });
};

InvestorTwinSchema.statics.findByWatchlistSymbol = function(symbol: string) {
  return this.find({ 'watchlist.symbol': symbol });
};

// Export model with proper typing
export const InvestorTwin = mongoose.model<IInvestorTwinDocument, IInvestorTwinModel>('InvestorTwin', InvestorTwinSchema);
